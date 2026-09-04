import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  X,
  DollarSign,
  Search,
  Eye,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface AdminBooking {
  id: number
  uuid?: string
  booking_reference?: string
  customer_name?: string
  customer_email?: string
  items?: { id?: number; item_type?: string; service_name?: string; service_date?: string }[]
  status?: string
  payment_status?: string
  grand_total?: number
  currency?: string
  amount_paid?: number
  amount_refunded?: number
  created_at?: string
}

const STATUS_FILTERS = ['all', 'confirmed', 'pending', 'payment_pending', 'completed', 'cancelled', 'cancel_requested'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const TYPE_OPTIONS = [
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
]

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'amount_desc', label: 'Highest Value' },
  { value: 'amount_asc', label: 'Lowest Value' },
]

const PAGE_SIZE = 20

export function AdminBookings() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-bookings', search, filterStatus, filterType, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterType !== 'all') params.type = filterType
      const body = await api.get<any>('/admin/bookings', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const detailQuery = useQuery({
    queryKey: ['admin-booking-detail', selectedBookingId],
    queryFn: async () => {
      const body = await api.get<any>(`/admin/bookings/${selectedBookingId}`)
      return body
    },
    enabled: selectedBookingId !== null,
  })

  const bookings: AdminBooking[] = data?.data?.bookings ?? []
  const totalCount: number = data?.data?.total_count ?? 0
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const sortedBookings = (() => {
    const list = [...bookings]
    switch (sortBy) {
      case 'created_asc':
        return list.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
      case 'amount_desc':
        return list.sort((a, b) => (b.grand_total ?? 0) - (a.grand_total ?? 0))
      case 'amount_asc':
        return list.sort((a, b) => (a.grand_total ?? 0) - (b.grand_total ?? 0))
      default:
        return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    }
  })()

  const updateStatus = async (status: string) => {
    if (!selectedBookingId) return
    setIsUpdating(true)
    try {
      const body = await api.put<any>(`/admin/bookings/${selectedBookingId}`, { status })
      if (body.success) {
        toast.success(body.message || `Booking marked as ${status}`)
        queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
        queryClient.invalidateQueries({ queryKey: ['admin-booking-detail'] })
      } else {
        toast.error(body.message || 'Failed to update booking')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update booking')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading && bookings.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader />
        <TableSkeleton rows={8} columns={7} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader />

      {isError ? (
        <div className="alert alert-danger text-center py-12">
          <p className="font-medium">Failed to load bookings</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Total Bookings" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Confirmed" value={bookings.filter(b => b.status === 'confirmed').length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={bookings.filter(b => b.status === 'pending' || b.status === 'payment_pending').length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={bookings.filter(b => b.status === 'completed').length} iconClass="bg-eventra-teal-100 text-eventra-teal-600" />
            <StatCard icon={<X className="w-5 h-5" />} label="Cancelled" value={bookings.filter(b => b.status === 'cancelled').length} iconClass="bg-eventra-red-100 text-eventra-red-600" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Value (page)" value={formatCurrency(bookings.reduce((sum, b) => sum + (b.grand_total ?? 0), 0))} iconClass="bg-eventra-green-100 text-eventra-green-600" />
          </div>

          {/* Filters */}
          <Card variant="elevated" padding="md">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    onClick={() => { setFilterStatus(status); setPage(1) }}
                    className={cn(
                      'px-4 py-2 rounded-xl text-body-sm font-medium transition-all',
                      filterStatus === status
                        ? 'bg-eventra-navy-900 text-white shadow-card'
                        : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                    )}
                  >
                    {status === 'all' ? 'All' : status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
                <Select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
                  options={TYPE_OPTIONS}
                  aria-label="Filter by type"
                  className="w-40"
                />
                <Input
                  placeholder="Search bookings..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="max-w-xs"
                />
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={SORT_OPTIONS}
                  aria-label="Sort by"
                  className="w-44"
                />
              </div>
            </div>
          </Card>

          {/* Bookings Table */}
          {sortedBookings.length === 0 ? (
            <EmptyBookingsState />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{sortedBookings.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> bookings
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Payment</th>
                      <th className="text-center">Date</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <p className="font-mono text-body-sm text-eventra-navy-900">{booking.booking_reference || booking.uuid || booking.id}</p>
                        </td>
                        <td>
                          <p className="font-medium text-eventra-navy-900">{booking.customer_name || '—'}</p>
                          <p className="text-body-xs text-eventra-slate-500">{booking.customer_email || ''}</p>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {(booking.items ?? []).map((item, i) => (
                              <span key={item.id ?? i} className="badge badge-neutral capitalize">{item.item_type || 'item'}</span>
                            ))}
                            {(booking.items ?? []).length === 0 && <span className="text-body-xs text-eventra-slate-400">—</span>}
                          </div>
                        </td>
                        <td className="text-right">
                          <p className="font-semibold text-eventra-navy-900">{formatCurrency(booking.grand_total ?? 0, booking.currency || 'INR')}</p>
                        </td>
                        <td className="text-center">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="text-center">
                          <PaymentStatusBadge status={booking.payment_status} />
                        </td>
                        <td className="text-center">
                          <p className="text-body-sm text-eventra-slate-600">{booking.created_at ? formatDate(booking.created_at) : '—'}</p>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="xs" onClick={() => { setSelectedBookingId(booking.id); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {/* Booking Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedBookingId(null); }}
        title={detailQuery.data?.data?.booking_reference ? `Booking ${detailQuery.data.data.booking_reference}` : 'Booking Details'}
        size="xl"
      >
        <BookingDetailModal
          detailQuery={detailQuery}
          isUpdating={isUpdating}
          onUpdateStatus={updateStatus}
        />
      </Modal>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Bookings</h1>
        <p className="text-eventra-slate-600 mt-1">Manage all bookings across the platform</p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, iconClass }: { icon: React.ReactNode; label: string; value: string | number; iconClass?: string }) {
  return (
    <Card variant="elevated" padding="lg" className="text-center">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3', iconClass || 'bg-eventra-blue-100 text-eventra-blue-600')}>
        {icon}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-lg font-display font-bold text-eventra-navy-900 mt-1">{value}</p>
    </Card>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const s = status || ''
  return (
    <span className={cn('badge',
      s === 'confirmed' ? 'badge-success' :
      s === 'pending' ? 'badge-warning' :
      s === 'cancelled' ? 'badge-danger' :
      s === 'completed' ? 'badge-primary' :
      s === 'cancel_requested' ? 'badge-danger' :
      s === 'failed' ? 'badge-danger' : 'badge-neutral'
    )}>
      {s.replace(/_/g, ' ') || 'unknown'}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status?: string }) {
  const s = status || ''
  return (
    <span className={cn('badge',
      s === 'paid' ? 'badge-success' :
      s === 'partial' || s === 'partially_refunded' || s === 'pending_verification' ? 'badge-warning' :
      s === 'refunded' ? 'badge-primary' :
      s === 'failed' ? 'badge-danger' : 'badge-neutral'
    )}>
      {s.replace(/_/g, ' ') || 'unknown'}
    </span>
  )
}

function EmptyBookingsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <ClipboardList className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No bookings found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No bookings match your current filters.
      </p>
    </motion.div>
  )
}

function BookingDetailModal({ detailQuery, isUpdating, onUpdateStatus }: {
  detailQuery: { data?: any; isLoading: boolean; isError: boolean; refetch: () => void }
  isUpdating: boolean
  onUpdateStatus: (status: string) => void
}) {
  const booking: any = detailQuery.data?.data

  if (detailQuery.isLoading) {
    return <div className="py-8 text-center text-eventra-slate-500">Loading booking details…</div>
  }

  if (detailQuery.isError || !booking) {
    return (
      <div className="alert alert-danger">
        Failed to load booking details.{' '}
        <button className="link" onClick={() => detailQuery.refetch()}>Retry</button>
      </div>
    )
  }

  const items: any[] = booking.items ?? []
  const payments: any[] = booking.payments ?? []
  const refunds: any[] = booking.refunds ?? []

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-eventra-slate-50 p-4">
          <p className="text-body-xs text-eventra-slate-500">Customer</p>
          <p className="font-medium text-eventra-navy-900">{booking.customer?.user?.name || '—'}</p>
          <p className="text-body-xs text-eventra-slate-500">{booking.customer?.user?.email || ''}</p>
        </div>
        <div className="rounded-xl bg-eventra-slate-50 p-4">
          <p className="text-body-xs text-eventra-slate-500">Amounts</p>
          <p className="font-semibold text-eventra-navy-900">{formatCurrency(Number(booking.grand_total) || 0, booking.currency || 'INR')}</p>
          <p className="text-body-xs text-eventra-slate-500">
            Paid: {formatCurrency(Number(booking.amount_paid) || 0, booking.currency || 'INR')} • Refunded: {formatCurrency(Number(booking.amount_refunded) || 0, booking.currency || 'INR')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={booking.status} />
        <PaymentStatusBadge status={booking.payment_status} />
        <span className="text-body-xs text-eventra-slate-500">
          Created {booking.created_at ? formatDateTime(booking.created_at) : '—'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-eventra-slate-200">
        <Button size="sm" variant="outline" disabled={isUpdating || booking.status === 'confirmed'} onClick={() => onUpdateStatus('confirmed')}>
          Mark Confirmed
        </Button>
        <Button size="sm" variant="outline" disabled={isUpdating || booking.status === 'completed'} onClick={() => onUpdateStatus('completed')}>
          Mark Completed
        </Button>
        <Button size="sm" variant="danger" disabled={isUpdating || booking.status === 'cancelled'} onClick={() => onUpdateStatus('cancelled')}>
          Cancel Booking
        </Button>
      </div>

      <div>
        <h4 className="font-semibold text-eventra-navy-900 mb-3">Items</h4>
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={item.id ?? i} className="flex items-center justify-between p-3 rounded-xl border border-eventra-slate-200">
                <div>
                  <p className="font-medium text-eventra-navy-900">{item.service_name || '—'}</p>
                  <p className="text-body-xs text-eventra-slate-500 capitalize">{item.item_type || 'item'}{item.service_date ? ` • ${formatDate(item.service_date)}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-eventra-slate-500 py-4 text-center">No items on this booking</p>
        )}
      </div>

      {payments.length > 0 && (
        <div>
          <h4 className="font-semibold text-eventra-navy-900 mb-3">Payments</h4>
          <div className="space-y-2">
            {payments.map((p, i) => (
              <div key={p.id ?? i} className="flex items-center justify-between p-3 rounded-xl border border-eventra-slate-200">
                <div>
                  <p className="font-mono text-body-sm text-eventra-navy-900">{p.payment_reference || p.id}</p>
                  <p className="text-body-xs text-eventra-slate-500">{p.initiated_at ? formatDateTime(p.initiated_at) : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-eventra-navy-900">{formatCurrency(Number(p.amount) || 0, p.currency || booking.currency || 'INR')}</p>
                  <span className="badge badge-neutral">{p.status || 'unknown'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {refunds.length > 0 && (
        <div>
          <h4 className="font-semibold text-eventra-navy-900 mb-3">Refunds</h4>
          <div className="space-y-2">
            {refunds.map((r, i) => (
              <div key={r.id ?? i} className="flex items-center justify-between p-3 rounded-xl border border-eventra-slate-200">
                <p className="font-mono text-body-sm text-eventra-navy-900">{r.refund_reference || r.id}</p>
                <div className="text-right">
                  <p className="font-medium text-eventra-navy-900">{formatCurrency(Number(r.requested_amount) || 0, r.currency || booking.currency || 'INR')}</p>
                  <span className="badge badge-neutral">{r.status || 'unknown'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Previous
      </Button>
      <span className="text-body-sm font-medium text-eventra-navy-900 px-4">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next
      </Button>
    </div>
  )
}
