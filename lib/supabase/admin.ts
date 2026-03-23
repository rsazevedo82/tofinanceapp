// lib/supabase/admin.ts
// Cliente com service_role — usar APENAS em API routes server-side.
// Nunca importar em componentes client-side ou hooks.

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida nas variáveis de ambiente')
}

export const adminClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
)
