import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Wifi,
  Search,
  Eye,
  Trash2,
  Plus,
  Activity,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatDateTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface AdminSupplier {
  id: number
  name?: string
  code?: string
  type?: string
  mode?: string
  base_url?: string
  status?: string
  priority?: number
  commission_rate?: number | string | null
  is_default?: boolean
  last_sync_at?: string
  last_error_at?: string
  last_error_message?: string
  error_count?: number
  success_count?: number
  avg_latency_ms?: number
}

const STATUS_FILTERS = ['all', 'active', 'inactive', 'maintenance', 'error'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'flight', label: 'Flights' },
  { value: 'train', label: 'Trains' },
  { value: 'bus', label: 'Buses' },
  { value: 'venue', label: 'Venues' },
  { value: 'car', label: 'Cars' },
  { value: 'activity', label: 'Activities' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'payment', label: 'Payments' },
]

const CREATE_TYPE_OPTIONS = TYPE_OPTIONS.filter(o => o.value !== 'all')

const PAGE_SIZE = 20

export function AdminSuppliers() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterType, setFilterType] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<AdminSupplier | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<AdminSupplier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-suppliers', search, filterStatus, filterType, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterType !== 'all') params.type = filterType
      const body = await api.get<any>('/admin/suppliers', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const suppliers: AdminSupplier[] = data?.data?.suppliers ?? []
  const totalCount: number = data?.data?.total_count ?? 0
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const handleDeactivate = async () => {
    if (!supplierToDelete) return
    setIsDeleting(true)
    try {
      const body = await api.delete<any>(`/admin/suppliers/${supplierToDelete.id}`)
      if (body.success) {
        toast.success(body.message || 'Supplier deactivated')
        queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] })
      } else {
        toast.error(body.message || 'Failed to deactivate supplier')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate supplier')
    } finally {
      setIsDeleting(false)
      setSupplierToDelete(null)
    }
  }

  if (isLoading && suppliers.length === 0) {
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
          <p className="font-medium">Failed to load suppliers</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard icon={<Building className="w-5 h-5" />} label="Total Suppliers" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Active" value={suppliers.filter(s => s.status === 'active').length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Maintenance" value={suppliers.filter(s => s.status === 'maintenance').length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Error" value={suppliers.filter(s => s.status === 'error').length} iconClass="bg-eventra-red-100 text-eventra-red-600" />
            <StatCard icon={<Wifi className="w-5 h-5" />} label="Demo Mode" value={suppliers.filter(s => s.mode === 'demo').length} iconClass="bg-eventra-teal-100 text-eventra-teal-600" />
            <StatCard icon={<Activity className="w-5 h-5" />} label="Avg Latency" value={`${Math.round(suppliers.reduce((sum, s) => sum + (Number(s.avg_latency_ms) || 0), 0) / Math.max(suppliers.length, 1))}ms`} iconClass="bg-eventra-cyan-100 text-eventra-cyan-600" />
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
                  onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
                  options={TYPE_OPTIONS}
                  aria-label="Filter by type"
                  className="w-40"
                />
                <Input
                  placeholder="Search suppliers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="max-w-xs"
                />
              </div>
            </div>
          </Card>

          {/* Suppliers Table */}
          {suppliers.length === 0 ? (
            <EmptySuppliersState onAdd={() => setShowCreateModal(true)} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{suppliers.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> suppliers
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Type</th>
                      <th className="text-center">Mode</th>
                      <th className="text-center">Priority</th>
                      <th className="text-center">Default</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Last Sync</th>
                      <th className="text-center">Errors</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold">
                              {(supplier.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-eventra-navy-900">{supplier.name || '—'}</p>
                              <p className="text-body-xs text-eventra-slate-500 font-mono">{supplier.code || supplier.id}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral capitalize">{supplier.type || '—'}</span>
                        </td>
                        <td className="text-center">
                          <span className={cn('badge', supplier.mode === 'live' ? 'badge-success' : 'badge-warning')}>
                            {supplier.mode || '—'}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="font-medium text-eventra-navy-900">{supplier.priority ?? 0}</span>
                        </td>
                        <td className="text-center">
                          {supplier.is_default ? <span className="badge badge-primary">Default</span> : <span className="text-body-xs text-eventra-slate-400">—</span>}
                        </td>
                        <td className="text-center">
                          <span className={cn('badge',
                            supplier.status === 'active' ? 'badge-success' :
                            supplier.status === 'inactive' ? 'badge-neutral' :
                            supplier.status === 'maintenance' ? 'badge-warning' : 'badge-danger'
                          )}>
                            {supplier.status || 'unknown'}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="text-body-sm text-eventra-slate-600">{supplier.last_sync_at ? formatDateTime(supplier.last_sync_at) : 'Never'}</span>
                        </td>
                        <td className="text-center">
                          <span className={cn('font-medium', (supplier.error_count ?? 0) > 0 ? 'text-eventra-red-600' : 'text-eventra-green-600')}>
                            {supplier.error_count ?? 0} / {supplier.success_count ?? 0}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="xs" onClick={() => { setSelectedSupplier(supplier); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                              View
                            </Button>
                            <Button variant="ghost" size="xs" className="text-eventra-red-600 hover:bg-eventra-red-50" onClick={() => setSupplierToDelete(supplier)} aria-label="Deactivate supplier">
                              <Trash2 className="w-4 h-4" />
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

      {/* Create Supplier Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Supplier"
        size="lg"
      >
        <CreateSupplierForm
          onSubmit={async (payload) => {
            const body = await api.post<any>('/admin/suppliers', payload)
            if (!body.success) throw new Error(body.message || 'Failed to create supplier')
            toast.success(body.message || 'Supplier created')
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] })
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Supplier Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedSupplier(null); }}
        title={selectedSupplier?.name || 'Supplier Details'}
        size="lg"
      >
        {selectedSupplier && <SupplierDetailModal supplier={selectedSupplier} />}
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Supplier"
        message={`Deactivate ${supplierToDelete?.name || 'this supplier'}? It will be marked inactive.`}
        confirmText="Deactivate"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  )
}

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Suppliers</h1>
        <p className="text-eventra-slate-600 mt-1">Manage inventory suppliers and providers</p>
      </div>
      <Button onClick={onAdd} leftIcon={<Plus className="w-5 h-5" />}>
        Add Supplier
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

function EmptySuppliersState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Building className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No suppliers yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Add your first supplier to start managing inventory providers.
      </p>
      <Button onClick={onAdd} leftIcon={<Plus className="w-5 h-5" />}>
        Add Your First Supplier
      </Button>
    </motion.div>
  )
}

function SupplierDetailModal({ supplier }: { supplier: AdminSupplier }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-2xl">
          {(supplier.name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{supplier.name || '—'}</h3>
          <p className="text-eventra-slate-600 font-mono">{supplier.code || '—'}</p>
          <span className={cn('badge mt-1',
            supplier.status === 'active' ? 'badge-success' :
            supplier.status === 'inactive' ? 'badge-neutral' :
            supplier.status === 'maintenance' ? 'badge-warning' : 'badge-danger'
          )}>
            {supplier.status || 'unknown'}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <DetailRow label="Type" value={supplier.type || '—'} />
        <DetailRow label="Mode" value={supplier.mode || '—'} />
        <DetailRow label="Priority" value={String(supplier.priority ?? 0)} />
        <DetailRow label="Default" value={supplier.is_default ? 'Yes' : 'No'} />
        <DetailRow label="Base URL" value={supplier.base_url || '—'} />
        <DetailRow label="Commission Rate" value={supplier.commission_rate != null ? `${supplier.commission_rate}%` : '—'} />
        <DetailRow label="Last Sync" value={supplier.last_sync_at ? formatDateTime(supplier.last_sync_at) : 'Never'} />
        <DetailRow label="Avg Latency" value={supplier.avg_latency_ms != null ? `${supplier.avg_latency_ms}ms` : '—'} />
        <DetailRow label="Errors / Successes" value={`${supplier.error_count ?? 0} / ${supplier.success_count ?? 0}`} />
        <DetailRow label="Last Error" value={supplier.last_error_message || '—'} />
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

function CreateSupplierForm({ onSubmit, onCancel }: { onSubmit: (payload: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'hotel',
    mode: 'demo',
    base_url: '',
    priority: '0',
    commission_rate: '',
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
        commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : undefined,
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create supplier')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Supplier Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Acme Hotels API" required />
        <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="ACME" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Select
          label="Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          options={CREATE_TYPE_OPTIONS}
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
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Priority" type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} placeholder="0" min="0" />
        <Input label="Commission Rate (%)" type="number" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })} placeholder="10" min="0" max="100" step="0.1" />
      </div>
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Create Supplier</Button>
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
