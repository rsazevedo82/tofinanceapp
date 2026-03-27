import { createHash } from 'crypto'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const PROCESSING_TTL_SECONDS = 2 * 60
const RESULT_TTL_SECONDS = 24 * 60 * 60

type ProcessingRecord = {
  state: 'processing'
  bodyHash: string
  createdAt: string
}

type CompletedRecord = {
  state: 'completed'
  bodyHash: string
  responseStatus: number
  responseBody: unknown
  createdAt: string
}

type RecordValue = ProcessingRecord | CompletedRecord

export type IdempotencyReplay = {
  status: number
  body: unknown
}

export type PreparedIdempotency = {
  enabled: boolean
  cacheKey?: string
  bodyHash?: string
  replay?: IdempotencyReplay
  inProgress?: boolean
  conflictError?: string
}

function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function buildCacheKey(userId: string, scope: string, key: string): string {
  return `idem:${scope}:${userId}:${key}`
}

function readIdempotencyKey(request: Request): string | null {
  const key = request.headers.get('idempotency-key')?.trim()
  if (!key) return null
  if (key.length > 128) return null
  return key
}

async function readRecord(cacheKey: string): Promise<RecordValue | null> {
  const raw = await redis.get<string>(cacheKey)
  if (!raw) return null
  try {
    return JSON.parse(raw) as RecordValue
  } catch {
    return null
  }
}

export async function prepareIdempotency(
  request: Request,
  params: { userId: string; scope: string; payload: unknown }
): Promise<PreparedIdempotency> {
  const key = readIdempotencyKey(request)
  if (!key) return { enabled: false }

  const bodyHash = hashPayload(params.payload)
  const cacheKey = buildCacheKey(params.userId, params.scope, key)

  const existing = await readRecord(cacheKey)
  if (existing) {
    if (existing.bodyHash !== bodyHash) {
      return {
        enabled: true,
        conflictError: 'Idempotency-Key reutilizada com payload diferente.',
      }
    }
    if (existing.state === 'completed') {
      return {
        enabled: true,
        replay: { status: existing.responseStatus, body: existing.responseBody },
      }
    }
    return { enabled: true, inProgress: true }
  }

  const processing: ProcessingRecord = {
    state: 'processing',
    bodyHash,
    createdAt: new Date().toISOString(),
  }

  const locked = await redis.set(cacheKey, JSON.stringify(processing), {
    nx: true,
    ex: PROCESSING_TTL_SECONDS,
  })

  if (!locked) {
    const raceRecord = await readRecord(cacheKey)
    if (!raceRecord) {
      return { enabled: true, inProgress: true }
    }
    if (raceRecord.bodyHash !== bodyHash) {
      return {
        enabled: true,
        conflictError: 'Idempotency-Key reutilizada com payload diferente.',
      }
    }
    if (raceRecord.state === 'completed') {
      return {
        enabled: true,
        replay: { status: raceRecord.responseStatus, body: raceRecord.responseBody },
      }
    }
    return { enabled: true, inProgress: true }
  }

  return { enabled: true, cacheKey, bodyHash }
}

export async function finalizeIdempotency(
  prepared: PreparedIdempotency,
  responseStatus: number,
  responseBody: unknown
): Promise<void> {
  if (!prepared.enabled || !prepared.cacheKey || !prepared.bodyHash) return

  const completed: CompletedRecord = {
    state: 'completed',
    bodyHash: prepared.bodyHash,
    responseStatus,
    responseBody,
    createdAt: new Date().toISOString(),
  }

  await redis.set(prepared.cacheKey, JSON.stringify(completed), {
    ex: RESULT_TTL_SECONDS,
  })
}
