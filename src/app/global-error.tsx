'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-black-deep text-white">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-white-muted">An unexpected error occurred. Our team has been notified.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded bg-red-hot px-6 py-2 text-white transition-colors hover:bg-red-dim"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
