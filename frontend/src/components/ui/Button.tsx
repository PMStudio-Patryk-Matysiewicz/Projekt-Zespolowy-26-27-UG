import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
export type ButtonSize = 'small' | 'medium' | 'large'

type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
  children: ReactNode
}

// With `to` it is a router link that looks like a button; otherwise a <button> (type="button" by default).
type ButtonProps =
  | (StyleProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & { to?: undefined })
  | (StyleProps & Omit<LinkProps, 'className'>)

function buttonClass({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = '',
}: Omit<StyleProps, 'children'> = {}): string {
  return [styles.button, styles[variant], styles[size], fullWidth ? styles.fullWidth : '', className]
    .filter(Boolean)
    .join(' ')
}

// Shared button: primary (green), secondary (dark), ghost (text only), danger (red outline), gold.
export default function Button(props: ButtonProps) {
  if (props.to !== undefined) {
    const { variant, size, fullWidth, className, ...linkProps } = props
    return <Link {...linkProps} className={buttonClass({ variant, size, fullWidth, className })} />
  }

  const { variant, size, fullWidth, className, type = 'button', ...buttonProps } = props
  return <button type={type} {...buttonProps} className={buttonClass({ variant, size, fullWidth, className })} />
}
