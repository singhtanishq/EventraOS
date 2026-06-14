import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, Bus, Clock, Shield, CheckCircle2, Bed, Armchair, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, debounce } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'

interface SearchParams {
  origin_terminal_id?: string
  destination_terminal_id?: string
  journey_date?: string
  passengers?: string
  page?: number
  per_page?: number
  price_min?: string
  price_max?: string

}

interface BusResult {
  id: string
  name: string
  type: string
  provider_code: string
  provider_item_id: string
  location: {
    origin: { terminal: string; code: string; city: string }
    destination: { terminal: string; code: string; city: string }
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
  amenities: string[]
  metadata: {
    operator_name: string
    operator_code: string
    bus_type_name: string
    departure_time: string
    arrival_time: string
    duration_minutes: number
    layout: string
    berth_type: string
    is_ac: boolean
    boarding_points: BoardingPoint[]
    dropping_points: DroppingPoint[]
  }
  rating: number
  review_count: number
}

interface BoardingPoint {
  name: string
  time: string
  address: string
}

interface DroppingPoint {
  name: string
  time: string
  address: string
}

export function BusResults() {
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
  }, [searchParams])

  const queryParams = {
    ...filters,
    sort: sortBy,
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 20,
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['buses', queryParams],
    queryFn: async () => {
      const response = await api.get<any>('/search/buses', { params: queryParams })
      return response
    },
    placeholderData: (previousData) => previousData,
  })

  const buses = data?.data?.results || []
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
    if (searchParams.get('origin_terminal_id')) params.set('origin_terminal_id', searchParams.get('origin_terminal_id')!)
    if (searchParams.get('destination_terminal_id')) params.set('destination_terminal_id', searchParams.get('destination_terminal_id')!)
    if (searchParams.get('journey_date')) params.set('journey_date', searchParams.get('journey_date')!)
    if (searchParams.get('passengers')) params.set('passengers', searchParams.get('passengers')!)
    setSearchParams(params, { replace: true })
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['origin_terminal_id', 'destination_terminal_id', 'journey_date', 'passengers'].includes(key)
  ).length

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h ${m}m`
  }

  const getBusTypeIcon = (berthType: string, isAc: boolean) => {
    if (berthType === 'sleeper') return <Bed className="w-4 h-4" />
    if (berthType === 'semi_sleeper') return <Armchair className="w-4 h-4" />
    return <Bus className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-heading-lg font-semibold text-eventra-navy-900">
                {buses.length} {buses.length === 1 ? 'Bus' : 'Buses'} Found
              </h1>
              {searchParams.get('origin') && searchParams.get('destination') && (
                <span className="badge badge-primary">
                  <Bus className="w-3 h-3 mr-1" />
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
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input form-select w-48"
                  aria-label="Sort buses"
                >
                  <option value="recommended">Recommended</option>
                  <option value="cheapest">Cheapest</option>
                  <option value="fastest">Fastest</option>
                  <option value="earliest">Earliest Departure</option>
                  <option value="latest">Latest Departure</option>
                </select>
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
        <BusFilters
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
            <BusFilters
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
                <p className="font-medium">Failed to load buses</p>
                <p className="text-body-sm mt-1">{error?.message || 'Please try again'}</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
              </div>
            ) : (
              <>
                {isLoading && buses.length === 0 ? (
                  <PageSkeleton columns={1} />
                ) : buses.length === 0 ? (
                  <div className="text-center py-16">
                    <Bus className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">
                      No buses found
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
                        key="buses"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {buses.map((bus) => (
                          <BusResultCard
                            key={bus.id}
                            bus={bus}
                            formatDuration={formatDuration}
                            onSelect={() => {
                              navigate(`/buses/${bus.provider_item_id}`, {
                                state: { 
                                  journey_date: searchParams.get('journey_date'),
                                  passengers: searchParams.get('passengers')
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

function BusResultCard({ bus, formatDuration, onSelect }: { bus: BusResult; formatDuration: (minutes: number) => string; onSelect: () => void }) {
  const metadata = bus.metadata
  const dep = bus.location.origin
  const arr = bus.location.destination
  const boardingPoints = metadata.boarding_points || []

  return (
    <Card variant="interactive" onClick={onSelect} className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-eventra-amber-100 flex items-center justify-center flex-shrink-0">
          <Bus className="w-7 h-7 text-eventra-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-eventra-navy-900">{metadata.operator_name}</span>
            <span className="badge badge-neutral">{metadata.bus_type_name}</span>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{metadata.departure_time}</p>
              <p className="text-body-sm text-eventra-slate-600">{dep.terminal} ({dep.code})</p>
              <p className="text-body-xs text-eventra-slate-500">{dep.city}</p>
            </div>
            <div className="col-span-2 flex flex-col items-center">
              <div className="relative w-full h-px bg-eventra-slate-300">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-eventra-amber-600 flex items-center justify-center">
                  <Bus className="w-3 h-3 text-eventra-amber-600" />
                </div>
              </div>
              <p className="text-body-xs text-eventra-slate-500 text-center mt-1">{formatDuration(metadata.duration_minutes)}</p>
            </div>
            <div className="col-span-5 text-right">
              <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{metadata.arrival_time}</p>
              <p className="text-body-sm text-eventra-slate-600">{arr.terminal} ({arr.code})</p>
              <p className="text-body-xs text-eventra-slate-500">{arr.city}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium', metadata.is_ac ? 'bg-eventra-blue-100 text-eventra-blue-700' : 'bg-eventra-slate-100 text-eventra-slate-700')}>
              {metadata.is_ac ? 'AC' : 'Non-AC'}
            </span>
            {metadata.layout && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-teal-100 text-eventra-teal-700">
                {metadata.layout.replace('x', '×')}
              </span>
            )}
            {metadata.berth_type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-slate-100 text-eventra-slate-700">
                {metadata.berth_type.charAt(0).toUpperCase() + metadata.berth_type.slice(1)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 w-48">
          <div className="flex items-center gap-2">
            {boardingPoints.slice(0, 2).map((point, i) => (
              <BoardingPointBadge key={i} point={point} />
            ))}
            {boardingPoints.length > 2 && (
              <span className="badge badge-neutral">+{boardingPoints.length - 2} more</span>
            )}
          </div>
          <div className="text-right">
            <p className="price-md text-eventra-navy-900">{formatCurrency(bus.pricing.total, bus.pricing.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">Total</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-1 rounded-full text-body-xs font-medium', bus.availability.available ? 'bg-eventra-green-100 text-eventra-green-700' : 'bg-eventra-red-100 text-eventra-red-700')}>
              {bus.availability.available ? `${bus.availability.seats_available} seats` : 'Sold Out'}
            </span>
          </div>
          <Button className="w-full" size="sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
            Select
          </Button>
        </div>
      </div>
    </Card>
  )
}

function BoardingPointBadge({ point }: { point: BoardingPoint }) {
  return (
    <span className="badge badge-neutral text-body-xs">
      {point.name} - {point.time}
    </span>
  )
}

function BusFilters({ filters, onChange, onClearAll }: { filters: Partial<SearchParams>; onChange: (filters: Partial<SearchParams>) => void; onClearAll: () => void }) {
  const [priceRange, setPriceRange] = useState([0, 3000])
  const [busTypes, setBusTypes] = useState<string[]>([])
  const [operators, setOperators] = useState<string[]>([])

  const handlePriceChange = debounce((range: number[]) => {
    setPriceRange(range)
    onChange({ price_min: String(range[0]), price_max: String(range[1]) })
  }, 500)

  const toggleBusType = (type: string) => {
    const newTypes = busTypes.includes(type)
      ? busTypes.filter(t => t !== type)
      : [...busTypes, type]
    setBusTypes(newTypes)
  }

  const toggleOperator = (operator: string) => {
    const newOps = operators.includes(operator)
      ? operators.filter(o => o !== operator)
      : [...operators, operator]
    setOperators(newOps)
  }

  return (
    <Card padding="lg" className="sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900">Filters</h3>
        {(priceRange[0] > 0 || priceRange[1] < 3000 || busTypes.length > 0 || operators.length > 0) && (
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
              max="3000"
              value={priceRange[0]}
              onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="3000"
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

        {/* Bus Type */}
        <div>
          <label className="label">Bus Type</label>
          <div className="space-y-2">
            {(['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'Volvo', 'Mercedes', 'Scania'] as const).map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={busTypes.includes(type)}
                  onChange={() => toggleBusType(type)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Operator */}
        <div>
          <label className="label">Operator</label>
          <div className="space-y-2">
            {(['RedBus', 'KSRTC', 'MSRTC', 'APSRTC', 'TSRTC', 'Private Operators'] as const).map((op) => (
              <label key={op} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={operators.includes(op)}
                  onChange={() => toggleOperator(op)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{op}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label className="label">Departure Time</label>
          <div className="space-y-2">
            {(['Before 6 AM', '6 AM - 12 PM', '12 PM - 6 PM', 'After 6 PM'] as const).map((time) => (
              <label key={time} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox" />
                <span className="text-body-sm text-eventra-navy-700">{time}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}