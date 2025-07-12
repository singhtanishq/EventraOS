import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, SlidersHorizontal, MapPin, Star, Tag, X, Loader2, Train, Clock, RotateCcw, Shield, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, debounce } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card, FlightCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { PageSkeleton } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface SearchParams {
  origin_station_id?: string
  destination_station_id?: string
  journey_date?: string
  passengers?: string
  class?: string
  quota?: string
  page?: number
  per_page?: number
}

interface TrainResult {
  id: string
  name: string
  type: string
  provider_code: string
  provider_item_id: string
  location: {
    origin: { station: string; code: string; city: string }
    destination: { station: string; code: string; city: string }
  }
  pricing: {
    base_price: number
    currency: string
    total: number
    per_passenger: number
  }
  availability: {
    available: boolean
    berths_available: number
    rac_available: number
    wl_available: number
  }
  images: string[]
  amenities: string[]
  metadata: {
    train_number: string
    train_name: string
    departure_time: string
    arrival_time: string
    duration_minutes: number
    train_type: string
    classes: TrainClass[]
  }
  rating: number
  review_count: number
}

interface TrainClass {
  class_id: string
  name: string
  code: string
  is_ac: boolean
  has_berth: boolean
  pricing: {
    base_price: number
    currency: string
    total: number
    per_passenger: number
  }
  availability: {
    available: boolean
    berths_available: number
    rac_count: number
    wl_count: number
  }
  quota: string
}

