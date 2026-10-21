// src/lib/auth/sign-in.ts
// Browser-only staff sign-in helper (Supabase Auth email/password).
// Uses the public browser client — not the server session client.

import { getSupabaseBrowserClient } from '../supabase/client'

export type SignInResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Sign in with email/password via Supabase Auth.
 * Returns a simple ok/message result for the UI (does not throw AuthApiError).
 */
export async function signIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const trimmedEmail = email.trim()
  if (!trimmedEmail || !password) {
    return { ok: false, message: 'Email and password are required.' }
  }

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}