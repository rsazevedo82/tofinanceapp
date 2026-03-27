import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null }, { status })
}

export function fail<T>(status: number, message: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data: null, error: message }, { status })
}

export function logInternalError(context: string, err: unknown): void {
  console.error(`[${context}]`, err)
}
