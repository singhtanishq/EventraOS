import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Plane, Shield, CheckCircle2, Calendar, Users, BaggageClaim, Coffee, Tag, Armchair, Sparkles, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useAuth } from '@/hooks/useAuth'

// departure_date is required by the API - default to today + 3 days
const addDaysISO = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

interface FlightDetailData {
  id: string
  name: string
  description: string
  images: string[]
  location: {
    origin: { airport: string; code: string; city: string; terminal: string; timezone: string }
    destination: { airport: string; code: string; city: string; terminal: string; timezone: string }
  }
  amenities: {
    baggage: any
    stops: number
    duration: number
    aircraft: string
  }
  metadata: {
    flight_number: string
    airline: string
    airline_code: string
    airline_logo: string
    departure_time: string
    arrival_time: string
    duration_minutes: number
    stops: number
    aircraft: string
    refundable: boolean
    changeable: boolean
    change_fee: number
    cancel_fee: number
  }
  rating: number
  review_count: number
  fare_options: FareOption[]
}

interface FareOption {
  fare_id: string
  name: string
  cabin_class: string
  code: string
  baggage_allowance: any
  fare_rules: any
  is_refundable: boolean
  is_changeable: boolean
  change_fee: number
  cancel_fee: number
  pricing: {
    base_price: number
    currency: string
    total: number
    per_passenger: number
  }
  availability: {
    available: boolean
    seats_available: number
  }
}

