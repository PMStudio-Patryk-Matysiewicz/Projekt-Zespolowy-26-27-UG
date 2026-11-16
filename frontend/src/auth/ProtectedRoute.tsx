import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from './AuthContext'

export const LOGIN_PATH = '/logowanie'

// Route element for pages that need a logged-in player.
// Anonymous visitors go to the login page; `from` brings them back after logging in.
export default function ProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <p role="status" style={{ padding: '2rem', color: 'var(--color-muted)' }}>
        Ładowanie…
      </p>
    )
  }

  if (auth.status === 'anonymous') {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
