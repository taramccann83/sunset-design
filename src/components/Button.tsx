import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'inverted'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  className?: string
  as?: 'a'
  href?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'gradient-primary text-white',
  secondary: 'bg-transparent border-ghost text-primary-dark',
  tertiary: 'bg-transparent text-primary-dark hover:underline',
  inverted: 'bg-secondary text-white',
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  disabled,
  as,
  href,
  ...rest
}: ButtonProps) {
  const base =
    'font-sans font-semibold text-sm px-5 py-2.5 rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const classes = `${base} ${variantClasses[variant]} ${className}`

  if (as === 'a') {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
