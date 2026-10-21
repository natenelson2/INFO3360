// src/server/scouting-notes.ts
// Protected scouting notes loader for Hockey Ops staff.
// Gate: requireSession() before any table access.
// Client: createSupabaseServerClient() so the user JWT reaches Postgres (RLS).
// Forbidden: browser Supabase client queries; trusting a UI-sent role string.
//
// RLS SELECT rule (docs/security/rls-policy-spec.md § scouting_notes):
// only staff_profiles.role = scouting AND athlete on that user’s assignment/caseload.
// Coaching and medical must receive zero scouting_notes rows.

import { createServerFn } from '@tanstack/react-start'
import { requireSession } from '../lib/auth/require-session'
import { createSupabaseServerClient } from '../lib/supabase/server'

export type ScoutingNoteRow = {
  id: string
  athlete_id: string
  player_name: string
  body: string
  created_at: string
  author_id: string
}

export type ListScoutingNotesResult =
  | {
      ok: true
      notes: ScoutingNoteRow[]
      staff: { id: string; email: string | undefined }
    }
  | {
      ok: false
      error: { code: 'UNAUTHORIZED' | 'UPSTREAM'; message: string }
    }

type NoteQueryRow = {
  id: string
  athlete_id: string
  body: string
  created_at: string
  author_id: string
  athlete: { full_name: string } | null
}

/**
 * List scouting notes visible to the signed-in staff member.
 * Row filtering is enforced by Postgres RLS — not by a role argument from the UI.
 */
export const listScoutingNotes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListScoutingNotesResult> => {
    // 1) Identity gate — refuse anonymous callers before any table access.
    //    Never accept userId/role/isLoggedIn from the browser as proof.
    let staff: { id: string; email: string | undefined }
    try {
      staff = await requireSession()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unauthorized: sign in required'
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message },
      }
    }

    // 2) Authenticated server client — session cookies/JWT reach Postgres so RLS applies.
    const supabase = await createSupabaseServerClient()

    // 3) Query the table. Do NOT filter by a client-supplied role in app code
    //    as a substitute for RLS (spec: same tables, different rows).
    const { data, error } = await supabase
      .from('scouting_notes')
      .select(
        `
        id,
        athlete_id,
        body,
        created_at,
        author_id,
        athlete:players!athlete_id (
          full_name
        )
      `,
      )
      .order('created_at', { ascending: false })

    if (error) {
      return {
        ok: false,
        error: {
          code: 'UPSTREAM',
          message: `Failed to load scouting notes: ${error.message}`,
        },
      }
    }

    const rows = (data ?? []) as unknown as NoteQueryRow[]
    const notes: ScoutingNoteRow[] = rows.map((row) => ({
      id: row.id,
      athlete_id: row.athlete_id,
      player_name: row.athlete?.full_name ?? 'Unknown player',
      body: row.body,
      created_at: row.created_at,
      author_id: row.author_id,
    }))

    return { ok: true, notes, staff }
  },
)