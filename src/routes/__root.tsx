import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { AppContext } from '@/types/app'

export const Route = createRootRouteWithContext<AppContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
}