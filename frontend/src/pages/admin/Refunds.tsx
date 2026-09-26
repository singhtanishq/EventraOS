import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  DollarSign,
  Eye,
  Search,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface AdminRefund {
  id: number
  uuid?: string
  refund_reference?: string
  booking_reference?: string
  customer_name?: string
  refund_type?: string
  reason?: string
  status?: string
  requested_amount?: number | string
  approved_amount?: number | string | null
  net_refund?: number | string | null
  currency?: string
  created_at?: string
}

const PAGE_SIZE = 20

const STATUS_FILTERS = [
  'all', 'requested', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'failed', 'cancelled',
] as const

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'full', label: 'Full Refund' },
  { value: 'partial', label: 'Partial Refund' },
  { value: 'wallet_credit', label: 'Wallet Credit' },
  { value: 'loyalty_points', label: 'Loyalty Points' },
]

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'amount_desc', label: 'Highest Amount' },
  { value: 'amount_asc', label: 'Lowest Amount' },
]

const STATUS_BADGE: Record<string, string> = {
  requested: 'badge-warning',
  under_review: 'badge-warning',
  approved: 'badge-primary',
  rejected: 'badge-danger',
  processing: 'badge-warning',
  completed: 'badge-success',
  failed: 'badge-danger',
  cancelled: 'badge-neutral',
}

const TYPE_BADGE: Record<string, string> = {
  full: 'badge-primary',
  partial: 'badge-warning',
  wallet_credit: 'badge-warning',
  loyalty_points: 'badge-primary',
}

