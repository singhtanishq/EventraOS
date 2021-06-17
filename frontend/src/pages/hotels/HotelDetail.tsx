import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, X, MapPin, Star, Shield, CheckCircle2, Loader2, Heart, Share2, Download, Calendar, Users, Bed, Utensils, Wifi, Car, Waves, Dumbbell, Coffee, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PageSkeleton, CardSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useAuth } from '@/hooks/useAuth'

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
  rating_breakdown: {
    cleanliness: number
    location: number
    service: number
    value: number
  }
  metadata: {
    star_rating: number
    property_type: string
  }
  room_types: RoomType[]
  check_in: string
  check_out: string
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
    cancellation_policy: string
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
  const checkIn = searchParams.get('check_in') || new Date().toISOString().split('T')[0]
  const checkOut = searchParams.get('check_out') || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
  const [selectedRate, setSelectedRate] = useState<CancellationPolicy | null>(null)
  const [showRoomSelector, setShowRoomSelector] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['hotel', id, checkIn, checkOut],
    queryFn: async () => {
      const response = await api.get(`/hotels/${id}`, {
        params: { check_in: checkIn, check_out: checkOut }
      })
      return response.data
    },
    enabled: !!id,
  })

  const hotel = data?.data
  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))

  if (isLoading) return <HotelDetailSkeleton />
  if (isError || !hotel) return <HotelNotFound onBack={() => navigate(-1)} />

  const availableRooms = hotel.room_types.filter(r => r.availability.available)
  
  // Auto-select first available room
  useEffect(() => {
    if (availableRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(availableRooms[0])
      setSelectedRate(availableRooms[0].cancellation_policies[0] || null)
    }
  }, [availableRooms])

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book')
      navigate('/login', { state: { from: `/hotels/${id}` } })
      return
    }

    if (!selectedRoom || !selectedRate) {
      toast.error('Please select a room and rate')
      return
    }

    const itemId = addItem({
      type: 'hotel',
      serviceId: hotel.id,
      providerId: hotel.metadata?.provider_id,
      providerName: 'EventraOS Demo',
      name: hotel.name,
      description: hotel.description,
      image: hotel.images[0],
      location: hotel.location,
      dates: { start: checkIn, end: checkOut },
      guests: { adults: 2, children: 0 },
      options: [
        {
          id: `room-${selectedRoom.id}`,
          name: `${selectedRoom.name} - ${selectedRate.name}`,
          type: 'room',
          price: selectedRoom.pricing.total,
          currency: selectedRoom.pricing.currency,
          quantity: 1,
        }
      ],
      pricing: {
        basePrice: selectedRoom.pricing.base_price,
        taxes: 0,
        fees: 0,
        serviceFee: 0,
        discount: 0,
        optionsTotal: 0,
        total: selectedRoom.pricing.total,
        currency: selectedRoom.pricing.currency,
        breakdown: [],
      },
      availability: {
        available: true,
        quantity: selectedRoom.availability.rooms_available,
      },
      cancellationPolicy: selectedRate.cancellation_policy?.cancellation_policy_text || selectedRate.cancellation_policy,
    })

    toast.success('Added to cart')
    navigate('/checkout')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Image Gallery */}
      <div className="relative h-[500px] sm:h-[600px]">
        <motion.div
          className="w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {hotel.images.length > 0 ? (
            <>
              <img
                src={hotel.images[imageIndex]}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
              {hotel.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex((imageIndex - 1 + hotel.images.length) % hotel.images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-eventra-navy-900 hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setImageIndex((imageIndex + 1) % hotel.images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-eventra-navy-900 hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {hotel.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImageIndex(i)}
                        className={cn(
                          'w-2.5 h-2.5 rounded-full transition-all',
                          i === imageIndex
                            ? 'bg-white'
                            : 'bg-white/50 hover:bg-white/75'
                        )}
                        aria-label={`View image ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-eventra-slate-100 flex items-center justify-center">
              <span className="text-eventra-slate-500">No images available</span>
            </div>
          )}
        </motion.div>

        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm" onClick={() => toast('Share coming soon')}>
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm">
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {hotel.metadata.star_rating && (
            <span className="badge px-3 py-1 bg-eventra-amber-500 text-white">
              {'★'.repeat(hotel.metadata.star_rating)} {hotel.metadata.star_rating}
            </span>
          )}
          <span className="badge badge-primary">★ {hotel.rating.toFixed(1)}</span>
          <span className="badge badge-neutral">({hotel.review_count} reviews)</span>
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
                  {hotel.location.address}, {hotel.location.city}, {hotel.location.country}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-eventra-amber-500 text-eventra-amber-500" />
                  {hotel.rating.toFixed(1)} ({hotel.review_count} reviews)
                </span>
              </div>
            </div>

            {/* Room Selector */}
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
                    <Bed className="w-6 h-6 text-eventra-navy-600" />
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Max Occupancy</p>
                      <p className="font-medium text-eventra-navy-900">{selectedRoom.max_occupancy} guests</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-eventra-slate-50 rounded-xl">
                    <Utensils className="w-6 h-6 text-eventra-navy-600" />
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Meal Plan</p>
                      <p className="font-medium text-eventra-navy-900 capitalize">{selectedRate.meal_plan.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-eventra-slate-50 rounded-xl">
                    {selectedRate.is_refundable ? (
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
                <div className="border-t border-eventra-slate-200 pt-4">
                  <h4 className="text-body-sm font-medium text-eventra-navy-900 mb-3">Select Rate</h4>
                  <div className="space-y-2">
                    {selectedRoom.cancellation_policies.map((rate) => (
                      <label
                        key={rate.rate_id}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all',
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
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-eventra-navy-900">{rate.name}</span>
                            <span className="badge badge-neutral capitalize">{rate.meal_plan.replace('_', ' ')}</span>
                            {rate.is_refundable && <span className="badge badge-success">Free cancellation</span>}
                          </div>
                          <p className="text-body-xs text-eventra-slate-500 mt-1">{rate.cancellation_policy?.cancellation_policy_text || 'Standard cancellation policy'}</p>
                        </div>
                        <div className="text-right">
                          <p className="price-md text-eventra-navy-900">{formatCurrency(selectedRoom.pricing.total, selectedRoom.pricing.currency)}</p>
                          <p className="text-body-xs text-eventra-slate-500">Total for {nights} nights</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Description */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4">About this property</h3>
              <p className="text-body-md text-eventra-slate-600 leading-relaxed">{hotel.description}</p>
            </Card>

            {/* Amenities */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hotel.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-body-sm text-eventra-navy-700">
                    <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                    {amenity}
                  </div>
                ))}
              </div>
            </Card>

            {/* Policies */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4">Policies</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Check-in</p>
                  <p className="font-medium text-eventra-navy-900">{hotel.policies.check_in}</p>
                </div>
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Check-out</p>
                  <p className="font-medium text-eventra-navy-900">{hotel.policies.check_out}</p>
                </div>
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Children</p>
                  <p className="font-medium text-eventra-navy-900">{hotel.policies.children}</p>
                </div>
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Pets</p>
                  <p className="font-medium text-eventra-navy-900">{hotel.policies.pets}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" padding="lg" className="sticky top-24 h-fit">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">{nights} nights</span>
                  <span className="text-body-sm text-eventra-slate-600">{formatDate(checkIn)} - {formatDate(checkOut)}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="price-xl text-eventra-navy-900">
                    {selectedRoom ? formatCurrency(selectedRoom.pricing.total, selectedRoom.pricing.currency) : 'Select a room'}
                  </span>
                  {selectedRoom && <span className="text-body-sm text-eventra-slate-500">total</span>}
                </div>
              </div>

              {selectedRoom ? (
                <>
                  <div className="space-y-3 mb-6 p-4 bg-eventra-slate-50 rounded-xl">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-eventra-slate-600">Room price ({nights} nights)</span>
                      <span className="text-eventra-navy-900">{formatCurrency(selectedRoom.pricing.per_night * nights, selectedRoom.pricing.currency)}</span>
                    </div>
                    <div className="flex justify-between text-body-sm">
                      <span className="text-eventra-slate-600">Taxes & fees</span>
                      <span className="text-eventra-navy-900">{formatCurrency(selectedRoom.pricing.total - selectedRoom.pricing.per_night * nights, selectedRoom.pricing.currency)}</span>
                    </div>
                    <div className="border-t border-eventra-slate-200 pt-2 flex justify-between font-semibold">
                      <span className="text-eventra-navy-900">Total</span>
                      <span className="price-lg text-eventra-navy-900">{formatCurrency(selectedRoom.pricing.total, selectedRoom.pricing.currency)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full btn-lg"
                    onClick={handleAddToCart}
                    leftIcon={<Sparkles className="w-5 h-5" />}
                  >
                    Reserve - {formatCurrency(selectedRoom.pricing.total, selectedRoom.pricing.currency)}
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
          {hotel.room_types.map((room) => (
            <Card
              key={room.id}
              variant={selectedRoom?.id === room.id ? 'interactive' : 'outlined'}
              className="cursor-pointer"
              onClick={() => {
                setSelectedRoom(room)
                setSelectedRate(room.cancellation_policies[0] || null)
                setShowRoomSelector(false)
              }}
            >
              <div className="flex gap-4">
                <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={room.images[0] || hotel.images[0] || '/placeholder-room.jpg'} alt={room.name} className="w-full h-full object-cover" />
                  {!room.availability.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="badge badge-danger">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-eventra-navy-900">{room.name}</h4>
                  <p className="text-body-sm text-eventra-slate-600 mt-1">{room.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {room.bed_configuration.map((bed, i) => (
                      <Badge key={i} className="badge-neutral">{bed.count}x {bed.type.replace('_', ' ')}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="price-md text-eventra-navy-900">{formatCurrency(room.pricing.total, room.pricing.currency)}</p>
                  <p className="text-body-xs text-eventra-slate-500">Total for {nights} nights</p>
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
      <div className="h-[500px] bg-eventra-slate-100" />
      <div className="section-container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
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
        <p className="text-eventra-slate-600 mb-6">The hotel you're looking for doesn't exist or has been removed.</p>
        <Button onClick={onBack} leftIcon={<ChevronLeft className="w-5 h-5" />}>
          Back to search
        </Button>
      </motion.div>
    </div>
  )
}