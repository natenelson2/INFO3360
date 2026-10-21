// src/lib/auth/sign-out.ts
// Browser-only staff sign-out helper.
// Clears the Supabase Auth session (cookie/storage) via the browser client.

import { getSupabaseBrowserClient } from '../supabase/client'

export type SignOutResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Sign out the current staff session.
 * Returns ok/message for the UI instead of throwing.
 */
export async function signOut(): Promise<SignOutResult> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}