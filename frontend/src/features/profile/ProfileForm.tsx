import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { updateProfile } from '@/api/endpoints'
import type { AgeRating, User } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { FormError, SelectField, TextField } from '@/components/ui/Field'
import { applyServerErrors, fieldState } from '@/features/auth/AuthModals'
import { profileSchema, type ProfileValues } from '@/lib/validation'
import { useAuth } from '@/state/auth'
import { useFilterOptions } from '@/state/queries'
import { useToast } from '@/state/toast'
import { PROFILE_REQUIRED_MESSAGE } from '@/state/useProtectedAction'

const toValues = (u: User): ProfileValues => ({
  fullName: u.fullName ?? '',
  email: u.email,
  mobileNumber: u.mobileNumber ?? '',
  dateOfBirth: u.dateOfBirth ?? '',
  preferredVenueId: u.preferredVenue ? String(u.preferredVenue.id) : '',
})

/** Plain-language eligibility, driven by the age the API derives from date of birth. */
export function eligibilityNote(age: number | null, ratings: AgeRating[]) {
  if (age == null) return null
  const blocked = ratings.filter((r) => r.minAge > age).map((r) => r.code)
  if (!blocked.length) return `You are ${age}, you can buy tickets for all age ratings.`
  const join = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} or ${l.at(-1)}` : l[0])
  return `You are ${age}, so you cannot buy tickets for ${join(blocked)} titles.`
}

export function ProfileForm({ user }: { user: User }) {
  const { setUser } = useAuth()
  const toast = useToast()
  const options = useFilterOptions()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: toValues(user),
  })

  // An incomplete profile shows its missing fields straight away.
  useEffect(() => {
    if (!user.profileComplete) form.trigger(['fullName', 'mobileNumber', 'dateOfBirth'])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = useMutation({
    mutationFn: (v: ProfileValues) =>
      updateProfile({
        fullName: v.fullName.trim(),
        mobileNumber: v.mobileNumber.replace(/\s+/g, ''),
        dateOfBirth: v.dateOfBirth,
        preferredVenueId: v.preferredVenueId ? Number(v.preferredVenueId) : null,
      }),
    onSuccess: (updated) => {
      // Show what the server stored, not what we sent.
      setUser(updated)
      form.reset(toValues(updated))
      toast.push(updated.profileComplete ? 'Profile saved. You can book tickets now.' : 'Profile saved.', 'success')
    },
    onError: (err) => setFormError(applyServerErrors(form, err)),
  })

  const { isDirty, isValid } = form.formState
  const note = eligibilityNote(user.age, options.data?.ageRatings ?? [])

  return (
    <section aria-label="Personal information" className="max-w-[880px]">
      {user.profileComplete ? (
        <p className="inline-flex rounded-lg bg-ok/15 px-3 py-2 text-[13px] font-semibold text-ok">Profile Complete ✓</p>
      ) : (
        <div role="alert" className="rounded-xl bg-brass/15 px-4 py-3">
          <p className="text-[13px] font-semibold text-brass">Profile incomplete</p>
          <p className="mt-0.5 text-xs text-mute">{PROFILE_REQUIRED_MESSAGE}</p>
        </div>
      )}

      <form
        noValidate
        onSubmit={form.handleSubmit((v) => {
          setFormError(null)
          save.mutate(v)
        })}
        className="mt-6 flex flex-col gap-5"
      >
        <FormError message={formError} />
        <TextField id="pf-name" label="Full name" autoComplete="name" maxLength={60} required {...fieldState(form, 'fullName')} {...form.register('fullName')} />
        <TextField id="pf-email" label="Email" type="email" disabled readOnly hint="Set at registration and can’t be changed." {...form.register('email')} />
        <TextField
          id="pf-mobile"
          label="Mobile number"
          type="tel"
          inputMode="numeric"
          placeholder="5XX XXX XXX"
          autoComplete="tel-national"
          required
          {...fieldState(form, 'mobileNumber')}
          {...form.register('mobileNumber')}
        />
        <TextField
          id="pf-dob"
          label="Date of birth"
          type="date"
          autoComplete="bday"
          required
          max={new Date().toISOString().slice(0, 10)}
          hint={note ?? undefined}
          {...fieldState(form, 'dateOfBirth')}
          {...form.register('dateOfBirth')}
        />
        <SelectField id="pf-venue" label="Preferred venue (optional)" {...form.register('preferredVenueId')}>
          <option value="">No preference</option>
          {options.data?.venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.city}
            </option>
          ))}
        </SelectField>
        <div className="mt-1 flex items-center gap-4">
          <Button type="submit" loading={save.isPending} disabled={!isDirty || !isValid}>
            Save Changes
          </Button>
          {isDirty && (
            <Button variant="ghost" onClick={() => form.reset(toValues(user))} disabled={save.isPending}>
              Discard changes
            </Button>
          )}
        </div>
      </form>
    </section>
  )
}
