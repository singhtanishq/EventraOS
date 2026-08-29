import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, X, MapPin, Star, Shield, CheckCircle2, Heart, Share2, Calendar, Users, BedDouble, Utensils, Sparkles, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { CardSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useAuth } from '@/hooks/useAuth'

const addDaysISO = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const FALLBACK_HOTEL_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80'
const FALLBACK_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=400&q=60'

interface HotelDetailData {
  id: string
  name: string
  description: string
  images: string[]
  location: {
    address: string
    city: string
    country: string
    latitude: number
    longitude: number
  }
  amenities: string[]
  policies: {
    check_in: string
    check_out: string
    children: string
    pets: string
    cancellation: string
  }
  rating: number
  review_count: number
  metadata: {
    star_rating: number
    property_type: string
  }
  room_types: RoomType[]
}

interface RoomType {
  id: string
  name: string
  description: string
  max_occupancy: number
  bed_configuration: { type: string; count: number }[]
  amenities: string[]
  images: string[]
  pricing: {
    base_price: number
    currency: string
    per_night: number
    total: number
    meal_plan: string
    is_refundable: boolean
  }
  availability: {
    available: boolean
    rooms_available: number
  }
  cancellation_policies: CancellationPolicy[]
}

interface CancellationPolicy {
  rate_id: string
  name: string
  meal_plan: string
  is_refundable: boolean
  cancellation_policy: {
    free_cancellation: boolean
    free_cancellation_hours: number
    cancellation_deadline_hours: number
    refund_percent: number
  }
}

