import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import { createOrder } from '@/api/endpoints'
import type { Order, SeatHold, User } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { FormError, TextField } from '@/components/ui/Field'
import { applyServerErrors, fieldState } from '@/features/auth/AuthModals'
import { checkoutSchema, type CheckoutValues } from '@/lib/validation'

const groupCard = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

const formatExpiry = (v: string, prev: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  // Let backspace remove the slash naturally.
  if (d.length <= 2) return v.length < prev.length ? d : d.length === 2 ? `${d}/` : d
  return `${d.slice(0, 2)}/${d.slice(2)}`
}

export function CheckoutForm({
  hold,
  user,
  onBack,
  onPaid,
  onExpired,
  onConflict,
}: {
  hold: SeatHold
  user: User
  onBack: () => void
  onPaid: (order: Order) => void
  onExpired: (message: string) => void
  onConflict: (contested: string[], message: string) => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: user.fullName ?? '',
      email: user.email,
      mobileNumber: user.mobileNumber ?? '',
      cardNumber: '',
      expiry: '',
      cvv: '',
    },
  })

  const pay = useMutation({
    mutationFn: (v: CheckoutValues) =>
      createOrder({
        holdId: hold.holdId,
        fullName: v.fullName,
        email: v.email,
        mobileNumber: v.mobileNumber.replace(/\s+/g, ''),
        cardNumber: v.cardNumber.replace(/\s+/g, ''),
        expiry: v.expiry,
        cvv: v.cvv,
      }),
    onSuccess: onPaid,
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.status === 409) return onConflict(err.contested ?? [], err.message)
        // 422 without field errors = the hold ran out.
        if (err.status === 422 && !err.errors) return onExpired(err.message)
      }
      setFormError(applyServerErrors(form, err))
    },
  })

  const card = form.register('cardNumber')
  const expiry = form.register('expiry')

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) => {
        if (pay.isPending) return
        setFormError(null)
        pay.mutate(v)
      })}
      className="flex flex-col gap-5"
    >
      <FormError message={formError} />
      <fieldset className="grid grid-cols-2 gap-4">
        <legend className="eyebrow mb-3 !text-[11px] text-mute">Your details</legend>
        <div className="col-span-2">
          <TextField id="co-name" label="Full Name" autoComplete="name" required {...fieldState(form, 'fullName')} {...form.register('fullName')} />
        </div>
        <TextField id="co-email" label="Email" type="email" autoComplete="email" required {...fieldState(form, 'email')} {...form.register('email')} />
        <TextField
          id="co-mobile"
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="5XX XXX XXX"
          required
          {...fieldState(form, 'mobileNumber')}
          {...form.register('mobileNumber')}
        />
      </fieldset>

      <fieldset className="grid grid-cols-4 gap-4 border-t border-line/70 pt-5">
        <legend className="eyebrow mb-3 !text-[11px] text-mute">Card</legend>
        <div className="col-span-4">
          <TextField
            id="co-card"
            label="Card Number"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            required
            {...fieldState(form, 'cardNumber')}
            {...card}
            onChange={(e) => {
              e.target.value = groupCard(e.target.value)
              card.onChange(e)
            }}
          />
        </div>
        <div className="col-span-2">
          <TextField
            id="co-expiry"
            label="Expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            required
            {...fieldState(form, 'expiry')}
            {...expiry}
            onChange={(e) => {
              e.target.value = formatExpiry(e.target.value, form.getValues('expiry'))
              expiry.onChange(e)
            }}
          />
        </div>
        <div className="col-span-2">
          <TextField
            id="co-cvv"
            label="CVV"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={3}
            placeholder="123"
            required
            {...fieldState(form, 'cvv')}
            {...form.register('cvv')}
          />
        </div>
      </fieldset>

      <div className="mt-2 flex items-center justify-between gap-4">
        <Button variant="secondary" onClick={onBack} disabled={pay.isPending}>
          Back to seats
        </Button>
        <Button type="submit" size="lg" loading={pay.isPending}>
          Pay & Complete Order
        </Button>
      </div>
    </form>
  )
}
