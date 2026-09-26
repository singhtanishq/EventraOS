import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, CheckCircle2, Clock, X, DollarSign, Calendar, Users, CreditCard, Search, User, Mail, Phone, Building2, RefreshCw, ChevronRight, Package, Plane, Train, Bus, Car, Sparkles, Truck, MapPin, Download, Ticket } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface BookingItem {
  id: number
  item_type: string
  service_name: string
  service_date?: string | null
  service_end_date?: string | null
  service_time?: string | null
  item_status?: string
  total_price?: number
  currency?: string
  travelers?: unknown[] | null
}

interface AgentBooking {
  id: number
  booking_reference: string
  customer_name: string
  customer_email: string
  service_type: string
  service_name: string
  status: string
  payment_status?: string
  amount: number
  currency: string
  travel_date?: string | null
  created_at: string
  items?: BookingItem[] | null
}

type FilterStatus = 'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed'
type FilterType = 'all' | 'hotel' | 'flight' | 'venue' | 'train' | 'bus' | 'car' | 'activity' | 'transfer' | 'package'
type SortKey = 'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc' | 'date_desc'

function statusVariant(status?: string): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
  switch (status) {
    case 'confirmed':
    case 'completed':
    case 'rescheduled':
    case 'refunded':
      return 'success'
    case 'pending':
    case 'partially_confirmed':
    case 'reschedule_requested':
    case 'refund_pending':
      return 'warning'
    case 'cancelled':
    case 'cancel_requested':
    case 'failed':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function AgentBookings() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortKey>('created_desc')
  const [selectedBooking, setSelectedBooking] = useState<AgentBooking | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['agent-bookings', filterStatus],
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (filterStatus !== 'all') params.status = filterStatus
      const body = await api.get<any>('/agent/bookings', params)
      return body
    },
  })

  const bookings: AgentBooking[] = data?.data?.bookings ?? []
  const totalCount: number = Number(data?.data?.total_count ?? bookings.length)

  const filteredBookings = bookings
    .filter((b) => {
      if (filterType !== 'all') {
        const items = b.items ?? []
        if (!items.some((item) => item.item_type === filterType)) return false
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${b.booking_reference || ''} ${b.customer_name || ''} ${b.customer_email || ''} ${b.service_name || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'amount_desc':
          return (Number(b.amount) || 0) - (Number(a.amount) || 0)
        case 'amount_asc':
          return (Number(a.amount) || 0) - (Number(b.amount) || 0)
        case 'date_desc':
          return new Date(b.travel_date || 0).getTime() - new Date(a.travel_date || 0).getTime()
        case 'created_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  if (isLoading) return <TableSkeleton rows={5} columns={5} />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load bookings</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4" leftIcon={<RefreshCw className="w-5 h-5" />}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Bookings</h1>
          <p className="text-eventra-slate-600 mt-1">Manage your customers' bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<ClipboardList className="w-6 h-6" />} label="Total Bookings" value={bookings.length} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Confirmed" value={bookings.filter((b) => b.status === 'confirmed').length} color="eventra-green" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={bookings.filter((b) => b.status === 'pending' || b.status === 'partially_confirmed').length} color="eventra-amber" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Completed" value={bookings.filter((b) => b.status === 'completed').length} color="eventra-teal" />
        <StatCard icon={<X className="w-6 h-6" />} label="Cancelled" value={bookings.filter((b) => b.status === 'cancelled').length} color="eventra-red" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Total Value" value={formatCurrency(bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0))} color="eventra-green" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'confirmed', 'pending', 'cancelled', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-4 py-2 rounded-xl text-body-sm font-medium transition-all',
                  filterStatus === status
                    ? 'bg-eventra-navy-900 text-white shadow-card'
                    : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
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
              aria-label="Filter by type"
            />
            <div className="w-56">
              <Input
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              options={[
                { value: 'created_desc', label: 'Newest First' },
                { value: 'created_asc', label: 'Oldest First' },
                { value: 'amount_desc', label: 'Highest Value' },
                { value: 'amount_asc', label: 'Lowest Value' },
                { value: 'date_desc', label: 'Latest Travel' },
              ]}
              className="w-44"
              aria-label="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <EmptyBookingsState hasFilters={filterType !== 'all' || !!search.trim()} />
        ) : (
          <>
            <p className="text-body-md text-eventra-slate-600">
              Showing <strong>{filteredBookings.length}</strong> of <strong>{totalCount}</strong> bookings
            </p>
            <div className="space-y-4">
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 10) * 0.03 }}
                >
                  <AgentBookingCard
                    booking={booking}
                    onView={() => { setSelectedBooking(booking); setShowDetailModal(true); }}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedBooking(null); }}
        title={selectedBooking ? `Booking ${selectedBooking.booking_reference}` : 'Booking Details'}
        size="xl"
      >
        {selectedBooking && <BookingDetailModal booking={selectedBooking} />}
      </Modal>
    </div>
  )
}

