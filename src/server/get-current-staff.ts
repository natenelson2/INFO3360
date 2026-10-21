// src/server/get-current-staff.ts
// TanStack Start server function: who is signed in right now?
// Identity comes only from requireSession() on the server — never from a
// client-passed userId argument.

import { createServerFn } from '@tanstack/react-start'
import { requireSession } from '../lib/auth/require-session'

export type CurrentStaff = {
  id: string
  email: string | undefined
}

/**
 * Returns safe staff identity fields for the current Auth session.
 * Role / RLS enforcement stays for later steps (see role-access-matrix).
 */
export const getCurrentStaff = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentStaff> => {
    const user = await requireSession()

    return {
      id: user.id,
      email: user.email,
    }
  },
)