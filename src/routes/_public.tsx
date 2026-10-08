import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PublicHeader } from '@/features/public/PublicHeader'
import { PublicFooter } from '@/features/public/PublicFooter'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white font-public text-foreground antialiased">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
