import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, X, CheckCircle2, Loader2, User, CreditCard, Package, Shield, Calendar, MapPin, Users, Utensils, Plane, Building2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PageSkeleton, CardSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useAuth } from '@/hooks/useAuth'

interface CartItem {
  id: string
  type: string
  serviceId: string
  providerId?: string
  providerName?: string
  name: string
  description?: string
  image?: string
  location?: {
    city: string
    country: string
    address?: string
  }
  dates: {
    start: string
    end?: string
  }
  guests?: {
    adults: number
    children: number
    infants?: number
  }
  passengers?: number
  options: CartItemOption[]
  pricing: CartItemPricing
  availability: {
    available: boolean
    quantity?: number
    holdExpiresAt?: string
  }
  cancellationPolicy?: string
  metadata?: Record<string, unknown>
}

interface CartItemOption {
  id: string
  name: string
  type: 'addon' | 'upgrade' | 'seat' | 'baggage' | 'meal' | 'insurance' | 'transfer' | 'other'
  price: number
  currency: string
  quantity: number
  metadata?: Record<string, unknown>
}

interface CartItemPricing {
  basePrice: number
  taxes: number
  fees: number
  serviceFee: number
  discount: number
  optionsTotal: number
  total: number
  currency: string
  breakdown: PricingBreakdownItem[]
}

interface PricingBreakdownItem {
  label: string
  amount: number
  currency: string
  type: 'base' | 'tax' | 'fee' | 'service_fee' | 'discount' | 'option'
  metadata?: Record<string, unknown>
}

type CheckoutStep = 'travelers' | 'addons' | 'review' | 'payment'

const STEPS: { id: CheckoutStep; label: string; icon: React.ReactNode }[] = [
  { id: 'travelers', label: 'Travelers', icon: <Users className="w-5 h-5" /> },
  { id: 'addons', label: 'Add-ons', icon: <Package className="w-5 h-5" /> },
  { id: 'review', label: 'Review', icon: <Shield className="w-5 h-5" /> },
  { id: 'payment', label: 'Payment', icon: <CreditCard className="w-5 h-5" /> },
]

