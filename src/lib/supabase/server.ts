// src/lib/supabase/server.ts
// SERVER Supabase client — session-aware via cookies.
//
// MUST NOT be imported from browser/UI routes or client components.
// Import only from TanStack Start server functions / other server modules.
//
// Uses the public anon key + request cookies so later require-session helpers
// can read the signed-in staff user. Does NOT use SUPABASE_SERVICE_ROLE_KEY
// (that secret stays in app/lib/supabase.server.ts for privileged server jobs).

import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

function readServerPublicEnv(): { url: string; anonKey: string } {
  // Prefer non-VITE names on the server when present; fall back to VITE_ public names.
  const url =
    (typeof process !== 'undefined'
      ? process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
      : undefined) ?? undefined
  const anonKey =
    (typeof process !== 'undefined'
      ? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
      : undefined) ?? undefined

  if (!url?.trim() || !anonKey?.trim()) {
    throw new Error(
      'Missing Supabase URL or anon key for the server client. ' +
        'Set SUPABASE_URL / SUPABASE_ANON_KEY or VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.',
    )
  }

  return { url: url.trim(), anonKey: anonKey.trim() }
}

/**
 * Creates a per-request typed Supabase server client wired to Start cookies.
 * Call from server functions that will later run require-session before queries.
 * Do not cache this client across requests.
 */
export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const { url, anonKey } = readServerPublicEnv()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options)
        }
      },
    },
  })
}