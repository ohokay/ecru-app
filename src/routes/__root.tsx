import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { type QueryClient } from '@tanstack/react-query'
import type PocketBase from 'pocketbase'

export type AppContext = {
  queryClient: QueryClient
  pb: PocketBase
}

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