export function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { 
    items, 
    getTotal, 
    getSubtotal,
    validateCart,
    revalidatePricing,
    removeItem,
    updateItemOption,
    removeItemOption,
    appliedPromoCode,
    promoDiscount,
    removePromoCode,
  } = useCartStore()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('travelers')
  const [travelers, setTravelers] = useState<Record<string, TravelerFormData>>({})
  const [promoCode, setPromoCode] = useState('')
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPromoSuccess, setShowPromoSuccess] = useState(false)

  // Check if cart is valid
  const validation = validateCart()
  if (!validation.valid && items.length > 0) {
    toast.error(validation.errors.join(', '))
  }

  // Initialize travelers for each item
  useEffect(() => {
    const newTravelers: Record<string, TravelerFormData> = {}
    items.forEach((item) => {
      if (!travelers[item.id]) {
        const passengerCount = item.type === 'flight' ? (item.passengers || 1) : (item.guests?.adults || 1) + (item.guests?.children || 0)
        for (let i = 0; i < passengerCount; i++) {
          const travelerId = `${item.id}-traveler-${i}`
          newTravelers[travelerId] = {
            title: i === 0 ? 'Mr' : '',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            date_of_birth: '',
            gender: '',
            nationality: '',
            passport_number: '',
            passport_expiry: '',
            is_primary: i === 0,
          }
        }
      }
    })
    // Clean up removed items
    Object.keys(travelers).forEach(key => {
      if (!newTravelers[key]) {
        delete travelers[key]
      }
    })
    setTravelers({ ...travelers, ...newTravelers })
  }, [items, travelers])

  const subtotal = getSubtotal()
  const total = getTotal()

  const handleNextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id)
    }
  }

  const handlePrevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id)
    }
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setIsApplyingPromo(true)
    try {
      const response = await api.post('/promotions/validate', { code: promoCode, cart_total: subtotal })
      if (response.data.success) {
        // Store would handle promo application
        toast.success('Promo code applied!')
        setShowPromoSuccess(true)
        setTimeout(() => setShowPromoSuccess(false), 3000)
      } else {
        toast.error(response.data.message || 'Invalid promo code')
      }
    } catch {
      toast.error('Failed to apply promo code')
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const handlePayment = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to complete booking')
      navigate('/login', { state: { from: '/checkout' } })
      return
    }

    setIsProcessing(true)
    try {
      // Create booking
      const response = await api.post('/bookings', {
        items: items.map(item => ({
          item_type: item.type,
          service_id: parseInt(item.serviceId),
          configuration: item.options.reduce((acc, opt) => ({ ...acc, [opt.id]: opt }), {}),
          travelers: Object.entries(travelers)
            .filter(([key]) => key.startsWith(item.id))
            .map(([_, traveler]) => traveler),
        })),
        promo_code: appliedPromoCode,
      })

      if (response.data.success) {
        navigate(`/checkout/payment?booking_id=${response.data.data.id}`)
      } else {
        toast.error(response.data.message || 'Failed to create booking')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Booking failed')
    } finally {
      setIsProcessing(false)
    }
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
          <p className="text-eventra-slate-600 mb-6">Add some amazing experiences to your cart first.</p>
          <Button onClick={() => navigate('/search')} leftIcon={<Sparkles className="w-5 h-5" />}>
            Start Shopping
          </Button>
        </motion.div>
      </div>
    )
  }

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Building2 className="w-5 h-5" />
      case 'flight': return <Plane className="w-5 h-5" />
      case 'venue': return <Building2 className="w-5 h-5" />
      case 'train': return <Train className="w-5 h-5" />
      case 'bus': return <Bus className="w-5 h-5" />
      case 'car': return <Car className="w-5 h-5" />
      case 'activity': return <Sparkles className="w-5 h-5" />
      case 'transfer': return <MapPin className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Progress Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container">
          <div className="flex items-center justify-between px-4 py-4">
            {STEPS.map((step, index) => {
              const isActive = STEPS.findIndex(s => s.id === currentStep) >= index
              const isCompleted = STEPS.findIndex(s => s.id === currentStep) > index
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'stepper-circle flex items-center justify-center w-10 h-10 rounded-full text-body-sm font-medium',
                      isCompleted ? 'stepper-circle-completed' : isActive ? 'stepper-circle-active' : 'stepper-circle-pending'
                    )}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                    </div>
                    <span className={cn('hidden sm:block font-medium', isActive ? 'text-eventra-navy-900' : 'text-eventra-slate-500')}>
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      'stepper-line hidden sm:block',
                      isActive ? 'stepper-line-active' : ''
                    )} />
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
            <AnimatePresence mode="wait">
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
                    onNext={handleNextStep}
                  />
                </motion.div>
              )}
              {currentStep === 'addons' && (
                <motion.div
                  key="addons"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <AddonsStep
                    items={items}
                    onNext={handleNextStep}
                    onBack={handlePrevStep}
                  />
                </motion.div>
              )}
              {currentStep === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ReviewStep
                    items={items}
                    travelers={travelers}
                    subtotal={subtotal}
                    total={total}
                    promoDiscount={promoDiscount}
                    appliedPromoCode={appliedPromoCode}
                    onBack={handlePrevStep}
                    onNext={handleNextStep}
                    onRemoveItem={removeItem}
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
                    items={items}
                    total={total}
                    selectedPaymentMethod={selectedPaymentMethod}
                    setSelectedPaymentMethod={setSelectedPaymentMethod}
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
              promoDiscount={promoDiscount}
              appliedPromoCode={appliedPromoCode}
              promoCode={promoCode}
              setPromoCode={setPromoCode}
              isApplyingPromo={isApplyingPromo}
              showPromoSuccess={showPromoSuccess}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={removePromoCode}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function TravelersStep({ items, travelers, setTravelers, onNext }: { items: CartItem[]; travelers: Record<string, TravelerFormData>; setTravelers: React.Dispatch<React.SetStateAction<Record<string, TravelerFormData>>>; onNext: () => void }) {
  const isComplete = Object.values(travelers).every(t => t.first_name && t.last_name && t.email)

  return (
    <Card variant="elevated" padding="lg">
      <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-2">Traveler Details</h2>
      <p className="text-eventra-slate-600 mb-6">Enter details for each traveler. Primary traveler will receive all communications.</p>

      {items.map((item) => {
        const passengerCount = item.type === 'flight' ? (item.passengers || 1) : (item.guests?.adults || 1) + (item.guests?.children || 0)
        const itemTravelers = Array.from({ length: passengerCount }, (_, i) => `${item.id}-traveler-${i}`)

        return (
          <div key={item.id} className="mb-8 p-6 bg-eventra-slate-50 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-eventra-blue-100 flex items-center justify-center">
                  {getServiceIcon(item.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-eventra-navy-900">{item.name}</h3>
                  <p className="text-body-sm text-eventra-slate-600">
                    {passengerCount} traveler{passengerCount > 1 ? 's' : ''} • {formatDate(item.dates.start)}
                    {item.dates.end && ` - ${formatDate(item.dates.end)}`}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {itemTravelers.map((travelerId, index) => {
                  const traveler = travelers[travelerId] || {}
                  return (
                    <div key={travelerId} className="border border-eventra-slate-200 rounded-xl p-4 bg-white">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 rounded-full bg-eventra-navy-900 text-white flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <h4 className="font-medium text-eventra-navy-900">Traveler {index + 1}</p>
                        {traveler.is_primary && <Badge className="badge-primary text-xs">Primary</Badge>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input
                          label="Title"
                          value={traveler.title}
                          onChange={(e) => updateTraveler(travelerId, { title: e.target.value })}
                          placeholder="Mr/Mrs/Ms"
                        />
                        <Input
                          label="First Name"
                          value={traveler.first_name}
                          onChange={(e) => updateTraveler(travelerId, { first_name: e.target.value })}
                          placeholder="John"
                          required
                        />
                        <Input
                          label="Last Name"
                          value={traveler.last_name}
                          onChange={(e) => updateTraveler(travelerId, { last_name: e.target.value })}
                          placeholder="Doe"
                          required
                        />
                        <Input
                          label="Email"
                          type="email"
                          value={traveler.email}
                          onChange={(e) => updateTraveler(travelerId, { email: e.target.value })}
                          placeholder="john@example.com"
                          required
                        />
                        <Input
                          label="Phone"
                          type="tel"
                          value={traveler.phone}
                          onChange={(e) => updateTraveler(travelerId, { phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                        <Input
                          label="Date of Birth"
                          type="date"
                          value={traveler.date_of_birth}
                          onChange={(e) => updateTraveler(travelerId, { date_of_birth: e.target.value })}
                        />
                        <Select
                          label="Gender"
                          value={traveler.gender}
                          onValueChange={(v) => updateTraveler(travelerId, { gender: v })}
                          options={[
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other' },
                          ]}
                          placeholder="Select"
                        />
                        <Select
                          label="Nationality"
                          value={traveler.nationality}
                          onValueChange={(v) => updateTraveler(travelerId, { nationality: v })}
                          options={[
                            { value: 'IN', label: 'Indian' },
                            { value: 'US', label: 'American' },
                            { value: 'GB', label: 'British' },
                            { value: 'AE', label: 'Emirati' },
                            { value: 'SG', label: 'Singaporean' },
                          ]}
                          placeholder="Select"
                        />
                      </div>
                      {item.type === 'flight' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-eventra-slate-200">
                          <Input
                            label="Passport Number"
                            value={traveler.passport_number}
                            onChange={(e) => updateTraveler(travelerId, { passport_number: e.target.value })}
                            placeholder="A1234567"
                          />
                          <Input
                            label="Passport Expiry"
                            type="date"
                            value={traveler.passport_expiry}
                            onChange={(e) => updateTraveler(travelerId, { passport_expiry: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            </div>
          )
        })
      </div>

      <div className="flex justify-end">
        <Button 
          className="w-full sm:w-auto" 
          onClick={onNext} 
          disabled={!isComplete}
        >
          Continue to Add-ons <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  )

  function getServiceIcon(type: string) {
    switch (type) {
      case 'hotel': return <Building2 className="w-6 h-6 text-eventra-blue-600" />
      case 'flight': return <Plane className="w-6 h-6 text-eventra-cyan-600" />
      case 'venue': return <Building2 className="w-6 h-6 text-eventra-red-600" />
      case 'train': return <Train className="w-6 h-6 text-eventra-teal-600" />
      case 'bus': return <Bus className="w-6 h-6 text-eventra-amber-600" />
      case 'car': return <Car className="w-6 h-6 text-eventra-green-600" />
      case 'activity': return <Sparkles className="w-6 h-6 text-eventra-blue-600" />
      case 'transfer': return <MapPin className="w-6 h-6 text-eventra-cyan-600" />
      default: return <Package className="w-6 h-6 text-eventra-navy-600" />
    }
  }

  function updateTraveler(travelerId: string, updates: Partial<TravelerFormData>) {
    setTravelers(prev => ({
      ...prev,
      [travelerId]: { ...prev[travelerId], ...updates }
    }))
  }
}

function AddonsStep({ items, onNext, onBack }: { items: CartItem[]; onNext: () => void; onBack: () => void }) {
  return (
    <Card variant="elevated" padding="lg">
      <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-2">Add-ons</h2>
      <p className="text-eventra-slate-600 mb-6">Enhance your experience with additional services</p>

      {items.map((item) => (
        <div key={item.id} className="mb-8">
          <h3 className="font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
            {getServiceIcon(item.type)}
            {item.name}
          </h3>
          
          {/* Sample addons - in production these would come from the item metadata */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { id: 'insurance', name: 'Travel Insurance', price: 299, icon: Shield },
              { id: 'transfer', name: 'Airport Transfer', price: 1499, icon: Car },
              { id: 'meals', name: 'Meal Package', price: 999, icon: Utensils },
              { id: 'guide', name: 'Local Guide', price: 1999, icon: User },
            ].map((addon) => (
              <label key={addon.id} className="flex items-center gap-3 p-4 border border-eventra-slate-200 rounded-xl cursor-pointer hover:border-eventra-blue-300 hover:bg-eventra-blue-50 transition-colors">
                <input type="checkbox" className="form-checkbox" />
                <div className="w-10 h-10 rounded-xl bg-eventra-blue-100 flex items-center justify-center">
                  <addon.icon className="w-5 h-5 text-eventra-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-eventra-navy-900">{addon.name}</p>
                  <p className="text-body-sm text-eventra-slate-600">Protect your trip with comprehensive coverage</p>
                </div>
                <span className="font-semibold text-eventra-navy-900">{formatCurrency(addon.price, 'INR')}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" /> Back
        </Button>
        <Button onClick={onNext}>
          Continue to Review <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  )
}

function ReviewStep({ items, travelers, subtotal, total, promoDiscount, appliedPromoCode, onBack, onNext, onRemoveItem }: { 
  items: CartItem[]; 
  travelers: Record<string, TravelerFormData>;
  subtotal: number;
  total: number;
  promoDiscount: number;
  appliedPromoCode: string | null;
  onBack: () => void;
  onNext: () => void;
  onRemoveItem: (id: string) => void;
}) {
  const firstTraveler = Object.values(travelers)[0]

  return (
    <Card variant="elevated" padding="lg">
      <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-2">Review Your Booking</h2>
      <p className="text-eventra-slate-600 mb-6">Please review all details before proceeding to payment</p>

      {/* Traveler Summary */}
      {firstTraveler && (
        <div className="mb-6 p-4 bg-eventra-slate-50 rounded-xl">
          <h3 className="font-semibold text-eventra-navy-900 mb-3">Primary Traveler</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <p className="text-body-xs text-eventra-slate-500">Name</p>
              <p className="font-medium text-eventra-navy-900">{firstTraveler.title} {firstTraveler.first_name} {firstTraveler.last_name}</p>
            </div>
            <div>
              <p className="text-body-xs text-eventra-slate-500">Email</p>
              <p className="font-medium text-eventra-navy-900">{firstTraveler.email}</p>
            </div>
            <div>
              <p className="text-body-xs text-eventra-slate-500">Phone</p>
              <p className="font-medium text-eventra-navy-900">{firstTraveler.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <Card key={item.id} variant="outlined" padding="md">
            <div className="flex gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-eventra-navy-900">{item.name}</h4>
                    <p className="text-body-sm text-eventra-slate-600">{formatDate(item.dates.start)} • {item.type}</p>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => onRemoveItem(item.id)} className="text-eventra-red-600">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-body-sm text-eventra-slate-600">
                  {item.guests && <span><Users className="w-4 h-4" /> {item.guests.adults} adults</span>}
                  {item.passengers && <span><Users className="w-4 h-4" /> {item.passengers} passengers</span>}
                  {item.options.length > 0 && <span><Package className="w-4 h-4" /> {item.options.length} add-ons</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="price-md text-eventra-navy-900">{formatCurrency(item.pricing.total, item.pricing.currency)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Price Breakdown */}
      <Card variant="outlined" padding="lg">
        <h3 className="font-semibold text-eventra-navy-900 mb-4">Price Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-body-sm">
            <span className="text-eventra-slate-600">Subtotal</span>
            <span className="text-eventra-navy-900">{formatCurrency(subtotal, 'INR')}</span>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-body-sm text-eventra-green-600">
              <span>Promo Discount ({appliedPromoCode})</span>
              <span>-{formatCurrency(promoDiscount, 'INR')}</span>
            </div>
          )}
          <div className="flex justify-between text-body-sm">
            <span className="text-eventra-slate-600">Taxes & Fees</span>
            <span className="text-eventra-navy-900">{formatCurrency(total - subtotal + promoDiscount, 'INR')}</span>
          </div>
          <div className="border-t border-eventra-slate-200 pt-3 flex justify-between font-semibold text-lg">
            <span className="text-eventra-navy-900">Total Payable</span>
            <span className="price-lg text-eventra-navy-900">{formatCurrency(total, 'INR')}</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" /> Back
        </Button>
        <Button onClick={onNext} size="lg">
          Proceed to Payment <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  )
}

function PaymentStep({ items, total, selectedPaymentMethod, setSelectedPaymentMethod, onBack, onPay, isProcessing }: { 
  items: CartItem[]; 
  total: number; 
  selectedPaymentMethod: string; 
  setSelectedPaymentMethod: (method: string) => void;
  onBack: () => void;
  onPay: () => void;
  isProcessing: boolean;
}) {
  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
    { id: 'upi', name: 'UPI', icon: Smartphone, description: 'PhonePe, Google Pay, Paytm' },
    { id: 'netbanking', name: 'Net Banking', icon: Building2, description: 'All major banks' },
    { id: 'wallet', name: 'EventraOS Wallet', icon: Wallet, description: 'Use wallet balance' },
  ]

  return (
    <Card variant="elevated" padding="lg">
      <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-2">Payment</h2>
      <p className="text-eventra-slate-600 mb-6">Choose your preferred payment method</p>

      <div className="space-y-3 mb-6">
        {paymentMethods.map((method) => (
          <label key={method.id} className={cn(
            'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
            selectedPaymentMethod === method.id
              ? 'border-eventra-navy-900 bg-eventra-navy-50'
              : 'border-eventra-slate-200 hover:border-eventra-slate-300'
          )}>
            <input
              type="radio"
              name="payment"
              value={method.id}
              checked={selectedPaymentMethod === method.id}
              onChange={() => setSelectedPaymentMethod(method.id)}
              className="sr-only"
            />
            <div className="w-12 h-12 rounded-xl bg-eventra-blue-100 flex items-center justify-center">
              <method.icon className="w-6 h-6 text-eventra-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-eventra-navy-900">{method.name}</p>
              <p className="text-body-sm text-eventra-slate-600">{method.description}</p>
            </div>
          </label>
        ))}
      </div>

      {selectedPaymentMethod === 'card' && (
        <div className="space-y-4 mb-6 p-4 bg-eventra-slate-50 rounded-xl">
          <h4 className="font-medium text-eventra-navy-900">Card Details</h4>
          <Input label="Card Number" placeholder="1234 5678 9012 3456" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expiry" placeholder="MM/YY" />
            <Input label="CVV" type="password" placeholder="123" />
          </div>
          <Input label="Cardholder Name" placeholder="John Doe" />
        </div>
      )}

      {selectedPaymentMethod === 'upi' && (
        <div className="space-y-4 mb-6 p-4 bg-eventra-slate-50 rounded-xl">
          <h4 className="font-medium text-eventra-navy-900">UPI Payment</h4>
          <Input label="UPI ID" placeholder="example@upi" />
          <p className="text-body-sm text-eventra-slate-600">You will receive a payment request on your UPI app</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" /> Back
        </Button>
        <Button 
          onClick={onPay} 
          loading={isProcessing}
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

function OrderSummary({ items, subtotal, total, promoDiscount, appliedPromoCode, promoCode, setPromoCode, isApplyingPromo, showPromoSuccess, onApplyPromo, onRemovePromo }: { 
  items: CartItem[];
  subtotal: number;
  total: number;
  promoDiscount: number;
  appliedPromoCode: string | null;
  promoCode: string;
  setPromoCode: (code: string) => void;
  isApplyingPromo: boolean;
  showPromoSuccess: boolean;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
}) {
  return (
    <Card variant="elevated" padding="lg" className="sticky top-24 h-fit">
      <h3 className="font-semibold text-eventra-navy-900 mb-4">Order Summary</h3>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2 border-b border-eventra-slate-100">
            <div className="flex items-center gap-3">
              <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <p className="font-medium text-eventra-navy-900 text-sm">{item.name}</p>
                <p className="text-body-xs text-eventra-slate-500">{item.type}</p>
              </div>
            </div>
            <span className="font-medium text-eventra-navy-900">{formatCurrency(item.pricing.total, item.pricing.currency)}</span>
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
          <span className="text-eventra-slate-600">Taxes & Fees</span>
          <span className="text-eventra-navy-900">{formatCurrency(total - subtotal + promoDiscount, 'INR')}</span>
        </div>
        <div className="border-t border-eventra-slate-200 pt-3 flex justify-between font-semibold text-lg">
          <span className="text-eventra-navy-900">Total</span>
          <span className="price-lg text-eventra-navy-900">{formatCurrency(total, 'INR')}</span>
        </div>
      </div>

      {/* Promo Code */}
      <div className="mb-4">
        <label className="label">Promo Code</label>
        <div className="flex gap-2">
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter promo code"
            className="flex-1"
          />
          <Button onClick={onApplyPromo} loading={isApplyingPromo}>
            Apply
          </Button>
        </div>
        {showPromoSuccess && (
          <p className="text-body-xs text-eventra-green-600 mt-2">Promo code applied successfully!</p>
        )}
        {appliedPromoCode && !showPromoSuccess && (
          <div className="flex items-center justify-between mt-2 p-2 bg-eventra-green-50 rounded-lg">
            <span className="text-body-sm text-eventra-green-800">Applied: {appliedPromoCode}</span>
            <Button variant="ghost" size="xs" onClick={onRemovePromo}>Remove</Button>
          </div>
        )}
      </div>

      <div className="border-t border-eventra-slate-200 pt-4">
        <p className="text-body-xs text-eventra-slate-500 text-center">
          By continuing, you agree to our <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a>
        </p>
      </div>
    </Card>
  )
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
  is_primary: boolean
}

function getServiceIcon(type: string) {
  switch (type) {
    case 'hotel': return <Building2 className="w-5 h-5" />
    case 'flight': return <Plane className="w-5 h-5" />
    case 'venue': return <Building2 className="w-5 h-5" />
    case 'train': return <Train className="w-5 h-5" />
    case 'bus': return <Bus className="w-5 h-5" />
    case 'car': return <Car className="w-5 h-5" />
    case 'activity': return <Sparkles className="w-5 h-5" />
    case 'transfer': return <MapPin className="w-5 h-5" />
    default: return <Package className="w-5 h-5" />
  }
}

import { Train, Bus, Smartphone, Wallet } from 'lucide-react'