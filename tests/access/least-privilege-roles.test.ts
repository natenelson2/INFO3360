/**
 * Break-tests for assistant_scout / video_analyst / medical least privilege.
 *
 * Case list: docs/access/adversarial-test-cases.md
 * Matrix: docs/access/access-matrix-v2.md
 * Migration: supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql
 *
 * Rules:
 * - Sign in as each role's test account (anon key + password). Never service-role.
 * - Secrets only from env var NAMES in the case list. No hard-coded passwords.
 * - Do not edit the migration. Do not GRANT. Do not disable RLS.
 * - This file does not write pass/fail results; the next step owns the run.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'

const MEDICAL_FLAG_KEYS = [
  'notes',
  'ir',
  'injury',
  'injury_status',
  'medical_flag',
  'medical_status',
  'health',
  'availability_flag',
] as const

function env(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

function hasPair(emailName: string, passwordName: string): boolean {
  return Boolean(env(emailName) && env(passwordName))
}

const hasAssistant = hasPair(
  'TEST_ASSISTANT_SCOUT_EMAIL',
  'TEST_ASSISTANT_SCOUT_PASSWORD',
)
const hasAnalyst = hasPair(
  'TEST_VIDEO_ANALYST_EMAIL',
  'TEST_VIDEO_ANALYST_PASSWORD',
)
const hasMedical = hasPair('TEST_MEDICAL_EMAIL', 'TEST_MEDICAL_PASSWORD')
const hasPublicSupabase = Boolean(
  (env('VITE_SUPABASE_URL') || env('SUPABASE_URL')) &&
    (env('VITE_SUPABASE_ANON_KEY') || env('SUPABASE_ANON_KEY')),
)

function createAnonClient(): SupabaseClient {
  const url = env('VITE_SUPABASE_URL') || env('SUPABASE_URL')
  const anonKey = env('VITE_SUPABASE_ANON_KEY') || env('SUPABASE_ANON_KEY')
  if (!url || !anonKey) {
    throw new Error(
      'Set VITE_SUPABASE_URL (or SUPABASE_URL) and VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY). Do not use the service-role key.',
    )
  }
  // Public anon client only — never SUPABASE_SERVICE_ROLE_KEY.
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

async function signInAs(
  emailEnv: string,
  passwordEnv: string,
): Promise<SupabaseClient> {
  const email = env(emailEnv)
  const password = env(passwordEnv)
  if (!email || !password) {
    throw new Error(`Missing ${emailEnv} / ${passwordEnv}`)
  }
  const client = createAnonClient()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Sign-in failed for ${emailEnv}: ${error.message}`)
  }
  return client
}

function assertDenyRead(data: unknown[] | null, error: { message: string } | null) {
  const rows = data ?? []
  const blocked = rows.length === 0 || error != null
  expect(
    blocked,
    `Expected deny (empty rows or error), got ${rows.length} row(s)` +
      (error ? ` error=${error.message}` : ''),
  ).toBe(true)
}

function assertAllowRead(error: { message: string } | null) {
  expect(error, error?.message ?? 'unexpected read error').toBeNull()
}

function assertDenyChange(error: { message: string } | null) {
  expect(error, 'Expected change to be rejected').not.toBeNull()
}

function assertNoMedicalFlagLeak(row: Record<string, unknown>) {
  const keys = Object.keys(row)
  for (const flag of MEDICAL_FLAG_KEYS) {
    expect(keys, `shared view must not expose ${flag}`).not.toContain(flag)
    expect(row[flag], `shared view must not expose ${flag}`).toBeUndefined()
  }
}

describe('least-privilege roles (adversarial cases)', () => {
  // Guardrail: createAnonClient() above never reads SUPABASE_SERVICE_ROLE_KEY.
  // Do not add a service-role client to this file.

  describe.runIf(hasPublicSupabase && hasAssistant)('assistant scout', () => {
    let client: SupabaseClient

    beforeAll(async () => {
      client = await signInAs(
        'TEST_ASSISTANT_SCOUT_EMAIL',
        'TEST_ASSISTANT_SCOUT_PASSWORD',
      )
    })

    it('AS-READ-SCOUT', async () => {
      const { error } = await client.from('scouting_notes').select('id, body').limit(5)
      assertAllowRead(error)
    })

    it('AS-READ-GAME', async () => {
      const { error } = await client.from('games').select('id, opponent, status').limit(5)
      assertAllowRead(error)
    })

    it('AS-READ-MED', async () => {
      const { data, error } = await client
        .from('sports_science_records')
        .select('id, measure_label, measure_value, notes')
        .limit(5)
      assertDenyRead(data, error)
    })

    it('AS-CHANGE-MED', async () => {
      const { error } = await client.from('sports_science_records').insert({
        athlete_id: '00000000-0000-0000-0000-000000000001',
        author_id: '00000000-0000-0000-0000-000000000002',
        measure_label: 'adversarial-should-fail',
        measure_value: 'x',
      })
      assertDenyChange(error)
    })

    it('AS-READ-SS', async () => {
      const { data, error } = await client
        .from('sports_science_records')
        .select('id, measure_label, measure_value')
        .limit(5)
      assertDenyRead(data, error)
    })

    it('AS-CHANGE-SS', async () => {
      const { error } = await client.from('sports_science_records').insert({
        athlete_id: '00000000-0000-0000-0000-000000000001',
        author_id: '00000000-0000-0000-0000-000000000002',
        measure_label: 'adversarial-ss-should-fail',
        measure_value: 'x',
      })
      assertDenyChange(error)
    })

    it('AS-FLAG-SHARED', async () => {
      const { data, error } = await client
        .from('players_shared_identity')
        .select('*')
        .limit(20)
      assertAllowRead(error)
      for (const row of data ?? []) {
        assertNoMedicalFlagLeak(row as Record<string, unknown>)
      }
      const notesProbe = await client
        .from('players_shared_identity')
        .select('notes')
        .limit(1)
      const notesBlocked =
        notesProbe.error != null ||
        (notesProbe.data ?? []).every(
          (row) =>
            row == null ||
            !Object.prototype.hasOwnProperty.call(row, 'notes') ||
            (row as { notes?: unknown }).notes == null,
        )
      expect(
        notesBlocked,
        'medical flag / players.notes must be absent, hidden, or rejected on players_shared_identity',
      ).toBe(true)
    })

    it('AS-BASE-PLAYERS-NOTES', async () => {
      const { data, error } = await client
        .from('players')
        .select('id, notes')
        .limit(5)
      assertDenyRead(data, error)
    })
  })

  describe.runIf(hasPublicSupabase && hasAnalyst)('video analyst', () => {
    let client: SupabaseClient

    beforeAll(async () => {
      client = await signInAs(
        'TEST_VIDEO_ANALYST_EMAIL',
        'TEST_VIDEO_ANALYST_PASSWORD',
      )
    })

    it('VA-READ-SCOUT', async () => {
      const { error } = await client.from('scouting_notes').select('id, body').limit(5)
      assertAllowRead(error)
    })

    it('VA-READ-GAME', async () => {
      const { error } = await client.from('games').select('id, opponent, status').limit(5)
      assertAllowRead(error)
    })

    it('VA-READ-MED', async () => {
      const { data, error } = await client
        .from('sports_science_records')
        .select('id, measure_label, measure_value, notes')
        .limit(5)
      assertDenyRead(data, error)
    })

    it('VA-CHANGE-MED', async () => {
      const { error } = await client.from('sports_science_records').insert({
        athlete_id: '00000000-0000-0000-0000-000000000001',
        author_id: '00000000-0000-0000-0000-000000000002',
        measure_label: 'adversarial-va-med-should-fail',
        measure_value: 'x',
      })
      assertDenyChange(error)
    })

    it('VA-READ-SS', async () => {
      const { data, error } = await client
        .from('sports_science_records')
        .select('id, measure_label, measure_value')
        .limit(5)
      assertDenyRead(data, error)
    })

    it('VA-CHANGE-SS', async () => {
      const { error } = await client.from('sports_science_records').insert({
        athlete_id: '00000000-0000-0000-0000-000000000001',
        author_id: '00000000-0000-0000-0000-000000000002',
        measure_label: 'adversarial-va-ss-should-fail',
        measure_value: 'x',
      })
      assertDenyChange(error)
    })

    it('VA-FLAG-SHARED', async () => {
      const { data, error } = await client
        .from('players_shared_identity')
        .select('*')
        .limit(20)
      assertAllowRead(error)
      for (const row of data ?? []) {
        assertNoMedicalFlagLeak(row as Record<string, unknown>)
      }
      const notesProbe = await client
        .from('players_shared_identity')
        .select('notes')
        .limit(1)
      const notesBlocked =
        notesProbe.error != null ||
        (notesProbe.data ?? []).every(
          (row) =>
            row == null ||
            !Object.prototype.hasOwnProperty.call(row, 'notes') ||
            (row as { notes?: unknown }).notes == null,
        )
      expect(
        notesBlocked,
        'medical flag / players.notes must be absent, hidden, or rejected on players_shared_identity',
      ).toBe(true)
    })
  })

  describe.runIf(hasPublicSupabase && hasMedical)('medical control', () => {
    let client: SupabaseClient

    beforeAll(async () => {
      client = await signInAs('TEST_MEDICAL_EMAIL', 'TEST_MEDICAL_PASSWORD')
    })

    it('MED-READ-MED', async () => {
      const { error } = await client
        .from('sports_science_records')
        .select('id, measure_label, measure_value, notes')
        .limit(5)
      assertAllowRead(error)
    })
  })
})