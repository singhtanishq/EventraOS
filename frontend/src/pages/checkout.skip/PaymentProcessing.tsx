import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Loader2, XCircle, AlertCircle, CreditCard, Shield, Clock, Check, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/store/cart'

interface PaymentStatus {
  id: string
  status: 'initiated' | 'processing' | 'authorized' | 'captured' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded' | 'pending_verification' | 'expired'
  amount: number
  currency: string
  booking_id: string
  booking_reference: string
  payment_reference: string
  failure_reason?: string
  processed_at?: string
  gateway_response?: any
}

const PAYMENT_STEPS = [
  { id: 'securing', label: 'Securing your reservation...', icon: Shield },
  { id: 'verifying', label: 'Verifying payment...', icon: CreditCard },
  { id: 'confirming', label: 'Confirming inventory...', icon: CheckCircle2 },
  { id: 'generating', label: 'Generating booking reference...', icon: Clock },
]

export function PaymentProcessing() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = searchParams.get('booking_id')
  const [currentStep, setCurrentStep] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const { clearCart } = useCartStore()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payment', bookingId],
    queryFn: async () => {
      const response = await api.get(`/payments/booking/${bookingId}`)
      return response.data
    },
    enabled: !!bookingId,
    refetchInterval: 2000,
  })

  useEffect(() => {
    if (data?.data) {
      setPaymentStatus(data.data)
      
      // Update step based on payment status
      switch (data.data.status) {
        case 'processing':
          setCurrentStep(1)
          break
        case 'authorized':
          setCurrentStep(2)
          break
        case 'captured':
          setCurrentStep(3)
          break
        case 'failed':
        case 'cancelled':
        case 'expired':
          setCurrentStep(-1)
          break
      }

      // Stop polling on final states
      if (['captured', 'failed', 'cancelled', 'expired'].includes(data.data.status)) {
        setIsPolling(false)
      }
    }
  }, [data])

  // Start polling
  useEffect(() => {
    if (bookingId && !paymentStatus) {
      setIsPolling(true)
    }
  }, [bookingId, paymentStatus])

  const handleRetry = () => {
    setCurrentStep(0)
    setPaymentStatus(null)
    // In production, would re-initiate payment
    toast('Retrying payment...', { icon: '🔄' })
  }

  const handleBackToHome = () => {
    clearCart()
    navigate('/')
  }

  const handleViewBooking = () => {
    if (paymentStatus?.booking_reference) {
      navigate(`/customer/bookings/${paymentStatus.booking_reference}`)
    }
  }

  if (isLoading && !paymentStatus) {
    return <PaymentProcessingSkeleton />
  }

  const isFinalState = paymentStatus && ['captured', 'failed', 'cancelled', 'expired'].includes(paymentStatus.status)
  const isSuccess = paymentStatus?.status === 'captured'

  return (
    <div className="min-h-screen bg-eventra-slate-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card variant="elevated" padding="xl" className="text-center">
          {/* Header */}
          <div className="mb-8">
            <AnimatePresence mode="wait">
              {isFinalState ? (
                <motion.div
                  key="final"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="mb-6"
                >
                  <div className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4',
                    isSuccess ? 'bg-eventra-green-100' : 'bg-eventra-red-100'
                  )}>
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
                      ? 'Your booking has been confirmed. Reference number will be sent via email.'
                      : paymentStatus?.failure_reason || 'Payment could not be processed. Please try again.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
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
                        {PAYMENT_STEPS[currentStep >= 0 ? currentStep : 0].icon && (
                          <PAYMENT_STEPS[currentStep >= 0 ? currentStep : 0].icon className="w-7 h-7 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                  <h1 className="text-display-sm font-display font-bold text-eventra-navy-900 mb-2">
                    Processing Payment
                  </h1>
                  <p className="text-body-lg text-eventra-slate-600 mb-8">
                    {PAYMENT_STEPS[currentStep >= 0 ? currentStep : 0].label}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Steps */}
            <div className="space-y-4 mb-8">
              {PAYMENT_STEPS.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl transition-all',
                    index < currentStep ? 'bg-eventra-green-50 border border-eventra-green-200' :
                    index === currentStep ? 'bg-eventra-blue-50 border border-eventra-blue-200' :
                    'bg-eventra-slate-50 border border-eventra-slate-200'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    index < currentStep ? 'bg-eventra-green-600 text-white' :
                    index === currentStep ? 'bg-eventra-blue-600 text-white animate-pulse' :
                    'bg-eventra-slate-200 text-eventra-slate-400'
                  )}>
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={cn(
                      'font-medium',
                      index < currentStep ? 'text-eventra-green-800' :
                      index === currentStep ? 'text-eventra-blue-800' :
                      'text-eventra-slate-600'
                    )}>
                      {step.label}
                    </p>
                    <p className="text-body-xs text-eventra-slate-500">
                      {index < currentStep ? 'Completed' : index === currentStep ? 'In progress' : 'Pending'}
                    </p>
                  </div>
                  {index < currentStep && (
                    <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Amount Display */}
          {paymentStatus && !isFinalState && (
            <div className="mb-6 p-4 bg-eventra-slate-50 rounded-xl">
              <p className="text-body-sm text-eventra-slate-600">Amount</p>
              <p className="price-xl text-eventra-navy-900">{formatCurrency(paymentStatus.amount, paymentStatus.currency)}</p>
              <p className="text-body-xs text-eventra-slate-500">Payment Reference: {paymentStatus.payment_reference}</p>
            </div>
          )}

          {/* Actions */}
          <AnimatePresence mode="wait">
            {isFinalState && isSuccess && (
              <motion.div
                key="success-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-3"
              >
                <Button className="flex-1" onClick={handleViewBooking} leftIcon={<CheckCircle2 className="w-5 h-5" />}>
                  View Booking
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleBackToHome}>
                  Back to Home
                </Button>
              </motion.div>
            )}
            {isFinalState && !isSuccess && (
              <motion.div
                key="failure-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-3"
              >
                <Button className="flex-1" onClick={handleRetry} leftIcon={<Loader2 className="w-5 h-5" />}>
                  Retry Payment
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleBackToHome}>
                  Back to Home
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Notice */}
          {!isFinalState && (
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

function PaymentProcessingSkeleton() {
  return (
    <div className="min-h-screen bg-eventra-slate-50 flex items-center justify-center py-12 px-4">
      <Card variant="elevated" padding="xl" className="w-full max-w-2xl text-center">
        <div className="w-24 h-24 mx-auto mb-6">
          <div className="w-full h-full rounded-full border-4 border-eventra-slate-200 animate-pulse" />
        </div>
        <div className="h-8 bg-eventra-slate-200 rounded animate-pulse mb-4" />
        <div className="h-4 bg-eventra-slate-200 rounded animate-pulse mb-8 mx-auto" style={{ width: '60%' }} />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-eventra-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </Card>
    </div>
  )
}