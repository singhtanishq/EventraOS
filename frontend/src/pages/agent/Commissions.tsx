import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Clock, CheckCircle2, Search, Eye, Download, RefreshCw, Calendar, Landmark } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AgentCommission {
  id: number
  commission_reference: string
  booking_id?: number
  booking_item_id?: number
  customer_id?: number
  booking_amount: number
  commission_rate: number
  commission_amount: number
  tax_amount: number
  net_commission: number
  currency: string
  commission_type?: 'percentage' | 'fixed' | 'tiered'
  status: 'pending' | 'eligible' | 'approved' | 'paid' | 'reversed' | 'cancelled' | 'on_hold'
  eligible_date?: string | null
  approved_at?: string | null
  paid_at?: string | null
  payout_reference?: string | null
  reversed_at?: string | null
  reversal_reason?: string | null
  created_at: string
}

interface CommissionSummary {
  total_earned?: number
  total_net?: number
  pending?: number
  eligible?: number
  approved?: number
  paid?: number
  this_month_target?: number
  paid_this_month?: number
}

type FilterStatus = 'all' | 'pending' | 'eligible' | 'approved' | 'paid' | 'reversed' | 'cancelled' | 'on_hold'
type SortKey = 'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc'

function commissionVariant(status: string): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
  switch (status) {
    case 'paid':
    case 'approved':
      return 'success'
    case 'eligible':
      return 'primary'
    case 'pending':
    case 'on_hold':
      return 'warning'
    case 'reversed':
    case 'cancelled':
      return 'danger'
    default:
      return 'neutral'
  }
}

function formatRate(commission: AgentCommission): string {
  const rate = Number(commission.commission_rate) || 0
  if (commission.commission_type === 'fixed') return formatCurrency(rate, commission.currency)
  const pct = rate > 0 && rate <= 1 ? rate * 100 : rate
  return `${Number(pct.toFixed(2))}%`
}

