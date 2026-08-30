import { Link } from '@tanstack/react-router'
import { CompassIcon, HugeiconsIcon } from '@/lib/icons'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
      <HugeiconsIcon icon={CompassIcon} className="size-10 text-brand-600" />
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you are looking for doesn’t exist or has moved.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
