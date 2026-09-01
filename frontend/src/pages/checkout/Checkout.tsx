import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Plane,
  Train,
  Bus,
  Car,
  Sparkles,
  MapPin,
  Package,
  Users,
  CreditCard,
  Smartphone,
  Landmark,
  Wallet,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  X,
  Shield,
  Tag,
  Search,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { toast } from 'react-hot-toast'
import { useCartStore, type CartItem } from '@/store/cart'
import { useAuthStore } from '@/store/auth'

interface PaymentMethodOption {
  id: number
  name: string
  code: string
  type?: string
  gateway?: string
  description?: string
}

interface TravelerFormData {
  title: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  gender: string
  nationality: string
  passport_number: string
  passport_expiry: string
}

type CheckoutStep = 'review' | 'travelers' | 'payment'

const STEPS: { id: CheckoutStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'review', label: 'Review', icon: Package },
  { id: 'travelers', label: 'Travelers', icon: Users },
  { id: 'payment', label: 'Payment', icon: CreditCard },
]

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const NATIONALITY_OPTIONS = [
  { value: 'IN', label: 'Indian' },
  { value: 'US', label: 'American' },
  { value: 'GB', label: 'British' },
  { value: 'AE', label: 'Emirati' },
  { value: 'SG', label: 'Singaporean' },
]

const emptyTraveler = (): TravelerFormData => ({
  title: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  nationality: '',
  passport_number: '',
  passport_expiry: '',
})

const travelerKey = (itemId: string, index: number) => `${itemId}::${index}`

const travelerCount = (item: CartItem): number => {
  if (item.type === 'flight') return Math.max(1, item.passengers ?? 1)
  if (item.guests) return Math.max(1, item.guests.adults + item.guests.children)
  return 1
}

// Cart stores serviceId as '<type>_<id>' (e.g. 'hotel_1'); the bookings API needs the numeric id
const toNumericServiceId = (raw: string): number => {
  const parts = raw.split('_').filter(Boolean)
  const last = parts[parts.length - 1] ?? raw
  const parsed = parseInt(last, 10)
  if (!Number.isNaN(parsed)) return parsed
  const fallback = parseInt(raw, 10)
  return Number.isNaN(fallback) ? 0 : fallback
}

// Map cart item options/dates into the booking configuration contract
const buildConfiguration = (item: CartItem): Record<string, unknown> => {
  const config: Record<string, unknown> = {
    date: item.dates.start,
    start_date: item.dates.start,
  }
  if (item.dates.end) config.end_date = item.dates.end

  switch (item.type) {
    case 'hotel':
      config.check_in = item.dates.start
      if (item.dates.end) config.check_out = item.dates.end
      break
    case 'car':
    case 'transfer':
      config.pickup_date = item.dates.start
      if (item.dates.end) config.return_date = item.dates.end
      break
    case 'flight':
      config.departure_date = item.dates.start
      break
    case 'train':
    case 'bus':
      config.journey_date = item.dates.start
      break
  }

  if (item.guests) {
    config.guests = item.guests
    config.participants = item.guests.adults + item.guests.children + (item.guests.infants ?? 0)
  }
  if (item.passengers) config.passengers = item.passengers
  if (item.options.length > 0) {
    config.addons = item.options.map((opt) => ({
      id: opt.id,
      name: opt.name,
      price: opt.price,
      quantity: opt.quantity,
    }))
  }
  if (item.providerId) config.provider_code = item.providerId

  // Preserve provider-specific selections captured at detail time (room_type_id, fare_id, package_id...)
  if (item.metadata) {
    for (const key of ['room_type_id', 'fare_id', 'package_id', 'class_id', 'quota'] as const) {
      if (item.metadata[key] !== undefined && item.metadata[key] !== null) {
        config[key] = item.metadata[key]
      }
    }
  }

  return config
}