export function FlightDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const departureDate = searchParams.get('departure_date') || addDaysISO(3)
  const returnDate = searchParams.get('return_date')
  const adults = parseInt(searchParams.get('adults') || '1') || 1
  const children = parseInt(searchParams.get('children') || '0') || 0
  const infants = parseInt(searchParams.get('infants') || '0') || 0
  const cabinClass = searchParams.get('cabin_class') || 'economy'
  const [selectedFare, setSelectedFare] = useState<FareOption | null>(null)
  const [showFareSelector, setShowFareSelector] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [showSeatMap, setShowSeatMap] = useState(false)
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['flight', id, departureDate, cabinClass, adults, children, infants],
    queryFn: async () => {
      const body = await api.get<any>(`/flights/${id}`, {
        params: {
          departure_date: departureDate,
          cabin_class: cabinClass,
          adults,
          children,
          infants
        }
      })
      return body
    },
    enabled: !!id,
  })

  const flight = data?.data as FlightDetailData | undefined
  const passengers = adults + children + infants

  // Auto-select first available fare (kept above early returns to preserve hook order)
  useEffect(() => {
    const fareOptions: FareOption[] = Array.isArray(flight?.fare_options) ? flight.fare_options : []
    const available = fareOptions.filter((fare) => fare.availability?.available)
    if (available.length > 0 && !selectedFare) {
      setSelectedFare(available[0])
    }
  }, [flight, selectedFare])

  if (isLoading) return <FlightDetailSkeleton />
  if (isError || !flight) return <FlightNotFound onBack={() => navigate('/flights')} />

  const fareOptions: FareOption[] = Array.isArray(flight.fare_options) ? flight.fare_options : []
  const availableFares = fareOptions.filter((fare) => fare.availability?.available)
  const metadata = flight.metadata || {}
  const origin = flight.location?.origin
  const destination = flight.location?.destination

  const formatDuration = (minutes: number) => {
    const h = Math.floor((minutes ?? 0) / 60)
    const m = (minutes ?? 0) % 60
    return `${h}h ${m}m`
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book')
      navigate('/login', { state: { from: `/flights/${id}` } })
      return
    }

    if (!selectedFare) {
      toast.error('Please select a fare')
      return
    }

    if (selectedSeats.length !== passengers) {
      toast.error(`Please select ${passengers} seat${passengers > 1 ? 's' : ''}`)
      return
    }

    const totalForPassengers = (selectedFare.pricing?.total ?? 0) * passengers

    addItem({
      type: 'flight',
      serviceId: flight.id || id || '',
      providerName: 'EventraOS',
      name: `${metadata.airline ?? 'Flight'} ${metadata.flight_number ?? ''}`.trim(),
      description: flight.description,
      image: metadata.airline_logo,
      location: {
        city: origin?.city ?? '',
        country: '',
      },
      dates: { start: departureDate, end: returnDate || undefined },
      passengers,
      options: [],
      pricing: {
        basePrice: totalForPassengers,
        taxes: 0,
        fees: 0,
        serviceFee: 0,
        discount: 0,
        optionsTotal: 0,
        total: totalForPassengers,
        currency: selectedFare.pricing?.currency ?? 'INR',
        breakdown: [],
      },
      availability: {
        available: true,
        quantity: selectedFare.availability?.seats_available,
      },
      cancellationPolicy: selectedFare.is_refundable
        ? 'Free cancellation'
        : selectedFare.is_changeable
          ? 'Changeable with fee'
          : 'Non-refundable',
      metadata: {
        fare: selectedFare.name,
        cabin_class: selectedFare.cabin_class || cabinClass,
        seats: selectedSeats.join(', '),
        flight_number: metadata.flight_number,
      },
    })

    toast.success('Added to cart')
    navigate('/checkout')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Flight Header */}
      <div className="relative bg-eventra-navy-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-eventra-navy-900 via-eventra-blue-900/50 to-transparent" />

        <div className="relative section-container py-8">
          <Button variant="ghost" size="sm" className="mb-4 text-white hover:bg-white/10" onClick={() => navigate('/flights')}>
            <ChevronLeft className="w-5 h-5" />
            Back to results
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                {metadata.airline_logo ? (
                  <img src={metadata.airline_logo} alt={metadata.airline} className="w-14 h-14 object-contain bg-white/10 rounded-xl p-2" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xl">
                    {metadata.airline_code || <Plane className="w-6 h-6" />}
                  </div>
                )}
                <div>
                  <h1 className="text-heading-lg font-display font-bold">
                    {metadata.airline} {metadata.flight_number}
                  </h1>
                  <p className="text-eventra-slate-300">{metadata.aircraft || flight.amenities?.aircraft || 'Aircraft details unavailable'}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-3xl font-display font-bold">{metadata.departure_time || '--:--'}</div>
                  <div className="text-eventra-slate-300 text-sm">{origin?.airport || origin?.city} ({origin?.code})</div>
                  <div className="text-eventra-slate-400 text-xs">{origin?.city} • {origin?.terminal || 'Terminal TBA'}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane className="w-5 h-5" />
                    <span className="text-eventra-slate-300 text-sm">{formatDuration(metadata.duration_minutes)}</span>
                  </div>
                  {(metadata.stops ?? 0) === 0 ? (
                    <span className="badge badge-success text-xs">Direct</span>
                  ) : (
                    <span className="badge badge-warning text-xs">{metadata.stops} stop{metadata.stops > 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-right">
                  <div className="text-3xl font-display font-bold">{metadata.arrival_time || '--:--'}</div>
                  <div className="text-eventra-slate-300 text-sm">{destination?.airport || destination?.city} ({destination?.code})</div>
                  <div className="text-eventra-slate-400 text-xs">{destination?.city} • {destination?.terminal || 'Terminal TBA'}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {metadata.refundable && <Badge variant="success">Refundable</Badge>}
                {metadata.changeable && <Badge variant="primary">Changeable</Badge>}
                <Badge variant="neutral">{flight.amenities?.baggage?.checked ?? '1'} checked bag</Badge>
                <Badge variant="neutral">{flight.amenities?.baggage?.cabin ?? '1'} cabin bag</Badge>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-white/10 rounded-2xl p-6 h-fit">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-eventra-slate-300 text-sm">Departure</p>
                  <p className="font-bold">{formatDate(departureDate)}</p>
                </div>
                <div>
                  <p className="text-eventra-slate-300 text-sm">Passengers</p>
                  <p className="font-bold">{passengers} ({adults}A/{children}C/{infants}I)</p>
                </div>
                <div>
                  <p className="text-eventra-slate-300 text-sm">Cabin</p>
                  <p className="font-bold capitalize">{(selectedFare?.cabin_class || cabinClass).replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-eventra-slate-300 text-sm">Duration</p>
                  <p className="font-bold">{formatDuration(metadata.duration_minutes)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="section-container py-6 -mt-6 relative z-10">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fare Selector */}
            <Card variant="elevated" padding="lg">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-heading-md font-semibold text-eventra-navy-900">Select Your Fare</h3>
                  <p className="text-eventra-slate-600 mt-1">
                    {passengers} passenger{passengers > 1 ? 's' : ''} • {(selectedFare?.cabin_class || cabinClass).replace('_', ' ')}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowFareSelector(true)}>
                  View All Fares
                </Button>
              </div>

              {selectedFare && (
                <div className="border border-eventra-slate-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-eventra-navy-900">{selectedFare.name}</h4>
                      <p className="text-eventra-slate-600 text-sm capitalize">
                        {(selectedFare.cabin_class || cabinClass).replace('_', ' ')} {selectedFare.code ? `• ${selectedFare.code}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="price-lg text-eventra-navy-900">
                        {formatCurrency((selectedFare.pricing?.total ?? 0) * passengers, selectedFare.pricing?.currency)}
                      </p>
                      <p className="text-body-xs text-eventra-slate-500">Total for {passengers} passenger{passengers > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-eventra-slate-200">
                    <div className="text-center">
                      <p className="text-body-xs text-eventra-slate-500">Baggage</p>
                      <p className="font-medium text-eventra-navy-900">
                        {selectedFare.baggage_allowance?.checked ?? '1'} checked + {selectedFare.baggage_allowance?.cabin ?? '1'} cabin
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-body-xs text-eventra-slate-500">Cancellation</p>
                      <p className={cn('font-medium', selectedFare.is_refundable ? 'text-eventra-green-700' : 'text-eventra-red-700')}>
                        {selectedFare.is_refundable ? 'Free cancellation' : 'Non-refundable'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-body-xs text-eventra-slate-500">Changes</p>
                      <p className={cn('font-medium', selectedFare.is_changeable ? 'text-eventra-green-700' : 'text-eventra-red-700')}>
                        {selectedFare.is_changeable
                          ? `Change fee: ${formatCurrency(selectedFare.change_fee ?? 0, selectedFare.pricing?.currency)}`
                          : 'Not changeable'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fare Options */}
              <div className="space-y-2">
                <h4 className="text-body-sm font-medium text-eventra-navy-900 mb-3">Available Fares</h4>
                {availableFares.length === 0 && (
                  <p className="text-body-sm text-eventra-slate-500">No fares are currently available for this flight.</p>
                )}
                {availableFares.map((fare) => (
                  <label
                    key={fare.fare_id}
                    className={cn(
                      'flex items-center justify-between gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                      selectedFare?.fare_id === fare.fare_id
                        ? 'border-eventra-navy-900 bg-eventra-navy-50'
                        : 'border-eventra-slate-200 hover:border-eventra-slate-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="fare"
                      checked={selectedFare?.fare_id === fare.fare_id}
                      onChange={() => setSelectedFare(fare)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-eventra-navy-900">{fare.name}</span>
                        <span className="badge badge-neutral capitalize">{(fare.cabin_class || cabinClass).replace('_', ' ')}</span>
                        {fare.is_refundable && <span className="badge badge-success">Free cancellation</span>}
                      </div>
                      <p className="text-body-xs text-eventra-slate-500 mt-1">
                        {fare.fare_rules?.cancellation_policy_text || 'Standard cancellation policy'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="price-md text-eventra-navy-900">
                        {formatCurrency((fare.pricing?.total ?? 0) * passengers, fare.pricing?.currency)}
                      </p>
                      <p className="text-body-xs text-eventra-slate-500">Total</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Baggage & Add-ons */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <BaggageClaim className="w-6 h-6 text-eventra-navy-600" />
                Baggage & Add-ons
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-eventra-slate-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <BaggageClaim className="w-6 h-6 text-eventra-blue-600" />
                    <span className="font-medium text-eventra-navy-900">Checked Baggage</span>
                  </div>
                  <p className="text-body-sm text-eventra-slate-600">
                    {selectedFare?.baggage_allowance?.checked ?? flight.amenities?.baggage?.checked ?? '1'} × 23kg included
                  </p>
                </div>
                <div className="p-4 bg-eventra-slate-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Coffee className="w-6 h-6 text-eventra-amber-600" />
                    <span className="font-medium text-eventra-navy-900">Cabin Baggage</span>
                  </div>
                  <p className="text-body-sm text-eventra-slate-600">
                    {selectedFare?.baggage_allowance?.cabin ?? flight.amenities?.baggage?.cabin ?? '1'} × 7kg included
                  </p>
                </div>
                <div className="p-4 bg-eventra-slate-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Armchair className="w-6 h-6 text-eventra-teal-600" />
                    <span className="font-medium text-eventra-navy-900">Seat Selection</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setShowSeatMap(true)}>
                    Select Seats ({selectedSeats.length}/{passengers})
                  </Button>
                </div>
                <div className="p-4 bg-eventra-slate-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-6 h-6 text-eventra-green-600" />
                    <span className="font-medium text-eventra-navy-900">Travel Insurance</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => toast('Travel insurance coming soon')}>
                    Add Insurance
                  </Button>
                </div>
              </div>
            </Card>

            {/* Fare Rules */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <Tag className="w-6 h-6 text-eventra-navy-600" />
                Fare Rules
              </h3>
              <div className="space-y-3 text-body-sm text-eventra-slate-600">
                {selectedFare ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                      <span>Advance purchase: {selectedFare.fare_rules?.advance_purchase_days ?? 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                      <span>Minimum stay: {selectedFare.fare_rules?.min_stay_days ?? 'Not required'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                      <span>Maximum stay: {selectedFare.fare_rules?.max_stay_days ?? 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                      <span>Change fee: {formatCurrency(selectedFare.change_fee ?? 0, selectedFare.pricing?.currency)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                      <span>Cancellation fee: {formatCurrency(selectedFare.cancel_fee ?? 0, selectedFare.pricing?.currency)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                      <span>Refundable: {selectedFare.is_refundable ? 'Yes' : 'No'}</span>
                    </div>
                  </>
                ) : (
                  <p>Select a fare to see its rules.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" padding="lg" className="sticky top-24 h-fit">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">Flight</span>
                  <span className="text-body-sm text-eventra-slate-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(departureDate)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="price-lg text-eventra-navy-900">
                    {selectedFare
                      ? formatCurrency((selectedFare.pricing?.total ?? 0) * passengers, selectedFare.pricing?.currency)
                      : 'Select a fare'}
                  </span>
                  {selectedFare && <span className="text-body-sm text-eventra-slate-500">total</span>}
                </div>
              </div>

              {selectedFare ? (
                <>
                  <div className="space-y-3 mb-6 p-4 bg-eventra-slate-50 rounded-xl">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-eventra-slate-600">Base fare ({passengers} ×)</span>
                      <span className="text-eventra-navy-900">
                        {formatCurrency((selectedFare.pricing?.base_price ?? 0) * passengers, selectedFare.pricing?.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-body-sm">
                      <span className="text-eventra-slate-600">Taxes & carrier charges</span>
                      <span className="text-eventra-navy-900">
                        {formatCurrency(
                          Math.max(0, ((selectedFare.pricing?.total ?? 0) - (selectedFare.pricing?.base_price ?? 0)) * passengers),
                          selectedFare.pricing?.currency
                        )}
                      </span>
                    </div>
                    <div className="border-t border-eventra-slate-200 pt-2 flex justify-between font-semibold">
                      <span className="text-eventra-navy-900">Total</span>
                      <span className="price-lg text-eventra-navy-900">
                        {formatCurrency((selectedFare.pricing?.total ?? 0) * passengers, selectedFare.pricing?.currency)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleAddToCart}
                    leftIcon={<Sparkles className="w-5 h-5" />}
                  >
                    Continue · {formatCurrency((selectedFare.pricing?.total ?? 0) * passengers, selectedFare.pricing?.currency)}
                  </Button>

                  <p className="text-center text-body-xs text-eventra-slate-500 mt-3">
                    Price guaranteed for 24 hours
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <Plane className="w-12 h-12 text-eventra-slate-300 mx-auto mb-3" />
                  <p className="text-eventra-slate-600">Select a fare to see pricing</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-eventra-slate-200 space-y-3">
                <div className="flex items-center gap-3 text-body-sm text-eventra-slate-600">
                  <Shield className="w-5 h-5 text-eventra-green-600" />
                  <span>Price guaranteed for 24 hours</span>
                </div>
                <div className="flex items-center gap-3 text-body-sm text-eventra-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-eventra-blue-600" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-3 text-body-sm text-eventra-slate-600">
                  <Users className="w-5 h-5 text-eventra-amber-600" />
                  <span>24/7 customer support</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Fare Selector Modal */}
      <Modal
        isOpen={showFareSelector}
        onClose={() => setShowFareSelector(false)}
        title="Select Fare"
        size="xl"
      >
        <div className="space-y-4">
          {fareOptions.length === 0 && (
            <p className="text-body-sm text-eventra-slate-500 text-center py-8">
              No fare information available for this flight.
            </p>
          )}
          {fareOptions.map((fare) => (
            <Card
              key={fare.fare_id}
              variant={selectedFare?.fare_id === fare.fare_id ? 'interactive' : 'outlined'}
              className={cn('cursor-pointer', !fare.availability?.available && 'opacity-75')}
              onClick={() => {
                if (!fare.availability?.available) return
                setSelectedFare(fare)
                setShowFareSelector(false)
              }}
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-eventra-navy-900">{fare.name}</h4>
                  <p className="text-body-sm text-eventra-slate-600 mt-1 capitalize">
                    {(fare.cabin_class || cabinClass).replace('_', ' ')}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {fare.is_refundable && <Badge variant="success">Free cancellation</Badge>}
                    {fare.is_changeable && <Badge variant="primary">Changes allowed</Badge>}
                    {!fare.availability?.available && <Badge variant="danger">Sold out</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="price-md text-eventra-navy-900">
                    {formatCurrency((fare.pricing?.total ?? 0) * passengers, fare.pricing?.currency)}
                  </p>
                  <p className="text-body-xs text-eventra-slate-500">Total</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Seat Map Modal */}
      <Modal
        isOpen={showSeatMap}
        onClose={() => setShowSeatMap(false)}
        title="Select Seats"
        size="xl"
      >
        <SeatMap
          selectedSeats={selectedSeats}
          onSelectionChange={setSelectedSeats}
          passengerCount={passengers}
          onConfirm={() => setShowSeatMap(false)}
        />
      </Modal>
    </div>
  )
}

function SeatMap({ selectedSeats, onSelectionChange, passengerCount, onConfirm }: { selectedSeats: string[]; onSelectionChange: (seats: string[]) => void; passengerCount: number; onConfirm: () => void }) {
  const rows = 30
  const letters = ['A', 'B', 'C', 'D', 'E', 'F']

  const handleSeatClick = (seat: string) => {
    if (selectedSeats.includes(seat)) {
      onSelectionChange(selectedSeats.filter(s => s !== seat))
    } else if (selectedSeats.length < passengerCount) {
      onSelectionChange([...selectedSeats, seat])
    } else {
      toast.error(`Maximum ${passengerCount} seat${passengerCount > 1 ? 's' : ''} allowed`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-body-sm text-eventra-slate-600 flex items-center gap-1">
          <Armchair className="w-4 h-4" />
          Selected: {selectedSeats.length}/{passengerCount} seats
        </p>
        <Button onClick={onConfirm} disabled={selectedSeats.length !== passengerCount}>
          Confirm Seats
        </Button>
      </div>

      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <div className="grid grid-cols-7 gap-1 min-w-[400px]">
          <div className="text-center text-body-xs text-eventra-slate-500 font-medium py-2"></div>
          {letters.map((letter) => (
            <div key={letter} className="text-center text-body-xs text-eventra-slate-500 font-medium py-2">{letter}</div>
          ))}
        </div>
        {Array.from({ length: rows }, (_, i) => i + 1).map((row) => (
          <div key={row} className="grid grid-cols-7 gap-1">
            <div className="text-center text-body-xs text-eventra-slate-500 font-medium py-2 w-10">{row}</div>
            {letters.map((letter) => {
              const seat = `${row}${letter}`
              const isSelected = selectedSeats.includes(seat)
              const isAisle = ['C', 'D'].includes(letter)
              const isWindow = ['A', 'F'].includes(letter)

              return (
                <button
                  key={seat}
                  onClick={() => handleSeatClick(seat)}
                  disabled={!isSelected && selectedSeats.length >= passengerCount}
                  className={cn(
                    'w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-body-xs',
                    isSelected
                      ? 'bg-eventra-navy-900 border-eventra-navy-900 text-white'
                      : 'bg-eventra-slate-50 border-eventra-slate-200 text-eventra-navy-700 hover:bg-eventra-slate-100',
                    !isSelected && selectedSeats.length >= passengerCount && 'opacity-50 cursor-not-allowed'
                  )}
                  title={`${isWindow ? 'Window' : isAisle ? 'Aisle' : 'Middle'} seat`}
                >
                  {seat}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-body-xs text-eventra-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded border-2 bg-eventra-navy-900" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded border-2 bg-eventra-slate-50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded border-2 bg-eventra-red-100 border-eventra-red-300" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Held for 24 hours once confirmed</span>
        </div>
      </div>
    </div>
  )
}

function FlightDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-[360px] bg-eventra-navy-900" />
      <div className="section-container py-6 -mt-6 relative z-10">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-1">
            <CardSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}

function FlightNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-eventra-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
          <Plane className="w-12 h-12 text-eventra-slate-400" />
        </div>
        <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">Flight not found</h2>
        <p className="text-eventra-slate-600 mb-6">
          The flight you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={onBack} leftIcon={<ChevronLeft className="w-5 h-5" />}>
          Back to flights
        </Button>
      </motion.div>
    </div>
  )
}
