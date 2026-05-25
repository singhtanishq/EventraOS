import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DollarSign,
  Clock,
  CheckCircle2,
  Eye,
  Search,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface AdminCommission {
  id: number
  uuid?: string
  commission_reference?: string
  booking_reference?: string
  agent_name?: string
  agent_number?: string
  customer_name?: string
  status?: string
  booking_amount?: number | string
  commission_rate?: number | string
  commission_amount?: number | string
  net_commission?: number | string
  currency?: string
  eligible_date?: string | null
  created_at?: string
}

const PAGE_SIZE = 20

const STATUS_FILTERS = [
  'all', 'pending', 'eligible', 'approved', 'paid', 'reversed', 'cancelled', 'on_hold',
] as const

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'amount_desc', label: 'Highest Commission' },
  { value: 'amount_asc', label: 'Lowest Commission' },
]

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  eligible: 'badge-primary',
  approved: 'badge-success',
  paid: 'badge-success',
  reversed: 'badge-danger',
  cancelled: 'badge-danger',
  on_hold: 'badge-warning',
}

export function AdminCommissions() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [selectedCommission, setSelectedCommission] = useState<AdminCommission | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-commissions', search, filterStatus, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      const body = await api.get<any>('/admin/commissions', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const commissions: AdminCommission[] = data?.data?.commissions ?? []
  const totalCount: number = data?.data?.total_count ?? commissions.length
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const sortedCommissions = useMemo(() => {
    const list = [...commissions]
    switch (sortBy) {
      case 'created_asc':
        return list.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
      case 'amount_desc':
        return list.sort((a, b) => (Number(b.commission_amount) || 0) - (Number(a.commission_amount) || 0))
      case 'amount_asc':
        return list.sort((a, b) => (Number(a.commission_amount) || 0) - (Number(b.commission_amount) || 0))
      default:
        return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    }
  }, [commissions, sortBy])

  const sumBy = (predicate: (c: AdminCommission) => boolean, field: 'commission_amount' | 'net_commission') =>
    commissions.filter(predicate).reduce((sum, c) => sum + (Number(c[field]) || 0), 0)

  if (isLoading && commissions.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader />
        <TableSkeleton rows={8} columns={9} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader />

      {isError ? (
        <div className="alert alert-danger text-center py-12">
          <p className="font-medium">Failed to load commissions</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Commission" value={formatCurrency(sumBy(() => true, 'commission_amount'))} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={formatCurrency(sumBy(c => c.status === 'pending', 'commission_amount'))} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Eligible" value={formatCurrency(sumBy(c => c.status === 'eligible', 'net_commission'))} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Approved" value={formatCurrency(sumBy(c => c.status === 'approved', 'net_commission'))} iconClass="bg-eventra-cyan-100 text-eventra-cyan-600" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Paid" value={formatCurrency(sumBy(c => c.status === 'paid', 'net_commission'))} iconClass="bg-eventra-green-100 text-eventra-green-600" />
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
                <Input
                  placeholder="Search commissions..."
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

          {/* Commissions Table */}
          {sortedCommissions.length === 0 ? (
            <EmptyCommissionsState />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{sortedCommissions.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> commissions
                  {isFetching && <Loader2 className="inline w-4 h-4 ml-2 animate-spin text-eventra-slate-400" />}
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Booking</th>
                      <th>Agent</th>
                      <th className="text-right">Booking Amt</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Commission</th>
                      <th className="text-right">Net</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Eligible</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCommissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <span className="font-mono text-body-sm text-eventra-navy-900">{commission.commission_reference || commission.uuid || commission.id}</span>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-eventra-navy-900">{commission.booking_reference || '—'}</p>
                            <p className="text-body-xs text-eventra-slate-500">{commission.customer_name || '—'}</p>
                          </div>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-eventra-navy-900">{commission.agent_name || '—'}</p>
                            <p className="text-body-xs text-eventra-slate-500">{commission.agent_number || '—'}</p>
                          </div>
                        </td>
                        <td className="text-right">
                          <span className="font-medium text-eventra-navy-900">{formatCurrency(Number(commission.booking_amount) || 0, commission.currency || 'INR')}</span>
                        </td>
                        <td className="text-right">
                          <span className="text-body-sm text-eventra-slate-600">{Number(commission.commission_rate) || 0}%</span>
                        </td>
                        <td className="text-right">
                          <span className="font-semibold text-eventra-navy-900">{formatCurrency(Number(commission.commission_amount) || 0, commission.currency || 'INR')}</span>
                        </td>
                        <td className="text-right">
                          <span className="font-semibold text-eventra-green-600">{formatCurrency(Number(commission.net_commission) || 0, commission.currency || 'INR')}</span>
                        </td>
                        <td className="text-center">
                          <span className={cn('badge', STATUS_BADGE[String(commission.status)] || 'badge-neutral')}>
                            {String(commission.status || '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="text-body-sm text-eventra-slate-600">{commission.eligible_date ? formatDate(commission.eligible_date) : '—'}</span>
                        </td>
                        <td className="text-center">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedCommission(commission); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                            Manage
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

      {/* Commission Manage Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedCommission(null); }}
        title={selectedCommission ? `Commission ${selectedCommission.commission_reference || selectedCommission.id}` : 'Commission Details'}
        size="lg"
      >
        {selectedCommission && (
          <CommissionManageModal
            commission={selectedCommission}
            onUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-commissions'] })
              setShowDetailModal(false)
              setSelectedCommission(null)
            }}
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
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Commissions</h1>
        <p className="text-eventra-slate-600 mt-1">Manage agent commissions and payouts</p>
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

function EmptyCommissionsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <DollarSign className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No commissions yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Complete bookings for agents to start generating commissions.
      </p>
    </motion.div>
  )
}

function CommissionManageModal({ commission, onUpdated }: { commission: AdminCommission; onUpdated: () => void }) {
  const [payoutReference, setPayoutReference] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const status = String(commission.status || '')

  const handleUpdate = async (nextStatus: 'eligible' | 'approved' | 'paid' | 'reversed' | 'on_hold') => {
    if (nextStatus === 'paid' && !payoutReference.trim()) {
      toast.error('A payout reference is required to mark as paid')
      return
    }
    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = { status: nextStatus }
      if (nextStatus === 'paid') payload.payout_reference = payoutReference.trim()
      const body = await api.put<any>(`/admin/commissions/${commission.id}`, payload)
      if (body.success) {
        toast.success(body.message || `Commission marked as ${nextStatus.replace('_', ' ')}`)
        onUpdated()
      } else {
        toast.error(body.message || 'Failed to update commission')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update commission')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <DetailStat label="Status" value={status.replace(/_/g, ' ') || '—'} />
        <DetailStat label="Agent" value={`${commission.agent_name || '—'}${commission.agent_number ? ` (${commission.agent_number})` : ''}`} />
        <DetailStat label="Booking" value={commission.booking_reference || '—'} />
        <DetailStat label="Customer" value={commission.customer_name || '—'} />
        <DetailStat label="Booking Amount" value={formatCurrency(Number(commission.booking_amount) || 0, commission.currency || 'INR')} />
        <DetailStat label="Rate" value={`${Number(commission.commission_rate) || 0}%`} />
        <DetailStat label="Commission" value={formatCurrency(Number(commission.commission_amount) || 0, commission.currency || 'INR')} />
        <DetailStat label="Net Commission" value={formatCurrency(Number(commission.net_commission) || 0, commission.currency || 'INR')} />
        <DetailStat label="Eligible Date" value={commission.eligible_date ? formatDate(commission.eligible_date) : '—'} />
        <DetailStat label="Created" value={commission.created_at ? formatDate(commission.created_at) : '—'} />
      </div>

      {['pending', 'eligible', 'approved', 'on_hold'].includes(status) ? (
        <div className="space-y-4 pt-4 border-t border-eventra-slate-200">
          {status !== 'approved' && (
            <Button className="w-full" loading={isSubmitting} onClick={() => handleUpdate('approved')}>
              Approve Commission
            </Button>
          )}
          {['eligible', 'approved', 'on_hold'].includes(status) && (
            <>
              <Input
                label="Payout Reference (required to mark paid)"
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
                placeholder="e.g. PAYOUT-2024-001"
              />
              <Button variant="success" className="w-full" loading={isSubmitting} onClick={() => handleUpdate('paid')}>
                Mark as Paid
              </Button>
            </>
          )}
          {status !== 'on_hold' && (
            <Button variant="secondary" className="w-full" disabled={isSubmitting} onClick={() => handleUpdate('on_hold')}>
              Put On Hold
            </Button>
          )}
          <Button variant="danger" className="w-full" disabled={isSubmitting} onClick={() => handleUpdate('reversed')}>
            Reverse Commission
          </Button>
        </div>
      ) : (
        <div className="alert alert-info">
          This commission is {status ? `already ${status.replace(/_/g, ' ')}` : 'in an unknown state'} and can no longer be modified.
        </div>
      )}
    </div>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-eventra-slate-50 p-3">
      <p className="text-body-xs text-eventra-slate-500 mb-1">{label}</p>
      <p className="font-semibold text-eventra-navy-900">{value}</p>
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
