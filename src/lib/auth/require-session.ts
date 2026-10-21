// src/lib/auth/require-session.ts
// Server-only session gate for TanStack Start server functions.
// Re-reads Auth identity from cookies via createSupabaseServerClient.
// Never trust client-passed user ids, isLoggedIn flags, or React state.

import { createSupabaseServerClient } from '../supabase/server'

export type SessionUser = {
  id: string
  email: string | undefined
}

/**
 * Fail-closed session check for protected server work.
 * Uses the server Supabase client (cookie-wired), not the browser client.
 * Throws when there is no valid signed-in user so callers cannot continue.
 */
export async function requireSession(): Promise<SessionUser> {
  const supabase = await createSupabaseServerClient()

  // Re-read the Auth session from server cookies. Do not accept a
  // client-supplied userId or isLoggedIn flag as proof of identity.
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error(`Unauthorized: session check failed (${error.message})`)
  }

  if (!session?.user) {
    throw new Error('Unauthorized: sign in required')
  }

  return {
    id: session.user.id,
    email: session.user.email,
  }
}