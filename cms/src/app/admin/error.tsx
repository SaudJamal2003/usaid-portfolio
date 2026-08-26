'use client'

import { useEffect } from 'react'
import { Button, Card } from '@/components/ui'

/**
 * Catches a failure in any admin route — most plausibly the database being
 * unreachable. Without this, a throw in a server component renders Next's
 * default error page and loses the whole shell.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surfacing the digest is what makes a production report traceable.
    console.error('[admin]', error)
  }, [error])

  return (
    <Card className="p-6">
      <h1 className="text-lg font-semibold text-ink">Something went wrong loading this screen.</h1>
      <p className="mt-1 max-w-prose text-sm text-muted">
        This is usually the database or media storage being unreachable. Your content is not
        affected — nothing was saved or changed by this error.
      </p>
      {error.digest && <p className="mt-2 text-xs text-faint">Reference: {error.digest}</p>}
      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <a
          href="/admin"
          className="inline-flex h-9 items-center rounded-lg border border-line-strong px-3.5 text-sm font-medium hover:bg-surface"
        >
          Back to dashboard
        </a>
      </div>
    </Card>
  )
}
