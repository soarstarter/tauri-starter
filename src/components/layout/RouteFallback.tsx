import { Loader2 } from 'lucide-react'

/**
 * Suspense fallback shown while a lazily-loaded route chunk is fetched. Kept
 * deliberately minimal so it paints instantly and doesn't itself pull in extra
 * code. Centered within whatever layout (shell or shell-less) renders it.
 */
export const RouteFallback = () => {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