function AgentBookingCard({ booking, onView }: { booking: AgentBooking; onView: () => void }) {
  const items = booking.items ?? []
  const firstItem = items[0]
  const travelerCount = items.reduce((sum, item) => sum + (Array.isArray(item.travelers) ? item.travelers.length : 0), 0)

  return (
    <Card variant="interactive" onClick={onView} padding="md">
      <div className="flex gap-4">
        <div className="relative w-20 h-20 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
          {getServiceIcon(firstItem?.item_type || booking.service_type)}
          <span className={cn('absolute -top-2 -right-2',)}>
            <Badge variant={statusVariant(booking.status)} size="sm">{String(booking.status || '').replace(/_/g, ' ')}</Badge>
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-eventra-navy-900 truncate">
                {items.length > 0 ? items.map((i) => i.service_name).join(', ') : booking.service_name}
              </h3>
              <p className="text-body-sm text-eventra-slate-600">{booking.booking_reference} • {booking.customer_name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="price-md text-eventra-navy-900">{formatCurrency(Number(booking.amount) || 0, booking.currency || 'INR')}</p>
              <p className="text-body-xs text-eventra-slate-500">Total</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-body-sm text-eventra-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {booking.travel_date || firstItem?.service_date ? formatDate(booking.travel_date || firstItem?.service_date) : 'TBD'}
            </span>
            {travelerCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {travelerCount} traveler{travelerCount !== 1 ? 's' : ''}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              {String(booking.payment_status || '—').replace(/_/g, ' ')}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-eventra-slate-400">
              <ChevronRight className="w-4 h-4" />
              View details
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyBookingsState({ hasFilters }: { hasFilters?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <ClipboardList className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No bookings found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        {hasFilters ? 'No bookings match your current filters. Try adjusting your search criteria.' : 'Bookings you create for your customers will appear here.'}
      </p>
    </motion.div>
  )
}

function BookingDetailModal({ booking }: { booking: AgentBooking }) {
  const items = booking.items ?? []

  const copyReference = () => {
    navigator.clipboard?.writeText(booking.booking_reference || '').then(
      () => toast.success('Booking reference copied'),
      () => toast.error('Could not copy reference')
    )
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <button onClick={copyReference} className="inline-flex items-center gap-2 font-mono text-body-sm text-eventra-slate-500 hover:text-eventra-navy-900">
          {booking.booking_reference}
          <Download className="w-3.5 h-3.5" />
        </button>
        <Badge variant={statusVariant(booking.status)}>{String(booking.status || '').replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Customer Details</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <User className="w-4 h-4" />
              <span>{booking.customer_name || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span>{booking.customer_email || '—'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Booking Details</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Payment Status</span>
              <Badge variant={booking.payment_status === 'paid' ? 'success' : booking.payment_status === 'partial' ? 'warning' : 'neutral'} size="sm">
                {String(booking.payment_status || '—').replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Total Amount</span>
              <span className="font-semibold text-eventra-navy-900">{formatCurrency(Number(booking.amount) || 0, booking.currency || 'INR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Booked On</span>
              <span className="font-medium text-eventra-navy-900">{formatDate(booking.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Travel Date</span>
              <span className="font-medium text-eventra-navy-900">{booking.travel_date ? formatDate(booking.travel_date) : 'TBD'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-eventra-slate-200">
        <h4 className="font-semibold text-eventra-navy-900 mb-4">Booking Items</h4>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id ?? index} className="border border-eventra-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                      {getServiceIcon(item.item_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-eventra-navy-900">{item.service_name || '—'}</h4>
                      <p className="text-body-sm text-eventra-slate-600 capitalize">{item.item_type || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="price-md text-eventra-navy-900">{formatCurrency(Number(item.total_price) || 0, item.currency || booking.currency || 'INR')}</p>
                    {item.item_status && (
                      <Badge variant={statusVariant(item.item_status)} size="sm" className="mt-1">
                        {String(item.item_status).replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-eventra-slate-200">
                  <div>
                    <p className="text-body-xs text-eventra-slate-500">Date</p>
                    <p className="font-medium text-eventra-navy-900">{item.service_date ? formatDate(item.service_date) : 'TBD'}</p>
                  </div>
                  {item.service_end_date && (
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">End Date</p>
                      <p className="font-medium text-eventra-navy-900">{formatDate(item.service_end_date)}</p>
                    </div>
                  )}
                  {Array.isArray(item.travelers) && item.travelers.length > 0 && (
                    <div>
                      <p className="text-body-xs text-eventra-slate-500">Travelers</p>
                      <p className="font-medium text-eventra-navy-900">{item.travelers.length}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-eventra-slate-600 text-center py-4">No item details available for this booking</p>
        )}
      </div>

      <div className="pt-4 border-t border-eventra-slate-200 flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          leftIcon={<Ticket className="w-5 h-5" />}
          onClick={() => toast('Voucher downloads are not available yet', { icon: 'ℹ️' })}
        >
          Voucher
        </Button>
        <Button
          variant="outline"
          className="flex-1 text-eventra-red-600 border-eventra-red-300 hover:bg-eventra-red-50"
          leftIcon={<X className="w-5 h-5" />}
          onClick={() => toast('Cancellation requests are handled by the support team', { icon: 'ℹ️' })}
        >
          Request Cancel
        </Button>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const map: Record<string, string> = {
    'eventra-blue': 'bg-eventra-blue-100 text-eventra-blue-600',
    'eventra-teal': 'bg-eventra-teal-100 text-eventra-teal-600',
    'eventra-green': 'bg-eventra-green-100 text-eventra-green-600',
    'eventra-amber': 'bg-eventra-amber-100 text-eventra-amber-600',
    'eventra-red': 'bg-eventra-red-100 text-eventra-red-600',
  }
  return (
    <Card variant="elevated" padding="md" className="text-center">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3', map[color] || map['eventra-blue'])}>
        {icon}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-md font-display font-bold text-eventra-navy-900 mt-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </Card>
  )
}

function getServiceIcon(type?: string) {
  switch (type) {
    case 'hotel': return <Building2 className="w-6 h-6 text-eventra-blue-600" />
    case 'flight': return <Plane className="w-6 h-6 text-eventra-cyan-600" />
    case 'venue': return <MapPin className="w-6 h-6 text-eventra-red-600" />
    case 'train': return <Train className="w-6 h-6 text-eventra-teal-600" />
    case 'bus': return <Bus className="w-6 h-6 text-eventra-amber-600" />
    case 'car': return <Car className="w-6 h-6 text-eventra-green-600" />
    case 'activity': return <Sparkles className="w-6 h-6 text-eventra-blue-600" />
    case 'transfer': return <Truck className="w-6 h-6 text-eventra-cyan-600" />
    case 'package': return <Package className="w-6 h-6 text-eventra-navy-600" />
    default: return <Package className="w-6 h-6 text-eventra-navy-600" />
  }
}
