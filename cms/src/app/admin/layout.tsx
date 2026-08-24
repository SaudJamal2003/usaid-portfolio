import { redirect } from 'next/navigation'
import { getSessionUser, destroySession } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'

const PORTFOLIO_URL = process.env.PORTFOLIO_URL ?? 'https://www.usaidux.space'

async function logout() {
  'use server'
  await destroySession()
  redirect('/login')
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  /* The real auth gate. Middleware only checks that a cookie exists. */
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const initial = (user.name ?? user.email).charAt(0).toUpperCase()

  return (
    <div className="flex min-h-dvh">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-end gap-3 border-b border-line bg-raised/90 px-5 backdrop-blur">
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-surface hover:text-ink sm:inline-flex"
          >
            View website
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5">
              <path
                d="M7 17 17 7M9 7h8v8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>

          <div className="flex items-center gap-2.5 border-l border-line pl-3">
            <span className="grid size-7 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
              {initial}
            </span>
            <span className="hidden text-sm text-ink-soft sm:inline">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-5 py-7 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