export function AgentCommissions() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortKey>('created_desc')
  const [selectedCommission, setSelectedCommission] = useState<AgentCommission | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['agent-commissions'],
    queryFn: async () => {
      const body = await api.get<any>('/agent/commissions')
      return body
    },
  })

  const commissions: AgentCommission[] = data?.data?.commissions ?? []
  const summary: CommissionSummary | undefined = data?.data?.summary

  const filteredCommissions = commissions
    .filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${c.commission_reference || ''} ${c.booking_id ?? ''} ${c.payout_reference || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'amount_desc':
          return (Number(b.net_commission) || 0) - (Number(a.net_commission) || 0)
        case 'amount_asc':
          return (Number(a.net_commission) || 0) - (Number(b.net_commission) || 0)
        case 'created_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  if (isLoading) return <CommissionsSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load commissions</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4" leftIcon={<RefreshCw className="w-5 h-5" />}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Commissions</h1>
          <p className="text-eventra-slate-600 mt-1">Track your commission earnings and payouts</p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Download className="w-5 h-5" />}
          onClick={() => toast('Commission exports are not available yet', { icon: 'ℹ️' })}
        >
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <StatCard icon={<DollarSign className="w-6 h-6" />} label="Total Earned" value={formatCurrency(summary.total_earned ?? 0)} color="eventra-green" />
          <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={formatCurrency(summary.pending ?? 0)} color="eventra-amber" />
          <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Eligible" value={formatCurrency(summary.eligible ?? 0)} color="eventra-blue" />
          <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Approved" value={formatCurrency(summary.approved ?? 0)} color="eventra-teal" />
          <StatCard icon={<Landmark className="w-6 h-6" />} label="Paid" value={formatCurrency(summary.paid ?? 0)} color="eventra-green" />
        </motion.div>
      )}

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'eligible', 'approved', 'paid', 'reversed', 'on_hold'] as const).map((status) => (
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
                {status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <div className="w-56">
              <Input
                placeholder="Search by reference..."
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
              ]}
              className="w-44"
              aria-label="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Commissions Table */}
      <div className="space-y-4">
        {filteredCommissions.length === 0 ? (
          <EmptyCommissionsState hasFilters={filterStatus !== 'all' || !!search.trim()} />
        ) : (
          <>
            <p className="text-body-md text-eventra-slate-600">
              Showing <strong>{filteredCommissions.length}</strong> of <strong>{commissions.length}</strong> commissions
            </p>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Booking</th>
                    <th>Type</th>
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
                  {filteredCommissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-eventra-slate-50">
                      <td>
                        <span className="font-mono text-body-sm text-eventra-navy-900">{commission.commission_reference}</span>
                      </td>
                      <td>
                        <p className="font-medium text-eventra-navy-900">#{commission.booking_id ?? '—'}</p>
                        <p className="text-body-xs text-eventra-slate-500">{formatDate(commission.created_at)}</p>
                      </td>
                      <td>
                        <span className="badge badge-neutral capitalize">{commission.commission_type || '—'}</span>
                      </td>
                      <td className="text-right">
                        <span className="font-medium text-eventra-navy-900">{formatCurrency(Number(commission.booking_amount) || 0, commission.currency)}</span>
                      </td>
                      <td className="text-right">
                        <span className="text-body-sm text-eventra-slate-600">{formatRate(commission)}</span>
                      </td>
                      <td className="text-right">
                        <span className="font-semibold text-eventra-navy-900">{formatCurrency(Number(commission.commission_amount) || 0, commission.currency)}</span>
                      </td>
                      <td className="text-right">
                        <span className="font-semibold text-eventra-green-600">{formatCurrency(Number(commission.net_commission) || 0, commission.currency)}</span>
                      </td>
                      <td className="text-center">
                        <Badge variant={commissionVariant(commission.status)} size="sm">
                          {String(commission.status || '').replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="text-center text-body-sm text-eventra-slate-600">
                        {commission.eligible_date ? formatDate(commission.eligible_date) : '—'}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() => { setSelectedCommission(commission); setShowDetailModal(true); }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedCommission(null); }}
        title={selectedCommission ? `Commission ${selectedCommission.commission_reference}` : 'Commission Details'}
        size="lg"
      >
        {selectedCommission && <CommissionDetailModal commission={selectedCommission} />}
      </Modal>
    </div>
  )
}

function CommissionDetailModal({ commission }: { commission: AgentCommission }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Booking', value: commission.booking_id ? `#${commission.booking_id}` : '—' },
    { label: 'Type', value: commission.commission_type || '—' },
    { label: 'Booking Amount', value: formatCurrency(Number(commission.booking_amount) || 0, commission.currency) },
    { label: 'Rate', value: formatRate(commission) },
    { label: 'Commission', value: formatCurrency(Number(commission.commission_amount) || 0, commission.currency) },
    { label: 'Tax', value: formatCurrency(Number(commission.tax_amount) || 0, commission.currency) },
    { label: 'Net Commission', value: formatCurrency(Number(commission.net_commission) || 0, commission.currency) },
    { label: 'Eligible Date', value: commission.eligible_date ? formatDate(commission.eligible_date) : '—' },
    { label: 'Approved At', value: commission.approved_at ? formatDate(commission.approved_at) : '—' },
    { label: 'Paid At', value: commission.paid_at ? formatDate(commission.paid_at) : '—' },
    { label: 'Payout Reference', value: commission.payout_reference || '—' },
  ]

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="font-mono text-body-sm text-eventra-slate-500">{commission.commission_reference}</span>
        <Badge variant={commissionVariant(commission.status)}>{String(commission.status || '').replace(/_/g, ' ')}</Badge>
      </div>

      {commission.status === 'reversed' && commission.reversal_reason && (
        <div className="alert alert-danger text-body-sm">Reversal reason: {commission.reversal_reason}</div>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-body-sm">
            <span className="text-eventra-slate-600">{row.label}</span>
            <span className="font-medium text-eventra-navy-900 capitalize">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="p-4 bg-eventra-green-50 border border-eventra-green-200 rounded-xl flex items-center justify-between">
        <span className="font-medium text-eventra-green-900">Net Payout</span>
        <span className="price-lg text-eventra-green-700">{formatCurrency(Number(commission.net_commission) || 0, commission.currency)}</span>
      </div>

      <div className="flex items-center gap-2 text-body-xs text-eventra-slate-500">
        <Calendar className="w-4 h-4" />
        Commissions are approved and paid out by the platform.
      </div>
    </div>
  )
}

function EmptyCommissionsState({ hasFilters }: { hasFilters?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <DollarSign className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No commissions found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        {hasFilters ? 'No commissions match your current filters.' : 'Complete bookings for your customers to start earning commissions.'}
      </p>
    </motion.div>
  )
}

function CommissionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse h-28 text-center" />
        ))}
      </div>
      <Card variant="elevated" padding="none" className="animate-pulse h-72" />
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
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
      <p className="text-heading-md font-display font-bold text-eventra-navy-900 mt-1">{value}</p>
    </Card>
  )
}
