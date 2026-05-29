import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  TicketPercent,
  CheckCircle2,
  Star,
  Gift,
  Plus,
  Trash2,
  Eye,
  Search,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select, Checkbox } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface AdminPromotion {
  id: number
  uuid?: string
  name?: string
  slug?: string
  description?: string
  type?: string
  value?: number | string
  currency?: string
  applicable_to?: string
  min_booking_value?: number | null
  max_discount_amount?: number | null
  usage_limit_total?: number | null
  usage_limit_per_customer?: number
  used_count?: number
  valid_from?: string
  valid_to?: string
  can_stack?: boolean
  requires_promo_code?: boolean
  promo_code?: string | null
  is_auto_apply?: boolean
  priority?: number
  is_active?: boolean
  is_featured?: boolean
  created_at?: string
  updated_at?: string
}

const PAGE_SIZE = 20

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'percentage_discount', label: '% Discount' },
  { value: 'fixed_discount', label: 'Fixed Discount' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'loyalty_bonus', label: 'Loyalty Bonus' },
  { value: 'free_addon', label: 'Free Add-on' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'early_bird', label: 'Early Bird' },
  { value: 'last_minute', label: 'Last Minute' },
  { value: 'group_discount', label: 'Group Discount' },
]

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'value', label: 'Discount Value' },
]

const STATUS_FILTERS = ['all', 'active', 'inactive', 'featured'] as const

const TYPE_BADGE: Record<string, string> = {
  percentage_discount: 'badge-primary',
  fixed_discount: 'badge-success',
  cashback: 'badge-warning',
  loyalty_bonus: 'badge-primary',
  free_addon: 'badge-success',
  upgrade: 'badge-warning',
  early_bird: 'badge-primary',
  last_minute: 'badge-danger',
  group_discount: 'badge-success',
}

const emptyForm = {
  name: '',
  description: '',
  type: 'percentage_discount',
  value: '',
  min_booking_value: '',
  max_discount_amount: '',
  usage_limit_total: '',
  valid_from: '',
  valid_to: '',
  requires_promo_code: false,
  is_featured: false,
}

