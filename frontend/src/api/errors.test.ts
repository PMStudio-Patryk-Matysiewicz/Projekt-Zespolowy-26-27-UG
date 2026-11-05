import { describe, expect, it } from 'vitest'

import { ApiError } from './client'
import { toFormErrors } from './errors'

const fields = ['username', 'email', 'password'] as const

describe('toFormErrors', () => {
  it('puts DRF field errors under their fields', () => {
    const error = new ApiError(400, {
      username: ['A user with that username already exists.'],
      email: 'Enter a valid email address.',
    })

    expect(toFormErrors(error, fields)).toEqual({
      fields: {
        username: 'A user with that username already exists.',
        email: 'Enter a valid email address.',
      },
      form: undefined,
    })
  })

  it('shows non-field errors and unknown fields as the form message', () => {
    const error = new ApiError(400, {
      non_field_errors: ['Passwords are too similar.'],
      display_name: ['Too long.'],
      password: ['This password is too common.'],
    })

    expect(toFormErrors(error, fields)).toEqual({
      fields: { password: 'This password is too common.' },
      form: 'Passwords are too similar. Too long.',
    })
  })

  it('gives a generic message for a 400 without readable errors', () => {
    expect(toFormErrors(new ApiError(400, 'Bad Request'), fields).form).toBe(
      'Popraw zaznaczone pola i spróbuj ponownie.',
    )
    expect(toFormErrors(new ApiError(400, {}), fields).form).toBe('Popraw zaznaczone pola i spróbuj ponownie.')
  })

  it.each([
    [403, 'Sesja wygasła. Odśwież stronę i spróbuj ponownie.'],
    [404, 'Ta funkcja jest chwilowo niedostępna. Spróbuj ponownie później.'],
    [429, 'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.'],
    [500, 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.'],
    [502, 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.'],
    [418, 'Coś poszło nie tak (kod 418). Spróbuj ponownie.'],
  ])('maps status %i to a form message', (status, message) => {
    expect(toFormErrors(new ApiError(status, undefined), fields)).toEqual({ fields: {}, form: message })
  })

  it('reports a network error when the request did not reach the server', () => {
    expect(toFormErrors(new TypeError('Failed to fetch'), fields)).toEqual({
      fields: {},
      form: 'Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.',
    })
  })
})
