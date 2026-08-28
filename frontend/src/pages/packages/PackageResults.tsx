import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, MapPin as MapPinIcon, Calendar, Users, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, debounce } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'
import { useCartStore } from '@/store/cart'

interface SearchParams {
  destination_ids?: string[]
  start_date?: string
  end_date?: string
  duration_min?: string
  duration_max?: string
  participants?: string
  price_min?: string
  price_max?: string
  page?: number
  per_page?: number
}

interface PackageResult {
  id: string
  name: string
  type: string
  provider_code: string
  provider_item_id: string
  location: {
    destinations: { city: string; country: string }[]
  }
  pricing: {
    base_price: number
    currency: string
    total: number
    per_person: number
  }
  availability: {
    available: boolean
    slots_available: number
  }
  images: string[]
  amenities: string[]
  metadata: {
    duration_nights: number
    duration_days: number
    min_participants: number
    max_participants: number
    includes: string[]
    excludes: string[]
    highlights: string[]
    pricing_tiers: PricingTier[]
  }
  rating: number
  review_count: number
}

interface PricingTier {
  id: string
  name: string
  occupancy: string
  price: number
  currency: string
  includes: string[]
  room_configuration: string
}

const todayISO = new Date().toISOString().split('T')[0]
const weekLaterISO = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

