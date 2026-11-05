import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { register } from '../api/auth'
import { toFormErrors } from '../api/errors'
import AuthLayout from '../components/auth/AuthLayout'
import TextField from '../components/form/TextField'
import { GiftIcon } from '../components/icons'
import {
  emptyRegisterValues,
  registerFields,
  validateRegister,
  type RegisterField,
  type RegisterValues,
} from '../forms/registerForm'
import styles from './RegisterPage.module.css'

type FieldErrors = Partial<Record<RegisterField, string>>

export default function RegisterPage() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [values, setValues] = useState<RegisterValues>(emptyRegisterValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  // Bumped after a failed submit, so focus moves to the first field with an error.
  const [focusRequest, setFocusRequest] = useState(0)

  useEffect(() => {
    if (focusRequest === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [focusRequest])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, type, value, checked } = event.target
    const field = name as RegisterField
    setValues((current) => ({ ...current, [field]: type === 'checkbox' ? checked : value }))
    // The player is fixing this field: hide its old error.
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setFormError(undefined)

    const clientErrors = validateRegister(values)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setFocusRequest((n) => n + 1)
      return
    }

    setSubmitting(true)
    try {
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        display_name: values.display_name.trim(),
        password: values.password,
      })
      navigate('/lobby')
    } catch (error) {
      const serverErrors = toFormErrors(error, registerFields)
      setErrors(serverErrors.fields)
      setFormError(serverErrors.form)
      setFocusRequest((n) => n + 1)
      setSubmitting(false)
    }
  }

  const fieldProps = (field: Exclude<RegisterField, 'accept_terms'>) => ({
    name: field,
    value: values[field],
    error: errors[field],
    onChange: handleChange,
    disabled: submitting,
  })

  return (
    <AuthLayout>
      <h1 className={styles.title}>Załóż konto</h1>
      <p className={styles.subtitle}>Zajmie Ci to mniej niż minutę.</p>

      <p className={styles.bonus}>
        <GiftIcon className={styles.bonusIcon} />
        Na start dostajesz 5&nbsp;000 żetonów, a potem bonus za każdy dzień gry.
      </p>

      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <TextField label="Nazwa użytkownika" autoComplete="username" {...fieldProps('username')} />
        <TextField label="E-mail" type="email" autoComplete="email" {...fieldProps('email')} />
        <TextField
          label="Nazwa wyświetlana"
          autoComplete="nickname"
          hint="Opcjonalnie. Widoczna przy stołach i w rankingu."
          {...fieldProps('display_name')}
        />

        <div className={styles.row}>
          <TextField label="Hasło" type="password" autoComplete="new-password" {...fieldProps('password')} />
          <TextField
            label="Powtórz hasło"
            type="password"
            autoComplete="new-password"
            {...fieldProps('password_confirm')}
          />
        </div>

        <div>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              name="accept_terms"
              checked={values.accept_terms}
              onChange={handleChange}
              disabled={submitting}
              aria-invalid={errors.accept_terms ? true : undefined}
              aria-describedby={errors.accept_terms ? 'accept-terms-error' : undefined}
            />
            Mam ukończone 18 lat i akceptuję regulamin
          </label>
          {errors.accept_terms && (
            <p id="accept-terms-error" className={styles.checkboxError}>
              {errors.accept_terms}
            </p>
          )}
        </div>

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? 'Zakładanie konta…' : 'Załóż konto i odbierz 5 000 żetonów'}
        </button>
      </form>

      <p className={styles.footer}>
        Masz już konto? <Link to="/logowanie">Zaloguj się</Link>
      </p>
    </AuthLayout>
  )
}