export function HotelDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const checkIn = searchParams.get('check_in') || addDaysISO(7)
  const checkOut = searchParams.get('check_out') || addDaysISO(10)
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
  const [selectedRate, setSelectedRate] = useState<CancellationPolicy | null>(null)
  const [showRoomSelector, setShowRoomSelector] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['hotel', id, checkIn, checkOut],
    queryFn: async () => {
      const body = await api.get<any>(`/hotels/${id}`, {
        params: { check_in: checkIn, check_out: checkOut }
      })
      return body
    },
    enabled: !!id,
  })

  const hotel = data?.data as HotelDetailData | undefined
  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  )

  // Auto-select first available room (kept above early returns to preserve hook order)
  useEffect(() => {
    const roomTypes: RoomType[] = Array.isArray(hotel?.room_types) ? hotel.room_types : []
    const available = roomTypes.filter((room) => room.availability?.available)
    if (available.length > 0 && !selectedRoom) {
      setSelectedRoom(available[0])
      setSelectedRate(available[0].cancellation_policies?.[0] || null)
    }
  }, [hotel, selectedRoom])

  if (isLoading) return <HotelDetailSkeleton />
  if (isError || !hotel) return <HotelNotFound onBack={() => navigate('/hotels')} />

  const roomTypes: RoomType[] = Array.isArray(hotel.room_types) ? hotel.room_types : []
  const images: string[] = Array.isArray(hotel.images) ? hotel.images : []
  const amenities: string[] = Array.isArray(hotel.amenities) ? hotel.amenities : []
  const rating = typeof hotel.rating === 'number' ? hotel.rating : 0
  const reviewCount = hotel.review_count ?? 0
  const starRating = hotel.metadata?.star_rating ?? 0
  const policies = hotel.policies || {} as HotelDetailData['policies']
  const currentImage = images[imageIndex] || FALLBACK_HOTEL_IMAGE

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book')
      navigate('/login', { state: { from: `/hotels/${id}` } })
      return
    }

    if (!selectedRoom) {
      toast.error('Please select a room')
      return
    }

    addItem({
      type: 'hotel',
      serviceId: hotel.id || id || '',
      providerName: 'EventraOS',
      name: hotel.name,
      description: hotel.description,
      image: images[0] || FALLBACK_HOTEL_IMAGE,
      location: {
        city: hotel.location?.city ?? '',
        country: hotel.location?.country ?? '',
        address: hotel.location?.address,
      },
      dates: { start: checkIn, end: checkOut },
      guests: { adults: 2, children: 0 },
      options: [],
      pricing: {
        basePrice: selectedRoom.pricing?.total ?? 0,
        taxes: 0,
        fees: 0,
        serviceFee: 0,
        discount: 0,
        optionsTotal: 0,
        total: selectedRoom.pricing?.total ?? 0,
        currency: selectedRoom.pricing?.currency ?? 'INR',
        breakdown: [],
      },
      availability: {
        available: true,
        quantity: selectedRoom.availability?.rooms_available,
      },
      cancellationPolicy: selectedRate
        ? selectedRate.is_refundable ? 'Free cancellation' : 'Non-refundable'
        : 'Standard cancellation policy',
      metadata: {
        room: selectedRoom.name,
        rate: selectedRate?.name,
        meal_plan: selectedRate?.meal_plan,
        nights,
      },
    })

    toast.success('Added to cart')
    navigate('/checkout')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Image Gallery */}
      <div className="relative h-[420px] sm:h-[560px] bg-eventra-slate-100">
        <motion.div
          className="w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <img
            src={currentImage}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-eventra-navy-900 hover:bg-white transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setImageIndex((imageIndex + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-eventra-navy-900 hover:bg-white transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all',
                      i === imageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                    )}
                    aria-label={`View image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm" onClick={() => navigate('/hotels')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm" onClick={() => toast('Sharing coming soon')}>
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm" onClick={() => toast('Saved to favorites')}>
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
          {starRating > 0 && (
            <span className="badge px-3 py-1 bg-eventra-amber-500 text-white">
              {'★'.repeat(Math.min(5, starRating))} {starRating}-star
            </span>
          )}
          <span className="badge badge-primary">★ {rating.toFixed(1)}</span>
          <span className="badge badge-neutral">({reviewCount} reviews)</span>
        </div>
      </div>

      {/* Content */}
      <div className="section-container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Header */}
            <div>
              <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">{hotel.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-eventra-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-5 h-5" />
                  {hotel.location?.address ? `${hotel.location.address}, ` : ''}
                  {hotel.location?.city}, {hotel.location?.country}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-eventra-amber-500 text-eventra-amber-500" />
                  {rating.toFixed(1)} ({reviewCount} reviews)
                </span>
                {hotel.metadata?.property_type && (
                  <span className="badge badge-neutral capitalize">{hotel.metadata.property_type}</span>
                )}
              </div>
            </div>

            {/* Selected Room */}
            {selectedRoom && (
              <Card variant="elevated" padding="lg">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900">{selectedRoom.name}</h3>
                    <p className="text-eventra-slate-600 mt-1">{selectedRoom.description}</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowRoomSelector(true)}>
                    Change Room
                  </Button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-eventra-slate-50 rounded-xl">
                    <BedDouble className="w-6 h-6 text-eventra-navy-600" />
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Max Occupancy</p>
                      <p className="font-medium text-eventra-navy-900">{selectedRoom.max_occupancy ?? 2} guests</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-eventra-slate-50 rounded-xl">
                    <Utensils className="w-6 h-6 text-eventra-navy-600" />
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Meal Plan</p>
                      <p className="font-medium text-eventra-navy-900 capitalize">
                        {(selectedRate?.meal_plan || selectedRoom.pricing?.meal_plan || 'room_only').replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-eventra-slate-50 rounded-xl">
                    {selectedRate?.is_refundable !== false ? (
                      <>
                        <Shield className="w-6 h-6 text-eventra-green-600" />
                        <div>
                          <p className="text-body-xs text-eventra-slate-500">Cancellation</p>
                          <p className="font-medium text-eventra-green-700">Free cancellation</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <X className="w-6 h-6 text-eventra-red-600" />
                        <div>
                          <p className="text-body-xs text-eventra-slate-500">Cancellation</p>
                          <p className="font-medium text-eventra-red-700">Non-refundable</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Rate Selector */}
                {selectedRoom.cancellation_policies && selectedRoom.cancellation_policies.length > 0 && (
                  <div className="border-t border-eventra-slate-200 pt-4">
                    <h4 className="text-body-sm font-medium text-eventra-navy-900 mb-3">Select Rate</h4>
                    <div className="space-y-2">
                      {selectedRoom.cancellation_policies.map((rate) => (
                        <label
                          key={rate.rate_id}
                          className={cn(
                            'flex items-center justify-between gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                            selectedRate?.rate_id === rate.rate_id
                              ? 'border-eventra-navy-900 bg-eventra-navy-50'
                              : 'border-eventra-slate-200 hover:border-eventra-slate-300'
                          )}
                        >
                          <input
                            type="radio"
                            name="rate"
                            checked={selectedRate?.rate_id === rate.rate_id}
                            onChange={() => setSelectedRate(rate)}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-medium text-eventra-navy-900">{rate.name}</span>
                              {rate.meal_plan && (
                                <span className="badge badge-neutral capitalize">{rate.meal_plan.replace('_', ' ')}</span>
                              )}
                              {rate.is_refundable && <span className="badge badge-success">Free cancellation</span>}
                            </div>
                            <p className="text-body-xs text-eventra-slate-500 mt-1">
                              {rate.cancellation_policy?.free_cancellation
                                ? `Free cancellation up to ${rate.cancellation_policy.free_cancellation_hours ?? 24}h before check-in`
                                : 'Standard cancellation policy'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="price-md text-eventra-navy-900">
                              {formatCurrency(selectedRoom.pricing?.total ?? 0, selectedRoom.pricing?.currency)}
                            </p>
                            <p className="text-body-xs text-eventra-slate-500">Total for {nights} {nights === 1 ? 'night' : 'nights'}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Description */}
            {hotel.description && (
              <Card variant="outlined" padding="lg">
                <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4">About this property</h3>
                <p className="text-body-md text-eventra-slate-600 leading-relaxed">{hotel.description}</p>
              </Card>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <Card variant="outlined" padding="lg">
                <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-body-sm text-eventra-navy-700">
                      <CheckCircle2 className="w-5 h-5 text-eventra-green-600 flex-shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Policies */}
            {policies && (policies.check_in || policies.check_out || policies.children || policies.pets) && (
              <Card variant="outlined" padding="lg">
                <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4">Policies</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {policies.check_in && (
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Check-in</p>
                      <p className="font-medium text-eventra-navy-900">{policies.check_in}</p>
                    </div>
                  )}
                  {policies.check_out && (
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Check-out</p>
                      <p className="font-medium text-eventra-navy-900">{policies.check_out}</p>
                    </div>
                  )}
                  {policies.children && (
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Children</p>
                      <p className="font-medium text-eventra-navy-900">{policies.children}</p>
                    </div>
                  )}
                  {policies.pets && (
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Pets</p>
                      <p className="font-medium text-eventra-navy-900">{policies.pets}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" padding="lg" className="sticky top-24 h-fit">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  <span className="text-body-sm text-eventra-slate-600">{formatDate(checkIn)} - {formatDate(checkOut)}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="price-lg text-eventra-navy-900">
                    {selectedRoom?.pricing
                      ? formatCurrency(selectedRoom.pricing.total, selectedRoom.pricing.currency)
                      : 'Select a room'}
                  </span>
                  {selectedRoom?.pricing && <span className="text-body-sm text-eventra-slate-500">total</span>}
                </div>
              </div>

              {selectedRoom?.pricing ? (
                <>
                  <div className="space-y-3 mb-6 p-4 bg-eventra-slate-50 rounded-xl">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-eventra-slate-600">Room price ({nights} {nights === 1 ? 'night' : 'nights'})</span>
                      <span className="text-eventra-navy-900">
                        {formatCurrency((selectedRoom.pricing.per_night ?? selectedRoom.pricing.total) * nights, selectedRoom.pricing.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-body-sm">
                      <span className="text-eventra-slate-600">Taxes & fees</span>
                      <span className="text-eventra-navy-900">
                        {formatCurrency(
                          Math.max(0, (selectedRoom.pricing.total ?? 0) - (selectedRoom.pricing.per_night ?? selectedRoom.pricing.total ?? 0) * nights),
                          selectedRoom.pricing.currency
                        )}
                      </span>
                    </div>
                    <div className="border-t border-eventra-slate-200 pt-2 flex justify-between font-semibold">
                      <span className="text-eventra-navy-900">Total</span>
                      <span className="price-lg text-eventra-navy-900">
                        {formatCurrency(selectedRoom.pricing.total, selectedRoom.pricing.currency)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleAddToCart}
                    leftIcon={<Sparkles className="w-5 h-5" />}
                  >
                    Reserve · {formatCurrency(selectedRoom.pricing.total, selectedRoom.pricing.currency)}
                  </Button>

                  <p className="text-center text-body-xs text-eventra-slate-500 mt-3">
                    No charge now. Free cancellation available.
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-eventra-slate-300 mx-auto mb-3" />
                  <p className="text-eventra-slate-600">Select a room to see pricing</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-eventra-slate-200 space-y-3">
                <div className="flex items-center gap-3 text-body-sm text-eventra-slate-600">
                  <Shield className="w-5 h-5 text-eventra-green-600" />
                  <span>Free cancellation on most rooms</span>
                </div>
                <div className="flex items-center gap-3 text-body-sm text-eventra-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-eventra-blue-600" />
                  <span>No booking fees</span>
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

      {/* Room Selector Modal */}
      <Modal
        isOpen={showRoomSelector}
        onClose={() => setShowRoomSelector(false)}
        title="Select Room"
        size="xl"
      >
        <div className="space-y-4">
          {roomTypes.length === 0 && (
            <p className="text-body-sm text-eventra-slate-500 text-center py-8">
              No room information available for this property.
            </p>
          )}
          {roomTypes.map((room) => (
            <Card
              key={room.id}
              variant={selectedRoom?.id === room.id ? 'interactive' : 'outlined'}
              className={cn('cursor-pointer', !room.availability?.available && 'opacity-75')}
              onClick={() => {
                if (!room.availability?.available) return
                setSelectedRoom(room)
                setSelectedRate(room.cancellation_policies?.[0] || null)
                setShowRoomSelector(false)
              }}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={room.images?.[0] || images[0] || FALLBACK_ROOM_IMAGE}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  {!room.availability?.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="badge badge-danger">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-eventra-navy-900">{room.name}</h4>
                  <p className="text-body-sm text-eventra-slate-600 mt-1 line-clamp-2">{room.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(room.bed_configuration || []).map((bed, i) => (
                      <span key={i} className="badge badge-neutral">
                        {bed.count}× {String(bed.type || 'Bed').replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right sm:text-right">
                  <p className="price-md text-eventra-navy-900">
                    {formatCurrency(room.pricing?.total ?? 0, room.pricing?.currency)}
                  </p>
                  <p className="text-body-xs text-eventra-slate-500">Total for {nights} {nights === 1 ? 'night' : 'nights'}</p>
                  <p className="text-body-xs text-eventra-slate-500 mt-1 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    {(room.pricing?.meal_plan || 'room only').replace('_', ' ')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function HotelDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-[420px] bg-eventra-slate-100" />
      <div className="section-container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
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

function HotelNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-eventra-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-12 h-12 text-eventra-slate-400" />
        </div>
        <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">Hotel not found</h2>
        <p className="text-eventra-slate-600 mb-6">
          The hotel you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={onBack} leftIcon={<ChevronLeft className="w-5 h-5" />}>
          Back to hotels
        </Button>
      </motion.div>
    </div>
  )
}
