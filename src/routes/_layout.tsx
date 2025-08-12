import { useAuth } from '@/hooks/useAuth'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  const { logout } = useAuth()
  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={() => logout()}>Logout</button>
      <Outlet />
    </div>
  )
}
