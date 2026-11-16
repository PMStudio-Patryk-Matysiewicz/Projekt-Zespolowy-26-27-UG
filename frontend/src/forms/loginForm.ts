export type LoginValues = {
  login: string
  password: string
}

export type LoginField = keyof LoginValues

export const emptyLoginValues: LoginValues = { login: '', password: '' }

// Shown for any wrong username, e-mail or password, so the form never tells which one was wrong.
export const INVALID_CREDENTIALS = 'Nieprawidłowa nazwa użytkownika, e-mail lub hasło.'

// Only checks that both fields are filled in; the backend decides whether they are correct.
export function validateLogin(values: LoginValues): Partial<Record<LoginField, string>> {
  const errors: Partial<Record<LoginField, string>> = {}
  if (!values.login.trim()) errors.login = 'Podaj nazwę użytkownika lub e-mail.'
  if (!values.password) errors.password = 'Podaj hasło.'
  return errors
}
