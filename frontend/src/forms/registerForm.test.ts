import { describe, expect, it } from 'vitest'

import { emptyRegisterValues, validateRegister, type RegisterValues } from './registerForm'

const valid: RegisterValues = {
  username: 'kamil_g',
  email: 'kamil@przyklad.pl',
  display_name: 'Kamil',
  password: 'tajne-haslo-1',
  password_confirm: 'tajne-haslo-1',
  accept_terms: true,
}

describe('validateRegister', () => {
  it('accepts a complete form', () => {
    expect(validateRegister(valid)).toEqual({})
  })

  it('accepts an empty display name (it is optional)', () => {
    expect(validateRegister({ ...valid, display_name: '' })).toEqual({})
  })

  it('requires every mandatory field', () => {
    expect(Object.keys(validateRegister(emptyRegisterValues)).sort()).toEqual(
      ['accept_terms', 'email', 'password', 'password_confirm', 'username'].sort(),
    )
  })

  it('rejects a username with spaces or other characters', () => {
    expect(validateRegister({ ...valid, username: 'kamil g' }).username).toMatch(/Dozwolone/)
    expect(validateRegister({ ...valid, username: 'kamil!' }).username).toMatch(/Dozwolone/)
  })

  it('rejects an invalid e-mail', () => {
    expect(validateRegister({ ...valid, email: 'kamil@' }).email).toBe('Podaj poprawny adres e-mail.')
  })

  it('rejects a display name longer than 50 characters', () => {
    expect(validateRegister({ ...valid, display_name: 'x'.repeat(51) }).display_name).toBeDefined()
  })

  it('rejects a short or numeric-only password', () => {
    expect(validateRegister({ ...valid, password: 'krotkie', password_confirm: 'krotkie' }).password).toMatch(
      /co najmniej 8/,
    )
    expect(validateRegister({ ...valid, password: '12345678', password_confirm: '12345678' }).password).toMatch(
      /samych cyfr/,
    )
  })

  it('rejects passwords that do not match', () => {
    expect(validateRegister({ ...valid, password_confirm: 'inne-haslo-1' }).password_confirm).toBe(
      'Hasła nie są takie same.',
    )
  })
})
