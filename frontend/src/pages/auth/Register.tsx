import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function Register() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: false,
    },
  })

  const password = watch('password') || ''

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)

    try {
      const result = await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })

      if (result.success) {
        toast.success('Account created successfully!')
        navigate('/search', { replace: true })
      } else {
        toast.error(result.message || 'Registration failed. Please try again.')
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[!@#$%^&*]/.test(password) },
  ]

  return (
    <div className="w-full">
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center mb-2">
          <h1 className="text-heading-lg font-display font-bold text-eventra-navy-900">
            Create your account
          </h1>
          <p className="text-body-md text-eventra-slate-600 mt-2">
            Join EventraOS and start exploring the world
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            leftIcon={<User className="w-5 h-5" />}
            error={errors.name?.message}
            {...register('name')}
            autoComplete="name"
            disabled={isSubmitting}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            {...register('email')}
            autoComplete="email"
            disabled={isSubmitting}
          />

          <Input
            label="Phone Number (Optional)"
            type="tel"
            placeholder="+91 98765 43210"
            leftIcon={<Phone className="w-5 h-5" />}
            error={errors.phone?.message}
            {...register('phone')}
            autoComplete="tel"
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <label className="label">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-eventra-slate-400 hover:text-eventra-navy-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5 ml-1">
              {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-body-xs">
                  <span className={cn('w-4 h-4 rounded border-2 flex items-center justify-center', req.met ? 'border-eventra-green-500 bg-eventra-green-500 text-white' : 'border-eventra-slate-300')}>
                    {req.met && <CheckCircle2 className="w-3 h-3" />}
                  </span>
                  <span className={cn('text-eventra-slate-600', req.met && 'text-eventra-green-600')}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-eventra-slate-400 hover:text-eventra-navy-600"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              error={errors.password_confirmation?.message}
              {...register('password_confirmation')}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>

          <Checkbox
            label={
              <>
                I agree to the{' '}
                <Link to="/terms" className="link">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy" className="link">Privacy Policy</Link>
              </>
            }
            {...register('terms')}
            error={errors.terms?.message}
            disabled={isSubmitting}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting || authLoading}
        >
          Create Account
        </Button>

        <div className="relative">
          <div className="divider">
            <span className="divider-text">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => toast('Google signup coming soon', { icon: '🔐' })}
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => toast('Apple signup coming soon', { icon: '🍎' })}
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.97c-.76.54-1.64.89-2.59.89-2.5 0-4.55-2.04-4.55-4.54 0-1.42.71-2.68 1.79-3.44-.11-1.47.75-2.75 1.99-3.45.65.12 1.3.2 1.98.22v-.88c-.9-.03-1.68-.6-2.06-1.43-.16-.36-.24-.76-.24-1.16 0-1.18.96-2.13 2.14-2.13 1.03 0 1.87.72 2.1 1.65.02.09 1.19-.67 2.31-1.44.6-.4 1.19-.77 1.81-1.08.19-.1.37-.19.56-.27H22.1c-.28 1.41-1.06 2.71-2.24 3.78-.72.65-1.57 1.16-2.5 1.52.3 1.13.49 2.31.49 3.51 0 2.77-2.25 5.02-5.02 5.02zm-4.24-6.14c-.6 0-1.1-.49-1.1-1.08 0-.6.5-1.1 1.1-1.1.6 0 1.1.49 1.1 1.09 0 .59-.5 1.09-1.1 1.09z" />
            </svg>
            Apple
          </Button>
        </div>

        <p className="text-center text-body-sm text-eventra-slate-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-eventra-blue-600 hover:text-eventra-blue-700">
            Sign in
          </Link>
        </p>
      </motion.form>
    </div>
  )
}