import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

interface FieldShellProps {
  id: string
  label: string
  required?: boolean
  error?: string
  /** Field was touched and passed validation. */
  valid?: boolean
  hint?: ReactNode
  children: ReactNode
}

export function FieldShell({ id, label, required, error, valid, hint, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-mute">
        {label}
        {required && <span className="text-velvet-hi"> *</span>}
      </label>
      <div className="relative">
        {children}
        {valid && !error && (
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ok"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-err">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-mute">{hint}</p>
      ) : null}
    </div>
  )
}

export const inputClass = (error?: string, valid?: boolean) =>
  `h-11 w-full rounded-md border bg-ink-3 px-3 pr-9 text-[15px] text-screen placeholder:text-mute/70 outline-none transition-colors
   disabled:cursor-not-allowed disabled:opacity-60 focus:border-brass ${
     error ? 'border-err' : valid ? 'border-ok' : 'border-line'
   }`

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  valid?: boolean
  hint?: ReactNode
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, error, valid, hint, required, className = '', ...rest },
  ref,
) {
  return (
    <FieldShell id={id} label={label} required={required} error={error} valid={valid} hint={hint}>
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass(error, valid)} ${className}`}
        {...rest}
      />
    </FieldShell>
  )
})

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  error?: string
  valid?: boolean
  children: ReactNode
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { id, label, error, valid, required, children, ...rest },
  ref,
) {
  return (
    <FieldShell id={id} label={label} required={required} error={error} valid={valid}>
      <select ref={ref} id={id} className={inputClass(error, valid)} {...rest}>
        {children}
      </select>
    </FieldShell>
  )
})

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-md border border-err/40 bg-err/10 px-3 py-2.5 text-sm text-err">
      {message}
    </div>
  )
}
