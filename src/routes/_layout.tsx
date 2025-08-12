import { useAuth } from '@/hooks/useAuth'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  const { logout } = useAuth()
  return (
    <>
      <button onClick={() => logout()}>Logout</button>
      <Outlet />
    </>
  )
}