const buildTravelerPayload = (t: TravelerFormData) => ({
  first_name: t.first_name.trim(),
  last_name: t.last_name.trim(),
  email: t.email.trim(),
  ...(t.phone.trim() ? { phone: t.phone.trim() } : {}),
  ...(t.title.trim() ? { title: t.title.trim() } : {}),
  ...(t.date_of_birth ? { date_of_birth: t.date_of_birth } : {}),
  ...(t.gender ? { gender: t.gender } : {}),
  ...(t.nationality ? { nationality: t.nationality } : {}),
  ...(t.passport_number ? { passport_number: t.passport_number } : {}),
  ...(t.passport_expiry ? { passport_expiry: t.passport_expiry } : {}),
})

export function getServiceIcon(type: string, className = 'w-5 h-5') {
  switch (type) {
    case 'hotel':
      return <Building2 className={cn(className, 'text-eventra-blue-600')} />
    case 'flight':
      return <Plane className={cn(className, 'text-eventra-cyan-600')} />
    case 'train':
      return <Train className={cn(className, 'text-eventra-teal-600')} />
    case 'bus':
      return <Bus className={cn(className, 'text-eventra-amber-600')} />
    case 'car':
      return <Car className={cn(className, 'text-eventra-green-600')} />
    case 'activity':
      return <Sparkles className={cn(className, 'text-eventra-blue-600')} />
    case 'transfer':
      return <MapPin className={cn(className, 'text-eventra-cyan-600')} />
    default:
      return <Package className={cn(className, 'text-eventra-navy-600')} />
  }
}

