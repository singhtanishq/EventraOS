import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, Calendar, Users, Building2, Grid, List, Map } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, debounce } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'

interface SearchParams {
  city_id?: string
  city?: string
  event_type?: string
  event_date?: string
  guest_count?: string
  duration_hours?: string
  venue_type?: string
  price_min?: string
  price_max?: string
  page?: number
  per_page?: number
}

interface VenueResult {
  id: string
  name: string
  type: string
  provider_code: string
  provider_item_id: string
  location: {
    city: string
    country: string
    address: string
  }
  pricing: {
    base_price: number
    currency: string
    total: number
  }
  availability: {
    available: boolean
  }
  images: string[]
  amenities: string[]
  metadata: {
    capacity: number
    venue_types: string[]
    rating: number
    review_count: number
  }
  rating: number
  review_count: number
}

const tomorrowISO = new Date(Date.now() + 86400000).toISOString().split('T')[0]

export function VenueResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Partial<SearchParams>>({})
  const [sortBy, setSortBy] = useState('recommended')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')

  useEffect(() => {
    const initialFilters: Partial<SearchParams> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'per_page') {
        (initialFilters as Record<string, string>)[key] = value
      }
    })
    setFilters(initialFilters)
  }, [searchParams])

  // event_date is required by the API validator - default to tomorrow
  const eventDate = filters.event_date || searchParams.get('event_date') || tomorrowISO

  const queryParams = {
    ...filters,
    event_date: eventDate,
    sort: sortBy,
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 20,
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['venues', queryParams],
    queryFn: async () => {
      const body = await api.get<any>('/search/venues', { params: queryParams })
      return body
    },
    placeholderData: (previousData) => previousData,
  })

  const venues: VenueResult[] = data?.data?.results ?? []
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
    if (searchParams.get('city_id')) params.set('city_id', searchParams.get('city_id')!)
    if (searchParams.get('city')) params.set('city', searchParams.get('city')!)
    if (searchParams.get('event_date')) params.set('event_date', searchParams.get('event_date')!)
    if (searchParams.get('guest_count')) params.set('guest_count', searchParams.get('guest_count')!)
    setSearchParams(params, { replace: true })
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['city_id', 'city', 'event_date', 'guest_count', 'duration_hours'].includes(key)
  ).length

  const eventTypes = ['Wedding', 'Conference', 'Seminar', 'Birthday', 'Corporate Event', 'Exhibition', 'Party', 'Concert', 'Workshop', 'Meeting']

  const handleSelect = (venue: VenueResult) => {
    navigate(`/venues/${venue.id}`, {
      state: {
        eventDate,
        guestCount: searchParams.get('guest_count'),
        eventType: searchParams.get('event_type')
      }
    })
  }

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-heading-lg font-semibold text-eventra-navy-900">
                {venues.length} {venues.length === 1 ? 'Venue' : 'Venues'} Found
              </h1>
              {searchParams.get('city') && (
                <span className="badge badge-primary">
                  <MapPin className="w-3 h-3 mr-1" />
                  {searchParams.get('city')}
                </span>
              )}
              {searchParams.get('event_type') && (
                <span className="badge badge-neutral">
                  <Building2 className="w-3 h-3 mr-1" />
                  {searchParams.get('event_type')}
                </span>
              )}
              <span className="badge badge-neutral">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(eventDate)}
              </span>
              {searchParams.get('guest_count') && (
                <span className="badge badge-neutral">
                  <Users className="w-3 h-3 mr-1" />
                  {searchParams.get('guest_count')} guests
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input form-select w-48"
                  aria-label="Sort venues"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="capacity">Capacity</option>
                </select>
              </div>

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
        <VenueFilters
          filters={filters}
          onChange={handleSearch}
          onClearAll={clearAllFilters}
          eventTypes={eventTypes}
        />
      </Modal>

      {/* Results */}
      <div className="section-container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 hidden lg:block">
            <VenueFilters
              filters={filters}
              onChange={handleSearch}
              onClearAll={clearAllFilters}
              eventTypes={eventTypes}
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
                <p className="font-medium">Failed to load venues</p>
                <p className="text-body-sm mt-1">{error?.message || 'Please try again'}</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
              </div>
            ) : (
              <>
                {isLoading && venues.length === 0 ? (
                  <PageSkeleton columns={viewMode === 'list' ? 1 : 2} />
                ) : venues.length === 0 ? (
                  <div className="text-center py-16">
                    <Building2 className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">
                      No venues found
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
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
                        >
                          {venues.map((venue) => (
                            <VenueResultCard
                              key={venue.id}
                              venue={venue}
                              onSelect={() => handleSelect(venue)}
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
                          {venues.map((venue) => (
                            <VenueListCard
                              key={venue.id}
                              venue={venue}
                              onSelect={() => handleSelect(venue)}
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
                          className="aspect-video rounded-2xl overflow-hidden border border-eventra-slate-200 bg-eventra-slate-100"
                        >
                          <div className="w-full h-full flex items-center justify-center text-eventra-slate-500">
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

function VenueResultCard({ venue, onSelect }: { venue: VenueResult; onSelect: () => void }) {
  const rating = venue.rating || venue.metadata.rating || 0

  return (
    <Card variant="interactive" onClick={onSelect} className="h-full flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={venue.images[0] || '/placeholder-venue.jpg'}
          alt={venue.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <span className={`badge px-3 py-1 ${venue.availability.available ? 'badge-success' : 'badge-danger'}`}>
            {venue.availability.available ? 'Available' : 'Booked'}
          </span>
          {rating > 0 && (
            <span className="badge badge-primary">★ {rating.toFixed(1)}</span>
          )}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 line-clamp-1">{venue.name}</h3>
        <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {venue.location.city}, {venue.location.country}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4 mt-2">
          {venue.metadata.venue_types.slice(0, 3).map((type) => (
            <span key={type} className="tag text-body-xs px-2 py-0.5">{type}</span>
          ))}
          {venue.metadata.venue_types.length > 3 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{venue.metadata.venue_types.length - 3} more</span>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-eventra-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1 text-body-sm text-eventra-slate-600">
            <Users className="w-4 h-4" />
            {venue.metadata.capacity} guests
          </div>
          <div className="text-right">
            <p className="price-md text-eventra-navy-900">{formatCurrency(venue.pricing.total, venue.pricing.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">starting</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function VenueListCard({ venue, onSelect }: { venue: VenueResult; onSelect: () => void }) {
  const rating = venue.rating || venue.metadata.rating || 0

  return (
    <Card variant="interactive" onClick={onSelect} className="flex flex-col sm:flex-row overflow-hidden">
      <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0">
        <img
          src={venue.images[0] || '/placeholder-venue.jpg'}
          alt={venue.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <span className={`badge px-3 py-1 ${venue.availability.available ? 'badge-success' : 'badge-danger'}`}>
            {venue.availability.available ? 'Available' : 'Booked'}
          </span>
          {rating > 0 && (
            <span className="badge badge-primary">★ {rating.toFixed(1)}</span>
          )}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h3 className="text-heading-sm font-semibold text-eventra-navy-900">{venue.name}</h3>
            <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {venue.location.city}, {venue.location.country}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {venue.metadata.venue_types.slice(0, 3).map((type) => (
            <span key={type} className="tag text-body-xs px-2 py-0.5">{type}</span>
          ))}
          {venue.metadata.venue_types.length > 3 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{venue.metadata.venue_types.length - 3} more</span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-eventra-slate-200">
          <div className="flex items-center gap-4 text-body-sm text-eventra-slate-600">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {venue.metadata.capacity} guests
            </span>
          </div>
          <div className="text-right">
            <p className="price-md text-eventra-navy-900">{formatCurrency(venue.pricing.total, venue.pricing.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">starting</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function VenueFilters({ filters, onChange, onClearAll, eventTypes }: { filters: Partial<SearchParams>; onChange: (filters: Partial<SearchParams>) => void; onClearAll: () => void; eventTypes: string[] }) {
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [venueTypes, setVenueTypes] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [capacityRange, setCapacityRange] = useState([0, 5000])

  const handlePriceChange = debounce((range: number[]) => {
    setPriceRange(range)
    onChange({ price_min: String(range[0]), price_max: String(range[1]) })
  }, 500)

  const toggleVenueType = (type: string) => {
    const newTypes = venueTypes.includes(type)
      ? venueTypes.filter(t => t !== type)
      : [...venueTypes, type]
    setVenueTypes(newTypes)
    onChange({ venue_type: newTypes.join(',') })
  }

  const toggleAmenity = (amenity: string) => {
    const newAmenities = amenities.includes(amenity)
      ? amenities.filter(a => a !== amenity)
      : [...amenities, amenity]
    setAmenities(newAmenities)
    // Would need API support for amenities filter
  }

  const handleCapacityChange = debounce((range: number[]) => {
    setCapacityRange(range)
    // Would need API support for capacity range
  }, 500)

  return (
    <Card padding="lg" className="sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900">Filters</h3>
        {(priceRange[0] > 0 || priceRange[1] < 500000 || venueTypes.length > 0 || amenities.length > 0) && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <label className="label">Price Range</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="500000"
              value={priceRange[0]}
              onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="500000"
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

        {/* Venue Type */}
        <div>
          <label className="label">Venue Type</label>
          <div className="space-y-2">
            {eventTypes.map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={venueTypes.includes(type)}
                  onChange={() => toggleVenueType(type)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="label">Capacity</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="5000"
              value={capacityRange[0]}
              onChange={(e) => handleCapacityChange([parseInt(e.target.value), capacityRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="5000"
              value={capacityRange[1]}
              onChange={(e) => handleCapacityChange([capacityRange[0], parseInt(e.target.value)])}
              className="flex-1"
            />
          </div>
          <div className="flex justify-between text-body-xs text-eventra-slate-500 mt-1">
            <span>{capacityRange[0]} guests</span>
            <span>{capacityRange[1]}+ guests</span>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="label">Facilities</label>
          <div className="space-y-2">
            {['Parking', 'Catering', 'AV Equipment', 'Stage', 'WiFi', 'AC', 'Outdoor Space', 'Bridal Suite'].map((amenity) => (
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
