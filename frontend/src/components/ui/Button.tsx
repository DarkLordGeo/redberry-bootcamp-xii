import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'brass'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-velvet text-screen hover:bg-velvet-hi disabled:bg-ink-3 disabled:text-mute',
  secondary: 'border border-line bg-ink-2 text-screen hover:border-mute disabled:text-mute',
  ghost: 'text-screen hover:bg-ink-3 disabled:text-mute',
  brass: 'bg-brass text-ink hover:brightness-110 disabled:bg-ink-3 disabled:text-mute',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-13 px-7 text-base',
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  )
}

/** Button styling for links that look like buttons (avoids nesting <button> in <a>). */
export const buttonClass = (variant: Variant = 'primary', size: Size = 'md') =>
  `inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors ${variants[variant]} ${sizes[size]}`

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