export function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const {
    items,
    getSubtotal,
    getTotal,
    removeItem,
    clearCart,
    appliedPromoCode,
    promoDiscount,
    setPromoCode,
    removePromoCode,
    validateCart,
  } = useCartStore()

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review')
  const [travelers, setTravelers] = useState<Record<string, TravelerFormData>>({})
  const [promoInput, setPromoInput] = useState('')
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Redirect to login when unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
    }
  }, [isAuthenticated, navigate, location])

  // Initialize traveler forms for each cart item
  useEffect(() => {
    setTravelers((prev) => {
      const next = { ...prev }
      items.forEach((item) => {
        const count = travelerCount(item)
        for (let i = 0; i < count; i++) {
          const key = travelerKey(item.id, i)
          if (!next[key]) next[key] = emptyTraveler()
        }
      })
      return next
    })
  }, [items])

  // Payment methods (public endpoint)
  const { data: paymentMethods, isLoading: methodsLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const body = await api.get<any>('/payment-methods')
      return (Array.isArray(body?.data) ? body.data : []) as PaymentMethodOption[]
    },
  })

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && selectedPaymentMethodId === null) {
      setSelectedPaymentMethodId(paymentMethods[0].id)
    }
  }, [paymentMethods, selectedPaymentMethodId])

  const subtotal = getSubtotal()
  const total = getTotal()
  const validation = validateCart()

  const travelersForItem = (itemId: string): TravelerFormData[] => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return []
    return Array.from({ length: travelerCount(item) }, (_, i) => travelers[travelerKey(itemId, i)]).filter(
      Boolean
    ) as TravelerFormData[]
  }

  const allTravelersComplete =
    items.length > 0 &&
    items.every((item) =>
      travelersForItem(item.id).every((t) => t.first_name.trim() && t.last_name.trim() && t.email.trim())
    )

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id)
    }
  }

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id)
    }
  }

  const handleApplyPromo = async () => {
    const code = promoInput.trim()
    if (!code) return
    setIsApplyingPromo(true)
    try {
      const res = await api.post<any>('/promotions/validate', { code, cart_total: subtotal })
      if (res?.success && res?.data) {
        setPromoCode(res.data.code || code, Number(res.data.discount) || 0)
        setPromoInput('')
        toast.success(res.message || 'Promo code applied!')
      } else {
        toast.error(res?.message || 'Invalid promo code')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to apply promo code')
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    removePromoCode()
    toast.success('Promo code removed')
  }

  const handlePayment = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (!selectedPaymentMethodId) {
      toast.error('Please select a payment method')
      return
    }

    setIsProcessing(true)
    try {
      const bookingRes = await api.post<any>('/bookings', {
        items: items.map((item) => ({
          item_type: item.type,
          service_id: toNumericServiceId(item.serviceId),
          configuration: buildConfiguration(item),
          travelers: travelersForItem(item.id).map(buildTravelerPayload),
        })),
        currency: 'INR',
        promo_code: appliedPromoCode || undefined,
      })

      const booking = bookingRes?.data
      if (!bookingRes?.success || !booking?.id) {
        toast.error(bookingRes?.message || 'Failed to create booking')
        return
      }

      // Initiate payment against the created booking
      try {
        const payRes = await api.post<any>('/payments/initiate', {
          booking_id: booking.id,
          payment_method_id: selectedPaymentMethodId,
        })
        const payment = payRes?.data
        if (payRes?.success && payment?.id) {
          clearCart()
          toast.success(`Booking ${booking.booking_reference} created`)
          navigate(`/booking/payment/${payment.id}`, {
            state: { bookingId: booking.id, bookingReference: booking.booking_reference },
          })
          return
        }
        toast.error(payRes?.message || 'Payment could not be initiated — your booking has been saved')
      } catch (initErr: any) {
        toast.error(
          initErr?.response?.data?.message || 'Payment initiation failed — your booking has been saved'
        )
      }

      // Booking exists but payment was not initiated → confirmation page
      clearCart()
      navigate(`/booking/confirmation/${booking.booking_reference}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-eventra-slate-50" />
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-eventra-slate-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-eventra-slate-400" />
          </div>
          <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">Your cart is empty</h2>
          <p className="text-eventra-slate-600 mb-6">
            Browse hotels, flights, trains and more to start planning your next trip.
          </p>
          <Button onClick={() => navigate('/search')} leftIcon={<Search className="w-5 h-5" />}>
            Explore Services
          </Button>
        </motion.div>
      </div>
    )
  }

  const taxesAndFees = Math.max(0, total - subtotal + promoDiscount)

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Stepper */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container">
          <div className="flex items-center justify-between px-4 py-4">
            {STEPS.map((step, index) => {
              const isActive = currentStepIndex >= index
              const isCompleted = currentStepIndex > index
              const StepIcon = step.icon
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'stepper-circle flex items-center justify-center w-10 h-10 rounded-full text-body-sm font-medium',
                        isCompleted
                          ? 'stepper-circle-completed'
                          : isActive
                            ? 'stepper-circle-active'
                            : 'stepper-circle-pending'
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <span
                      className={cn(
                        'hidden sm:block font-medium',
                        isActive ? 'text-eventra-navy-900' : 'text-eventra-slate-500'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn('stepper-line hidden sm:block', isActive && 'stepper-line-active')} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="section-container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {!validation.valid && (
              <div className="alert alert-warning flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Some items in your cart need attention</p>
                  <p className="text-body-sm mt-1">{validation.errors.join(' • ')}</p>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {currentStep === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ReviewStep items={items} onRemoveItem={removeItem} onNext={handleNextStep} />
                </motion.div>
              )}
              {currentStep === 'travelers' && (
                <motion.div
                  key="travelers"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TravelersStep
                    items={items}
                    travelers={travelers}
                    setTravelers={setTravelers}
                    allComplete={allTravelersComplete}
                    onBack={handlePrevStep}
                    onNext={handleNextStep}
                  />
                </motion.div>
              )}
              {currentStep === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <PaymentStep
                    methods={paymentMethods ?? []}
                    isLoading={methodsLoading}
                    selectedPaymentMethodId={selectedPaymentMethodId}
                    onSelectPaymentMethod={setSelectedPaymentMethodId}
                    total={total}
                    onBack={handlePrevStep}
                    onPay={handlePayment}
                    isProcessing={isProcessing}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              total={total}
              taxesAndFees={taxesAndFees}
              promoDiscount={promoDiscount}
              appliedPromoCode={appliedPromoCode}
              promoInput={promoInput}
              setPromoInput={setPromoInput}
              isApplyingPromo={isApplyingPromo}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={handleRemovePromo}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewStep({
  items,
  onRemoveItem,
  onNext,
}: {
  items: CartItem[]
  onRemoveItem: (id: string) => void
  onNext: () => void
}) {
  return (
    <Card variant="elevated" padding="lg">
      <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-2">Review Your Cart</h2>
      <p className="text-eventra-slate-600 mb-6">Check your selections before entering traveler details</p>

      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <Card key={item.id} variant="outlined" padding="md">
            <div className="flex gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-eventra-slate-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getServiceIcon(item.type, 'w-8 h-8')}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-eventra-navy-900">{item.name}</h4>
                    <p className="text-body-sm text-eventra-slate-600 capitalize">
                      {item.type} • {formatDate(item.dates.start)}
                      {item.dates.end ? ` - ${formatDate(item.dates.end)}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-eventra-red-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-body-sm text-eventra-slate-600">
                  {item.guests && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {item.guests.adults} adults
                      {item.guests.children > 0 ? `, ${item.guests.children} children` : ''}
                    </span>
                  )}
                  {item.passengers && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {item.passengers} passengers
                    </span>
                  )}
                  {item.options.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" /> {item.options.length} add-ons
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="price-md text-eventra-navy-900">
                  {formatCurrency(item.pricing.total, item.pricing.currency)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
          Continue to Traveler Details
        </Button>
      </div>
    </Card>
  )
}

function TravelersStep({
  items,
  travelers,
  setTravelers,
  allComplete,
  onBack,
  onNext,
}: {
  items: CartItem[]
  travelers: Record<string, TravelerFormData>
  setTravelers: React.Dispatch<React.SetStateAction<Record<string, TravelerFormData>>>
  allComplete: boolean
  onBack: () => void
  onNext: () => void
}) {
  const updateTraveler = (travelerId: string, updates: Partial<TravelerFormData>) => {
    setTravelers((prev) => ({
      ...prev,
      [travelerId]: { ...emptyTraveler(), ...prev[travelerId], ...updates },
    }))
  }

  return (
    <Card variant="elevated" padding="lg">
      <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-2">Traveler Details</h2>
      <p className="text-eventra-slate-600 mb-6">
        Enter details for each traveler. The primary traveler will receive all communications.
      </p>

      {items.map((item) => {
        const count = travelerCount(item)
        return (
          <div key={item.id} className="mb-8 p-6 bg-eventra-slate-50 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-eventra-slate-200 flex items-center justify-center">
                {getServiceIcon(item.type, 'w-6 h-6')}
              </div>
              <div>
                <h3 className="font-semibold text-eventra-navy-900">{item.name}</h3>
                <p className="text-body-sm text-eventra-slate-600">
                  {count} traveler{count > 1 ? 's' : ''} • {formatDate(item.dates.start)}
                  {item.dates.end ? ` - ${formatDate(item.dates.end)}` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: count }, (_, index) => {
                const travelerId = travelerKey(item.id, index)
                const traveler = travelers[travelerId]
                return (
                  <div key={travelerId} className="border border-eventra-slate-200 rounded-xl p-4 bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-8 h-8 rounded-full bg-eventra-navy-900 text-white flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <h4 className="font-medium text-eventra-navy-900">
                        Traveler {index + 1}
                        {index === 0 && ' (Primary)'}
                      </h4>
                      {index === 0 && (
                        <Badge variant="primary" size="sm">
                          Lead
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Input
                        label="Title"
                        value={traveler?.title ?? ''}
                        onChange={(e) => updateTraveler(travelerId, { title: e.target.value })}
                        placeholder="Mr/Mrs/Ms"
                      />
                      <Input
                        label="First Name"
                        value={traveler?.first_name ?? ''}
                        onChange={(e) => updateTraveler(travelerId, { first_name: e.target.value })}
                        placeholder="John"
                        required
                      />
                      <Input
                        label="Last Name"
                        value={traveler?.last_name ?? ''}
                        onChange={(e) => updateTraveler(travelerId, { last_name: e.target.value })}
                        placeholder="Doe"
                        required
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={traveler?.email ?? ''}
                        onChange={(e) => updateTraveler(travelerId, { email: e.target.value })}
                        placeholder="john@example.com"
                        required
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        value={traveler?.phone ?? ''}
                        onChange={(e) => updateTraveler(travelerId, { phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={traveler?.date_of_birth ?? ''}
                        onChange={(e) => updateTraveler(travelerId, { date_of_birth: e.target.value })}
                      />
                      <Select
                        label="Gender"
                        value={traveler?.gender ?? ''}
                        onChange={(e) => updateTraveler(travelerId, { gender: e.target.value })}
                        options={GENDER_OPTIONS}
                        placeholder="Select"
                      />
                      <Select
                        label="Nationality"
                        value={traveler?.nationality ?? ''}
                        onChange={(e) => updateTraveler(travelerId, { nationality: e.target.value })}
                        options={NATIONALITY_OPTIONS}
                        placeholder="Select"
                      />
                    </div>
                    {item.type === 'flight' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-eventra-slate-200">
                        <Input
                          label="Passport Number"
                          value={traveler?.passport_number ?? ''}
                          onChange={(e) => updateTraveler(travelerId, { passport_number: e.target.value })}
                          placeholder="A1234567"
                        />
                        <Input
                          label="Passport Expiry"
                          type="date"
                          value={traveler?.passport_expiry ?? ''}
                          onChange={(e) => updateTraveler(travelerId, { passport_expiry: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} leftIcon={<ChevronLeft className="w-5 h-5" />}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!allComplete} rightIcon={<ArrowRight className="w-5 h-5" />}>
          Continue to Payment
        </Button>
      </div>
      {!allComplete && (
        <p className="text-body-xs text-eventra-slate-500 mt-3 text-right">
          First name, last name and email are required for every traveler.
        </p>
      )}
    </Card>
  )
}

const methodIcon = (code?: string) => {
  switch ((code || '').toLowerCase()) {
    case 'upi':
      return Smartphone
    case 'netbanking':
    case 'bank_transfer':
      return Landmark
    case 'wallet':
      return Wallet
    default:
      return CreditCard
  }
}

function PaymentStep({
  methods,
  isLoading,
  selectedPaymentMethodId,
  onSelectPaymentMethod,
  total,
  onBack,
  onPay,
  isProcessing,
}: {
  methods: PaymentMethodOption[]
  isLoading: boolean
  selectedPaymentMethodId: number | null
  onSelectPaymentMethod: (id: number) => void
  total: number
  onBack: () => void
  onPay: () => void
  isProcessing: boolean
}) {
  return (
    <Card variant="elevated" padding="lg">
      <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-2">Payment</h2>
      <p className="text-eventra-slate-600 mb-6">Choose your preferred payment method</p>

      {isLoading ? (
        <div className="space-y-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-eventra-slate-100 skeleton" />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <div className="alert alert-danger mb-6">No payment methods are available right now. Please try again later.</div>
      ) : (
        <div className="space-y-3 mb-6">
          {methods.map((method) => {
            const Icon = methodIcon(method.code)
            const selected = selectedPaymentMethodId === method.id
            return (
              <label
                key={method.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selected
                    ? 'border-eventra-navy-900 bg-eventra-navy-50'
                    : 'border-eventra-slate-200 hover:border-eventra-slate-300'
                )}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={method.id}
                  checked={selected}
                  onChange={() => onSelectPaymentMethod(method.id)}
                  className="sr-only"
                />
                <div className="w-12 h-12 rounded-xl bg-eventra-blue-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-eventra-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-eventra-navy-900">{method.name}</p>
                  {method.gateway && (
                    <p className="text-body-sm text-eventra-slate-600 capitalize">
                      {method.gateway} gateway
                      {method.type ? ` • ${method.type}` : ''}
                    </p>
                  )}
                </div>
                {selected && <CheckCircle2 className="w-5 h-5 text-eventra-navy-900" />}
              </label>
            )
          })}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} leftIcon={<ChevronLeft className="w-5 h-5" />}>
          Back
        </Button>
        <Button
          onClick={onPay}
          loading={isProcessing}
          disabled={methods.length === 0 || selectedPaymentMethodId === null}
          size="lg"
        >
          Pay {formatCurrency(total, 'INR')}
        </Button>
      </div>

      <p className="text-center text-body-xs text-eventra-slate-500 mt-4">
        <Shield className="w-4 h-4 inline mr-1" />
        Secure payment powered by EventraOS. Your data is encrypted and protected.
      </p>
    </Card>
  )
}

function OrderSummary({
  items,
  subtotal,
  total,
  taxesAndFees,
  promoDiscount,
  appliedPromoCode,
  promoInput,
  setPromoInput,
  isApplyingPromo,
  onApplyPromo,
  onRemovePromo,
}: {
  items: CartItem[]
  subtotal: number
  total: number
  taxesAndFees: number
  promoDiscount: number
  appliedPromoCode: string | null
  promoInput: string
  setPromoInput: (code: string) => void
  isApplyingPromo: boolean
  onApplyPromo: () => void
  onRemovePromo: () => void
}) {
  return (
    <Card variant="elevated" padding="lg" className="sticky top-36 h-fit">
      <h3 className="font-semibold text-eventra-navy-900 mb-4">Order Summary</h3>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2 border-b border-eventra-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                  {getServiceIcon(item.type, 'w-5 h-5')}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-eventra-navy-900 text-sm truncate">{item.name}</p>
                <p className="text-body-xs text-eventra-slate-500 capitalize">{item.type}</p>
              </div>
            </div>
            <span className="font-medium text-eventra-navy-900 flex-shrink-0">
              {formatCurrency(item.pricing.total, item.pricing.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-4 p-4 bg-eventra-slate-50 rounded-xl">
        <div className="flex justify-between text-body-sm">
          <span className="text-eventra-slate-600">Subtotal</span>
          <span className="text-eventra-navy-900">{formatCurrency(subtotal, 'INR')}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-body-sm text-eventra-green-600">
            <span>Discount ({appliedPromoCode})</span>
            <span>-{formatCurrency(promoDiscount, 'INR')}</span>
          </div>
        )}
        <div className="flex justify-between text-body-sm">
          <span className="text-eventra-slate-600">Taxes &amp; Fees</span>
          <span className="text-eventra-navy-900">{formatCurrency(taxesAndFees, 'INR')}</span>
        </div>
        <div className="border-t border-eventra-slate-200 pt-3 flex justify-between font-semibold text-lg">
          <span className="text-eventra-navy-900">Total</span>
          <span className="price-lg text-eventra-navy-900">{formatCurrency(total, 'INR')}</span>
        </div>
      </div>

      {/* Promo Code */}
      <div className="mb-4">
        <label className="label">
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Promo Code
          </span>
        </label>
        {appliedPromoCode ? (
          <div className="flex items-center justify-between p-3 bg-eventra-green-50 rounded-xl">
            <span className="text-body-sm text-eventra-green-800 font-medium">{appliedPromoCode} applied</span>
            <Button variant="ghost" size="xs" onClick={onRemovePromo} className="text-eventra-red-600">
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Enter promo code"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onApplyPromo()
                }
              }}
            />
            <Button onClick={onApplyPromo} loading={isApplyingPromo} disabled={!promoInput.trim()}>
              Apply
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-eventra-slate-200 pt-4">
        <p className="text-body-xs text-eventra-slate-500 text-center">
          By continuing, you agree to our <a href="#" className="link">Terms of Service</a> and{' '}
          <a href="#" className="link">Privacy Policy</a>
        </p>
      </div>
    </Card>
  )
}
