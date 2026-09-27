// src/lib/supabase/client.ts
// Public (anon) Supabase client for typed scouting reads.
// Do NOT put SUPABASE_SERVICE_ROLE_KEY here — that stays in app/lib/supabase.server.ts.

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined

if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill the public Supabase values.',
  )
}

export const supabase = createClient<Database>(
  supabaseUrl.trim(),
  supabaseAnonKey.trim(),
)