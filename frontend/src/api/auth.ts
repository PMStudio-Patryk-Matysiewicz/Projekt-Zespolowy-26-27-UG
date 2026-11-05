import { api } from './client'

// Body of POST /api/auth/register. Assumed contract until the backend endpoint exists:
// fields of accounts.User; the backend checks the password with Django's validators.
export type RegisterRequest = {
  username: string
  email: string
  display_name: string
  password: string
}

export function register(data: RegisterRequest): Promise<unknown> {
  return api.post('/api/auth/register', data)
}