export function TrainResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Partial<SearchParams>>({})
  const [sortBy, setSortBy] = useState('recommended')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const initialFilters: Partial<SearchParams> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'per_page') {
        initialFilters[key as keyof SearchParams] = value
      }
    })
    setFilters(initialFilters)
  }, [searchParams])

  const queryParams = {
    ...filters,
    sort: sortBy,
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 20,
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['trains', queryParams],
    queryFn: async () => {
      const response = await api.get('/search/trains', { params: queryParams })
      return response.data
    },
    placeholderData: (previousData) => previousData,
  })

  const trains = data?.data?.results || []
  const totalCount = data?.data?.total_count || 0
  const hasErrors = data?.data?.has_errors || false

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
    if (searchParams.get('origin_station_id')) params.set('origin_station_id', searchParams.get('origin_station_id')!)
    if (searchParams.get('destination_station_id')) params.set('destination_station_id', searchParams.get('destination_station_id')!)
    if (searchParams.get('journey_date')) params.set('journey_date', searchParams.get('journey_date')!)
    if (searchParams.get('passengers')) params.set('passengers', searchParams.get('passengers')!)
    if (searchParams.get('quota')) params.set('quota', searchParams.get('quota')!)
    setSearchParams(params, { replace: true })
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['origin_station_id', 'destination_station_id', 'journey_date', 'passengers', 'quota'].includes(key)
  ).length

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  const getAvailabilityStatus = (availability: TrainResult['availability']) => {
    if (!availability.available) return { label: 'Not Available', color: 'bg-eventra-red-100 text-eventra-red-700' }
    if (availability.berths_available > 0) return { label: `${availability.berths_available} berths`, color: 'bg-eventra-green-100 text-eventra-green-700' }
    if (availability.rac_available > 0) return { label: `RAC: ${availability.rac_available}`, color: 'bg-eventra-amber-100 text-eventra-amber-700' }
    if (availability.wl_available > 0) return { label: `WL: ${availability.wl_available}`, color: 'bg-eventra-slate-100 text-eventra-slate-700' }
    return { label: 'Check Availability', color: 'bg-eventra-slate-100 text-eventra-slate-700' }
  }

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-heading-lg font-semibold text-eventra-navy-900">
                {trains.length} {trains.length === 1 ? 'Train' : 'Trains'} Found
              </h1>
              {searchParams.get('origin') && searchParams.get('destination') && (
                <span className="badge badge-primary">
                  <Train className="w-3 h-3 mr-1" />
                  {searchParams.get('origin')} → {searchParams.get('destination')}
                </span>
              )}
              {searchParams.get('journey_date') && (
                <span className="badge badge-neutral">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(searchParams.get('journey_date')!)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Select
                  value={sortBy}
                  onValueChange={handleSortChange}
                  options={[
                    { value: 'recommended', label: 'Recommended' },
                    { value: 'cheapest', label: 'Cheapest' },
                    { value: 'fastest', label: 'Fastest' },
                    { value: 'earliest', label: 'Earliest Departure' },
                    { value: 'latest', label: 'Latest Departure' },
                  ]}
                  className="w-48"
                  placeholder="Sort by"
                />
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
        <TrainFilters
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
            <TrainFilters
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
                <p className="font-medium">Failed to load trains</p>
                <p className="text-body-sm mt-1">{error?.message || 'Please try again'}</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
              </div>
            ) : (
              <>
                {isLoading && trains.length === 0 ? (
                  <PageSkeleton columns={1} />
                ) : trains.length === 0 ? (
                  <div className="text-center py-16">
                    <Train className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">
                      No trains found
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
                        key="trains"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {trains.map((train) => (
                          <TrainResultCard
                            key={train.id}
                            train={train}
                            formatDuration={formatDuration}
                            getAvailabilityStatus={getAvailabilityStatus}
                            onSelect={() => {
                              navigate(`/trains/${train.provider_item_id}`, {
                                state: { 
                                  journey_date: searchParams.get('journey_date'),
                                  passengers: searchParams.get('passengers'),
                                  class: searchParams.get('class'),
                                  quota: searchParams.get('quota')
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
              )}
          </main>
        </div>
      </div>
    </div>
  )
}

function TrainResultCard({ train, formatDuration, getAvailabilityStatus, onSelect }: { train: TrainResult; formatDuration: (minutes: number) => string; getAvailabilityStatus: (availability: TrainResult['availability']) => { label: string; color: string }; onSelect: () => void }) {
  const metadata = train.metadata
  const dep = train.location.origin
  const arr = train.location.destination

  return (
    <Card variant="interactive" onClick={onSelect} className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-eventra-teal-100 flex items-center justify-center flex-shrink-0">
          <Train className="w-7 h-7 text-eventra-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-eventra-navy-900">{metadata.train_name}</span>
            <span className="badge badge-neutral">{metadata.train_number}</span>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{metadata.departure_time}</p>
              <p className="text-body-sm text-eventra-slate-600">{dep.station} ({dep.code})</p>
              <p className="text-body-xs text-eventra-slate-500">{dep.city}</p>
            </div>
            <div className="col-span-2 flex flex-col items-center">
              <div className="relative w-full h-px bg-eventra-slate-300">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-eventra-teal-600 flex items-center justify-center">
                  <Train className="w-3 h-3 text-eventra-teal-600" />
                </div>
              </div>
              <p className="text-body-xs text-eventra-slate-500 text-center mt-1">{formatDuration(metadata.duration_minutes)}</p>
            </div>
            <div className="col-span-5 text-right">
              <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{metadata.arrival_time}</p>
              <p className="text-body-sm text-eventra-slate-600">{arr.station} ({arr.code})</p>
              <p className="text-body-xs text-eventra-slate-500">{arr.city}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-body-sm text-eventra-slate-600">
            <span className="flex items-center gap-1"><RotateCcw className="w-4 h-4" />{metadata.train_type}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 w-48">
          <div className="flex items-center gap-2">
            {train.metadata.classes.map((cls, i) => (
              <TrainClassBadge key={cls.class_id} classInfo={cls} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-body-xs text-eventra-slate-500">Status:</span>
            <span className={cn('px-2 py-1 rounded-full text-body-xs font-medium', getAvailabilityStatus(train.availability).color)}>
              {getAvailabilityStatus(train.availability).label}
            </span>
          </div>
          <div className="text-right">
            <p className="price-md text-eventra-navy-900">{formatCurrency(train.pricing.total, train.pricing.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">Total</p>
          </div>
          <Button className="w-full" size="sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
            Select
          </Button>
        </div>
      </div>
    </Card>
  )
}

function TrainClassBadge({ classInfo }: { classInfo: TrainClass }) {
  const availability = classInfo.availability
  let statusColor = 'bg-eventra-green-100 text-eventra-green-700'
  let statusText = `${availability.berths_available} available`
  
  if (!availability.available) {
    statusColor = 'bg-eventra-red-100 text-eventra-red-700'
    statusText = 'Unavailable'
  } else if (availability.berths_available === 0 && availability.rac_count > 0) {
    statusColor = 'bg-eventra-amber-100 text-eventra-amber-700'
    statusText = `RAC: ${availability.rac_count}`
  } else if (availability.berths_available === 0 && availability.wl_count > 0) {
    statusColor = 'bg-eventra-slate-100 text-eventra-slate-700'
    statusText = `WL: ${availability.wl_count}`
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-medium text-eventra-navy-900 text-sm">{classInfo.name}</span>
      <span className={cn('px-2 py-0.5 rounded-full text-body-xs font-medium', statusColor)}>
        {statusText}
      </span>
      <span className="text-body-xs text-eventra-slate-500">
        {formatCurrency(classInfo.pricing.per_passenger, classInfo.pricing.currency)}/passenger
      </span>
    </div>
  )
}

function TrainFilters({ filters, onChange, onClearAll }: { filters: Partial<SearchParams>; onChange: (filters: Partial<SearchParams>) => void; onClearAll: () => void }) {
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [trainTypes, setTrainTypes] = useState<string[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [quota, setQuota] = useState<string>('')

  const handlePriceChange = debounce((range: number[]) => {
    setPriceRange(range)
    onChange({ price_min: range[0], price_max: range[1] })
  }, 500)

  const toggleTrainType = (type: string) => {
    const newTypes = trainTypes.includes(type)
      ? trainTypes.filter(t => t !== type)
      : [...trainTypes, type]
    setTrainTypes(newTypes)
    // Would need API support
  }

  const toggleClass = (cls: string) => {
    const newClasses = classes.includes(cls)
      ? classes.filter(c => c !== cls)
      : [...classes, cls]
    setClasses(newClasses)
    // Would need API support
  }

  return (
    <Card padding="lg" className="sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900">Filters</h3>
        {(priceRange[0] > 0 || priceRange[1] < 5000 || trainTypes.length > 0 || classes.length > 0) && (
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
              max="5000"
              value={priceRange[0]}
              onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="5000"
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

        {/* Train Type */}
        <div>
          <label className="label">Train Type</label>
          <div className="space-y-2">
            ['Rajdhani', 'Shatabdi', 'Duronto', 'Vande Bharat', 'Mail/Express', 'Passenger'].map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trainTypes.includes(type)}
                  onChange={() => toggleTrainType(type)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{type}</span>
              </label>
            ))
          </div>
        </div>

        {/* Class */}
        <div>
          <label className="label">Class</label>
          <div className="space-y-2">
            ['1AC', '2AC', '3AC', 'SL', 'CC', 'EC', '2S'].map((cls) => (
              <label key={cls} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={classes.includes(cls)}
                  onChange={() => toggleClass(cls)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{cls}</span>
              </label>
            ))
          </div>
        </div>

        {/* Quota */}
        <div>
          <label className="label">Quota</label>
          <Select
            value={quota}
            onValueChange={(v) => setQuota(v)}
            options={[
              { value: '', label: 'All Quotas' },
              { value: 'GN', label: 'General' },
              { value: 'LD', label: 'Ladies' },
              { value: 'HQ', label: 'Headquarters' },
              { value: 'DF', label: 'Defence' },
              { value: 'PH', label: 'Parliament House' },
              { value: 'FT', label: 'Foreign Tourist' },
            ]}
            placeholder="Select quota"
          />
        </div>
      </div>
    </Card>
  )
}