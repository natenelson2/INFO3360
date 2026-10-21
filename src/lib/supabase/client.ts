// src/lib/supabase/client.ts
// BROWSER Supabase client — public env only (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
// Use for login UI / sign-out later. Must NOT be trusted alone for authorization.
// Do NOT read SUPABASE_SERVICE_ROLE_KEY here (that stays server-only).

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

/**
 * Creates a typed Supabase browser client (anon / public key only).
 * Call from browser-side code. Prefer this named factory in new work.
 */
export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  if (!url?.trim() || !anonKey?.trim()) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env.local and fill the public Supabase values.',
    )
  }

  return createBrowserClient<Database>(url.trim(), anonKey.trim())
}

let browserClient: SupabaseClient<Database> | undefined

/**
 * Shared browser client singleton for existing scouting helpers.
 * New code should prefer createSupabaseBrowserClient() or this getter.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient()
  }
  return browserClient
}

/**
 * Lazy singleton used by src/lib/scouting/* today.
 * Still public-anon only — never the service-role key.
 */
export const supabase: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop, receiver) {
      const client = getSupabaseBrowserClient()
      const value = Reflect.get(client, prop, receiver)
      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(client)
        : value
    },
  },
)