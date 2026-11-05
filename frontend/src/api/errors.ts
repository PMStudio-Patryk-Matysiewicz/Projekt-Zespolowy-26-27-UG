import { ApiError } from './client'

// Errors to show in a form: one message per field, plus an optional message for the whole form.
export type FormErrors<F extends string> = {
  fields: Partial<Record<F, string>>
  form?: string
}

const MESSAGES = {
  network: 'Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.',
  invalid: 'Popraw zaznaczone pola i spróbuj ponownie.',
  forbidden: 'Sesja wygasła. Odśwież stronę i spróbuj ponownie.',
  unavailable: 'Ta funkcja jest chwilowo niedostępna. Spróbuj ponownie później.',
  tooManyRequests: 'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.',
  server: 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.',
} as const

// DRF sends a message as a string or a list of strings.
function firstMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Turns anything thrown by the API client into messages for a form.
// `fieldNames` are the fields the form shows; errors for other keys go to the form message.
export function toFormErrors<F extends string>(error: unknown, fieldNames: readonly F[]): FormErrors<F> {
  // fetch itself failed: no network, server down, CORS...
  if (!(error instanceof ApiError)) return { fields: {}, form: MESSAGES.network }

  const { status, data } = error

  if (status === 400 && isRecord(data)) {
    const fields: Partial<Record<F, string>> = {}
    const other: string[] = []

    for (const [key, value] of Object.entries(data)) {
      const message = firstMessage(value)
      if (!message) continue
      if ((fieldNames as readonly string[]).includes(key)) fields[key as F] = message
      else other.push(message) // non_field_errors, detail or a field the form does not show
    }

    const hasFieldErrors = Object.keys(fields).length > 0
    return { fields, form: other.join(' ') || (hasFieldErrors ? undefined : MESSAGES.invalid) }
  }

  if (status === 400) return { fields: {}, form: MESSAGES.invalid }
  if (status === 401 || status === 403) return { fields: {}, form: MESSAGES.forbidden }
  if (status === 404 || status === 405) return { fields: {}, form: MESSAGES.unavailable }
  if (status === 429) return { fields: {}, form: MESSAGES.tooManyRequests }
  if (status >= 500) return { fields: {}, form: MESSAGES.server }

  return { fields: {}, form: `Coś poszło nie tak (kod ${status}). Spróbuj ponownie.` }
}
