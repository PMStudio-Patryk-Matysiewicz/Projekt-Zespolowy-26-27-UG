import { createContext, useContext } from 'react'

import type { LoginRequest, Player, RegisterRequest } from '../api/auth'

// `loading` lasts until GET /api/auth/me answers, so a refresh does not flash the login page.
export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; player: Player }
  | { status: 'anonymous' }

export type AuthContextValue = AuthState & {
  logIn: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>')
  return auth
}
