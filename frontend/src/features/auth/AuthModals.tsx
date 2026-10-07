import { useEffect, useState } from 'react'
import { useForm, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { login, register as registerUser } from '@/api/endpoints'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormError, TextField } from '@/components/ui/Field'
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from '@/lib/validation'
import { useAuth } from '@/state/auth'
import { useModals } from '@/state/modals'
import { useToast } from '@/state/toast'

/** Field state helpers: error shown on blur, green once touched and valid. */
export function fieldState<T extends FieldValues>(form: UseFormReturn<T>, name: Path<T>) {
  const { errors, touchedFields, dirtyFields } = form.formState
  const error = errors[name]?.message as string | undefined
  const touched = !!(touchedFields as Record<string, unknown>)[name] || !!(dirtyFields as Record<string, unknown>)[name]
  return { error, valid: touched && !error && !!form.getValues(name) }
}

/** Puts each key of a 422 `errors` body onto its input; returns the leftover message for a banner. */
export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, err: unknown): string | null {
  if (err instanceof ApiError && err.isValidation && err.errors) {
    let mapped = false
    for (const [key, messages] of Object.entries(err.errors)) {
      if (key in form.getValues()) {
        form.setError(key as Path<T>, { type: 'server', message: messages[0] })
        mapped = true
      }
    }
    return mapped ? null : err.message
  }
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const { signIn } = useAuth()
  const { switchAuth } = useModals()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  })
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (payload) => {
      signIn(payload)
      toast.push(`Welcome back, ${payload.user.fullName ?? payload.user.username}.`, 'success')
      onDone()
    },
    // Wrong credentials: keep the modal open and the email filled in; show the API message.
    onError: (err) => setFormError(applyServerErrors(form, err)),
  })

  const email = fieldState(form, 'email')
  const password = fieldState(form, 'password')
  const [emailValue, passwordValue] = form.watch(['email', 'password'])
  const filled = !!emailValue && !!passwordValue

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) => {
        setFormError(null)
        mutation.mutate(v)
      })}
      className="flex flex-col gap-4"
    >
      <FormError message={formError} />
      <TextField id="login-email" label="Email" type="email" autoComplete="email" required {...email} {...form.register('email')} />
      <TextField
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        {...password}
        {...form.register('password')}
      />
      <Button type="submit" loading={mutation.isPending} disabled={!filled} className="mt-2 w-full">
        Log in
      </Button>
      <p className="text-center text-[13px] text-mute">
        Don’t have an account?{' '}
        <button type="button" className="font-bold text-velvet hover:underline" onClick={() => switchAuth('register')}>
          Sign up
        </button>
      </p>
    </form>
  )
}

function AvatarPicker({
  file,
  onChange,
  error,
}: {
  file: File | null | undefined
  onChange: (f: File | null) => void
  error?: string
}) {
  const [preview, setPreview] = useState<string | null>(null)
  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={`grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border bg-ink-3 ${error ? 'border-err' : 'border-line'}`}>
          {preview && !error ? (
            <img src={preview} alt="Avatar preview" className="size-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-5 text-mute" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="12" cy="9" r="4" />
              <path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="register-avatar" className="text-sm font-bold hover:underline">
            {file ? 'Change avatar' : 'Upload avatar'} <span className="font-normal text-mute">(optional)</span>
          </label>
          <p className="mt-0.5 text-xs text-mute">JPG, PNG or WEBP</p>
        </div>
        {file && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        )}
        <input
          id="register-avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            onChange(e.target.files?.[0] ?? null)
            e.target.value = ''
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-err">
          {error}
        </p>
      )}
    </div>
  )
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { signIn } = useAuth()
  const { switchAuth } = useModals()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { username: '', email: '', password: '', password_confirmation: '', avatar: null },
  })
  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (payload) => {
      signIn(payload)
      toast.push('Account created. Complete your profile to start booking.', 'success')
      onDone()
    },
    onError: (err) => setFormError(applyServerErrors(form, err)),
  })
  const avatar = form.watch('avatar')
  const [u, e, p1, p2] = form.watch(['username', 'email', 'password', 'password_confirmation'])
  const filled = !!(u && e && p1 && p2)

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) => {
        setFormError(null)
        mutation.mutate(v)
      })}
      className="flex flex-col gap-4"
    >
      <FormError message={formError} />
      <AvatarPicker
        file={avatar}
        error={form.formState.errors.avatar?.message}
        onChange={(f) => form.setValue('avatar', f, { shouldValidate: true, shouldDirty: true })}
      />
      <TextField id="register-username" label="Username" autoComplete="username" required {...fieldState(form, 'username')} {...form.register('username')} />
      <TextField id="register-email" label="Email" type="email" autoComplete="email" required {...fieldState(form, 'email')} {...form.register('email')} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <TextField
        id="register-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        {...fieldState(form, 'password')}
        {...form.register('password', {
          onChange: () => {
            if (form.getFieldState('password_confirmation').isTouched) form.trigger('password_confirmation')
          },
        })}
      />
      <TextField
        id="register-password-confirmation"
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        required
        {...fieldState(form, 'password_confirmation')}
        {...form.register('password_confirmation')}
      />
      </div>
      <Button type="submit" loading={mutation.isPending} disabled={!filled} className="mt-2 w-full">
        Sign up
      </Button>
      <p className="text-center text-[13px] text-mute">
        Already have an account?{' '}
        <button type="button" className="font-bold text-velvet hover:underline" onClick={() => switchAuth('login')}>
          Log in
        </button>
      </p>
    </form>
  )
}

export function AuthModals() {
  const { authModal, finishAuth } = useModals()
  return (
    <>
      <Modal open={authModal === 'login'} onClose={() => finishAuth(false)} title="Log in" subtitle="Welcome back to Kino XII">
        <LoginForm onDone={() => finishAuth(true)} />
      </Modal>
      <Modal open={authModal === 'register'} onClose={() => finishAuth(false)} title="Sign up" subtitle="Welcome to Kino XII" width="max-w-[480px]">
        <RegisterForm onDone={() => finishAuth(true)} />
      </Modal>
    </>
  )
}