export function PackageResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<Partial<SearchParams>>({})
  const [sortBy, setSortBy] = useState('recommended')
  const [showFilters, setShowFilters] = useState(false)
  const { addItem } = useCartStore()

  useEffect(() => {
    const initialFilters: Partial<SearchParams> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'per_page') {
        (initialFilters as Record<string, string>)[key] = value
      }
    })
    setFilters(initialFilters)
  }, [searchParams])

  // Sensible date defaults so the validator (end_date must be after start_date) always passes
  const startDate = filters.start_date || searchParams.get('start_date') || todayISO
  const endDate = filters.end_date || searchParams.get('end_date') || (startDate !== todayISO ? undefined : weekLaterISO)

  const queryParams = {
    ...filters,
    start_date: startDate,
    end_date: endDate,
    sort: sortBy,
    page: parseInt(searchParams.get('page') || '1'),
    per_page: 20,
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['packages', queryParams],
    queryFn: async () => {
      const body = await api.get<any>('/search/packages', { params: queryParams })
      return body
    },
    placeholderData: (previousData) => previousData,
  })

  const packages: PackageResult[] = data?.data?.results ?? []
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
    if (searchParams.get('destination_ids')) {
      searchParams.getAll('destination_ids').forEach(v => params.append('destination_ids', v))
    }
    if (searchParams.get('start_date')) params.set('start_date', searchParams.get('start_date')!)
    if (searchParams.get('end_date')) params.set('end_date', searchParams.get('end_date')!)
    if (searchParams.get('participants')) params.set('participants', searchParams.get('participants')!)
    setSearchParams(params, { replace: true })
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['destination_ids', 'start_date', 'end_date', 'participants'].includes(key)
  ).length

  const handleSelect = (pkg: PackageResult) => {
    const tierPrices = pkg.metadata.pricing_tiers.map(t => t.price)
    const basePrice = tierPrices.length > 0 ? Math.min(...tierPrices) : (pkg.pricing.per_person ?? pkg.pricing.total ?? 0)
    addItem({
      type: 'package',
      serviceId: pkg.provider_item_id || pkg.id,
      providerId: pkg.provider_code,
      name: pkg.name,
      image: pkg.images[0],
      dates: { start: startDate, end: endDate },
      guests: { adults: parseInt(searchParams.get('participants') || '1') || 1, children: 0 },
      options: [],
      pricing: {
        basePrice,
        taxes: 0,
        fees: 0,
        serviceFee: 0,
        discount: 0,
        optionsTotal: 0,
        total: basePrice,
        currency: pkg.pricing.currency || 'INR',
        breakdown: [],
      },
      availability: { available: pkg.availability.available },
    })
    toast.success('Added to cart')
    navigate('/checkout')
  }

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Search Header */}
      <div className="sticky top-16 z-30 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-heading-lg font-semibold text-eventra-navy-900">
                {packages.length} {packages.length === 1 ? 'Package' : 'Packages'} Found
              </h1>
              {searchParams.get('destination') && (
                <span className="badge badge-primary">
                  <MapPin className="w-3 h-3 mr-1" />
                  {searchParams.get('destination')}
                </span>
              )}
              <span className="badge badge-neutral">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(startDate)}{endDate ? ` - ${formatDate(endDate)}` : ''}
              </span>
              {searchParams.get('participants') && (
                <span className="badge badge-neutral">
                  <Users className="w-3 h-3 mr-1" />
                  {searchParams.get('participants')} travelers
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input form-select w-48"
                  aria-label="Sort packages"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="duration">Duration</option>
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
        <PackageFilters
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
            <PackageFilters
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
                <p className="font-medium">Failed to load packages</p>
                <p className="text-body-sm mt-1">{error?.message || 'Please try again'}</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
              </div>
            ) : (
              <>
                {isLoading && packages.length === 0 ? (
                  <PageSkeleton columns={2} />
                ) : packages.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">
                      No packages found
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
                        key="packages"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
                      >
                        {packages.map((pkg) => (
                          <PackageResultCard
                            key={pkg.id}
                            pkg={pkg}
                            onSelect={() => handleSelect(pkg)}
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

function PackageResultCard({ pkg, onSelect }: { pkg: PackageResult; onSelect: () => void }) {
  const metadata = pkg.metadata

  // Calculate savings if there are multiple tiers
  const tierPrices = metadata.pricing_tiers.map(t => t.price)
  const minPrice = tierPrices.length > 0 ? Math.min(...tierPrices) : 0
  const maxPrice = tierPrices.length > 0 ? Math.max(...tierPrices) : 0
  const savings = maxPrice > minPrice ? maxPrice - minPrice : 0

  return (
    <Card variant="interactive" onClick={onSelect} className="h-full flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={pkg.images[0] || '/placeholder-package.jpg'}
          alt={pkg.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <span className="badge badge-primary">
            {pkg.metadata.duration_nights}N/{pkg.metadata.duration_days}D
          </span>
          <span className={`badge px-3 py-1 ${pkg.availability.available ? 'badge-success' : 'badge-danger'}`}>
            {pkg.availability.available ? 'Available' : 'Sold Out'}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="badge badge-primary">★ {pkg.rating.toFixed(1)}</span>
          <span className="badge badge-neutral">({pkg.review_count} reviews)</span>
        </div>
        {savings > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="badge badge-success">Save {formatCurrency(savings, pkg.pricing.currency)}</span>
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 line-clamp-1">{pkg.name}</h3>
        <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1 flex-wrap">
          {pkg.location.destinations.map((d, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-eventra-slate-400">→</span>}
              <MapPinIcon className="w-3 h-3" />
              {d.city}
            </span>
          ))}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {metadata.highlights.slice(0, 3).map((highlight) => (
            <span key={highlight} className="tag text-body-xs px-2 py-0.5">{highlight}</span>
          ))}
          {metadata.highlights.length > 3 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{metadata.highlights.length - 3} more</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-blue-100 text-eventra-blue-700">
            <Calendar className="w-3 h-3" /> {metadata.duration_nights}N/{metadata.duration_days}D
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-green-100 text-eventra-green-700">
            <Users className="w-3 h-3" /> {metadata.min_participants}-{metadata.max_participants || '∞'} travelers
          </span>
        </div>
        <div className="mt-auto pt-4 border-t border-eventra-slate-200 flex items-center justify-between">
          <div>
            {metadata.pricing_tiers.length > 1 ? (
              <>
                <p className="price-lg text-eventra-navy-900">{formatCurrency(minPrice, pkg.pricing.currency)}</p>
                <p className="text-body-xs text-eventra-slate-500">starting from / {metadata.pricing_tiers[0]?.occupancy || 'per person'}</p>
              </>
            ) : (
              <>
                <p className="price-lg text-eventra-navy-900">{formatCurrency(pkg.pricing.per_person, pkg.pricing.currency)}</p>
                <p className="text-body-xs text-eventra-slate-500">per person</p>
              </>
            )}
          </div>
          <Button className="btn-sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
            Select
          </Button>
        </div>
      </div>
    </Card>
  )
}

function PackageFilters({ filters, onChange, onClearAll }: { filters: Partial<SearchParams>; onChange: (filters: Partial<SearchParams>) => void; onClearAll: () => void }) {
  const [priceRange, setPriceRange] = useState([0, 500000])
  const [durationRange, setDurationRange] = useState([1, 30])
  const [destinations, setDestinations] = useState<string[]>([])
  const [themes, setThemes] = useState<string[]>([])

  const handlePriceChange = debounce((range: number[]) => {
    setPriceRange(range)
    onChange({ price_min: String(range[0]), price_max: String(range[1]) })
  }, 500)

  const toggleDestination = (dest: string) => {
    const newDests = destinations.includes(dest)
      ? destinations.filter(d => d !== dest)
      : [...destinations, dest]
    setDestinations(newDests)
    onChange({ destination_ids: newDests })
  }

  const toggleTheme = (theme: string) => {
    const newThemes = themes.includes(theme)
      ? themes.filter(t => t !== theme)
      : [...themes, theme]
    setThemes(newThemes)
  }

  return (
    <Card padding="lg" className="sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900">Filters</h3>
        {(priceRange[0] > 0 || priceRange[1] < 500000 || destinations.length > 0 || themes.length > 0) && (
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

        {/* Duration */}
        <div>
          <label className="label">Duration (Nights)</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="30"
              value={durationRange[0]}
              onChange={(e) => setDurationRange([parseInt(e.target.value), durationRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="1"
              max="30"
              value={durationRange[1]}
              onChange={(e) => setDurationRange([durationRange[0], parseInt(e.target.value)])}
              className="flex-1"
            />
          </div>
          <div className="flex justify-between text-body-xs text-eventra-slate-500 mt-1">
            <span>{durationRange[0]} nights</span>
            <span>{durationRange[1]}+ nights</span>
          </div>
        </div>

        {/* Destinations */}
        <div>
          <label className="label">Destinations</label>
          <div className="space-y-2">
            {['Dubai', 'Maldives', 'Thailand', 'Singapore', 'Bali', 'Europe', 'USA', 'Australia'].map((dest) => (
              <label key={dest} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={destinations.includes(dest)}
                  onChange={() => toggleDestination(dest)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{dest}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="label">Theme</label>
          <div className="space-y-2">
            {['Beach', 'Adventure', 'Cultural', 'Romantic', 'Family', 'Luxury', 'Budget', 'Wildlife'].map((theme) => (
              <label key={theme} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={themes.includes(theme)}
                  onChange={() => toggleTheme(theme)}
                  className="form-checkbox"
                />
                <span className="text-body-sm text-eventra-navy-700">{theme}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Inclusions */}
        <div>
          <label className="label">Includes</label>
          <div className="space-y-2">
            {['Flights', 'Hotel', 'Meals', 'Transfers', 'Activities', 'Guide', 'Visa Assistance', 'Insurance'].map((inc) => (
              <label key={inc} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox" />
                <span className="text-body-sm text-eventra-navy-700">{inc}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
