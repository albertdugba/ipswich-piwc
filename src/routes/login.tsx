import { createFileRoute, Link } from '@tanstack/react-router'
import { ChurchIcon, HugeiconsIcon } from '@/lib/icons'
import { isFirebaseConfigured } from '@/lib/env.public'

/*
 * Login placeholder. Auth is scaffolded (Firebase Auth) but wired to a mock
 * session for this phase, so this page just explains the current state. When
 * real auth lands, this is where the Firebase sign-in UI goes.
 */
export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-brand-600 text-white ring-2 ring-gold-400">
            <HugeiconsIcon icon={ChurchIcon} className="size-6" />
          </span>
          <h1 className="text-lg font-semibold text-foreground">
            Ipswich PIWC
          </h1>
          <p className="text-sm text-muted-foreground">
            The Church of Pentecost — internal management
          </p>
        </div>

        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Authentication is scaffolded for this phase.{' '}
          {isFirebaseConfigured
            ? 'Firebase is configured; sign-in UI is added in a later phase.'
            : 'Add your Firebase config to .env to enable sign-in.'}
        </div>

        <Link
          to="/dashboard"
          className="mt-6 flex h-10 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700"
        >
          Continue to app
        </Link>
      </div>
    </div>
  )
}
