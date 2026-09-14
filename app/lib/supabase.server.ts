// app/lib/supabase.server.ts
// Server-only Supabase client. Do NOT import this from client routes or browser components.
// Import only from TanStack Start server functions / other *.server.ts modules.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getServerEnv } from '../config/env'

/**
 * Returns a Supabase client authenticated with the secret service-role key.
 * Call only from server functions / server modules.
 *
 * Env names align with .env.example / getServerEnv():
 * - URL: SUPABASE_URL or VITE_SUPABASE_URL (URL itself is public)
 * - Key: SUPABASE_SERVICE_ROLE_KEY (SECRET; never VITE_-prefixed)
 */
export function getSupabaseServerClient(): SupabaseClient {
  // getServerEnv() throws a clear error if required server values are missing.
  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv()

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}