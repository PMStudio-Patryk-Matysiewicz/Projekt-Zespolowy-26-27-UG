import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import * as authApi from '../api/auth'
import { AuthContext, type AuthContextValue, type AuthState } from './AuthContext'

// Knows who is logged in. The session itself lives in Django's cookie, so after a page refresh
// the provider asks GET /api/auth/me and the player stays logged in.
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    // Ignore a response that arrives after unmount (or after StrictMode's extra mount in dev).
    let active = true
    authApi
      .getMe()
      .then((player) => {
        if (active) setState({ status: 'authenticated', player })
      })
      .catch(() => {
        // 403 = no session. Network or server errors also leave the player logged out:
        // protected pages send them to the login form instead of showing a broken page.
        if (active) setState({ status: 'anonymous' })
      })
    return () => {
      active = false
    }
  }, [])

  // Errors are thrown to the caller, so the form can show them.
  const logIn = useCallback(async (credentials: authApi.LoginRequest) => {
    const player = await authApi.login(credentials)
    setState({ status: 'authenticated', player })
  }, [])

  const register = useCallback(async (data: authApi.RegisterRequest) => {
    const player = await authApi.register(data)
    setState({ status: 'authenticated', player })
  }, [])

  const logOut = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setState({ status: 'anonymous' })
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({ ...state, logIn, register, logOut }), [state, logIn, register, logOut])

  return <AuthContext value={value}>{children}</AuthContext>
}
