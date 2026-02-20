import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, Grid, List, Map, BedDouble } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, debounce } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'

// check_in / check_out are required by the search API - default to +7 / +10 days
const addDaysISO = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const DEFAULT_HOTEL_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=60'

interface SearchParams {
  destination?: string
  city_id?: string
  check_in?: string
  check_out?: string
  rooms?: string
  adults?: string
  children?: string
  star_rating?: string
  price_min?: string
  price_max?: string
  amenities?: string[]
  sort?: string
  page?: number
  per_page?: number
}

interface HotelResult {
  id: string
  name: string
  type: string
  provider_code: string
  provider_item_id: string
  location: {
    city: string
    country: string
    address: string
    latitude: number
    longitude: number
  }
  pricing: {
    base_price: number
    currency: string
    per_night: number
    total_estimated: number
  }
  availability: {
    available: boolean
    rooms_available: number
  }
  images: string[]
  amenities: string[]
  metadata: {
    star_rating: number
    property_type: string
    rating: number
    review_count: number
  }
  rating: number
  review_count: number
}

export function HotelResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Partial<SearchParams>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('recommended')

  // Extract initial search params from URL
  useEffect(() => {
    const initialFilters: Partial<SearchParams> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'per_page') {
        (initialFilters as Record<string, string>)[key] = value
      }
    })
    setFilters(initialFilters)
    if (searchParams.get('sort')) setSortBy(searchParams.get('sort')!)
  }, [searchParams])

  // check_in / check_out are required by the API - default when missing
  const checkIn = filters.check_in || searchParams.get('check_in') || addDaysISO(7)
  const checkOut = filters.check_out || searchParams.get('check_out') || addDaysISO(10)

  const queryParams = {
    ...filters,
    check_in: checkIn,
    check_out: checkOut,
    sort: sortBy,
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 20,
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hotels', queryParams],
    queryFn: async () => {
      const body = await api.get<any>('/search/hotels', { params: queryParams })
      return body
    },
    placeholderData: (previousData) => previousData,
  })

  const hotels: HotelResult[] = data?.data?.results ?? []
  const totalCount = data?.data?.total_count ?? 0
  const hasErrors = data?.data?.has_errors ?? false

  const handleSearch = (newFilters: Partial<SearchParams>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
          params.delete(key)
          value.forEach(v => params.append(key, v))
        } else {
          params.set(key, String(value))
        }
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1')
    setSearchParams(params, { replace: true })
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    const params = new URLSearchParams(searchParams)
    params.set('sort', newSort)
    params.set('page', '1')
    setSearchParams(params, { replace: true })
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    setSearchParams(params, { replace: true })
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams()
    if (searchParams.get('destination')) params.set('destination', searchParams.get('destination')!)
    if (searchParams.get('city_id')) params.set('city_id', searchParams.get('city_id')!)
    if (searchParams.get('rooms')) params.set('rooms', searchParams.get('rooms')!)
    if (searchParams.get('adults')) params.set('adults', searchParams.get('adults')!)
    if (searchParams.get('children')) params.set('children', searchParams.get('children')!)
    params.set('check_in', checkIn)
    params.set('check_out', checkOut)
    setSearchParams(params, { replace: true })
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['check_in', 'check_out', 'city_id', 'destination', 'adults', 'children', 'rooms'].includes(key)
  ).length

  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-heading-lg font-semibold text-eventra-navy-900">
                {hotels.length} {hotels.length === 1 ? 'Hotel' : 'Hotels'} Found
              </h1>
              {searchParams.get('destination') && (
                <span className="badge badge-primary">
                  <MapPin className="w-3 h-3 mr-1" />
                  {searchParams.get('destination')}
                </span>
              )}
              <span className="badge badge-neutral">
                {formatDate(checkIn)} - {formatDate(checkOut)} · {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input form-select w-48"
                  aria-label="Sort hotels"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="distance">Distance</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex border border-eventra-slate-300 rounded-xl overflow-hidden">
                {(['grid', 'list', 'map'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'p-2 transition-colors',
                      viewMode === mode
                        ? 'bg-eventra-navy-900 text-white'
                        : 'text-eventra-slate-500 hover:text-eventra-navy-900 hover:bg-eventra-slate-50'
                    )}
                    aria-label={`${mode} view`}
                  >
                    {mode === 'grid' && <Grid className="w-5 h-5" />}
                    {mode === 'list' && <List className="w-5 h-5" />}
                    {mode === 'map' && <Map className="w-5 h-5" />}
                  </button>
                ))}
              </div>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              >
                Filters {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-eventra-navy-900 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        size="lg"
      >
        <HotelFilters
          filters={filters}
          onChange={handleSearch}
          onClearAll={clearAllFilters}
        />
      </Modal>

      {/* Results */}
      <div className="section-container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 hidden lg:block">
            <HotelFilters
              filters={filters}
              onChange={handleSearch}
              onClearAll={clearAllFilters}
            />
          </aside>

          {/* Results List */}
          <main className="flex-1 min-w-0">
            {hasErrors && (
              <div className="alert alert-warning mb-6">
                Some providers couldn't be reached. Showing available results.
              </div>
            )}

            {isError ? (
              <div className="alert alert-danger text-center py-12">
                <p className="font-medium">Failed to load hotels</p>
                <p className="text-body-sm mt-1">{error?.message || 'Please try again'}</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
              </div>
            ) : (
              <>
                {isLoading && hotels.length === 0 ? (
                  <PageSkeleton columns={viewMode === 'list' ? 1 : 2} />
                ) : hotels.length === 0 ? (
                  <div className="text-center py-16">
                    <BedDouble className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">
                      No hotels found
                    </h3>
                    <p className="text-eventra-slate-600 mb-6">
                      Try adjusting your filters or search dates
                    </p>
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear all filters
                    </Button>
                  </div>
                ) : (
                  <>
                    <AnimatePresence mode="popLayout">
                      {viewMode === 'grid' && (
                        <motion.div
                          key="grid"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                          {hotels.map((hotel) => (
                            <HotelResultCard
                              key={hotel.id}
                              hotel={hotel}
                              checkIn={checkIn}
                              checkOut={checkOut}
                              onSelect={() => {
                                navigate(`/hotels/${hotel.provider_item_id}`, {
                                  state: { checkIn, checkOut }
                                })
                              }}
                            />
                          ))}
                        </motion.div>
                      )}
                      {viewMode === 'list' && (
                        <motion.div
                          key="list"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          {hotels.map((hotel) => (
                            <HotelListCard
                              key={hotel.id}
                              hotel={hotel}
                              checkIn={checkIn}
                              checkOut={checkOut}
                              onSelect={() => {
                                navigate(`/hotels/${hotel.provider_item_id}`, {
                                  state: { checkIn, checkOut }
                                })
                              }}
                            />
                          ))}
                        </motion.div>
                      )}
                      {viewMode === 'map' && (
                        <motion.div
                          key="map"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="aspect-video rounded-2xl overflow-hidden border border-eventra-slate-200 bg-gradient-to-br from-eventra-blue-100 via-eventra-slate-100 to-eventra-teal-100"
                        >
                          <div className="w-full h-full flex flex-col items-center justify-center text-eventra-slate-500">
                            <Map className="w-10 h-10 mb-2" />
                            Map view coming soon
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pagination */}
                    {totalCount > 20 && (
                      <div className="mt-8 flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(parseInt(searchParams.get('page') || '1') - 1)}
                          disabled={!searchParams.get('page') || parseInt(searchParams.get('page')!) <= 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-body-md font-medium text-eventra-navy-900 px-4">
                          Page {searchParams.get('page') || 1} of {Math.ceil(totalCount / 20)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(parseInt(searchParams.get('page') || '1') + 1)}
                          disabled={parseInt(searchParams.get('page') || '1') >= Math.ceil(totalCount / 20)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function HotelResultCard({ hotel, checkIn, checkOut, onSelect }: { hotel: HotelResult; checkIn: string; checkOut: string; onSelect: () => void }) {
  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  )
  const perNight = hotel.pricing?.per_night ?? 0
  const totalPrice = perNight * nights
  const rating = hotel.rating || hotel.metadata?.rating || 0
  const reviewCount = hotel.review_count || hotel.metadata?.review_count || 0
  const amenities: string[] = Array.isArray(hotel.amenities) ? hotel.amenities : []

  return (
    <Card variant="interactive" onClick={onSelect} className="h-full flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={hotel.images?.[0] || DEFAULT_HOTEL_IMAGE}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <span className={`badge px-3 py-1 ${hotel.availability?.available ? 'badge-success' : 'badge-danger'}`}>
            {hotel.availability?.available ? 'Available' : 'Sold Out'}
          </span>
          {hotel.metadata?.star_rating ? (
            <span className="badge px-3 py-1 bg-eventra-amber-500 text-white">
              {'★'.repeat(Math.min(5, hotel.metadata.star_rating))}
            </span>
          ) : null}
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="badge badge-primary">★ {rating.toFixed(1)}</span>
          <span className="badge badge-neutral">({reviewCount} reviews)</span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 line-clamp-1">{hotel.name}</h3>
        <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {hotel.location?.city}, {hotel.location?.country}
        </p>
        <div className="flex flex-wrap gap-1.5 my-3">
          {amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className="tag text-body-xs px-2 py-0.5">{amenity}</span>
          ))}
          {amenities.length > 3 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{amenities.length - 3} more</span>
          )}
        </div>
        <div className="mt-auto pt-3 border-t border-eventra-slate-200 flex items-end justify-between gap-2">
          <div>
            <p className="price-lg text-eventra-navy-900">{formatCurrency(totalPrice, hotel.pricing?.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">
              {formatCurrency(perNight, hotel.pricing?.currency)} / night · {nights} {nights === 1 ? 'night' : 'nights'}
            </p>
          </div>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
            Select
          </Button>
        </div>
      </div>
    </Card>
  )
}

function HotelListCard({ hotel, checkIn, checkOut, onSelect }: { hotel: HotelResult; checkIn: string; checkOut: string; onSelect: () => void }) {
  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  )
  const perNight = hotel.pricing?.per_night ?? 0
  const totalPrice = perNight * nights
  const rating = hotel.rating || hotel.metadata?.rating || 0
  const reviewCount = hotel.review_count || hotel.metadata?.review_count || 0
  const amenities: string[] = Array.isArray(hotel.amenities) ? hotel.amenities : []

  return (
    <Card variant="interactive" onClick={onSelect} className="flex flex-col sm:flex-row overflow-hidden">
      <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0">
        <img
          src={hotel.images?.[0] || DEFAULT_HOTEL_IMAGE}
          alt={hotel.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <span className={`badge px-3 py-1 ${hotel.availability?.available ? 'badge-success' : 'badge-danger'}`}>
            {hotel.availability?.available ? 'Available' : 'Sold Out'}
          </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h3 className="text-heading-sm font-semibold text-eventra-navy-900">{hotel.name}</h3>
            <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {hotel.location?.city}, {hotel.location?.country}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-primary">★ {rating.toFixed(1)}</span>
            <span className="badge badge-neutral">({reviewCount} reviews)</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {amenities.slice(0, 4).map((amenity) => (
            <span key={amenity} className="tag text-body-xs px-2 py-0.5">{amenity}</span>
          ))}
          {amenities.length > 4 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{amenities.length - 4} more</span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-eventra-slate-200">
          <div>
            <p className="price-lg text-eventra-navy-900">{formatCurrency(totalPrice, hotel.pricing?.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">
              {formatCurrency(perNight, hotel.pricing?.currency)} per night × {nights} {nights === 1 ? 'night' : 'nights'}
            </p>
          </div>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
            Select
          </Button>
        </div>
      </div>
    </Card>
  )
}

function HotelFilters({ filters, onChange, onClearAll }: { filters: Partial<SearchParams>; onChange: (filters: Partial<SearchParams>) => void; onClearAll: () => void }) {
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [starRating, setStarRating] = useState<number[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [propertyTypes, setPropertyTypes] = useState<string[]>([])

  const handlePriceChange = debounce((range: number[]) => {
    setPriceRange(range)
    onChange({ price_min: String(range[0]), price_max: String(range[1]) })
  }, 500)

  const toggleStar = (rating: number) => {
    const newRating = starRating.includes(rating)
      ? starRating.filter(r => r !== rating)
      : [...starRating, rating]
    setStarRating(newRating)
    onChange({ star_rating: newRating.join(',') })
  }

  const toggleAmenity = (amenity: string) => {
    const newAmenities = amenities.includes(amenity)
      ? amenities.filter(a => a !== amenity)
      : [...amenities, amenity]
    setAmenities(newAmenities)
    onChange({ amenities: newAmenities })
  }

  const togglePropertyType = (type: string) => {
    const newTypes = propertyTypes.includes(type)
      ? propertyTypes.filter(t => t !== type)
      : [...propertyTypes, type]
    setPropertyTypes(newTypes)
  }

  return (
    <Card padding="lg" className="sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900">Filters</h3>
        {(priceRange[0] > 0 || priceRange[1] < 50000 || starRating.length > 0 || amenities.length > 0 || propertyTypes.length > 0) && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <label className="label">Price Range (per night)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="50000"
              value={priceRange[0]}
              onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="50000"
              value={priceRange[1]}
              onChange={(e) => handlePriceChange([priceRange[0], parseInt(e.target.value)])}
              className="flex-1"
            />
          </div>
          <div className="flex justify-between text-body-xs text-eventra-slate-500 mt-1">
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
        </div>

        {/* Star Rating */}
        <div>
          <label className="label">Star Rating</label>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={starRating.includes(rating)}
                  onChange={() => toggleStar(rating)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">
                  {'★'.repeat(rating)} {rating}+
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className="label">Property Type</label>
          <div className="space-y-2">
            {['Hotel', 'Resort', 'Apartment', 'Villa', 'Hostel'].map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={propertyTypes.includes(type)}
                  onChange={() => togglePropertyType(type)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="label">Amenities</label>
          <div className="space-y-2">
            {['Free WiFi', 'Pool', 'Spa', 'Gym', 'Parking', 'Restaurant', 'Room Service', 'Airport Shuttle'].map((amenity) => (
              <label key={amenity} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
