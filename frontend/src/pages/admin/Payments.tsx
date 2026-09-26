import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  CreditCard,
  CheckCircle2,
  X,
  Wallet,
  RotateCcw,
  Eye,
  Search,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'

interface AdminPayment {
  id: number
  uuid?: string
  payment_reference?: string
  booking_reference?: string
  customer_name?: string
  payment_method_name?: string
  status?: string
  amount?: number | string
  currency?: string
  gateway_status?: string | null
  initiated_at?: string
}

const PAGE_SIZE = 20

const STATUS_FILTERS = [
  'all', 'initiated', 'processing', 'authorized', 'captured', 'failed',
  'cancelled', 'refunded', 'partially_refunded', 'pending_verification', 'expired',
] as const

const METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
]

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'amount_desc', label: 'Highest Amount' },
  { value: 'amount_asc', label: 'Lowest Amount' },
]

const METHOD_MATCHERS: Record<string, string[]> = {
  card: ['card'],
  upi: ['upi'],
  netbanking: ['net banking', 'netbanking'],
  wallet: ['wallet'],
  bank_transfer: ['bank transfer', 'bank_transfer'],
}

const STATUS_BADGE: Record<string, string> = {
  captured: 'badge-success',
  authorized: 'badge-primary',
  processing: 'badge-warning',
  initiated: 'badge-neutral',
  failed: 'badge-danger',
  cancelled: 'badge-danger',
  refunded: 'badge-success',
  partially_refunded: 'badge-warning',
  pending_verification: 'badge-warning',
  expired: 'badge-danger',
}

