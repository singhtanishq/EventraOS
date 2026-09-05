import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plane,
  Train,
  Bus,
  CheckCircle2,
  Search,
  Eye,
  Plus,
  Activity,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatDateTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface TransportOperator {
  id: number
  name?: string
  code?: string
  type?: string
  mode?: string
  status?: string
  priority?: number
  base_url?: string
  avg_latency_ms?: number
  error_count?: number
  success_count?: number
  last_sync_at?: string
}

const TYPE_FILTERS = ['all', 'flight', 'train', 'bus'] as const
type TypeFilter = (typeof TYPE_FILTERS)[number]

const STATUS_FILTERS = ['all', 'active', 'inactive', 'maintenance', 'error'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const PAGE_SIZE = 20

export function AdminTransports() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<TypeFilter>('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTransport, setSelectedTransport] = useState<TransportOperator | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-transports', search, filterType, filterStatus, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterType !== 'all') params.type = filterType
      if (filterStatus !== 'all') params.status = filterStatus
      const body = await api.get<any>('/admin/suppliers', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const transports: TransportOperator[] = data?.data?.suppliers ?? []
  const totalCount: number = data?.data?.total_count ?? 0
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  if (isLoading && transports.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader onAdd={() => setShowCreateModal(true)} />
        <TableSkeleton rows={8} columns={7} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader onAdd={() => setShowCreateModal(true)} />

      {isError ? (
        <div className="alert alert-danger text-center py-12">
          <p className="font-medium">Failed to load transport operators</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          <div className="alert alert-info">
            Transport operators are managed as suppliers of type flight, train or bus. Routes and schedule counts appear once operators are synced.
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard icon={<Plane className="w-5 h-5" />} label="Airlines (page)" value={transports.filter(t => t.type === 'flight').length} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<Train className="w-5 h-5" />} label="Train Operators (page)" value={transports.filter(t => t.type === 'train').length} iconClass="bg-eventra-teal-100 text-eventra-teal-600" />
            <StatCard icon={<Bus className="w-5 h-5" />} label="Bus Operators (page)" value={transports.filter(t => t.type === 'bus').length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Active" value={transports.filter(t => t.status === 'active').length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<Activity className="w-5 h-5" />} label="Avg Latency" value={`${Math.round(transports.reduce((sum, t) => sum + (Number(t.avg_latency_ms) || 0), 0) / Math.max(transports.length, 1))}ms`} iconClass="bg-eventra-cyan-100 text-eventra-cyan-600" />
            <StatCard icon={<Plane className="w-5 h-5" />} label="Total Operators" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
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
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
                <Select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value as TypeFilter); setPage(1) }}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'flight', label: 'Flights' },
                    { value: 'train', label: 'Trains' },
                    { value: 'bus', label: 'Buses' },
                  ]}
                  aria-label="Filter by type"
                  className="w-40"
                />
                <Input
                  placeholder="Search operators..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="max-w-xs"
                />
              </div>
            </div>
          </Card>

          {/* Transports Table */}
          {transports.length === 0 ? (
            <EmptyTransportsState onAdd={() => setShowCreateModal(true)} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{transports.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> transport operators
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Operator</th>
                      <th>Type</th>
                      <th className="text-center">Mode</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Priority</th>
                      <th className="text-center">Avg Latency</th>
                      <th className="text-center">Last Sync</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transports.map((transport) => (
                      <tr key={transport.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                              {transport.type === 'flight' && <Plane className="w-5 h-5 text-eventra-blue-600" />}
                              {transport.type === 'train' && <Train className="w-5 h-5 text-eventra-teal-600" />}
                              {transport.type === 'bus' && <Bus className="w-5 h-5 text-eventra-amber-600" />}
                              {!['flight', 'train', 'bus'].includes(transport.type || '') && <Plane className="w-5 h-5 text-eventra-slate-400" />}
                            </div>
                            <div>
                              <p className="font-medium text-eventra-navy-900">{transport.name || '—'}</p>
                              <p className="text-body-xs text-eventra-slate-500 font-mono">{transport.code || transport.id}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral capitalize">{transport.type || '—'}</span>
                        </td>
                        <td className="text-center">
                          <span className={cn('badge', transport.mode === 'live' ? 'badge-success' : 'badge-warning')}>
                            {transport.mode || '—'}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={cn('badge',
                            transport.status === 'active' ? 'badge-success' :
                            transport.status === 'inactive' ? 'badge-neutral' :
                            transport.status === 'maintenance' ? 'badge-warning' : 'badge-danger'
                          )}>
                            {transport.status || 'unknown'}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="font-medium text-eventra-navy-900">{transport.priority ?? 0}</span>
                        </td>
                        <td className="text-center">
                          <span className="text-body-sm text-eventra-slate-600">{transport.avg_latency_ms != null ? `${transport.avg_latency_ms}ms` : '—'}</span>
                        </td>
                        <td className="text-center">
                          <span className="text-body-sm text-eventra-slate-600">{transport.last_sync_at ? formatDateTime(transport.last_sync_at) : 'Never'}</span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="xs" onClick={() => { setSelectedTransport(transport); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
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

      {/* Create Transport Operator Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Transport Operator"
        size="lg"
      >
        <CreateTransportForm
          onSubmit={async (payload) => {
            const body = await api.post<any>('/admin/suppliers', payload)
            if (!body.success) throw new Error(body.message || 'Failed to create transport operator')
            toast.success(body.message || 'Transport operator created')
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['admin-transports'] })
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Transport Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedTransport(null); }}
        title={selectedTransport?.name || 'Transport Details'}
        size="lg"
      >
        {selectedTransport && <TransportDetailModal transport={selectedTransport} />}
      </Modal>
    </div>
  )
}

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Transport Inventory</h1>
        <p className="text-eventra-slate-600 mt-1">Manage airlines, train operators, and bus operators</p>
      </div>
      <Button onClick={onAdd} leftIcon={<Plus className="w-5 h-5" />}>
        Add Transport
      </Button>
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

function EmptyTransportsState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Plane className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No transports found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No transport operators match your current filters.
      </p>
      <Button onClick={onAdd} leftIcon={<Plus className="w-5 h-5" />}>
        Add Transport Operator
      </Button>
    </motion.div>
  )
}

function TransportDetailModal({ transport }: { transport: TransportOperator }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center flex-shrink-0">
          {transport.type === 'train' ? <Train className="w-8 h-8" /> : transport.type === 'bus' ? <Bus className="w-8 h-8" /> : <Plane className="w-8 h-8" />}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{transport.name || '—'}</h3>
          <p className="text-eventra-slate-600 font-mono">{transport.code || '—'}</p>
          <span className={cn('badge mt-1',
            transport.status === 'active' ? 'badge-success' :
            transport.status === 'inactive' ? 'badge-neutral' :
            transport.status === 'maintenance' ? 'badge-warning' : 'badge-danger'
          )}>
            {transport.status || 'unknown'}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <DetailRow label="Type" value={transport.type || '—'} />
        <DetailRow label="Mode" value={transport.mode || '—'} />
        <DetailRow label="Priority" value={String(transport.priority ?? 0)} />
        <DetailRow label="Base URL" value={transport.base_url || '—'} />
        <DetailRow label="Avg Latency" value={transport.avg_latency_ms != null ? `${transport.avg_latency_ms}ms` : '—'} />
        <DetailRow label="Errors / Successes" value={`${transport.error_count ?? 0} / ${transport.success_count ?? 0}`} />
        <DetailRow label="Last Sync" value={transport.last_sync_at ? formatDateTime(transport.last_sync_at) : 'Never'} />
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-eventra-slate-50 p-3">
      <p className="text-body-xs text-eventra-slate-500">{label}</p>
      <p className="font-medium text-eventra-navy-900 break-all">{value}</p>
    </div>
  )
}

function CreateTransportForm({ onSubmit, onCancel }: { onSubmit: (payload: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'flight',
    mode: 'demo',
    base_url: '',
    priority: '0',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: formData.name,
        code: formData.code.toUpperCase(),
        type: formData.type,
        mode: formData.mode,
        base_url: formData.base_url || undefined,
        priority: parseInt(formData.priority) || 0,
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create transport operator')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Operator Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Indigo Airlines" required />
        <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="INDIGO" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Select
          label="Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          options={[
            { value: 'flight', label: 'Airline' },
            { value: 'train', label: 'Train Operator' },
            { value: 'bus', label: 'Bus Operator' },
          ]}
        />
        <Select
          label="Mode"
          value={formData.mode}
          onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
          options={[
            { value: 'demo', label: 'Demo' },
            { value: 'live', label: 'Live' },
          ]}
        />
      </div>
      <Input label="Base URL" type="url" value={formData.base_url} onChange={(e) => setFormData({ ...formData, base_url: e.target.value })} placeholder="https://api.example.com" />
      <Input label="Priority" type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} placeholder="0" min="0" />
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Create Operator</Button>
      </div>
    </form>
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
