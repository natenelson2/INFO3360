// src/routes/login.tsx
// Staff email/password sign-in (browser helpers only).
// No protected data fetching and no RLS in this step.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { signIn } from '../lib/auth/sign-in'
import { signOut } from '../lib/auth/sign-out'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setInfo(null)

    const result = await signIn(email, password)
    setPending(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    void navigate({ to: '/' })
  }

  async function onSignOut() {
    setError(null)
    setInfo(null)
    const result = await signOut()
    if (!result.ok) {
      setError(result.message)
      return
    }
    setInfo('Signed out. Session cleared.')
  }

  return (
    <main className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-slate-900">Staff sign-in</h1>
      <p className="mt-2 text-sm text-slate-600">
        Hockey Ops — use your staff email and password. This page only starts a
        Supabase Auth session; protected data loaders come later.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 rounded border border-slate-200 bg-white p-4"
      >
        <label className="block text-sm text-slate-800">
          Email
          <input
            type="email"
            autoComplete="username"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm text-slate-800">
          Password
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {info ? <p className="text-sm text-slate-700">{info}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-sky-800 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void onSignOut()}
        className="mt-4 text-sm text-sky-800 underline underline-offset-2"
      >
        Sign out
      </button>

      <p className="mt-6 text-sm">
        <Link to="/" className="text-sky-800 underline underline-offset-2">
          Back to home
        </Link>
      </p>
    </main>
  )
}