export function AdminRefunds() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [selectedRefund, setSelectedRefund] = useState<AdminRefund | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-refunds', search, filterStatus, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      const body = await api.get<any>('/admin/refunds', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const refunds: AdminRefund[] = data?.data?.refunds ?? []
  const totalCount: number = data?.data?.total_count ?? refunds.length
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const filteredRefunds = useMemo(() => {
    let list = [...refunds]
    if (filterType !== 'all') {
      list = list.filter(r => r.refund_type === filterType)
    }
    switch (sortBy) {
      case 'created_asc':
        return list.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
      case 'amount_desc':
        return list.sort((a, b) => (Number(b.requested_amount) || 0) - (Number(a.requested_amount) || 0))
      case 'amount_asc':
        return list.sort((a, b) => (Number(a.requested_amount) || 0) - (Number(b.requested_amount) || 0))
      default:
        return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    }
  }, [refunds, filterType, sortBy])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-refunds'] })

  if (isLoading && refunds.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader />
        <TableSkeleton rows={8} columns={8} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader />

      {isError ? (
        <div className="alert alert-danger text-center py-12">
          <p className="font-medium">Failed to load refunds</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard icon={<RotateCcw className="w-5 h-5" />} label="Total Refunds" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={refunds.filter(r => ['requested', 'under_review', 'approved', 'processing'].includes(String(r.status))).length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={refunds.filter(r => r.status === 'completed').length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<X className="w-5 h-5" />} label="Failed/Rejected" value={refunds.filter(r => ['rejected', 'failed'].includes(String(r.status))).length} iconClass="bg-eventra-red-100 text-eventra-red-600" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Refunded" value={formatCurrency(refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + (Number(r.net_refund) || 0), 0))} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Under Review" value={refunds.filter(r => r.status === 'under_review').length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
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
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  options={TYPE_OPTIONS}
                  aria-label="Filter by type"
                  className="w-40"
                />
                <Input
                  placeholder="Search refunds..."
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

          {/* Refunds Table */}
          {filteredRefunds.length === 0 ? (
            <EmptyRefundsState />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{filteredRefunds.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> refunds
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
                      <th>Type</th>
                      <th className="text-right">Requested</th>
                      <th className="text-right">Approved</th>
                      <th className="text-right">Net Refund</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Requested On</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRefunds.map((refund) => (
                      <tr key={refund.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <p className="font-mono text-body-sm text-eventra-navy-900">{refund.refund_reference || refund.uuid || refund.id}</p>
                        </td>
                        <td>
                          <p className="font-medium text-eventra-navy-900">{refund.booking_reference || '—'}</p>
                        </td>
                        <td>
                          <p className="font-medium text-eventra-navy-900">{refund.customer_name || '—'}</p>
                        </td>
                        <td>
                          <span className={cn('badge capitalize', TYPE_BADGE[String(refund.refund_type)] || 'badge-neutral')}>
                            {String(refund.refund_type || '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-right">
                          <p className="font-medium text-eventra-navy-900">{formatCurrency(Number(refund.requested_amount) || 0, refund.currency || 'INR')}</p>
                        </td>
                        <td className="text-right">
                          <p className="font-medium text-eventra-green-600">{refund.approved_amount != null ? formatCurrency(Number(refund.approved_amount), refund.currency || 'INR') : '—'}</p>
                        </td>
                        <td className="text-right">
                          <p className="font-semibold text-eventra-green-600">{refund.net_refund != null ? formatCurrency(Number(refund.net_refund), refund.currency || 'INR') : '—'}</p>
                        </td>
                        <td className="text-center">
                          <span className={cn('badge', STATUS_BADGE[String(refund.status)] || 'badge-neutral')}>
                            {String(refund.status || '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-center">
                          <p className="text-body-sm text-eventra-slate-600">{refund.created_at ? formatDateTime(refund.created_at) : '—'}</p>
                        </td>
                        <td className="text-center">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedRefund(refund); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                            Review
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

      {/* Refund Review Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedRefund(null); }}
        title={selectedRefund ? `Refund ${selectedRefund.refund_reference || selectedRefund.id}` : 'Refund Details'}
        size="lg"
      >
        {selectedRefund && (
          <RefundReviewModal
            refund={selectedRefund}
            onUpdated={() => { invalidate(); setShowDetailModal(false); setSelectedRefund(null) }}
          />
        )}
      </Modal>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Refunds</h1>
        <p className="text-eventra-slate-600 mt-1">Review and process refund requests</p>
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

function EmptyRefundsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <RotateCcw className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No refunds found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No refund requests match your current filters.
      </p>
    </motion.div>
  )
}

function RefundReviewModal({ refund, onUpdated }: { refund: AdminRefund; onUpdated: () => void }) {
  const [approvedAmount, setApprovedAmount] = useState(String(Number(refund.requested_amount) || 0))
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const status = String(refund.status || '')
  const actionable = ['requested', 'under_review', 'approved', 'processing'].includes(status)

  const handleUpdate = async (nextStatus: 'approved' | 'rejected' | 'processing' | 'completed') => {
    if (nextStatus === 'rejected' && !rejectionReason.trim()) {
      toast.error('A rejection reason is required')
      return
    }
    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = { status: nextStatus }
      if (nextStatus === 'rejected') {
        payload.rejection_reason = rejectionReason.trim()
      } else if (nextStatus === 'approved' || nextStatus === 'completed') {
        payload.approved_amount = Number(approvedAmount) || 0
      }
      const body = await api.put<any>(`/admin/refunds/${refund.id}`, payload)
      if (body.success) {
        toast.success(body.message || `Refund marked as ${nextStatus}`)
        onUpdated()
      } else {
        toast.error(body.message || 'Failed to update refund')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update refund')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <DetailStat label="Status" value={status.replace(/_/g, ' ') || '—'} />
        <DetailStat label="Type" value={String(refund.refund_type || '—').replace(/_/g, ' ')} />
        <DetailStat label="Booking" value={refund.booking_reference || '—'} />
        <DetailStat label="Customer" value={refund.customer_name || '—'} />
        <DetailStat label="Requested Amount" value={formatCurrency(Number(refund.requested_amount) || 0, refund.currency || 'INR')} />
        <DetailStat label="Net Refund" value={refund.net_refund != null ? formatCurrency(Number(refund.net_refund), refund.currency || 'INR') : '—'} />
        <DetailStat label="Reason" value={refund.reason || '—'} />
        <DetailStat label="Requested On" value={refund.created_at ? formatDateTime(refund.created_at) : '—'} />
      </div>

      {actionable ? (
        <div className="space-y-4 pt-4 border-t border-eventra-slate-200">
          <Input
            label="Approved Amount"
            type="number"
            min="0"
            step="0.01"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
            hint="Defaults to the full requested amount"
          />
          {status !== 'approved' && (
            <Button
              className="w-full"
              loading={isSubmitting}
              onClick={() => handleUpdate('approved')}
            >
              Approve Refund
            </Button>
          )}
          {(status === 'approved' || status === 'processing') && (
            <Button
              variant="success"
              className="w-full"
              loading={isSubmitting}
              onClick={() => handleUpdate('completed')}
            >
              Mark Completed
            </Button>
          )}
          {['requested', 'under_review'].includes(status) && (
            <Button
              variant="secondary"
              className="w-full"
              loading={isSubmitting}
              onClick={() => handleUpdate('processing')}
            >
              Mark Processing
            </Button>
          )}
          <div className="space-y-2">
            <Textarea
              label="Rejection Reason (required to reject)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Why is this refund being rejected?"
            />
            <Button
              variant="danger"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => handleUpdate('rejected')}
            >
              Reject Refund
            </Button>
          </div>
        </div>
      ) : (
        <div className="alert alert-info">
          This refund is {status ? `already ${status.replace(/_/g, ' ')}` : 'in an unknown state'} and can no longer be modified.
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
