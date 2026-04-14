import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Check, CreditCard, Shield, Loader2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, cn, sleep } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/store/cart'

interface PaymentData {
  id?: number
  payment_reference?: string
  booking_id?: number
  booking_reference?: string
  booking?: { booking_reference?: string } | null
  status?: string
  amount?: number
  currency?: string
  failure_reason?: string | null
}

type Phase = 'processing' | 'success' | 'failed'

const PAYMENT_STEPS: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'securing', label: 'Securing your reservation', icon: Shield },
  { id: 'authorizing', label: 'Authorizing payment', icon: CreditCard },
  { id: 'capturing', label: 'Capturing payment', icon: CheckCircle2 },
  { id: 'confirming', label: 'Confirming your booking', icon: Check },
]

const FAILED_STATUSES = ['failed', 'cancelled', 'expired']

export function PaymentProcessing() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const clearCart = useCartStore((s) => s.clearCart)

  const routeState = (location.state ?? {}) as { bookingId?: number; bookingReference?: string }

  const [phase, setPhase] = useState<Phase>('processing')
  const [stepIndex, setStepIndex] = useState(0)
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [bookingReference, setBookingReference] = useState<string | undefined>(routeState.bookingReference)
  const [failureReason, setFailureReason] = useState('')
  const [isRetrying, setIsRetrying] = useState(false)

  const startedRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const resolveBookingReference = async (paymentData: PaymentData | null): Promise<string | undefined> => {
    if (paymentData?.booking?.booking_reference) return paymentData.booking.booking_reference
    if (paymentData?.booking_reference) return paymentData.booking_reference
    if (bookingReference) return bookingReference
    const bookingId = paymentData?.booking_id ?? routeState.bookingId
    if (bookingId) {
      try {
        const body = await api.get<any>(`/bookings/${bookingId}`)
        if (body?.data?.booking_reference) return body.data.booking_reference as string
      } catch {
        // fall through
      }
    }
    return undefined
  }

  const handleSuccess = async (paymentData: PaymentData | null) => {
    setPhase('success')
    setStepIndex(PAYMENT_STEPS.length - 1)
    clearCart()
    const reference = await resolveBookingReference(paymentData)
    if (reference) setBookingReference(reference)
    window.setTimeout(() => {
      if (!mountedRef.current) return
      if (reference) {
        navigate(`/booking/confirmation/${reference}`, { replace: true })
      } else {
        toast.error('Payment captured but booking details could not be loaded')
        navigate('/')
      }
    }, 1800)
  }

  const pollStatus = async (paymentId: string): Promise<'captured' | 'failed' | 'timeout'> => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await sleep(1500)
      if (!mountedRef.current) return 'timeout'
      try {
        const body = await api.get<any>(`/payments/${paymentId}/status`)
        const data = (body?.data ?? null) as PaymentData | null
        if (data) setPayment(data)
        if (data?.status === 'captured') return 'captured'
        if (data?.status && FAILED_STATUSES.includes(data.status)) return 'failed'
      } catch {
        // transient error — keep polling
      }
    }
    return 'timeout'
  }

  const runPayment = async () => {
    if (!id) return
    try {
      // In-flight check first: handles refresh mid-processing or already-captured payments
      try {
        const statusBody = await api.get<any>(`/payments/${id}/status`)
        const current = (statusBody?.data ?? null) as PaymentData | null
        if (current) {
          setPayment(current)
          if (current.status === 'captured') {
            await handleSuccess(current)
            return
          }
          if (current.status && FAILED_STATUSES.includes(current.status)) {
            setPhase('failed')
            setFailureReason(current.failure_reason || 'Payment failed')
            return
          }
        }
      } catch {
        // status check failed — proceed with processing
      }

      const res = await api.post<any>(`/payments/${id}/process`, {})
      const data = (res?.data ?? null) as PaymentData | null
      if (data) setPayment(data)

      if (res?.success && data?.status === 'captured') {
        await handleSuccess(data)
      } else if (data?.status && FAILED_STATUSES.includes(data.status)) {
        setPhase('failed')
        setFailureReason(data.failure_reason || res?.message || 'Payment could not be processed.')
      } else if (res?.success) {
        // Still in-flight — poll until it settles
        const outcome = await pollStatus(id)
        if (outcome === 'captured') {
          await handleSuccess(data)
        } else {
          setPhase('failed')
          setFailureReason(
            outcome === 'timeout'
              ? 'Payment is taking longer than expected. You can check status or retry.'
              : 'Payment failed. Please try again.'
          )
        }
      } else {
        setPhase('failed')
        setFailureReason(data?.failure_reason || res?.message || 'Payment could not be processed.')
      }
    } catch (err: any) {
      if (err?.response?.data?.data) setPayment(err.response.data.data)
      setPhase('failed')
      setFailureReason(err?.response?.data?.message || 'Payment processing failed. Please try again.')
    }
  }

  useEffect(() => {
    if (!id || startedRef.current) return
    startedRef.current = true
    void runPayment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Simulated step progression while processing
  useEffect(() => {
    if (phase !== 'processing') return
    const timer = window.setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, PAYMENT_STEPS.length - 2))
    }, 1200)
    return () => window.clearInterval(timer)
  }, [phase])

  const handleRetry = async () => {
    if (!id) return
    setIsRetrying(true)
    setPhase('processing')
    setStepIndex(0)
    setFailureReason('')
    try {
      const res = await api.post<any>(`/payments/${id}/retry`)
      const data = (res?.data ?? null) as PaymentData | null
      if (data) setPayment(data)

      if (res?.success && data?.status === 'captured') {
        await handleSuccess(data)
      } else if (res?.success && data?.status === 'initiated') {
        // Retry reset the payment to initiated — process it again
        try {
          const procRes = await api.post<any>(`/payments/${id}/process`, {})
          const procData = (procRes?.data ?? null) as PaymentData | null
          if (procData) setPayment(procData)
          if (procRes?.success && procData?.status === 'captured') {
            await handleSuccess(procData)
          } else if (procRes?.success) {
            const outcome = await pollStatus(id)
            if (outcome === 'captured') {
              await handleSuccess(procData)
            } else {
              setPhase('failed')
              setFailureReason('Retry payment failed. Please try again.')
            }
          } else {
            setPhase('failed')
            setFailureReason(procData?.failure_reason || procRes?.message || 'Retry payment failed.')
          }
        } catch (procErr: any) {
          setPhase('failed')
          setFailureReason(procErr?.response?.data?.message || 'Retry payment failed. Please try again.')
        }
      } else {
        setPhase('failed')
        setFailureReason(data?.failure_reason || res?.message || 'Retry payment failed. Please try again.')
      }
    } catch (err: any) {
      setPhase('failed')
      setFailureReason(err?.response?.data?.message || 'Retry failed. Please try again.')
    } finally {
      if (mountedRef.current) setIsRetrying(false)
    }
  }

  const handleViewBooking = () => {
    if (bookingReference) {
      navigate(`/booking/confirmation/${bookingReference}`, { replace: true })
    } else if (payment?.booking_id ?? routeState.bookingId) {
      // Best effort: resolve reference before navigating
      void resolveBookingReference(payment).then((reference) => {
        if (reference) navigate(`/booking/confirmation/${reference}`, { replace: true })
        else navigate('/')
      })
    } else {
      navigate('/')
    }
  }

  const handleBackToHome = () => navigate('/')

  if (!id) {
    return (
      <div className="min-h-screen bg-eventra-slate-50 flex items-center justify-center py-12 px-4">
        <Card variant="elevated" padding="lg" className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-eventra-slate-400" />
          </div>
          <h1 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">Payment not found</h1>
          <p className="text-eventra-slate-600 mb-6">The payment you are looking for does not exist.</p>
          <Button onClick={handleBackToHome}>Back to Home</Button>
        </Card>
      </div>
    )
  }

  const isSuccess = phase === 'success'
  const isFailed = phase === 'failed'
  const currentStep = PAYMENT_STEPS[Math.min(stepIndex, PAYMENT_STEPS.length - 1)]

  return (
    <div className="min-h-screen bg-eventra-slate-50 flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Card variant="elevated" padding="lg" className="text-center">
          {/* Header */}
          <div className="mb-8">
            <AnimatePresence mode="wait">
              {phase === 'processing' ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-6"
                >
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-eventra-slate-200 rounded-full" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 border-4 border-eventra-navy-900 border-t-transparent rounded-full"
                    />
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-eventra-navy-900 flex items-center justify-center">
                        <currentStep.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <h1 className="text-display-sm font-display font-bold text-eventra-navy-900 mb-2">
                    Processing Payment
                  </h1>
                  <p className="text-body-lg text-eventra-slate-600">{currentStep.label}...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="final"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-6"
                >
                  <div
                    className={cn(
                      'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4',
                      isSuccess ? 'bg-eventra-green-100' : 'bg-eventra-red-100'
                    )}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="w-12 h-12 text-eventra-green-600" />
                    ) : (
                      <XCircle className="w-12 h-12 text-eventra-red-600" />
                    )}
                  </div>
                  <h1 className="text-display-sm font-display font-bold text-eventra-navy-900 mb-2">
                    {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
                  </h1>
                  <p className="text-body-lg text-eventra-slate-600">
                    {isSuccess
                      ? 'Your booking has been confirmed. Redirecting you to the confirmation page...'
                      : failureReason || 'Payment could not be processed. Please try again.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Steps */}
            <div className="space-y-3 mb-8">
              {PAYMENT_STEPS.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl transition-all text-left',
                      index < stepIndex
                        ? 'bg-eventra-green-50 border border-eventra-green-200'
                        : index === stepIndex && phase === 'processing'
                          ? 'bg-eventra-blue-50 border border-eventra-blue-200'
                          : phase === 'success' && index === PAYMENT_STEPS.length - 1
                            ? 'bg-eventra-green-50 border border-eventra-green-200'
                            : 'bg-eventra-slate-50 border border-eventra-slate-200'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                        index < stepIndex || (phase === 'success' && index === PAYMENT_STEPS.length - 1)
                          ? 'bg-eventra-green-600 text-white'
                          : index === stepIndex && phase === 'processing'
                            ? 'bg-eventra-blue-600 text-white animate-pulse'
                            : 'bg-eventra-slate-200 text-eventra-slate-400'
                      )}
                    >
                      {index < stepIndex || (phase === 'success' && index === PAYMENT_STEPS.length - 1) ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          'font-medium',
                          index < stepIndex || (phase === 'success' && index === PAYMENT_STEPS.length - 1)
                            ? 'text-eventra-green-800'
                            : index === stepIndex && phase === 'processing'
                              ? 'text-eventra-blue-800'
                              : 'text-eventra-slate-600'
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-body-xs text-eventra-slate-500">
                        {index < stepIndex || (phase === 'success' && index === PAYMENT_STEPS.length - 1)
                          ? 'Completed'
                          : index === stepIndex && phase === 'processing'
                            ? 'In progress'
                            : 'Pending'}
                      </p>
                    </div>
                    {(index < stepIndex || (phase === 'success' && index === PAYMENT_STEPS.length - 1)) && (
                      <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Amount Display */}
          {payment?.amount != null && (
            <div className="mb-6 p-4 bg-eventra-slate-50 rounded-xl">
              <p className="text-body-sm text-eventra-slate-600">Amount</p>
              <p className="price-xl text-eventra-navy-900">
                {formatCurrency(payment.amount, payment.currency || 'INR')}
              </p>
              {payment.payment_reference && (
                <p className="text-body-xs text-eventra-slate-500">
                  Payment Reference: {payment.payment_reference}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {phase === 'success' && (
            <motion.div
              key="success-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Button
                className="flex-1"
                onClick={handleViewBooking}
                leftIcon={<CheckCircle2 className="w-5 h-5" />}
              >
                View Booking
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleBackToHome}>
                Back to Home
              </Button>
            </motion.div>
          )}
          {isFailed && (
            <motion.div
              key="failure-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Button
                className="flex-1"
                onClick={handleRetry}
                loading={isRetrying}
                leftIcon={isRetrying ? undefined : <Loader2 className="w-5 h-5" />}
              >
                Retry Payment
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleBackToHome}>
                Back to Home
              </Button>
            </motion.div>
          )}

          {/* Security Notice */}
          {phase === 'processing' && (
            <div className="mt-8 pt-6 border-t border-eventra-slate-200">
              <div className="flex items-center justify-center gap-2 text-body-xs text-eventra-slate-500">
                <Shield className="w-4 h-4" />
                <span>Your payment is secured with 256-bit encryption</span>
              </div>
              <p className="text-body-xs text-eventra-slate-500 mt-2 text-center">
                Please do not close this window or refresh the page.
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