export function AdminPromotions() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [selectedPromo, setSelectedPromo] = useState<AdminPromotion | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [promoToDeactivate, setPromoToDeactivate] = useState<AdminPromotion | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-promotions', search, filterStatus, filterType, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterType !== 'all') params.type = filterType
      const body = await api.get<any>('/admin/promotions', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const promotions: AdminPromotion[] = data?.data?.promotions ?? []
  const totalCount: number = data?.data?.total_count ?? promotions.length
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const sortedPromotions = [...promotions].sort((a, b) => {
    switch (sortBy) {
      case 'created_asc':
        return String(a.created_at || '').localeCompare(String(b.created_at || ''))
      case 'name':
        return String(a.name || '').localeCompare(String(b.name || ''))
      case 'value':
        return (Number(b.value) || 0) - (Number(a.value) || 0)
      default:
        return String(b.created_at || '').localeCompare(String(a.created_at || ''))
    }
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-promotions'] })

  const handleToggleActive = async (promo: AdminPromotion) => {
    setIsMutating(true)
    try {
      const body = await api.put<any>(`/admin/promotions/${promo.id}`, { is_active: !promo.is_active })
      if (body.success) {
        toast.success(body.message || `Promotion ${promo.is_active ? 'deactivated' : 'activated'}`)
        invalidate()
      } else {
        toast.error(body.message || 'Failed to update promotion')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update promotion')
    } finally {
      setIsMutating(false)
    }
  }

  const handleDeactivate = async () => {
    if (!promoToDeactivate) return
    setIsMutating(true)
    try {
      const body = await api.delete<any>(`/admin/promotions/${promoToDeactivate.id}`)
      if (body.success) {
        toast.success(body.message || 'Promotion deactivated')
        invalidate()
      } else {
        toast.error(body.message || 'Failed to deactivate promotion')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate promotion')
    } finally {
      setIsMutating(false)
      setPromoToDeactivate(null)
    }
  }

  if (isLoading && promotions.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader />
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader onCreate={() => setShowCreateModal(true)} />

      {isError ? (
        <div className="alert alert-danger text-center py-12">
          <p className="font-medium">Failed to load promotions</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<TicketPercent className="w-5 h-5" />} label="Total Promotions" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Active" value={promotions.filter(p => p.is_active).length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<Star className="w-5 h-5" />} label="Featured" value={promotions.filter(p => p.is_featured).length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<Gift className="w-5 h-5" />} label="Total Usage" value={promotions.reduce((sum, p) => sum + (Number(p.used_count) || 0), 0).toLocaleString()} iconClass="bg-eventra-cyan-100 text-eventra-cyan-600" />
            <StatCard icon={<Gift className="w-5 h-5" />} label="Total Discount Given" value={formatCurrency(promotions.reduce((sum, p) => sum + (Number(p.used_count) || 0) * (Number(p.value) || 0), 0))} iconClass="bg-eventra-green-100 text-eventra-green-600" />
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
                  className="w-44"
                />
                <Input
                  placeholder="Search promotions..."
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

          {/* Promotions Table */}
          {sortedPromotions.length === 0 ? (
            <EmptyPromotionsState onAdd={() => setShowCreateModal(true)} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{sortedPromotions.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> promotions
                  {isFetching && <Loader2 className="inline w-4 h-4 ml-2 animate-spin text-eventra-slate-400" />}
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Promotion</th>
                      <th>Type</th>
                      <th className="text-right">Value</th>
                      <th className="text-center">Validity</th>
                      <th className="text-center">Usage</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Code</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPromotions.map((promo) => (
                      <tr key={promo.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <div>
                            <p className="font-medium text-eventra-navy-900">{promo.name || '—'}</p>
                            <p className="text-body-xs text-eventra-slate-500 font-mono">{promo.slug || promo.uuid || promo.id}</p>
                          </div>
                        </td>
                        <td>
                          <span className={cn('badge capitalize', TYPE_BADGE[promo.type || ''] || 'badge-neutral')}>
                            {String(promo.type || '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className="font-semibold text-eventra-navy-900">
                            {promo.type === 'percentage_discount' ? `${Number(promo.value) || 0}%` : formatCurrency(Number(promo.value) || 0, promo.currency || 'INR')}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="text-body-sm text-eventra-slate-600">
                            <p>{promo.valid_from ? formatDate(promo.valid_from) : '—'}</p>
                            <p className="text-eventra-slate-500">to {promo.valid_to ? formatDate(promo.valid_to) : '—'}</p>
                          </div>
                        </td>
                        <td className="text-center">
                          <p className="font-medium text-eventra-navy-900">{Number(promo.used_count) || 0}/{promo.usage_limit_total || '∞'}</p>
                        </td>
                        <td className="text-center">
                          <span className={cn('badge', promo.is_active ? 'badge-success' : 'badge-neutral')}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {promo.is_featured && <span className="badge badge-warning mt-1">Featured</span>}
                        </td>
                        <td className="text-center">
                          {promo.promo_code ? (
                            <span className="font-mono text-body-sm text-eventra-navy-900">{promo.promo_code}</span>
                          ) : (
                            <span className="text-body-xs text-eventra-slate-400">Auto-apply</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="xs" onClick={() => { setSelectedPromo(promo); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              disabled={isMutating}
                              onClick={() => handleToggleActive(promo)}
                            >
                              {promo.is_active ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-eventra-red-600 hover:bg-eventra-red-50"
                              onClick={() => setPromoToDeactivate(promo)}
                              aria-label="Deactivate promotion"
                            >
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

      {/* Create Promotion Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Promotion"
        size="xl"
      >
        <CreatePromotionForm
          onCancel={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); invalidate() }}
        />
      </Modal>

      {/* Promotion Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedPromo(null); }}
        title={selectedPromo?.name || 'Promotion Details'}
        size="lg"
      >
        {selectedPromo && <PromotionDetail promo={selectedPromo} />}
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={!!promoToDeactivate}
        onClose={() => setPromoToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Promotion"
        message={`Deactivate "${promoToDeactivate?.name || 'this promotion'}"? It will no longer be available to customers.`}
        confirmText="Deactivate"
        variant="danger"
        loading={isMutating}
      />
    </div>
  )
}

function PageHeader({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Promotions</h1>
        <p className="text-eventra-slate-600 mt-1">Manage promotional campaigns and discount codes</p>
      </div>
      {onCreate && (
        <Button onClick={onCreate} leftIcon={<Plus className="w-5 h-5" />}>
          Create Promotion
        </Button>
      )}
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

function EmptyPromotionsState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <TicketPercent className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No promotions yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Create your first promotional campaign to attract more customers.
      </p>
      <Button onClick={onAdd} leftIcon={<Plus className="w-5 h-5" />}>
        Create Promotion
      </Button>
    </motion.div>
  )
}

function PromotionDetail({ promo }: { promo: AdminPromotion }) {
  return (
    <div className="space-y-6">
      {promo.description && (
        <p className="text-body-md text-eventra-slate-600">{promo.description}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <DetailStat label="Type" value={String(promo.type || '—').replace(/_/g, ' ')} />
        <DetailStat label="Value" value={promo.type === 'percentage_discount' ? `${Number(promo.value) || 0}%` : formatCurrency(Number(promo.value) || 0, promo.currency || 'INR')} />
        <DetailStat label="Valid From" value={promo.valid_from ? formatDate(promo.valid_from) : '—'} />
        <DetailStat label="Valid To" value={promo.valid_to ? formatDate(promo.valid_to) : '—'} />
        <DetailStat label="Used" value={`${Number(promo.used_count) || 0} of ${promo.usage_limit_total || '∞'}`} />
        <DetailStat label="Per Customer" value={String(promo.usage_limit_per_customer ?? '—')} />
        <DetailStat label="Min Booking Value" value={promo.min_booking_value != null ? formatCurrency(Number(promo.min_booking_value)) : '—'} />
        <DetailStat label="Max Discount" value={promo.max_discount_amount != null ? formatCurrency(Number(promo.max_discount_amount)) : '—'} />
        <DetailStat label="Applicable To" value={String(promo.applicable_to || '—').replace(/_/g, ' ')} />
        <DetailStat label="Promo Code" value={promo.promo_code || (promo.is_auto_apply ? 'Auto-apply' : '—')} />
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-eventra-slate-200">
        <span className={cn('badge', promo.is_active ? 'badge-success' : 'badge-neutral')}>{promo.is_active ? 'Active' : 'Inactive'}</span>
        {promo.is_featured && <span className="badge badge-warning">Featured</span>}
        {promo.can_stack && <span className="badge badge-primary">Can Stack</span>}
        {promo.requires_promo_code && <span className="badge badge-neutral">Requires Code</span>}
        <span className="badge badge-neutral">Priority {promo.priority ?? 0}</span>
      </div>
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

function CreatePromotionForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ ...emptyForm })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.value || !form.valid_from || !form.valid_to) {
      toast.error('Name, value, and validity dates are required')
      return
    }
    setIsSubmitting(true)
    try {
      const body = await api.post<any>('/admin/promotions', {
        name: form.name,
        description: form.description || null,
        type: form.type,
        value: Number(form.value),
        min_booking_value: form.min_booking_value ? Number(form.min_booking_value) : null,
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit_total: form.usage_limit_total ? Number(form.usage_limit_total) : null,
        valid_from: form.valid_from,
        valid_to: form.valid_to,
        requires_promo_code: form.requires_promo_code,
        is_active: true,
        is_featured: form.is_featured,
      })
      if (body.success) {
        toast.success(body.message || 'Promotion created')
        onCreated()
      } else {
        toast.error(body.message || 'Failed to create promotion')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create promotion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder="Summer Sale"
        required
      />
      <Input
        label="Description"
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        placeholder="What does this promotion offer?"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <Select
          label="Type"
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
          options={TYPE_OPTIONS.filter(o => o.value !== 'all')}
        />
        <Input
          label={form.type === 'percentage_discount' ? 'Value (%)' : 'Value'}
          type="number"
          min="0"
          step="0.01"
          value={form.value}
          onChange={(e) => set('value', e.target.value)}
          required
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Input
          label="Min Booking Value"
          type="number"
          min="0"
          value={form.min_booking_value}
          onChange={(e) => set('min_booking_value', e.target.value)}
        />
        <Input
          label="Max Discount"
          type="number"
          min="0"
          value={form.max_discount_amount}
          onChange={(e) => set('max_discount_amount', e.target.value)}
        />
        <Input
          label="Total Usage Limit"
          type="number"
          min="1"
          value={form.usage_limit_total}
          onChange={(e) => set('usage_limit_total', e.target.value)}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Valid From"
          type="date"
          value={form.valid_from}
          onChange={(e) => set('valid_from', e.target.value)}
          required
        />
        <Input
          label="Valid To"
          type="date"
          value={form.valid_to}
          onChange={(e) => set('valid_to', e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Checkbox
          label="Requires promo code"
          description="Generates a promo code customers can enter at checkout"
          checked={form.requires_promo_code}
          onChange={(e) => set('requires_promo_code', e.target.checked)}
        />
        <Checkbox
          label="Featured"
          description="Highlight this promotion on storefronts"
          checked={form.is_featured}
          onChange={(e) => set('is_featured', e.target.checked)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Create Promotion</Button>
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
