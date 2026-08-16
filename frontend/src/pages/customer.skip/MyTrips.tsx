import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { ListSkeleton } from '@/components/ui/LoadingScreen'

type TripFilter = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'pending'
type TripType = 'all' | 'hotel' | 'flight' | 'venue' | 'train' | 'bus' | 'car' | 'activity' | 'transfer' | 'package'

interface Trip {
  id: string
  booking_reference: string
  type: string
  name: string
  start_date: string
  end_date?: string
  status: string
  image?: string
  location: { city: string; country: string }
  travelers: number
  amount: number
  currency: string
}

const typeIcons: Record<string, React.ReactNode> = {
  hotel: <Building2 className="w-5 h-5" />,
  flight: <Plane className="w-5 h-5" />,
  venue: <MapPinIcon className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  bus: <Bus className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  activity: <Sparkles className="w-5 h-5" />,
  transfer: <Truck className="w-5 h-5" />,
  package: <Package className="w-5 h-5" />,
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-eventra-green-100 text-eventra-green-700'
    case 'pending': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'cancelled': return 'bg-eventra-red-100 text-eventra-red-700'
    case 'completed': return 'bg-eventra-blue-100 text-eventra-blue-700'
    default: return 'bg-eventra-slate-100 text-eventra-slate-700'
  }
}

export function MyTrips() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<TripFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TripType>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc')
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['customer-trips', filter, typeFilter, search, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('filter', filter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (search) params.set('search', search)
      params.set('sort', sortBy)
      const response = await api.get('/customer/trips', { params })
      return response.data
    },
  })

  const trips = data?.data?.trips || []
  const totalCount = data?.data?.total_count || 0

  const handleFilterChange = (newFilter: TripFilter) => {
    setFilter(newFilter)
  }

  const handleTypeFilterChange = (newType: TripType) => {
    setTypeFilter(newType)
  }

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort)
  }

  const clearFilters = () => {
    setFilter('all')
    setTypeFilter('all')
    setSearch('')
  }

  const activeFiltersCount = (filter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (search ? 1 : 0)

  if (isLoading) return <TripsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">My Trips</h1>
          <p className="text-eventra-slate-600 mt-1">Manage all your bookings in one place</p>
        </div>
        <Link to="/search" className="btn-primary">
          <Sparkles className="w-5 h-5 mr-2" />
          Book New Trip
        </Link>
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'upcoming', 'completed', 'cancelled', 'pending'] as TripFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={cn(
                  'px-4 py-2 rounded-xl text-body-sm font-medium transition-all',
                  filter === f
                    ? 'bg-eventra-navy-900 text-white shadow-card'
                    : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Type Filter & Search */}
          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <div className="relative">
              <Select
                value={typeFilter}
                onValueChange={handleTypeFilterChange}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'hotel', label: 'Hotels' },
                  { value: 'flight', label: 'Flights' },
                  { value: 'venue', label: 'Venues' },
                  { value: 'train', label: 'Trains' },
                  { value: 'bus', label: 'Buses' },
                  { value: 'car', label: 'Cars' },
                  { value: 'activity', label: 'Activities' },
                  { value: 'transfer', label: 'Transfers' },
                  { value: 'package', label: 'Packages' },
                ]}
                className="w-40"
                placeholder="Filter by type"
              />
            </div>
            <div className="relative flex-1 max-w-xs">
              <Input
                placeholder="Search trips..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="relative">
              <Select
                value={sortBy}
                onValueChange={handleSortChange}
                options={[
                  { value: 'date_desc', label: 'Newest First' },
                  { value: 'date_asc', label: 'Oldest First' },
                  { value: 'amount_desc', label: 'Highest Price' },
                  { value: 'amount_asc', label: 'Lowest Price' },
                ]}
                className="w-40"
                placeholder="Sort by"
              />
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <TripsSkeleton />
        ) : trips.length === 0 ? (
          <EmptyTripsState onSearch={() => navigate('/search')} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{trips.length}</strong> of <strong>{totalCount}</strong> trips
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${filter}-${typeFilter}-${search}-${sortBy}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <TripCard trip={trip} onClick={() => navigate(`/customer/bookings/${trip.booking_reference}`)} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalCount > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(totalCount / 20)} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  const daysUntil = trip.start_date ? Math.ceil((new Date(trip.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <Card variant="interactive" onClick={onClick} className="p-4">
      <div className="flex gap-4">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
          <img 
            src={trip.image || '/placeholder-trip.jpg'} 
            alt={trip.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span className={cn('absolute top-2 right-2 badge px-2 py-1 text-body-xs', getStatusColor(trip.status))}>
            {trip.status}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {typeIcons[trip.type] || <Package className="w-6 h-6 text-eventra-slate-400" />}
              <div>
                <h3 className="font-semibold text-eventra-navy-900 truncate">{trip.name}</h3>
                <p className="text-body-sm text-eventra-slate-600">{trip.booking_reference}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="price-md text-eventra-navy-900">{formatCurrency(trip.amount, trip.currency)}</p>
              <p className="text-body-xs text-eventra-slate-500">Total</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-body-sm text-eventra-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(trip.start_date)} - {formatDate(trip.end_date || trip.start_date)}
            </span>
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              {trip.location.city}, {trip.location.country}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
            </span>
            {trip.start_date && (
              <span className={cn('px-2 py-1 rounded-full text-body-xs font-medium', daysUntil > 0 ? 'bg-eventra-blue-100 text-eventra-blue-700' : 'bg-eventra-green-100 text-eventra-green-700')}>
                {daysUntil > 0 ? `${daysUntil} days left` : 'Ongoing'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyTripsState({ onSearch }: { onSearch: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Suitcase className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No trips found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        {`You don't have any trips matching your current filters. Try adjusting your filters or book your first trip!`}
      </p>
      <Button onClick={onSearch} size="lg" leftIcon={<Sparkles className="w-5 h-5" />}>
        Explore Destinations
      </Button>
    </motion.div>
  )
}

function TripsSkeleton() {
  return (
    <div className="space-y-4">
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <Card key={i} variant="outlined" padding="md" className="animate-pulse" />
      ))}
    </div>
  )
}

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={currentPage <= 1}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          className={cn(
            'w-10 h-10 rounded-xl font-medium transition-colors',
            page === currentPage
              ? 'bg-eventra-navy-900 text-white'
              : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
          )}
        >
          {page}
        </button>
      ))}
      {totalPages > 5 && <span className="px-4 text-eventra-slate-500">...</span>}
      {totalPages > 5 && (
        <button className="w-10 h-10 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100">
          {totalPages}
        </button>
      )}
      <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

const activeFiltersCount = (filter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (search ? 1 : 0)

const clearFilters = () => {
  setFilter('all')
  setTypeFilter('all')
  setSearch('')
}