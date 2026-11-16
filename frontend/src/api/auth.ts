import { api } from './client'

// The logged-in player, as returned by register, login and me (accounts.PlayerSerializer).
export type Player = {
  id: number
  username: string
  email: string
  display_name: string
  balance: number
}

// Body of POST /api/auth/register; the backend checks the password with Django's validators.
export type RegisterRequest = {
  username: string
  email: string
  display_name: string
  password: string
}

// Body of POST /api/auth/login; `login` is a username or an e-mail address.
export type LoginRequest = {
  login: string
  password: string
}

// Creates the account and starts a session.
export function register(data: RegisterRequest): Promise<Player> {
  return api.post('/api/auth/register', data)
}

// Starts a session. Wrong credentials give 400 with one message for the whole form.
export function login(data: LoginRequest): Promise<Player> {
  return api.post('/api/auth/login', data)
}

// Ends the session (204).
export function logout(): Promise<void> {
  return api.post('/api/auth/logout')
}

// The player of the current session; 403 when nobody is logged in.
export function getMe(): Promise<Player> {
  return api.get('/api/auth/me')
}
