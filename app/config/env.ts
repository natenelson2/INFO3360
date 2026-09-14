/**
 * Env split for Hockey Operations Directory (TanStack Start + Vite + Supabase).
 *
 * Aligns with docs/client-vs-server-inventory.md:
 * - PUBLIC  → VITE_* only (safe to expose in the browser bundle)
 * - SECRET  → no VITE_ prefix (service role and similar stay server-only)
 *
 * Do NOT implement Supabase clients or server functions in this file.
 * Do NOT log secret values.
 */

export type PublicEnv = {
  /** Supabase project URL (public). */
  supabaseUrl: string
  /** Supabase anon/public key (public; protect data with RLS). */
  supabaseAnonKey: string
}

export type ServerEnv = {
  /**
   * Supabase service-role key (SECRET).
   * Never expose via VITE_ or import this export from client/UI modules.
   */
  supabaseServiceRoleKey: string
  /**
   * Project URL for server-side clients. Prefer the public URL value
   * (same project); read from process.env so server code does not depend
   * on importing client-only bindings.
   */
  supabaseUrl: string
}

function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill in development values ` +
        `(see docs/client-vs-server-inventory.md).`,
    )
  }
  return trimmed
}

/**
 * Browser-safe config. Only reads Vite-exposed `import.meta.env.VITE_*` values.
 * Safe to import from client components and routes.
 */
export function getPublicEnv(): PublicEnv {
  return {
    supabaseUrl: required(
      'VITE_SUPABASE_URL',
      import.meta.env.VITE_SUPABASE_URL as string | undefined,
    ),
    supabaseAnonKey: required(
      'VITE_SUPABASE_ANON_KEY',
      import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
    ),
  }
}

/**
 * SERVER-ONLY config.
 *
 * WARNING: Do not import `getServerEnv` (or this secret-bearing export path)
 * from client components, browser routes, or any module that Vite bundles
 * for the browser. That would risk pulling secret access into the client graph.
 *
 * Reads secrets via `process.env` (no VITE_ prefix) on the server path only.
 */
export function getServerEnv(): ServerEnv {
  const supabaseUrl = required(
    'SUPABASE_URL or VITE_SUPABASE_URL',
    (typeof process !== 'undefined'
      ? process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
      : undefined) as string | undefined,
  )

  const supabaseServiceRoleKey = required(
    'SUPABASE_SERVICE_ROLE_KEY',
    typeof process !== 'undefined'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : undefined,
  )

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
  }
}

/** Convenience aliases matching the step's publicEnv / serverEnv naming. */
export const publicEnv = {
  get: getPublicEnv,
}

/**
 * SERVER-ONLY. Do not import from client/UI code.
 * Prefer `getServerEnv()` at the call site inside server functions.
 */
export const serverEnv = {
  get: getServerEnv,
}