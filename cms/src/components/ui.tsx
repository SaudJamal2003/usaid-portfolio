import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

/* Shared primitives. Every screen composes these rather than restyling its own
   buttons and tables (§20). */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft',
  secondary: 'border border-line-strong bg-raised text-ink hover:bg-surface',
  ghost: 'text-muted hover:bg-surface hover:text-ink',
  danger: 'border border-danger/30 bg-danger-bg text-danger hover:bg-danger/10',
}

const BUTTON_BASE =
  'inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return <button className={`${BUTTON_BASE} ${BUTTON_STYLES[variant]} ${className}`} {...props} />
}

export function LinkButton({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={`${BUTTON_BASE} ${BUTTON_STYLES[variant]} ${className}`} {...props} />
}

const BADGE_STYLES: Record<string, string> = {
  PUBLISHED: 'bg-ok-bg text-ok',
  DRAFT: 'bg-warn-bg text-warn',
  ARCHIVED: 'bg-surface text-muted',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        BADGE_STYLES[status] ?? 'bg-surface text-muted'
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={`rounded-xl border border-line bg-raised shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-faint">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}

export const inputStyles =
  'w-full rounded-lg border border-line-strong bg-raised px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent-deep focus:outline-none focus:ring-2 focus:ring-accent/30'

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${inputStyles} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea className={`${inputStyles} min-h-24 resize-y ${className}`} {...props} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`${inputStyles} ${className}`} {...props} />
}

/** Never a blank screen (§40). */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-raised px-6 py-16 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-raised">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {head.map((label) => (
              <th
                key={label}
                scope="col"
                className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-faint"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return <tr className="border-b border-line last:border-0 hover:bg-surface">{children}</tr>
}

export function Cell({ className = '', ...props }: ComponentProps<'td'>) {
  return <td className={`px-4 py-3 align-middle ${className}`} {...props} />
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'error' | 'warn'; children: ReactNode }) {
  const styles = {
    info: 'bg-info-bg text-info',
    error: 'bg-danger-bg text-danger',
    warn: 'bg-warn-bg text-warn',
  }[tone]
  return (
    <div role="status" className={`rounded-lg px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  )
}
