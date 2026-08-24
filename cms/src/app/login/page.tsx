'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { login, type LoginState } from './actions'
import { Alert, Button, Field, Input } from '@/components/ui'

function LoginForm() {
  const params = useSearchParams()
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <form action={formAction} className="w-full max-w-sm">
      <div className="mb-7">
        <span className="mb-4 grid size-9 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-ink">
          U
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Sign in to the CMS</h1>
        <p className="mt-1 text-sm text-muted">Manage the content of usaidux.space</p>
      </div>

      <input type="hidden" name="next" value={params.get('next') ?? ''} />

      <div className="flex flex-col gap-4">
        <Field label="Email" required>
          <Input name="email" type="email" autoComplete="username" required autoFocus />
        </Field>
        <Field label="Password" required>
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>

        {state.error && <Alert tone="error">{state.error}</Alert>}

        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
