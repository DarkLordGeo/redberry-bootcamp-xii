import { z } from 'zod'

const digits = (v: string) => v.replace(/\s+/g, '')

export const mobileNumber = z.string().superRefine((raw, ctx) => {
  const v = digits(raw ?? '')
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message })
  if (!v) return fail('Mobile number is required')
  if (!/^\d+$/.test(v)) return fail('Please enter a valid Georgian mobile number (9 digits starting with 5)')
  if (!v.startsWith('5')) return fail('Georgian mobile numbers must start with 5')
  if (v.length !== 9) return fail('Mobile number must be exactly 9 digits')
})

export const fullName = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .min(3, 'Name must be at least 3 characters')
  .max(50, 'Name must not exceed 50 characters')

const ageOn = (dob: Date, now = new Date()) => {
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

export const dateOfBirth = z.string().superRefine((v, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message })
  if (!v) return fail('Date of birth is required')
  const d = new Date(`${v}T00:00:00`)
  if (Number.isNaN(d.getTime()) || d > new Date() || d.getFullYear() < 1900)
    return fail('Please enter a valid date of birth')
  if (ageOn(d) < 12) return fail('You must be at least 12 years old to create an account')
})

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const avatarFile = z
  .instanceof(File)
  .refine((f) => AVATAR_TYPES.includes(f.type), 'Avatar must be a JPG, PNG or WebP image')
  .nullable()
  .optional()

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(3, 'Password must be at least 3 characters'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    username: z.string().trim().min(1, 'Username is required').min(3, 'Username must be at least 3 characters'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required').min(3, 'Password must be at least 3 characters'),
    password_confirmation: z.string().min(1, 'Confirm your password'),
    avatar: avatarFile,
  })
  .refine((v) => v.password === v.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords do not match',
  })
export type RegisterValues = z.infer<typeof registerSchema>

export const profileSchema = z.object({
  fullName,
  email: z.string(),
  mobileNumber,
  dateOfBirth,
  preferredVenueId: z.string().optional(),
})
export type ProfileValues = z.infer<typeof profileSchema>

const expiryInFuture = (v: string) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(v)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  const endOfMonth = new Date(year, month, 1)
  return endOfMonth > new Date()
}

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').min(3, 'Name must be at least 3 characters'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  mobileNumber,
  cardNumber: z
    .string()
    .transform(digits)
    .pipe(z.string().min(1, 'Card number is required').regex(/^\d{16}$/, 'Card number must be exactly 16 digits')),
  expiry: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^\d{2}\/\d{2}$/, 'Use the MM/YY format')
    .refine(expiryInFuture, 'That card has expired'),
  cvv: z.string().min(1, 'CVV is required').regex(/^\d{3}$/, 'CVV must be exactly 3 digits'),
})
export type CheckoutValues = z.input<typeof checkoutSchema>
