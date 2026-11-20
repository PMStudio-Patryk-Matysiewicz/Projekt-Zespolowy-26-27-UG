import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'

import { ApiError } from '../api/client'
import { toFormErrors } from '../api/errors'
import { useAuth } from '../auth/AuthContext'
import AuthLayout from '../components/auth/AuthLayout'
import TextField from '../components/form/TextField'
import { ArrowLeftIcon } from '../components/icons'
import Button from '../components/ui/Button'
import { emptyLoginValues, INVALID_CREDENTIALS, validateLogin, type LoginField, type LoginValues } from '../forms/loginForm'
import styles from './LoginPage.module.css'

// ProtectedRoute puts the page the visitor wanted in `state.from`; go back there after logging in.
function redirectTarget(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/lobby'
}

export default function LoginPage() {
  const auth = useAuth()
  const location = useLocation()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<LoginValues>(emptyLoginValues)
  const [errors, setErrors] = useState<Partial<Record<LoginField, string>>>({})
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  // Bumped after a failed submit, so focus moves to the first field with an error.
  const [focusRequest, setFocusRequest] = useState(0)

  useEffect(() => {
    if (focusRequest === 0) return
    const form = formRef.current
    const target = form?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? form?.querySelector('input')
    target?.focus()
  }, [focusRequest])

  // Logged in (also right after a successful submit): go to the lobby or the page asked for.
  if (auth.status === 'authenticated') {
    return <Navigate to={redirectTarget(location.state)} replace />
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as LoginField
    const { value } = event.target
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setFormError(undefined)

    const clientErrors = validateLogin(values)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setFocusRequest((n) => n + 1)
      return
    }

    setSubmitting(true)
    try {
      await auth.logIn({ login: values.login.trim(), password: values.password })
    } catch (error) {
      // 400 = wrong credentials. One message for the whole form, never which field was wrong.
      const wrongCredentials = error instanceof ApiError && error.status === 400
      setFormError(wrongCredentials ? INVALID_CREDENTIALS : toFormErrors(error, []).form)
      setValues((current) => ({ ...current, password: '' }))
      setFocusRequest((n) => n + 1)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      headline="Wracasz do stołu?"
      lead="Twoje żetony, historia gier i miejsce w rankingu czekają. Gramy wyłącznie wirtualną walutą."
    >
      <Link to="/" className={styles.back}>
        <ArrowLeftIcon className={styles.backIcon} />
        Strona główna
      </Link>

      <h1 className={styles.title}>Zaloguj się</h1>
      <p className={styles.subtitle}>Podaj nazwę użytkownika lub e-mail i hasło.</p>

      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <TextField
          label="Nazwa użytkownika lub e-mail"
          name="login"
          autoComplete="username"
          value={values.login}
          error={errors.login}
          onChange={handleChange}
          disabled={submitting}
        />
        <TextField
          label="Hasło"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          error={errors.password}
          onChange={handleChange}
          disabled={submitting}
        />

        <Button type="submit" size="large" fullWidth disabled={submitting}>
          {submitting ? 'Logowanie…' : 'Zaloguj się'}
        </Button>
      </form>

      <p className={styles.divider}>albo</p>

      <Button to="/ranking" variant="secondary" size="large" fullWidth>
        Przeglądaj ranking jako gość
      </Button>

      <p className={styles.footer}>
        Nie masz konta? <Link to="/rejestracja">Załóż je za darmo</Link>
      </p>
    </AuthLayout>
  )
}
