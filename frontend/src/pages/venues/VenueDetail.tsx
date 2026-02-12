import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, MapPin, Star, Shield, CheckCircle2, Heart, Share2, Calendar, Users, Clock, Building2, Utensils, Sparkles, Image, Video, Music, Volume2, Lightbulb, Truck, Crown } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { CardSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/store/cart'
import { useAuth } from '@/hooks/useAuth'

interface VenueDetailData {
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
  facilities: string[]
  policies: {
    decoration: string
    vendor: string
    noise: string
    alcohol: string
    catering: string
  }
  capacity: number
  capacity_breakdown: {
    theater: number
    banquet: number
    classroom: number
    boardroom: number
    u_shape: number
    cocktail: number
  }
  venue_types: string[]
  has_parking: boolean
  parking_capacity: number
  has_catering: boolean
  has_av: boolean
  has_stage: boolean
  has_green_room: boolean
  has_bride_groom_room: boolean
  allows_external_catering: boolean
  allows_external_decor: boolean
  allows_alcohol: boolean
  earliest_event_time: string
  latest_event_time: string
  rating: number
  review_count: number
  venue_rooms: VenueRoom[]
  venue_packages: VenuePackage[]
  venue_addons: VenueAddon[]
  venue_availability: VenueAvailability[]
  check_in: string
  check_out: string
}

interface VenueRoom {
  id: string
  name: string
  description: string
  capacity_theater: number
  capacity_banquet: number
  capacity_classroom: number
  capacity_boardroom: number
  capacity_u_shape: number
  capacity_cocktail: number
  area_sqm: number
  ceiling_height: number
  has_ac: boolean
  has_stage: boolean
  has_projector: boolean
  has_sound_system: boolean
  has_wifi: boolean
  amenities: string[]
  images: string[]
  is_active: boolean
}

interface VenuePackage {
  id: string
  name: string
  slug: string
  type: 'basic' | 'standard' | 'premium' | 'custom'
  description: string
  includes: string[]
  excludes: string[]
  min_guests: number
  max_guests: number
  price_per_guest: number
  fixed_price: number
  price_per_hour: number
  currency: string
  menu_options: any[]
  decor_options: any[]
  av_options: any[]
  is_active: boolean
}

interface VenueAddon {
  id: string
  name: string
  slug: string
  category: 'catering' | 'decor' | 'photography' | 'videography' | 'entertainment' | 'av' | 'lighting' | 'security' | 'transport' | 'staff' | 'other'
  description: string
  pricing_type: 'per_guest' | 'per_hour' | 'fixed' | 'per_unit'
  price: number
  currency: string
  min_quantity: number
  max_quantity: number
  options: any[]
  images: string[]
  is_required: boolean
  is_active: boolean
}

interface VenueAvailability {
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'booked' | 'blocked' | 'maintenance'
  price_override: number
}

function AddonCategoryIcon({ category, size = 'md' }: { category: VenueAddon['category']; size?: 'sm' | 'md' }) {
  const iconClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  switch (category) {
    case 'catering': return <Utensils className={`${iconClass} text-eventra-blue-600`} />
    case 'decor': return <Sparkles className={`${iconClass} text-eventra-amber-600`} />
    case 'photography': return <Image className={`${iconClass} text-eventra-teal-600`} />
    case 'videography': return <Video className={`${iconClass} text-eventra-red-600`} />
    case 'entertainment': return <Music className={`${iconClass} text-eventra-amber-600`} />
    case 'av': return <Volume2 className={`${iconClass} text-eventra-cyan-600`} />
    case 'lighting': return <Lightbulb className={`${iconClass} text-eventra-amber-600`} />
    case 'security': return <Shield className={`${iconClass} text-eventra-green-600`} />
    case 'transport': return <Truck className={`${iconClass} text-eventra-navy-600`} />
    case 'staff': return <Users className={`${iconClass} text-eventra-blue-600`} />
    default: return <Sparkles className={`${iconClass} text-eventra-slate-600`} />
  }
}

export function VenueDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const eventDate = searchParams.get('event_date') || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const guestCount = parseInt(searchParams.get('guest_count') || '100')
  const eventType = searchParams.get('event_type') || 'Wedding'
  const duration = parseInt(searchParams.get('duration_hours') || '6')
  const [selectedPackage, setSelectedPackage] = useState<VenuePackage | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<VenueAddon[]>([])
  const [showPackageSelector, setShowPackageSelector] = useState(false)
  const [showAddonSelector, setShowAddonSelector] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['venue', id, eventDate, guestCount],
    queryFn: async () => {
      const body = await api.get<any>(`/venues/${id}`, {
        params: {
          event_date: eventDate,
          guest_count: guestCount,
          duration_hours: duration,
          event_type: eventType
        }
      })
      return body
    },
    enabled: !!id,
  })

  const venue = data?.data

  // Auto-select first available package (kept above early returns to preserve hook order)
  useEffect(() => {
    const pkgs: VenuePackage[] = Array.isArray(venue?.venue_packages)
      ? venue.venue_packages.filter((p: VenuePackage) => p.is_active)
      : []
    if (pkgs.length > 0 && !selectedPackage) {
      setSelectedPackage(pkgs[0])
    }
  }, [venue, selectedPackage])

  if (isLoading) return <VenueDetailSkeleton />
  if (isError || !venue) return <VenueNotFound onBack={() => navigate('/venues')} />

  const availablePackages: VenuePackage[] = Array.isArray(venue.venue_packages)
    ? venue.venue_packages.filter((p: VenuePackage) => p.is_active)
    : []
  const availableAddons: VenueAddon[] = Array.isArray(venue.venue_addons)
    ? venue.venue_addons.filter((a: VenueAddon) => a.is_active)
    : []

  const images: string[] = Array.isArray(venue.images) ? venue.images : []
  const venueTypes: string[] = Array.isArray(venue.venue_types) ? venue.venue_types : []
  const amenities: string[] = Array.isArray(venue.amenities) ? venue.amenities : []
  const facilities: string[] = Array.isArray(venue.facilities) ? venue.facilities : []
  const capacityBreakdown = venue.capacity_breakdown || ({} as VenueDetailData['capacity_breakdown'])
  const policies = venue.policies || ({} as VenueDetailData['policies'])
  const rating = typeof venue.rating === 'number' ? venue.rating : 0
  const reviewCount = venue.review_count ?? 0

  const isDateAvailable = Array.isArray(venue.venue_availability) && venue.venue_availability.length > 0
    ? venue.venue_availability.some(
        (a: VenueAvailability) => a.date === eventDate && a.status === 'available'
      )
    : true

  const calculateTotal = () => {
    let total = 0
    if (selectedPackage) {
      if (selectedPackage.price_per_guest) {
        total += selectedPackage.price_per_guest * guestCount
      } else if (selectedPackage.fixed_price) {
        total += selectedPackage.fixed_price
      } else if (selectedPackage.price_per_hour) {
        total += selectedPackage.price_per_hour * duration
      }
    }
    selectedAddons.forEach(addon => {
      if (addon.pricing_type === 'per_guest') {
        total += addon.price * guestCount
      } else if (addon.pricing_type === 'per_hour') {
        total += addon.price * duration
      } else if (addon.pricing_type === 'fixed') {
        total += addon.price
      } else if (addon.pricing_type === 'per_unit') {
        total += addon.price // quantity would be 1 by default
      }
    })
    return total
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book')
      navigate('/login', { state: { from: `/venues/${id}` } })
      return
    }

    if (!isDateAvailable) {
      toast.error('Venue not available on selected date')
      return
    }

    if (!selectedPackage) {
      toast.error('Please select a package')
      return
    }

    if (guestCount < selectedPackage.min_guests || (selectedPackage.max_guests && guestCount > selectedPackage.max_guests)) {
      toast.error(`Guest count must be between ${selectedPackage.min_guests} and ${selectedPackage.max_guests || 'unlimited'}`)
      return
    }

    const total = calculateTotal()

    addItem({
      type: 'venue',
      serviceId: venue.id,
      providerName: 'EventraOS',
      name: venue.name,
      description: venue.description,
      image: images[0],
      location: {
        city: venue.location?.city ?? '',
        country: venue.location?.country ?? '',
        address: venue.location?.address,
      },
      dates: { start: eventDate, end: eventDate },
      guests: { adults: guestCount, children: 0 },
      options: [
        {
          id: `package-${selectedPackage.id}`,
          name: selectedPackage.name,
          type: 'other' as const,
          price: total,
          currency: selectedPackage.currency,
          quantity: 1,
        },
        ...selectedAddons.map(addon => ({
          id: `addon-${addon.id}`,
          name: addon.name,
          type: 'addon' as const,
          price: addon.pricing_type === 'per_guest' ? addon.price * guestCount :
                 addon.pricing_type === 'per_hour' ? addon.price * duration : addon.price,
          currency: addon.currency,
          quantity: 1,
        }))
      ],
      pricing: {
        basePrice: total,
        taxes: 0,
        fees: 0,
        serviceFee: 0,
        discount: 0,
        optionsTotal: 0,
        total,
        currency: selectedPackage.currency,
        breakdown: [],
      },
      availability: {
        available: isDateAvailable,
        quantity: 1,
      },
      cancellationPolicy: 'Venue cancellation policy applies',
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
          {images.length > 0 ? (
            <>
              <img
                src={images[imageIndex]}
                alt={venue.name}
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
          <Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm" onClick={() => navigate('/venues')}>
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
          <span className="badge badge-primary">★ {rating.toFixed(1)}</span>
          <span className="badge badge-neutral">({reviewCount} reviews)</span>
          {venueTypes.slice(0, 2).map((type, i) => (
            <span key={i} className="badge badge-neutral">{type}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="section-container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Header */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {venueTypes.map((type, i) => (
                  <Badge key={i} variant="primary">{type}</Badge>
                ))}
              </div>
              <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">{venue.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-eventra-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-5 h-5" />
                  {venue.location?.address}, {venue.location?.city}, {venue.location?.country}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-eventra-amber-500 text-eventra-amber-500" />
                  {rating.toFixed(1)} ({reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  Capacity: {venue.capacity ?? '—'}
                </span>
              </div>
            </div>

            {/* Package Selector */}
            {selectedPackage && (
              <Card variant="elevated" padding="lg">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900">{selectedPackage.name} Package</h3>
                    <p className="text-eventra-slate-600 mt-1">{selectedPackage.description}</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowPackageSelector(true)}>
                    Change Package
                  </Button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-eventra-slate-50 rounded-xl">
                    <Users className="w-6 h-6 text-eventra-navy-600" />
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Guests</p>
                      <p className="font-medium text-eventra-navy-900">{guestCount} guests</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-eventra-slate-50 rounded-xl">
                    <Clock className="w-6 h-6 text-eventra-navy-600" />
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Duration</p>
                      <p className="font-medium text-eventra-navy-900">{duration} hours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-eventra-slate-50 rounded-xl">
                    <Calendar className="w-6 h-6 text-eventra-navy-600" />
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Event Date</p>
                      <p className="font-medium text-eventra-navy-900">{formatDate(eventDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Package Inclusions */}
                <div className="border-t border-eventra-slate-200 pt-4 mb-4">
                  <h4 className="text-body-sm font-medium text-eventra-navy-900 mb-3">Includes</h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {selectedPackage.includes.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-body-sm text-eventra-navy-700">
                        <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add-ons */}
                {selectedAddons.length > 0 && (
                  <div className="border-t border-eventra-slate-200 pt-4 mb-4">
                    <h4 className="text-body-sm font-medium text-eventra-navy-900 mb-3">Selected Add-ons</h4>
                    <div className="space-y-2">
                      {selectedAddons.map((addon) => (
                        <div key={addon.id} className="flex items-center justify-between p-3 bg-eventra-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-eventra-blue-100 flex items-center justify-center">
                              <AddonCategoryIcon category={addon.category} size="sm" />
                            </div>
                            <div>
                              <p className="font-medium text-eventra-navy-900 text-sm">{addon.name}</p>
                              <p className="text-body-xs text-eventra-slate-500 capitalize">{addon.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-eventra-navy-900">
                              {addon.pricing_type === 'per_guest' ? formatCurrency(addon.price * guestCount, addon.currency) :
                               addon.pricing_type === 'per_hour' ? formatCurrency(addon.price * duration, addon.currency) :
                               formatCurrency(addon.price, addon.currency)}
                            </p>
                            <button
                              onClick={() => setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id))}
                              className="text-body-xs text-eventra-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Description */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4">About this venue</h3>
              <p className="text-body-md text-eventra-slate-600 leading-relaxed">{venue.description}</p>
            </Card>

            {/* Facilities */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-eventra-navy-600" />
                Facilities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {facilities.map((facility) => (
                  <div key={facility} className="flex items-center gap-2 text-body-sm text-eventra-navy-700">
                    <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                    {facility}
                  </div>
                ))}
              </div>
            </Card>

            {/* Amenities */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-eventra-navy-600" />
                Amenities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-body-sm text-eventra-navy-700">
                    <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                    {amenity}
                  </div>
                ))}
              </div>
            </Card>

            {/* Capacity Configurations */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-eventra-navy-600" />
                Capacity Configurations
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-eventra-slate-200">
                      <th className="pb-2 text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Layout</th>
                      <th className="pb-2 text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider text-right">Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capacityBreakdown.theater > 0 && (
                      <tr className="border-b border-eventra-slate-100 py-3">
                        <td className="text-body-sm text-eventra-navy-700">Theater</td>
                        <td className="text-body-sm font-medium text-eventra-navy-900 text-right">{capacityBreakdown.theater}</td>
                      </tr>
                    )}
                    {capacityBreakdown.banquet > 0 && (
                      <tr className="border-b border-eventra-slate-100 py-3">
                        <td className="text-body-sm text-eventra-navy-700">Banquet</td>
                        <td className="text-body-sm font-medium text-eventra-navy-900 text-right">{capacityBreakdown.banquet}</td>
                      </tr>
                    )}
                    {capacityBreakdown.classroom > 0 && (
                      <tr className="border-b border-eventra-slate-100 py-3">
                        <td className="text-body-sm text-eventra-navy-700">Classroom</td>
                        <td className="text-body-sm font-medium text-eventra-navy-900 text-right">{capacityBreakdown.classroom}</td>
                      </tr>
                    )}
                    {capacityBreakdown.boardroom > 0 && (
                      <tr className="border-b border-eventra-slate-100 py-3">
                        <td className="text-body-sm text-eventra-navy-700">Boardroom</td>
                        <td className="text-body-sm font-medium text-eventra-navy-900 text-right">{capacityBreakdown.boardroom}</td>
                      </tr>
                    )}
                    {capacityBreakdown.u_shape > 0 && (
                      <tr className="border-b border-eventra-slate-100 py-3">
                        <td className="text-body-sm text-eventra-navy-700">U-Shape</td>
                        <td className="text-body-sm font-medium text-eventra-navy-900 text-right">{capacityBreakdown.u_shape}</td>
                      </tr>
                    )}
                    {capacityBreakdown.cocktail > 0 && (
                      <tr className="py-3">
                        <td className="text-body-sm text-eventra-navy-700">Cocktail</td>
                        <td className="text-body-sm font-medium text-eventra-navy-900 text-right">{capacityBreakdown.cocktail}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Policies */}
            <Card variant="outlined" padding="lg">
              <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-eventra-navy-600" />
                Policies
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Decoration</p>
                  <p className="font-medium text-eventra-navy-900">{policies.decoration || '—'}</p>
                </div>
                <div>
                  <p className="text-body-xs text-eventra-slate-500">External Vendors</p>
                  <p className="font-medium text-eventra-navy-900">{policies.vendor || '—'}</p>
                </div>
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Noise Policy</p>
                  <p className="font-medium text-eventra-navy-900">{policies.noise || '—'}</p>
                </div>
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Alcohol</p>
                  <p className="font-medium text-eventra-navy-900">{policies.alcohol || '—'}</p>
                </div>
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Catering</p>
                  <p className="font-medium text-eventra-navy-900">{policies.catering || '—'}</p>
                </div>
                <div>
                  <p className="text-body-xs text-eventra-slate-500">External Catering</p>
                  <p className="font-medium text-eventra-navy-900">{venue.allows_external_catering ? 'Allowed' : 'Not Allowed'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated" padding="lg" className="sticky top-24 h-fit">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">Event Date</span>
                  <span className="text-body-sm text-eventra-slate-600">{formatDate(eventDate)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">Guests</span>
                  <span className="text-body-sm text-eventra-slate-600">{guestCount}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">Duration</span>
                  <span className="text-body-sm text-eventra-slate-600">{duration} hours</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="price-xl text-eventra-navy-900">
                    {selectedPackage ? formatCurrency(calculateTotal(), selectedPackage.currency) : 'Select a package'}
                  </span>
                  {selectedPackage && <span className="text-body-sm text-eventra-slate-500">total</span>}
                </div>
              </div>

              {selectedPackage ? (
                <>
                  <div className="space-y-3 mb-6 p-4 bg-eventra-slate-50 rounded-xl">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-eventra-slate-600">{selectedPackage.name} Package</span>
                      <span className="text-eventra-navy-900">{formatCurrency(
                        selectedPackage.price_per_guest ? selectedPackage.price_per_guest * guestCount :
                        selectedPackage.fixed_price ? selectedPackage.fixed_price :
                        selectedPackage.price_per_hour ? selectedPackage.price_per_hour * duration : 0,
                        selectedPackage.currency
                      )}</span>
                    </div>
                    {selectedAddons.length > 0 && (
                      <>
                        <div className="border-t border-eventra-slate-200 pt-2 space-y-1">
                          {selectedAddons.map((addon) => (
                            <div key={addon.id} className="flex justify-between text-body-sm">
                              <span className="text-eventra-slate-600">{addon.name}</span>
                              <span className="text-eventra-navy-900">{formatCurrency(
                                addon.pricing_type === 'per_guest' ? addon.price * guestCount :
                                addon.pricing_type === 'per_hour' ? addon.price * duration :
                                addon.price,
                                addon.currency
                              )}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="border-t border-eventra-slate-200 pt-2 flex justify-between font-semibold">
                      <span className="text-eventra-navy-900">Total</span>
                      <span className="price-lg text-eventra-navy-900">{formatCurrency(calculateTotal(), selectedPackage.currency)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full btn-lg"
                    onClick={handleAddToCart}
                    disabled={!isDateAvailable}
                    leftIcon={<Sparkles className="w-5 h-5" />}
                  >
                    {isDateAvailable
                      ? `Reserve - ${formatCurrency(calculateTotal(), selectedPackage.currency)}`
                      : 'Not Available on this Date'}
                  </Button>

                  {!isDateAvailable && (
                    <p className="text-center text-body-xs text-eventra-red-600 mt-3">
                      Venue is not available on {formatDate(eventDate)}
                    </p>
                  )}

                  <p className="text-center text-body-xs text-eventra-slate-500 mt-3">
                    Pay 25% now, balance 30 days before event
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <Crown className="w-12 h-12 text-eventra-slate-300 mx-auto mb-3" />
                  <p className="text-eventra-slate-600">Select a package to see pricing</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-eventra-slate-200 space-y-3">
                <div className="flex items-center gap-3 text-body-sm text-eventra-slate-600">
                  <Shield className="w-5 h-5 text-eventra-green-600" />
                  <span>Free cancellation 30 days before</span>
                </div>
                <div className="flex items-center gap-3 text-body-sm text-eventra-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-eventra-blue-600" />
                  <span>Dedicated event coordinator</span>
                </div>
                <div className="flex items-center gap-3 text-body-sm text-eventra-slate-600">
                  <Crown className="w-5 h-5 text-eventra-amber-600" />
                  <span>Premium venues only</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Package Selector Modal */}
      <Modal
        isOpen={showPackageSelector}
        onClose={() => setShowPackageSelector(false)}
        title="Select Package"
        size="xl"
      >
        <div className="space-y-4">
          {availablePackages.map((pkg) => (
            <Card
              key={pkg.id}
              variant={selectedPackage?.id === pkg.id ? 'interactive' : 'outlined'}
              className="cursor-pointer"
              onClick={() => {
                setSelectedPackage(pkg)
                setShowPackageSelector(false)
              }}
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-eventra-navy-900">{pkg.name}</h4>
                  <p className="text-body-sm text-eventra-slate-600 mt-1">{pkg.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pkg.includes.slice(0, 3).map((item, i) => (
                      <Badge key={i} variant="neutral">{item}</Badge>
                    ))}
                    {pkg.includes.length > 3 && (
                      <Badge variant="neutral">+{pkg.includes.length - 3} more</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="price-md text-eventra-navy-900">
                    {pkg.price_per_guest ? formatCurrency(pkg.price_per_guest * guestCount, pkg.currency) :
                     pkg.fixed_price ? formatCurrency(pkg.fixed_price, pkg.currency) :
                     pkg.price_per_hour ? formatCurrency(pkg.price_per_hour * duration, pkg.currency) : 'Custom'}
                  </p>
                  <p className="text-body-xs text-eventra-slate-500">Estimated total</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Add-on Selector Modal */}
      <Modal
        isOpen={showAddonSelector}
        onClose={() => setShowAddonSelector(false)}
        title="Add Services"
        size="xl"
      >
        <div className="space-y-4">
          {availableAddons.map((addon) => {
            const isSelected = selectedAddons.some(a => a.id === addon.id)
            return (
              <Card
                key={addon.id}
                variant={isSelected ? 'interactive' : 'outlined'}
                className="cursor-pointer"
                onClick={() => {
                  if (isSelected) {
                    setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id))
                  } else {
                    setSelectedAddons([...selectedAddons, addon])
                  }
                }}
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-eventra-blue-100 flex items-center justify-center flex-shrink-0">
                    <AddonCategoryIcon category={addon.category} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-eventra-navy-900">{addon.name}</h4>
                    <p className="text-body-sm text-eventra-slate-600 mt-1">{addon.description}</p>
                    <span className="badge badge-neutral capitalize">{addon.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="price-md text-eventra-navy-900">
                      {addon.pricing_type === 'per_guest' ? formatCurrency(addon.price * guestCount, addon.currency) :
                       addon.pricing_type === 'per_hour' ? formatCurrency(addon.price * duration, addon.currency) :
                       formatCurrency(addon.price, addon.currency)}
                    </p>
                    <p className="text-body-xs text-eventra-slate-500">Total</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

function VenueDetailSkeleton() {
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

function VenueNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-eventra-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-12 h-12 text-eventra-slate-400" />
        </div>
        <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">Venue not found</h2>
        <p className="text-eventra-slate-600 mb-6">The venue you're looking for doesn't exist or has been removed.</p>
        <Button onClick={onBack} leftIcon={<ChevronLeft className="w-5 h-5" />}>
          Back to venues
        </Button>
      </motion.div>
    </div>
  )
}
