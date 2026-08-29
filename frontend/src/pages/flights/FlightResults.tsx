import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal, Plane, Clock, ArrowRight, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, debounce } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

// departure_date is required by the search API - default to today + 3 days
const addDaysISO = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

interface SearchParams {
  origin?: string
  destination?: string
  departure_date?: string
  return_date?: string
  adults?: string
  children?: string
  infants?: string
  cabin_class?: string
  stops?: string
  price_min?: string
  price_max?: string
  sort?: string
  page?: number
  per_page?: number
}

interface FlightResult {
  id: string
  name: string
  type: string
  provider_code: string
  provider_item_id: string
  location: {
    origin: { airport: string; code: string; city: string; terminal: string }
    destination: { airport: string; code: string; city: string; terminal: string }
  }
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
  images: string[]
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
    departure_time: string
    arrival_time: string
    duration_minutes: number
    stops: number
    refundable: boolean
  }
  rating: number
  review_count: number
}

export function FlightResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Partial<SearchParams>>({})
  const [sortBy, setSortBy] = useState('recommended')
  const [showFilters, setShowFilters] = useState(false)

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

  // departure_date is required by the API - default when missing
  const departureDate = filters.departure_date || searchParams.get('departure_date') || addDaysISO(3)

  const queryParams = {
    ...filters,
    departure_date: departureDate,
    sort: sortBy,
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 20,
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['flights', queryParams],
    queryFn: async () => {
      const body = await api.get<any>('/search/flights', { params: queryParams })
      return body
    },
    placeholderData: (previousData) => previousData,
  })

  const flights: FlightResult[] = data?.data?.results ?? []
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
    if (searchParams.get('origin')) params.set('origin', searchParams.get('origin')!)
    if (searchParams.get('destination')) params.set('destination', searchParams.get('destination')!)
    params.set('departure_date', departureDate)
    if (searchParams.get('return_date')) params.set('return_date', searchParams.get('return_date')!)
    if (searchParams.get('adults')) params.set('adults', searchParams.get('adults')!)
    if (searchParams.get('children')) params.set('children', searchParams.get('children')!)
    if (searchParams.get('infants')) params.set('infants', searchParams.get('infants')!)
    if (searchParams.get('cabin_class')) params.set('cabin_class', searchParams.get('cabin_class')!)
    setSearchParams(params, { replace: true })
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['origin', 'destination', 'departure_date', 'return_date', 'adults', 'children', 'infants', 'cabin_class'].includes(key)
  ).length

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  const getAirlineLogo = (code: string) => {
    // Airline logo CDN - falls back to code block if the image fails
    return `https://content.airhex.com/content/airline/logo/${(code || '').toLowerCase()}_100_200_r.png`
  }

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-heading-lg font-semibold text-eventra-navy-900">
                {flights.length} {flights.length === 1 ? 'Flight' : 'Flights'} Found
              </h1>
              {searchParams.get('origin') && searchParams.get('destination') && (
                <span className="badge badge-primary">
                  <Plane className="w-3 h-3 mr-1" />
                  {searchParams.get('origin')} → {searchParams.get('destination')}
                </span>
              )}
              <span className="badge badge-neutral">
                {formatDate(departureDate)}
              </span>
              {searchParams.get('return_date') && (
                <span className="badge badge-neutral">
                  Return: {formatDate(searchParams.get('return_date')!)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input form-select w-48"
                  aria-label="Sort flights"
                >
                  <option value="recommended">Recommended</option>
                  <option value="cheapest">Cheapest</option>
                  <option value="fastest">Fastest</option>
                  <option value="earliest">Earliest Departure</option>
                  <option value="latest">Latest Departure</option>
                </select>
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
        <FlightFilters
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
            <FlightFilters
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
                <p className="font-medium">Failed to load flights</p>
                <p className="text-body-sm mt-1">{error?.message || 'Please try again'}</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
              </div>
            ) : (
              <>
                {isLoading && flights.length === 0 ? (
                  <PageSkeleton columns={1} />
                ) : flights.length === 0 ? (
                  <div className="text-center py-16">
                    <Plane className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">
                      No flights found
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
                      <motion.div
                        key="flights"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {flights.map((flight) => (
                          <FlightResultCard
                            key={flight.id}
                            flight={flight}
                            getAirlineLogo={getAirlineLogo}
                            formatDuration={formatDuration}
                            onSelect={() => {
                              navigate(`/flights/${flight.provider_item_id}`, {
                                state: {
                                  departure_date: departureDate,
                                  return_date: searchParams.get('return_date'),
                                  adults: searchParams.get('adults'),
                                  children: searchParams.get('children'),
                                  infants: searchParams.get('infants'),
                                  cabin_class: searchParams.get('cabin_class')
                                }
                              })
                            }}
                          />
                        ))}
                      </motion.div>
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

function FlightResultCard({ flight, getAirlineLogo, formatDuration, onSelect }: { flight: FlightResult; getAirlineLogo: (code: string) => string; formatDuration: (minutes: number) => string; onSelect: () => void }) {
  const dep = flight.location?.origin
  const arr = flight.location?.destination
  const metadata = flight.metadata || {}
  const stops = metadata.stops ?? 0

  return (
    <Card variant="interactive" onClick={onSelect} className="p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Airline */}
        <div className="flex items-center gap-3 lg:w-52 flex-shrink-0">
          {metadata.airline_code ? (
            <img
              src={getAirlineLogo(metadata.airline_code)}
              alt={metadata.airline}
              className="w-10 h-10 object-contain bg-eventra-slate-50 rounded-lg p-1"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-eventra-blue-100 flex items-center justify-center">
              <Plane className="w-5 h-5 text-eventra-blue-700" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-eventra-navy-900 truncate">{metadata.airline || 'Airline'}</p>
            <p className="text-body-xs text-eventra-slate-500">{metadata.flight_number}</p>
          </div>
        </div>

        {/* Journey */}
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{metadata.departure_time || '--:--'}</p>
            <p className="text-body-sm text-eventra-slate-600">{dep?.code} · {dep?.airport || dep?.city}</p>
            <p className="text-body-xs text-eventra-slate-500">{dep?.city}</p>
          </div>
          <div className="flex flex-col items-center px-2">
            <p className="text-body-xs text-eventra-slate-500 whitespace-nowrap">{formatDuration(metadata.duration_minutes ?? 0)}</p>
            <div className="relative w-full h-px bg-eventra-slate-300 my-1">
              <Plane className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-eventra-blue-600 bg-white" />
            </div>
            <span className={cn(
              'badge badge-neutral text-body-xs',
              stops === 0 && 'badge-success'
            )}>
              {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="text-right">
            <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{metadata.arrival_time || '--:--'}</p>
            <p className="text-body-sm text-eventra-slate-600">{arr?.code} · {arr?.airport || arr?.city}</p>
            <p className="text-body-xs text-eventra-slate-500">{arr?.city}</p>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2 lg:w-44 flex-shrink-0">
          <div className="text-right">
            <p className="price-lg text-eventra-navy-900">
              {formatCurrency(flight.pricing?.total ?? 0, flight.pricing?.currency)}
            </p>
            <p className="text-body-xs text-eventra-slate-500">per passenger</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {metadata.refundable && (
              <span className="badge badge-success">
                <Shield className="w-3 h-3 mr-1" />
                Refundable
              </span>
            )}
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
              Select
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function FlightFilters({ filters, onChange, onClearAll }: { filters: Partial<SearchParams>; onChange: (filters: Partial<SearchParams>) => void; onClearAll: () => void }) {
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [stops, setStops] = useState<number[]>([])
  const [cabinClasses, setCabinClasses] = useState<string[]>([])
  const [departureTime, setDepartureTime] = useState<{ min: string; max: string }>({ min: '', max: '' })

  const handlePriceChange = debounce((range: number[]) => {
    setPriceRange(range)
    onChange({ price_min: String(range[0]), price_max: String(range[1]) })
  }, 500)

  const toggleStop = (stop: number) => {
    const newStops = stops.includes(stop)
      ? stops.filter(s => s !== stop)
      : [...stops, stop]
    setStops(newStops)
    onChange({ stops: newStops.join(',') })
  }

  const toggleCabinClass = (cabin: string) => {
    const newClasses = cabinClasses.includes(cabin)
      ? cabinClasses.filter(c => c !== cabin)
      : [...cabinClasses, cabin]
    setCabinClasses(newClasses)
    onChange({ cabin_class: newClasses.join(',') })
  }

  return (
    <Card padding="lg" className="sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900">Filters</h3>
        {(priceRange[0] > 0 || priceRange[1] < 100000 || stops.length > 0 || cabinClasses.length > 0) && (
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
              max="100000"
              value={priceRange[0]}
              onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="100000"
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

        {/* Stops */}
        <div>
          <label className="label">Stops</label>
          <div className="space-y-2">
            {[
              { value: 0, label: 'Non-stop' },
              { value: 1, label: '1 Stop' },
              { value: 2, label: '2+ Stops' },
            ].map((stop) => (
              <label key={stop.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stops.includes(stop.value)}
                  onChange={() => toggleStop(stop.value)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{stop.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Cabin Class */}
        <div>
          <label className="label">Cabin Class</label>
          <div className="space-y-2">
            {['economy', 'premium_economy', 'business', 'first'].map((cabin) => (
              <label key={cabin} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cabinClasses.includes(cabin)}
                  onChange={() => toggleCabinClass(cabin)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700 capitalize">{cabin.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Departure Time Window */}
        <div>
          <label className="label">Departure Time</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="time"
              value={departureTime.min}
              onChange={(e) => setDepartureTime({ ...departureTime, min: e.target.value })}
            />
            <Input
              type="time"
              value={departureTime.max}
              onChange={(e) => setDepartureTime({ ...departureTime, max: e.target.value })}
            />
          </div>
        </div>

        <p className="text-body-xs text-eventra-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Duration and layover times shown per provider.
        </p>
      </div>
    </Card>
  )
}
