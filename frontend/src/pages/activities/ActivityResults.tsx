import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, MapPin as MapPinIcon, Clock, Users, Utensils, Waves, Mountain, TreePine, Building2, Ticket, Sparkles, Calendar, User } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, debounce } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageSkeleton } from '@/components/ui/LoadingScreen'
import { Modal } from '@/components/ui/Modal'

interface SearchParams {
  city_id?: string
  category_id?: string
  date?: string
  participants?: string
  duration_min?: string
  duration_max?: string
  price_min?: string
  price_max?: string
  page?: number
  per_page?: number
}

interface ActivityResult {
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
    per_person: number
  }
  availability: {
    available: boolean
    slots_available: number
  }
  images: string[]
  amenities: string[]
  metadata: {
    category_name: string
    duration_minutes: number
    min_participants: number
    max_participants: number
    inclusions: string[]
    exclusions: string[]
    requirements: string[]
    highlights: string[]
    is_private: boolean
    has_guide: boolean
    guide_languages: string[]
    is_wheelchair_accessible: boolean
  }
  rating: number
  review_count: number
}

export function ActivityResults() {
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
    queryKey: ['activities', queryParams],
    queryFn: async () => {
      const response = await api.get<any>('/search/activities', { params: queryParams })
      return response
    },
    placeholderData: (previousData) => previousData,
  })

  const activities = data?.data?.results || []
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
    if (searchParams.get('date')) params.set('date', searchParams.get('date')!)
    if (searchParams.get('participants')) params.set('participants', searchParams.get('participants')!)
    setSearchParams(params, { replace: true })
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['city_id', 'date', 'participants'].includes(key)
  ).length

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sightseeing': return <Building2 className="w-4 h-4" />
      case 'adventure': return <Mountain className="w-4 h-4" />
      case 'cultural': return <Sparkles className="w-4 h-4" />
      case 'food': return <Utensils className="w-4 h-4" />
      case 'nature': return <TreePine className="w-4 h-4" />
      case 'water': return <Waves className="w-4 h-4" />
      default: return <Ticket className="w-4 h-4" />
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
                {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'} Found
              </h1>
              {searchParams.get('city') && (
                <span className="badge badge-primary">
                  <MapPin className="w-3 h-3 mr-1" />
                  {searchParams.get('city')}
                </span>
              )}
              {searchParams.get('date') && (
                <span className="badge badge-neutral">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(searchParams.get('date')!)}
                </span>
              )}
              {searchParams.get('participants') && (
                <span className="badge badge-neutral">
                  <Users className="w-3 h-3 mr-1" />
                  {searchParams.get('participants')} participants
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="input form-select w-48"
                  aria-label="Sort activities"
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
        <ActivityFilters
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
            <ActivityFilters
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
                <p className="font-medium">Failed to load activities</p>
                <p className="text-body-sm mt-1">{error?.message || 'Please try again'}</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
              </div>
            ) : (
              <>
                {isLoading && activities.length === 0 ? (
                  <PageSkeleton columns={2} />
                ) : activities.length === 0 ? (
                  <div className="text-center py-16">
                    <Ticket className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">
                      No activities found
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
                        key="activities"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
                      >
                        {activities.map((activity) => (
                          <ActivityResultCard
                            key={activity.id}
                            activity={activity}
                            onSelect={() => {
                              navigate(`/activities/${activity.provider_item_id}`, {
                                state: { 
                                  date: searchParams.get('date'),
                                  participants: searchParams.get('participants')
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

function ActivityResultCard({ activity, onSelect }: { activity: ActivityResult; onSelect: () => void }) {
  const metadata = activity.metadata

  return (
    <Card variant="interactive" onClick={onSelect} className="h-full flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={activity.images[0] || '/placeholder-activity.jpg'} 
          alt={activity.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <span className="badge badge-primary">
            {getCategoryIcon(metadata.category_name)}
            {metadata.category_name}
          </span>
          <span className={`badge px-3 py-1 ${activity.availability.available ? 'badge-success' : 'badge-danger'}`}>
            {activity.availability.available ? 'Available' : 'Sold Out'}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="badge badge-primary">★ {activity.rating.toFixed(1)}</span>
          <span className="badge badge-neutral">({activity.review_count} reviews)</span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 line-clamp-1">{activity.name}</h3>
        <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
          <MapPinIcon className="w-4 h-4" />
          {activity.location.city}, {activity.location.country}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-blue-100 text-eventra-blue-700">
            <Clock className="w-3 h-3" /> {formatDuration(metadata.duration_minutes)}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-green-100 text-eventra-green-700">
            <Users className="w-3 h-3" /> {metadata.min_participants}-{metadata.max_participants || '∞'} people
          </span>
          {metadata.has_guide && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-body-xs font-medium bg-eventra-slate-100 text-eventra-slate-700">
              <User className="w-3 h-3" /> Guide included
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {metadata.highlights.slice(0, 3).map((highlight) => (
            <span key={highlight} className="tag text-body-xs px-2 py-0.5">{highlight}</span>
          ))}
          {metadata.highlights.length > 3 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{metadata.highlights.length - 3} more</span>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-eventra-slate-200 flex items-center justify-between">
          <div>
            <p className="price-lg text-eventra-navy-900">{formatCurrency(activity.pricing.per_person, activity.pricing.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">per person</p>
          </div>
          <Button className="btn-sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
            Select
          </Button>
        </div>
      </div>
    </Card>
  )

  function getCategoryIcon(category: string) {
    switch (category.toLowerCase()) {
      case 'sightseeing': return <Building2 className="w-3 h-3" />
      case 'adventure': return <Mountain className="w-3 h-3" />
      case 'cultural': return <Sparkles className="w-3 h-3" />
      case 'food': return <Utensils className="w-3 h-3" />
      case 'nature': return <TreePine className="w-3 h-3" />
      case 'water': return <Waves className="w-3 h-3" />
      default: return <Ticket className="w-3 h-3" />
    }
  }

  function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }
}

function ActivityFilters({ filters, onChange, onClearAll }: { filters: Partial<SearchParams>; onChange: (filters: Partial<SearchParams>) => void; onClearAll: () => void }) {
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [categories, setCategories] = useState<string[]>([])
  const [durationRange, setDurationRange] = useState([0, 480])
  const [participantsRange, setParticipantsRange] = useState([1, 50])

  const handlePriceChange = debounce((range: number[]) => {
    setPriceRange(range)
    onChange({ price_min: String(range[0]), price_max: String(range[1]) })
  }, 500)

  const toggleCategory = (cat: string) => {
    const newCats = categories.includes(cat)
      ? categories.filter(c => c !== cat)
      : [...categories, cat]
    setCategories(newCats)
  }

  return (
    <Card padding="lg" className="sticky top-24 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900">Filters</h3>
        {(priceRange[0] > 0 || priceRange[1] < 10000 || categories.length > 0) && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <label className="label">Price per Person</label>
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
            {(['Sightseeing', 'Adventure', 'Cultural', 'Food & Drink', 'Nature & Wildlife', 'Water Sports', 'Wellness', 'Nightlife'] as const).map((cat) => (
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

        {/* Duration */}
        <div>
          <label className="label">Duration</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="480"
              value={durationRange[0]}
              onChange={(e) => setDurationRange([parseInt(e.target.value), durationRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="480"
              value={durationRange[1]}
              onChange={(e) => setDurationRange([durationRange[0], parseInt(e.target.value)])}
              className="flex-1"
            />
          </div>
          <div className="flex justify-between text-body-xs text-eventra-slate-500 mt-1">
            <span>{durationRange[0]} min</span>
            <span>{durationRange[1]} min</span>
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="label">Group Size</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="50"
              value={participantsRange[0]}
              onChange={(e) => setParticipantsRange([parseInt(e.target.value), participantsRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="1"
              max="50"
              value={participantsRange[1]}
              onChange={(e) => setParticipantsRange([participantsRange[0], parseInt(e.target.value)])}
              className="flex-1"
            />
          </div>
          <div className="flex justify-between text-body-xs text-eventra-slate-500 mt-1">
            <span>{participantsRange[0]} people</span>
            <span>{participantsRange[1]}+ people</span>
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="label">Features</label>
          <div className="space-y-2">
            {(['Private Tour', 'Guide Included', 'Meals Included', 'Transport Included', 'Wheelchair Accessible', 'Family Friendly'] as const).map((feature) => (
              <label key={feature} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="form-checkbox" />
                <span className="text-body-sm text-eventra-navy-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}