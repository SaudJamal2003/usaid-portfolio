'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

/* Grouped exactly as the requirements doc specifies (§5). Icons are inline
   glyphs rather than an icon package — a dozen small shapes do not justify a
   dependency. */
const GROUPS = [
  {
    label: null,
    items: [{ href: '/admin', label: 'Dashboard', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/homepage', label: 'Homepage', icon: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z' },
      { href: '/admin/case-studies', label: 'Case Studies', icon: 'M4 4h11l5 5v11H4zM14 4v6h6' },
      { href: '/admin/projects', label: 'Projects', icon: 'M3 7h6l2 2h10v11H3zM3 7V5h6l2 2' },
      { href: '/admin/experience', label: 'Experience', icon: 'M4 8h16v12H4zM9 8V5h6v3' },
      { href: '/admin/mentors', label: 'Mentors', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0' },
      { href: '/admin/services', label: 'Services', icon: 'M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z' },
      { href: '/admin/testimonials', label: 'Testimonials', icon: 'M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 0 1 8-8h2a8 8 0 0 1 8 4z' },
    ],
  },
  {
    label: 'Website',
    items: [
      { href: '/admin/navigation', label: 'Navigation', icon: 'M4 6h16M4 12h16M4 18h16' },
      { href: '/admin/footer', label: 'Footer', icon: 'M4 4h16v16H4zM4 15h16' },
      { href: '/admin/seo', label: 'SEO', icon: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.35-4.35' },
      { href: '/admin/settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1' },
    ],
  },
  {
    label: 'Media',
    items: [{ href: '/admin/media', label: 'Media Library', icon: 'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6' }],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/activity', label: 'Activity', icon: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0' },
      { href: '/admin/users', label: 'Users', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87' },
    ],
  },
]

function isActive(pathname: string, href: string) {
  // /admin must not light up for every child route.
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
}

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex flex-col gap-6 p-4">
      {GROUPS.map((group, index) => (
        <div key={group.label ?? `group-${index}`}>
          {group.label && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-faint">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-ink text-white'
                        : 'text-ink-soft hover:bg-surface hover:text-ink'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0">
                      <path
                        d={item.icon}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* Below lg the sidebar becomes a drawer (§6, §51). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="fixed left-4 top-3.5 z-30 rounded-lg border border-line bg-raised p-2 lg:hidden"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
          <path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="presentation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 shrink-0 overflow-y-auto border-r border-line bg-raised transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-line px-5">
          <span className="grid size-6 place-items-center rounded bg-accent text-[11px] font-bold text-accent-ink">
            U
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">USAID UX CMS</span>
        </div>
        {nav}
      </aside>
    </>
  )
}
