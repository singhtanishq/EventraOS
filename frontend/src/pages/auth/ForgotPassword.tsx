import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotFormData = z.infer<typeof forgotSchema>

export function ForgotPassword() {
  const { forgotPassword, error } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormData) => {
    setIsSubmitting(true)
    try {
      const result = await forgotPassword(data.email)
      if (result.success) {
        setSentTo(data.email)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      {sentTo ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 rounded-full bg-eventra-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-eventra-green-600" />
          </div>
          <h1 className="text-heading-lg font-display font-bold text-eventra-navy-900 mb-2">
            Check your email
          </h1>
          <p className="text-body-md text-eventra-slate-600 mb-6">
            If an account exists for <span className="font-medium text-eventra-navy-900">{sentTo}</span>,
            a password reset link is on its way.
          </p>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </motion.div>
      ) : (
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center mb-2">
            <h1 className="text-heading-lg font-display font-bold text-eventra-navy-900">
              Reset your password
            </h1>
            <p className="text-body-md text-eventra-slate-600 mt-2">
              Enter your email address and we&apos;ll send you a reset link
            </p>
          </div>

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

          {error && (
            <p className="text-body-sm text-eventra-red-600" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Send Reset Link
          </Button>

          <p className="text-center text-body-sm text-eventra-slate-600">
            Remembered it?{' '}
            <Link to="/login" className="font-medium text-eventra-blue-600 hover:text-eventra-blue-700">
              Back to Sign In
            </Link>
          </p>
        </motion.form>
      )}
    </div>
  )
}
