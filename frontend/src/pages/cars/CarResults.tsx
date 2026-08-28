import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, Car, Shield, Fuel, Settings, Zap, Users, Luggage, CheckCircle2, Cpu, Leaf, Snowflake, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, debounce } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'

interface SearchParams {
  city_id?: string
  pickup_date?: string
  pickup_time?: string
  return_date?: string
  return_time?: string
  category_id?: string
  passengers?: string
  transmission?: string
  fuel_type?: string
  with_driver?: string
  page?: number
  per_page?: number
  price_min?: string
  price_max?: string

}

interface CarResult {
  id: string
  name: string
  type: string
  provider_code: string
  provider_item_id: string
  location: {
    city: string
    country: string
  }
  pricing: {
    base_price: number
    currency: string
    total: number
    per_day: number
  }
  availability: {
    available: boolean
  }
  images: string[]
  amenities: string[]
  metadata: {
    company_name: string
    model: string
    year: string
    seats: number
    doors: number
    transmission: string
    fuel_type: string
    is_ac: boolean
    features: string[]
    km_included: number
    extra_km_rate: number
    driver_allowance: number
    deposit_amount: number
    insurance_options: any[]
  }
  rating: number
  review_count: number
}

export function CarResults() {
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
    queryKey: ['cars', queryParams],
    queryFn: async () => {
      const response = await api.get<any>('/search/cars', { params: queryParams })
      return response.data
    },
    placeholderData: (previousData) => previousData,
  })

  const cars = data?.data?.results || []
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
    if (searchParams.get('city_id')) params.set('city_id', searchParams.get('city_id')!)
    if (searchParams.get('pickup_date')) params.set('pickup_date', searchParams.get('pickup_date')!)
    if (searchParams.get('return_date')) params.set('return_date', searchParams.get('return_date')!)
    if (searchParams.get('passengers')) params.set('passengers', searchParams.get('passengers')!)
    setSearchParams(params, { replace: true })
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['city_id', 'pickup_date', 'return_date', 'passengers', 'pickup_time', 'return_time'].includes(key)
  ).length

  const pickupDate = searchParams.get('pickup_date')
  const returnDate = searchParams.get('return_date')
  const days = pickupDate && returnDate 
    ? Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24))
    : 1

  const getTransmissionIcon = (transmission: string) => {
    return transmission === 'automatic' ? <Settings className="w-4 h-4" /> : <Cpu className="w-4 h-4" />
  }

  const getFuelIcon = (fuel: string) => {
    if (fuel === 'electric') return <Zap className="w-4 h-4" />
    if (fuel === 'hybrid') return <Leaf className="w-4 h-4" />
    return <Fuel className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-heading-lg font-semibold text-eventra-navy-900">
                {cars.length} {cars.length === 1 ? 'Car' : 'Cars'} Found
              </h1>
              {searchParams.get('city') && (
                <span className="badge badge-primary">
                  <MapPin className="w-3 h-3 mr-1" />
                  {searchParams.get('city')}
                </span>
              )}
              {pickupDate && returnDate && (
                <span className="badge badge-neutral">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(pickupDate)} - {formatDate(returnDate)} ({days} days)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input form-select w-48"
                  aria-label="Sort cars"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
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
        <CarFilters
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
            <CarFilters
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
                <p className="font-medium">Failed to load cars</p>
                <p className="text-body-sm mt-1">{error?.message || 'Please try again'}</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
              </div>
            ) : (
              <>
                {isLoading && cars.length === 0 ? (
                  <PageSkeleton columns={2} />
                ) : cars.length === 0 ? (
                  <div className="text-center py-16">
                    <Car className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">
                      No cars found
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
                        key="cars"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
                      >
                        {cars.map((car) => (
                          <CarResultCard
                            key={car.id}
                            car={car}
                            days={days}
                            onSelect={() => {
                              navigate(`/cars/${car.provider_item_id}`, {
                                state: { 
                                  pickup_date: searchParams.get('pickup_date'),
                                  return_date: searchParams.get('return_date'),
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

function CarResultCard({ car, days, onSelect }: { car: CarResult; days: number; onSelect: () => void }) {
  const metadata = car.metadata

  return (
    <Card variant="interactive" onClick={onSelect} className="h-full flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={car.images[0] || '/placeholder-car.jpg'} 
          alt={car.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <span className="badge badge-primary">★ {car.rating.toFixed(1)}</span>
          <span className={`badge px-3 py-1 ${car.availability.available ? 'badge-success' : 'badge-danger'}`}>
            {car.availability.available ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-eventra-navy-900">{car.name}</span>
          <span className="badge badge-neutral">{metadata.year}</span>
        </div>
        <p className="text-body-sm text-eventra-slate-600 mb-3">{metadata.company_name}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-blue-100 text-eventra-blue-700">
            <Users className="w-3 h-3" /> {metadata.seats} seats
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-green-100 text-eventra-green-700">
            <Settings className="w-3 h-3" /> {metadata.transmission.charAt(0).toUpperCase() + metadata.transmission.slice(1)}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-amber-100 text-eventra-amber-700">
            <Fuel className="w-3 h-3" /> {metadata.fuel_type.charAt(0).toUpperCase() + metadata.fuel_type.slice(1)}
          </span>
          {metadata.is_ac && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-blue-100 text-eventra-blue-700">
              <Snowflake className="w-3 h-3" /> AC
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {metadata.features.slice(0, 4).map((feature) => (
            <span key={feature} className="tag text-body-xs px-2 py-0.5">{feature}</span>
          ))}
          {metadata.features.length > 4 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{metadata.features.length - 4} more</span>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-eventra-slate-200 flex items-center justify-between">
          <div>
            <p className="price-lg text-eventra-navy-900">{formatCurrency(car.pricing.per_day, car.pricing.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">per day × {days} days</p>
          </div>
          <Button className="btn-sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
            Select
          </Button>
        </div>
      </div>
    </Card>
  )
}

function CarFilters({ filters, onChange, onClearAll }: { filters: Partial<SearchParams>; onChange: (filters: Partial<SearchParams>) => void; onClearAll: () => void }) {
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [categories, setCategories] = useState<string[]>([])
  const [transmissions, setTransmissions] = useState<string[]>([])
  const [fuelTypes, setFuelTypes] = useState<string[]>([])
  const [withDriver, setWithDriver] = useState(false)

  const handlePriceChange = debounce((range: number[]) => {
    setPriceRange(range)
    onChange({ price_min: range[0], price_max: range[1] })
  }, 500)

  const toggleCategory = (cat: string) => {
    const newCats = categories.includes(cat)
      ? categories.filter(c => c !== cat)
      : [...categories, cat]
    setCategories(newCats)
  }

  const toggleTransmission = (trans: string) => {
    const newTrans = transmissions.includes(trans)
      ? transmissions.filter(t => t !== trans)
      : [...transmissions, trans]
    setTransmissions(newTrans)
  }

  const toggleFuel = (fuel: string) => {
    const newFuels = fuelTypes.includes(fuel)
      ? fuelTypes.filter(f => f !== fuel)
      : [...fuelTypes, fuel]
    setFuelTypes(newFuels)
  }

  return (
    <Card padding="lg" className="sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900">Filters</h3>
        {(priceRange[0] > 0 || priceRange[1] < 10000 || categories.length > 0 || transmissions.length > 0 || fuelTypes.length > 0 || withDriver) && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <label className="label">Price per Day</label>
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

        {/* Category */}
        <div>
          <label className="label">Category</label>
          <div className="space-y-2">
            {(['Economy', 'Compact', 'Sedan', 'SUV', 'Luxury', 'Van', 'Minivan'] as const).map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Transmission */}
        <div>
          <label className="label">Transmission</label>
          <div className="space-y-2">
            {(['automatic', 'manual'] as const).map((trans) => (
              <label key={trans} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transmissions.includes(trans)}
                  onChange={() => toggleTransmission(trans)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700 capitalize">{trans}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Fuel Type */}
        <div>
          <label className="label">Fuel Type</label>
          <div className="space-y-2">
            {(['petrol', 'diesel', 'electric', 'hybrid'] as const).map((fuel) => (
              <label key={fuel} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fuelTypes.includes(fuel)}
                  onChange={() => toggleFuel(fuel)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700 capitalize">{fuel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Driver */}
        <div>
          <label className="label flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={withDriver}
              onChange={(e) => setWithDriver(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-body-sm text-eventra-navy-700">With Driver</span>
          </label>
        </div>
      </div>
    </Card>
  )
}