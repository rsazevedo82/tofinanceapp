import { adminClient } from '@/lib/supabase/admin'

type AdminNotification = {
  user_id: string
  type: string
  title: string
  body: string
  payload?: Record<string, unknown>
  created_at?: string
}

export async function insertAdminNotification(notification: AdminNotification) {
  return adminClient.from('notifications').insert(notification)
}

export async function insertAdminNotifications(notifications: AdminNotification[]) {
  return adminClient.from('notifications').insert(notifications)
}
