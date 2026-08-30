import { createFileRoute, redirect } from '@tanstack/react-router'

// The root path sends people to the dashboard (which itself is auth-guarded by
// the _app layout).
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})