export function AdminPayments() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-payments', search, filterStatus, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      const body = await api.get<any>('/admin/payments', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const payments: AdminPayment[] = data?.data?.payments ?? []
  const totalCount: number = data?.data?.total_count ?? payments.length
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const filteredPayments = useMemo(() => {
    let list = [...payments]
    if (filterMethod !== 'all') {
      const needles = METHOD_MATCHERS[filterMethod] || [filterMethod]
      list = list.filter(p => {
        const name = String(p.payment_method_name || '').toLowerCase()
        return needles.some(n => name.includes(n))
      })
    }
    switch (sortBy) {
      case 'created_asc':
        return list.sort((a, b) => String(a.initiated_at || '').localeCompare(String(b.initiated_at || '')))
      case 'amount_desc':
        return list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
      case 'amount_asc':
        return list.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0))
      default:
        return list.sort((a, b) => String(b.initiated_at || '').localeCompare(String(a.initiated_at || '')))
    }
  }, [payments, filterMethod, sortBy])

  if (isLoading && payments.length === 0) {
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
          <p className="font-medium">Failed to load payments</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<CreditCard className="w-5 h-5" />} label="Total Payments" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Successful" value={payments.filter(p => ['captured', 'authorized'].includes(String(p.status))).length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<X className="w-5 h-5" />} label="Failed" value={payments.filter(p => ['failed', 'cancelled'].includes(String(p.status))).length} iconClass="bg-eventra-red-100 text-eventra-red-600" />
            <StatCard icon={<Wallet className="w-5 h-5" />} label="Total Amount (page)" value={formatCurrency(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0))} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<RotateCcw className="w-5 h-5" />} label="Refunded (page)" value={formatCurrency(payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + (Number(p.amount) || 0), 0))} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
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
                      'px-3 py-2 rounded-xl text-body-sm font-medium transition-all',
                      filterStatus === status
                        ? 'bg-eventra-navy-900 text-white shadow-card'
                        : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                    )}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
                <Select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  options={METHOD_OPTIONS}
                  aria-label="Filter by method"
                  className="w-44"
                />
                <Input
                  placeholder="Search payments..."
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
                  className="w-40"
                />
              </div>
            </div>
          </Card>

          {/* Payments Table */}
          {filteredPayments.length === 0 ? (
            <EmptyPaymentsState />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{filteredPayments.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> payments
                  {isFetching && <Loader2 className="inline w-4 h-4 ml-2 animate-spin text-eventra-slate-400" />}
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Booking</th>
                      <th>Customer</th>
                      <th>Method</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Gateway</th>
                      <th className="text-center">Date</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <p className="font-mono text-body-sm text-eventra-navy-900">{payment.payment_reference || payment.uuid || payment.id}</p>
                        </td>
                        <td>
                          <p className="font-medium text-eventra-navy-900">{payment.booking_reference || '—'}</p>
                        </td>
                        <td>
                          <p className="font-medium text-eventra-navy-900">{payment.customer_name || '—'}</p>
                        </td>
                        <td>
                          <span className="badge badge-neutral">{payment.payment_method_name || '—'}</span>
                        </td>
                        <td className="text-right">
                          <p className="font-semibold text-eventra-navy-900">{formatCurrency(Number(payment.amount) || 0, payment.currency || 'INR')}</p>
                        </td>
                        <td className="text-center">
                          <span className={cn('badge', STATUS_BADGE[String(payment.status)] || 'badge-neutral')}>
                            {String(payment.status || '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-center">
                          {payment.gateway_status ? (
                            <span className="badge badge-neutral">{payment.gateway_status}</span>
                          ) : (
                            <span className="text-body-xs text-eventra-slate-400">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <p className="text-body-sm text-eventra-slate-600">{payment.initiated_at ? formatDateTime(payment.initiated_at) : '—'}</p>
                        </td>
                        <td className="text-center">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedPayment(payment); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                            View
                          </Button>
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

      {/* Payment Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedPayment(null); }}
        title={selectedPayment ? `Payment ${selectedPayment.payment_reference || selectedPayment.id}` : 'Payment Details'}
        size="lg"
      >
        {selectedPayment && <PaymentDetailModal payment={selectedPayment} />}
      </Modal>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Payments</h1>
        <p className="text-eventra-slate-600 mt-1">All payment transactions across the platform</p>
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

function EmptyPaymentsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <CreditCard className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No payments found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No payments match your current filters.
      </p>
    </motion.div>
  )
}

function PaymentDetailModal({ payment }: { payment: AdminPayment }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-payment', payment.id],
    queryFn: async () => {
      const body = await api.get<any>(`/admin/payments/${payment.id}`)
      return body
    },
    enabled: !!payment.id,
  })

  const detail = data?.data ?? {}
  const attempts: any[] = detail.attempts ?? []
  const refunds: any[] = detail.refunds ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <DetailStat label="Status" value={String(detail.status ?? payment.status ?? '—').replace(/_/g, ' ')} />
        <DetailStat label="Amount" value={formatCurrency(Number(detail.amount ?? payment.amount) || 0, detail.currency ?? payment.currency ?? 'INR')} />
        <DetailStat label="Customer" value={String(detail.customer?.user?.name ?? payment.customer_name ?? '—')} />
        <DetailStat label="Payment Method" value={String(detail.paymentMethod?.name ?? payment.payment_method_name ?? '—')} />
        <DetailStat label="Booking" value={String(detail.booking?.booking_reference ?? payment.booking_reference ?? '—')} />
        <DetailStat label="Gateway Status" value={String(detail.gateway_status ?? payment.gateway_status ?? '—')} />
        <DetailStat label="Initiated" value={detail.initiated_at || payment.initiated_at ? formatDateTime(detail.initiated_at ?? payment.initiated_at) : '—'} />
        <DetailStat label="Captured" value={detail.captured_at ? formatDateTime(detail.captured_at) : '—'} />
        <DetailStat label="Failed" value={detail.failed_at ? formatDateTime(detail.failed_at) : '—'} />
        <DetailStat label="Failure Reason" value={detail.failure_reason ? String(detail.failure_reason) : '—'} />
      </div>

      {attempts.length > 0 && (
        <div className="pt-4 border-t border-eventra-slate-200">
          <h4 className="font-semibold text-eventra-navy-900 mb-3">Gateway Attempts</h4>
          <div className="space-y-2">
            {attempts.map((a, i) => (
              <div key={a.id ?? i} className="flex items-center justify-between p-3 rounded-xl bg-eventra-slate-50">
                <div>
                  <p className="font-medium text-eventra-navy-900 text-body-sm">{a.provider_code || a.provider_id || `Attempt ${i + 1}`}</p>
                  <p className="text-body-xs text-eventra-slate-500">{a.created_at ? formatDateTime(a.created_at) : '—'}</p>
                </div>
                <span className={cn('badge', a.status === 'success' ? 'badge-success' : a.status === 'failed' ? 'badge-danger' : 'badge-neutral')}>
                  {String(a.status || 'unknown').replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {refunds.length > 0 && (
        <div className="pt-4 border-t border-eventra-slate-200">
          <h4 className="font-semibold text-eventra-navy-900 mb-3">Refunds</h4>
          <div className="space-y-2">
            {refunds.map((r, i) => (
              <div key={r.id ?? i} className="flex items-center justify-between p-3 rounded-xl bg-eventra-slate-50">
                <div>
                  <p className="font-mono text-body-sm text-eventra-navy-900">{r.refund_reference || r.id}</p>
                  <p className="text-body-xs text-eventra-slate-500">{r.reason || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-eventra-navy-900 text-body-sm">{formatCurrency(Number(r.requested_amount) || 0, r.currency || 'INR')}</p>
                  <span className="badge badge-neutral">{String(r.status || 'unknown').replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && <p className="text-body-sm text-eventra-slate-500 text-center">Loading payment details…</p>}
      {isError && (
        <div className="alert alert-warning">
          Could not load full payment details.{' '}
          <span className="text-body-xs">Summary shown above.</span>
        </div>
      )}
    </div>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-eventra-slate-50 p-3">
      <p className="text-body-xs text-eventra-slate-500 mb-1">{label}</p>
      <p className="font-semibold text-eventra-navy-900 capitalize">{value}</p>
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
