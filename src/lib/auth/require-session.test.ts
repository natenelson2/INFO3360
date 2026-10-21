// src/lib/auth/require-session.test.ts
// Vitest coverage for the server session gate.
// Mocks createSupabaseServerClient — never hits a real network or database.
// Matches real exports: requireSession → SessionUser { id, email }, throws on fail.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

import { createSupabaseServerClient } from '../supabase/server'
import { requireSession } from './require-session'

describe('requireSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the authenticated staff identity when a session exists', async () => {
    const mockUser = {
      id: 'staff-user-uuid-1',
      email: 'scout@example.com',
    }

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: mockUser } },
          error: null,
        }),
      },
    } as never)

    const session = await requireSession()

    // Real helper returns { id, email } — not session.user
    expect(session.id).toBe('staff-user-uuid-1')
    expect(session.email).toBe('scout@example.com')
    expect(createSupabaseServerClient).toHaveBeenCalledTimes(1)
  })

  it('fails closed when there is no authenticated session', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
    } as never)

    await expect(requireSession()).rejects.toThrow(/unauthorized|sign in/i)
  })

  it('fails closed when getSession returns an auth error', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'Auth session missing' },
        }),
      },
    } as never)

    await expect(requireSession()).rejects.toThrow(
      /unauthorized|session check failed/i,
    )
  })
})