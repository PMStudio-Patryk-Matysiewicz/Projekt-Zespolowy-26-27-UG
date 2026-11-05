// Values and checks of the sign-up form. The checks mirror the backend (accounts.User and
// Django's default password validators), so most mistakes are caught before sending.
// The backend still validates everything; its errors are shown with toFormErrors.

export type RegisterValues = {
  username: string
  email: string
  display_name: string
  password: string
  password_confirm: string
  accept_terms: boolean
}

export type RegisterField = keyof RegisterValues

export const registerFields: readonly RegisterField[] = [
  'username',
  'email',
  'display_name',
  'password',
  'password_confirm',
  'accept_terms',
]

export const emptyRegisterValues: RegisterValues = {
  username: '',
  email: '',
  display_name: '',
  password: '',
  password_confirm: '',
  accept_terms: false,
}

const USERNAME_PATTERN = /^[\w.@+-]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8

export function validateRegister(values: RegisterValues): Partial<Record<RegisterField, string>> {
  const errors: Partial<Record<RegisterField, string>> = {}
  const username = values.username.trim()
  const email = values.email.trim()

  if (!username) errors.username = 'Podaj nazwę użytkownika.'
  else if (username.length > 150) errors.username = 'Nazwa użytkownika może mieć najwyżej 150 znaków.'
  else if (!USERNAME_PATTERN.test(username))
    errors.username = 'Dozwolone są litery, cyfry i znaki @ . + - _ (bez spacji).'

  if (!email) errors.email = 'Podaj adres e-mail.'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Podaj poprawny adres e-mail.'

  if (values.display_name.trim().length > 50) errors.display_name = 'Nazwa wyświetlana może mieć najwyżej 50 znaków.'

  if (!values.password) errors.password = 'Podaj hasło.'
  else if (values.password.length < PASSWORD_MIN_LENGTH)
    errors.password = `Hasło musi mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.`
  else if (/^\d+$/.test(values.password)) errors.password = 'Hasło nie może składać się z samych cyfr.'

  if (!values.password_confirm) errors.password_confirm = 'Powtórz hasło.'
  else if (values.password_confirm !== values.password) errors.password_confirm = 'Hasła nie są takie same.'

  if (!values.accept_terms) errors.accept_terms = 'Musisz potwierdzić wiek i zaakceptować regulamin.'

  return errors
}
