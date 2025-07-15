import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, SlidersHorizontal, MapPin, Star, Tag, X, Loader2, Plane, Shield, Clock, Users, Luggage, Car, Zap, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, debounce } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { PageSkeleton } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface SearchParams {
  pickup_location_id?: string
  dropoff_location_id?: string
  date?: string
  time?: string
  passengers?: string
  luggage?: string
  vehicle_type_id?: string
  transfer_type?: string
  page?: number
  per_page?: number
}

interface TransferResult {
  id: string
  name: string
  type: string
  provider_code: string
  provider_item_id: string
  location: {
    pickup: { location: string; address: string }
    dropoff: { location: string; address: string }
  }
  pricing: {
    base_price: number
    currency: string
    total: number
  }
  availability: {
    available: boolean
    vehicles_available: number
  }
  images: string[]
  amenities: string[]
  metadata: {
    operator_name: string
    vehicle_type_name: string
    max_passengers: number
    max_luggage: number
    transfer_type: string
    distance_km: number
    estimated_duration_minutes: number
    inclusions: string[]
    exclusions: string[]
    is_shared: boolean
  }
  rating: number
  review_count: number
}

export function TransferResults() {
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
    queryKey: ['transfers', queryParams],
    queryFn: async () => {
      const response = await api.get('/search/transfers', { params: queryParams })
      return response.data
    },
    placeholderData: (previousData) => previousData,
  })

  const transfers = data?.data?.results || []
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
    if (searchParams.get('pickup_location_id')) params.set('pickup_location_id', searchParams.get('pickup_location_id')!)
    if (searchParams.get('dropoff_location_id')) params.set('dropoff_location_id', searchParams.get('dropoff_location_id')!)
    if (searchParams.get('date')) params.set('date', searchParams.get('date')!)
    if (searchParams.get('passengers')) params.set('passengers', searchParams.get('passengers')!)
    if (searchParams.get('luggage')) params.set('luggage', searchParams.get('luggage')!)
    setSearchParams(params, { replace: true })
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['pickup_location_id', 'dropoff_location_id', 'date', 'passengers', 'luggage'].includes(key)
  ).length

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sedan': return <Car className="w-4 h-4" />
      case 'suv': return <Car className="w-4 h-4" />
      case 'van': return <Users className="w-4 h-4" />
      case 'minibus': return <Users className="w-4 h-4" />
      case 'coach': return <Bus className="w-4 h-4" />
      case 'luxury': return <Zap className="w-4 h-4" />
      default: return <Car className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-heading-lg font-semibold text-eventra-navy-900">
                {transfers.length} {transfers.length === 1 ? 'Transfer' : 'Transfers'} Found
              </h1>
              {searchParams.get('pickup') && searchParams.get('dropoff') && (
                <span className="badge badge-primary">
                  <Plane className="w-3 h-3 mr-1" />
                  {searchParams.get('pickup')} → {searchParams.get('dropoff')}
                </span>
              )}
              {searchParams.get('date') && (
                <span className="badge badge-neutral">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(searchParams.get('date')!)}
                </span>
              )}
              {searchParams.get('passengers') && (
                <span className="badge badge-neutral">
                  <Users className="w-3 h-3 mr-1" />
                  {searchParams.get('passengers')} passengers
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
                    { value: 'price_low', label: 'Price: Low to High' },
                    { value: 'price_high', label: 'Price: High to Low' },
                    { value: 'fastest', label: 'Fastest' },
                    { value: 'rating', label: 'Top Rated' },
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
        <TransferFilters
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
            <TransferFilters
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
                <p className="font-medium">Failed to load transfers</p>
                <p className="text-body-sm mt-1">{error?.message || 'Please try again'}</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
              </div>
            ) : (
              <>
                {isLoading && transfers.length === 0 ? (
                  <PageSkeleton columns={1} />
                ) : transfers.length === 0 ? (
                  <div className="text-center py-16">
                    <Plane className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">
                      No transfers found
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
                        key="transfers"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {transfers.map((transfer) => (
                          <TransferResultCard
                            key={transfer.id}
                            transfer={transfer}
                            formatDuration={formatDuration}
                            onSelect={() => {
                              navigate(`/transfers/${transfer.provider_item_id}`, {
                                state: { 
                                  date: searchParams.get('date'),
                                  time: searchParams.get('time'),
                                  passengers: searchParams.get('passengers'),
                                  luggage: searchParams.get('luggage')
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

function TransferResultCard({ transfer, formatDuration, onSelect }: { transfer: TransferResult; formatDuration: (minutes: number) => string; onSelect: () => void }) {
  const metadata = transfer.metadata
  const pickup = transfer.location.pickup
  const dropoff = transfer.location.dropoff

  return (
    <Card variant="interactive" onClick={onSelect} className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-eventra-blue-100 flex items-center justify-center flex-shrink-0">
          <Plane className="w-7 h-7 text-eventra-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-eventra-navy-900">{metadata.operator_name}</span>
            <span className="badge badge-neutral">{metadata.vehicle_type_name}</span>
            {metadata.is_shared && <span className="badge badge-neutral">Shared</span>}
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{pickup.location}</p>
              <p className="text-body-sm text-eventra-slate-600">{pickup.address}</p>
            </div>
            <div className="col-span-2 flex flex-col items-center">
              <div className="relative w-full h-px bg-eventra-slate-300">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-eventra-blue-600 flex items-center justify-center">
                  <Plane className="w-3 h-3 text-eventra-blue-600" />
                </div>
              </div>
              <p className="text-body-xs text-eventra-slate-500 text-center mt-1">{formatDuration(metadata.estimated_duration_minutes)}</p>
              <p className="text-body-xs text-eventra-slate-500 text-center">{metadata.distance_km} km</p>
            </div>
            <div className="col-span-5 text-right">
              <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{dropoff.location}</p>
              <p className="text-body-sm text-eventra-slate-600">{dropoff.address}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium', metadata.max_passengers > 4 ? 'bg-eventra-teal-100 text-eventra-teal-700' : 'bg-eventra-blue-100 text-eventra-blue-700')}>
              <Users className="w-3 h-3" /> {metadata.max_passengers} passengers
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-amber-100 text-eventra-amber-700">
              <Luggage className="w-3 h-3" /> {metadata.max_luggage} bags
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-green-100 text-eventra-green-700">
              <Shield className="w-3 h-3" /> Meet & Greet
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 w-48">
          <div className="text-right">
            <p className="price-md text-eventra-navy-900">{formatCurrency(transfer.pricing.total, transfer.pricing.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">Total</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-1 rounded-full text-body-xs font-medium', transfer.availability.available ? 'bg-eventra-green-100 text-eventra-green-700' : 'bg-eventra-red-100 text-eventra-red-700')}>
              {transfer.availability.available ? `${transfer.availability.vehicles_available} vehicles` : 'Unavailable'}
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

function TransferFilters({ filters, onChange, onClearAll }: { filters: Partial<SearchParams>; onChange: (filters: Partial<SearchParams>) => void; onClearAll: () => void }) {
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])
  const [transferTypes, setTransferTypes] = useState<string[]>([])
  const [isShared, setIsShared] = useState(false)

  const handlePriceChange = debounce((range: number[]) => {
    setPriceRange(range)
    onChange({ price_min: range[0], price_max: range[1] })
  }, 500)

  const toggleVehicleType = (type: string) => {
    const newTypes = vehicleTypes.includes(type)
      ? vehicleTypes.filter(t => t !== type)
      : [...vehicleTypes, type]
    setVehicleTypes(newTypes)
  }

  const toggleTransferType = (type: string) => {
    const newTypes = transferTypes.includes(type)
      ? transferTypes.filter(t => t !== type)
      : [...transferTypes, type]
    setTransferTypes(newTypes)
  }

  return (
    <Card padding="lg" className="sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900">Filters</h3>
        {(priceRange[0] > 0 || priceRange[1] < 10000 || vehicleTypes.length > 0 || transferTypes.length > 0 || isShared) && (
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
              max="10000"
              value={priceRange[0]}
              onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="10000"
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

        {/* Vehicle Type */}
        <div>
          <label className="label">Vehicle Type</label>
          <div className="space-y-2">
            ['Sedan', 'SUV', 'Van', 'Minibus', 'Coach', 'Luxury'].map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vehicleTypes.includes(type)}
                  onChange={() => toggleVehicleType(type)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{type}</span>
              </label>
            ))
          </div>
        </div>

        {/* Transfer Type */}
        <div>
          <label className="label">Transfer Type</label>
          <div className="space-y-2">
            ['airport_to_hotel', 'hotel_to_airport', 'point_to_point', 'hourly', 'city_tour'].map((type) => (
              <label key={type} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transferTypes.includes(type)}
                  onChange={() => toggleTransferType(type)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{type.replace('_', ' ')}</span>
              </label>
            ))
          </div>
        </div>

        {/* Shared */}
        <div>
          <label className="label flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-body-sm text-eventra-navy-700">Shared Transfer (cheaper)</span>
          </label>
        </div>
      </div>
    </Card>
  )
}