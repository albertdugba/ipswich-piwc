import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import { NotFound } from '@/components/layout/NotFound'

/*
 * Router factory. TanStack Start calls this per request (SSR) and once on the
 * client. A QueryClient is created here and threaded through the router context
 * so loaders/components can use TanStack Query where it earns its keep.
 */
export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    },
  })

  return createTanStackRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultNotFoundComponent: NotFound,
  })
}

// Support both the historic (`createRouter`) and newer (`getRouter`) entry
// names the Start plugin may look for.
export const getRouter = createRouter

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
