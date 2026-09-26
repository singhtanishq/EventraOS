import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserCheck,
  UserX,
  UserCog,
  Star,
  Search,
  Eye,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Globe,
  Luggage,
  CheckCircle2,
  X,
  DollarSign,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface AdminCustomer {
  id: number
  uuid?: string
  customer_number?: string
  user?: { name?: string; email?: string; phone?: string; is_active?: boolean }
  total_bookings?: number
  completed_bookings?: number
  cancelled_bookings?: number
  total_spent?: number
  loyalty_points?: number
  assigned_agent?: { id: number; agent_number?: string; user?: { name?: string } } | null
  is_vip?: boolean
  status?: string
  created_at?: string
}

const STATUS_FILTERS = ['all', 'active', 'inactive', 'vip'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'bookings_desc', label: 'Most Bookings' },
  { value: 'bookings_asc', label: 'Fewest Bookings' },
  { value: 'spent_desc', label: 'Highest Spend' },
  { value: 'spent_asc', label: 'Lowest Spend' },
  { value: 'name', label: 'Name' },
]

const PAGE_SIZE = 20

export function AdminCustomers() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<AdminCustomer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-customers', search, filterStatus, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      const body = await api.get<any>('/admin/customers', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const customers: AdminCustomer[] = data?.data?.customers ?? []
  const totalCount: number = data?.data?.total_count ?? 0
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const sortedCustomers = useMemo(() => {
    const list = [...customers]
    switch (sortBy) {
      case 'created_asc':
        return list.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
      case 'bookings_desc':
        return list.sort((a, b) => (b.total_bookings ?? 0) - (a.total_bookings ?? 0))
      case 'bookings_asc':
        return list.sort((a, b) => (a.total_bookings ?? 0) - (b.total_bookings ?? 0))
      case 'spent_desc':
        return list.sort((a, b) => (b.total_spent ?? 0) - (a.total_spent ?? 0))
      case 'spent_asc':
        return list.sort((a, b) => (a.total_spent ?? 0) - (b.total_spent ?? 0))
      case 'name':
        return list.sort((a, b) => String(a.user?.name || '').localeCompare(String(b.user?.name || '')))
      default:
        return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    }
  }, [customers, sortBy])

  const handleDelete = async () => {
    if (!customerToDelete) return
    setIsDeleting(true)
    try {
      const body = await api.delete<any>(`/admin/customers/${customerToDelete.id}`)
      if (body.success) {
        toast.success(body.message || 'Customer deactivated')
        queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
      } else {
        toast.error(body.message || 'Failed to deactivate customer')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate customer')
    } finally {
      setIsDeleting(false)
      setCustomerToDelete(null)
    }
  }

  if (isLoading && customers.length === 0) {
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
          <p className="font-medium">Failed to load customers</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />} label="Total Customers" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<UserCheck className="w-5 h-5" />} label="Active" value={customers.filter(c => c.status === 'active').length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<UserX className="w-5 h-5" />} label="Inactive" value={customers.filter(c => c.status === 'inactive').length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<Star className="w-5 h-5" />} label="VIP" value={customers.filter(c => c.is_vip).length} iconClass="bg-eventra-red-100 text-eventra-red-600" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Spent (page)" value={formatCurrency(customers.reduce((sum, c) => sum + (c.total_spent ?? 0), 0))} iconClass="bg-eventra-green-100 text-eventra-green-600" />
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
                <Input
                  placeholder="Search customers..."
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

          {/* Customers Table */}
          {sortedCustomers.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{sortedCustomers.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> customers
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th className="text-center">Bookings</th>
                      <th className="text-right">Total Spent</th>
                      <th className="text-center">Loyalty</th>
                      <th className="text-center">Agent</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Joined</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold">
                              {(customer.user?.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-eventra-navy-900">{customer.user?.name || '—'}</p>
                              <p className="text-body-xs text-eventra-slate-500 font-mono">{customer.customer_number || customer.uuid || customer.id}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <p className="text-body-sm text-eventra-navy-900">{customer.user?.email || '—'}</p>
                            <p className="text-body-xs text-eventra-slate-500">{customer.user?.phone || '—'}</p>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="space-y-1">
                            <p className="font-medium text-eventra-navy-900">{customer.total_bookings ?? 0}</p>
                            <p className="text-body-xs text-eventra-slate-500">{customer.completed_bookings ?? 0} completed</p>
                          </div>
                        </td>
                        <td className="text-right">
                          <p className="font-semibold text-eventra-navy-900">{formatCurrency(customer.total_spent ?? 0)}</p>
                        </td>
                        <td className="text-center">
                          <span className="font-medium text-eventra-amber-600">{(customer.loyalty_points ?? 0).toLocaleString()}</span>
                        </td>
                        <td className="text-center">
                          {customer.assigned_agent ? (
                            <span className="text-body-sm text-eventra-slate-600">{customer.assigned_agent.user?.name || '—'}</span>
                          ) : (
                            <span className="text-body-xs text-eventra-slate-400">Unassigned</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className={cn('badge',
                            customer.status === 'active' ? 'badge-success' : 'badge-neutral'
                          )}>
                            {customer.status || 'unknown'}
                          </span>
                          {customer.is_vip && <span className="badge badge-primary mt-1">VIP</span>}
                        </td>
                        <td className="text-center">
                          <p className="text-body-sm text-eventra-slate-600">{customer.created_at ? formatDate(customer.created_at) : '—'}</p>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="xs" onClick={() => { setSelectedCustomer(customer); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                              View
                            </Button>
                            <Button variant="ghost" size="xs" className="text-eventra-red-600 hover:bg-eventra-red-50" onClick={() => setCustomerToDelete(customer)} aria-label="Deactivate customer">
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

      {/* Customer Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedCustomer(null); }}
        title={selectedCustomer?.user?.name || 'Customer Details'}
        size="xl"
      >
        {selectedCustomer && <CustomerDetailModal customer={selectedCustomer} />}
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDelete}
        title="Deactivate Customer"
        message={`Deactivate ${customerToDelete?.user?.name || 'this customer'}? Customers with bookings cannot be deleted.`}
        confirmText="Deactivate"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Customers</h1>
        <p className="text-eventra-slate-600 mt-1">Manage customer accounts</p>
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

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Users className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No customers found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No customers match your current filters. Try adjusting your search criteria.
      </p>
    </motion.div>
  )
}

function CustomerDetailModal({ customer }: { customer: AdminCustomer }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-2xl">
          {(customer.user?.name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{customer.user?.name || '—'}</h3>
          <p className="text-eventra-slate-600">{customer.user?.email || '—'}</p>
          {customer.is_vip && <span className="badge badge-primary mt-1">VIP Customer</span>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Contact Information</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span>{customer.user?.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Phone className="w-4 h-4" />
              <span>{customer.user?.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Calendar className="w-4 h-4" />
              <span>Joined: {customer.created_at ? formatDate(customer.created_at) : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Globe className="w-4 h-4" />
              <span>Status: {customer.status || '—'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Booking Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <DetailStat icon={<Luggage className="w-4 h-4" />} label="Total Bookings" value={String(customer.total_bookings ?? 0)} />
            <DetailStat icon={<CheckCircle2 className="w-4 h-4" />} label="Completed" value={String(customer.completed_bookings ?? 0)} />
            <DetailStat icon={<X className="w-4 h-4" />} label="Cancelled" value={String(customer.cancelled_bookings ?? 0)} />
            <DetailStat icon={<DollarSign className="w-4 h-4" />} label="Total Spent" value={formatCurrency(customer.total_spent ?? 0)} />
          </div>
          <p className="text-body-sm text-eventra-slate-600">
            Loyalty Points: <span className="font-semibold text-eventra-navy-900">{(customer.loyalty_points ?? 0).toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-eventra-slate-200">
        <h4 className="font-semibold text-eventra-navy-900 mb-4">Assigned Agent</h4>
        {customer.assigned_agent ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold">
              {(customer.assigned_agent.user?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-eventra-navy-900">{customer.assigned_agent.user?.name || '—'}</p>
              <p className="text-body-sm text-eventra-slate-600">{customer.assigned_agent.agent_number || '—'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-eventra-slate-600">
            No agent assigned
          </div>
        )}
      </div>
    </div>
  )
}

function DetailStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-eventra-slate-50 p-3">
      <div className="flex items-center gap-2 text-eventra-slate-500 text-body-xs mb-1">
        {icon}
        {label}
      </div>
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
