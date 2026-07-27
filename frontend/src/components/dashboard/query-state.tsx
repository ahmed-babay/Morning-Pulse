import { RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { Skeleton } from '../ui/primitives'

function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading updates" className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}

export function QueryState({
  pending,
  error,
  empty,
  retry,
  children,
}: {
  pending: boolean
  error: Error | null
  empty: boolean
  retry: () => void
  children: ReactNode
}) {
  if (pending) return <LoadingRows />
  if (error)
    return (
      <div role="alert" className="py-8 text-center">
        <p className="font-bold">This update missed its connection</p>
        <p className="mt-1 text-sm text-muted">{error.message}</p>
        <button
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white"
          onClick={retry}
          type="button"
        >
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  if (empty)
    return (
      <p className="py-8 text-center text-sm text-muted">
        Nothing new right now.
      </p>
    )
  return children
}
