import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  fromMock,
  rpcMock,
  getUserByIdMock,
  inviteUserByEmailMock,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
  getUserByIdMock: vi.fn(),
  inviteUserByEmailMock: vi.fn(),
}))

function createBuilder() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }
}

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: fromMock,
    rpc: rpcMock,
    auth: {
      admin: {
        getUserById: getUserByIdMock,
        inviteUserByEmail: inviteUserByEmailMock,
      },
    },
  },
}))

import { insertAuditEvent } from '@/lib/privileged/auditAdmin'
import { insertAdminNotification, insertAdminNotifications } from '@/lib/privileged/notificationsAdmin'
import {
  cancelInvitationById,
  findAuthUserIdByEmail,
  getActiveCoupleByUserId,
  getAuthUserById,
  inviteUserByEmail,
} from '@/lib/privileged/coupleAdmin'

describe('privileged admin layers', () => {
  beforeEach(() => {
    fromMock.mockReset()
    rpcMock.mockReset()
    getUserByIdMock.mockReset()
    inviteUserByEmailMock.mockReset()
  })

  it('insere evento de auditoria na tabela correta', async () => {
    const builder = createBuilder()
    fromMock.mockReturnValue(builder)
    const event = {
      user_id: 'u1',
      action: 'auth_login',
      status: 'success' as const,
      target_type: 'session',
      target_id: 'u1',
      ip: '127.0.0.1',
      user_agent: 'UA',
      metadata: {},
    }

    await insertAuditEvent(event)

    expect(fromMock).toHaveBeenCalledWith('audit_events')
    expect(builder.insert).toHaveBeenCalledWith(event)
  })

  it('insere notificacao unica e em lote', async () => {
    const builder = createBuilder()
    fromMock.mockReturnValue(builder)
    const notification = {
      user_id: 'u1',
      type: 'security_password_changed',
      title: 'Senha alterada',
      body: 'ok',
      payload: {},
    }
    const notifications = [notification]

    await insertAdminNotification(notification)
    await insertAdminNotifications(notifications)

    expect(fromMock).toHaveBeenNthCalledWith(1, 'notifications')
    expect(fromMock).toHaveBeenNthCalledWith(2, 'notifications')
    expect(builder.insert).toHaveBeenNthCalledWith(1, notification)
    expect(builder.insert).toHaveBeenNthCalledWith(2, notifications)
  })

  it('consulta couple ativo por usuario com filtro OR esperado', async () => {
    const builder = createBuilder()
    fromMock.mockReturnValue(builder)

    await getActiveCoupleByUserId('user-123')

    expect(fromMock).toHaveBeenCalledWith('couple_profiles')
    expect(builder.select).toHaveBeenCalledWith('*')
    expect(builder.or).toHaveBeenCalledWith('user_id_1.eq.user-123,user_id_2.eq.user-123')
    expect(builder.maybeSingle).toHaveBeenCalled()
  })

  it('cancela convite por id e opcionalmente por inviter_id', async () => {
    const builder = createBuilder()
    fromMock.mockReturnValue(builder)

    await cancelInvitationById('inv-1')
    expect(builder.eq).toHaveBeenCalledWith('id', 'inv-1')

    builder.eq.mockClear()
    await cancelInvitationById('inv-2', 'user-2')
    expect(builder.eq).toHaveBeenNthCalledWith(1, 'id', 'inv-2')
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'inviter_id', 'user-2')
  })

  it('encapsula chamadas auth admin e rpc', async () => {
    getUserByIdMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    inviteUserByEmailMock.mockResolvedValue({ data: null, error: null })
    rpcMock.mockResolvedValue({ data: 'u2', error: null })

    await getAuthUserById('u1')
    await inviteUserByEmail('test@example.com', { invited_by: 'Tester' })
    await findAuthUserIdByEmail('test@example.com')

    expect(getUserByIdMock).toHaveBeenCalledWith('u1')
    expect(inviteUserByEmailMock).toHaveBeenCalledWith('test@example.com', {
      data: { invited_by: 'Tester' },
    })
    expect(rpcMock).toHaveBeenCalledWith('find_auth_user_id_by_email', { p_email: 'test@example.com' })
  })
})
