import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, User, Calendar, Phone, Mail, Globe, Search, UserPlus, Star, UserCheck, UserX, CheckCircle2, X, DollarSign, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AgentCustomer {
  id: number
  uuid?: string
  customer_number: string
  user: {
    name?: string
    email?: string
    phone?: string | null
  }
  date_of_birth?: string
  nationality?: string
  total_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  total_spent: number
  loyalty_points: number
  assigned_at: string
  last_booking_at?: string | null
  is_vip: boolean
  status: 'active' | 'inactive'
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'vip'
type SortKey = 'name' | 'bookings' | 'spent' | 'assigned' | 'last_booking'

export function AgentCustomers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortKey>('assigned')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<AgentCustomer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['agent-customers', search],
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (search.trim()) params.search = search.trim()
      const body = await api.get<any>('/agent/customers', params)
      return body
    },
  })

  const createCustomer = useMutation({
    mutationFn: async (payload: { name: string; email: string; phone: string; password: string }) => {
      return api.post<any>('/agent/customers', payload)
    },
    onSuccess: (body: any) => {
      if (body?.success === false) {
        toast.error(body?.message || 'Failed to create customer')
        return
      }
      toast.success(body?.message || 'Customer created')
      setShowCreateModal(false)
      queryClient.invalidateQueries({ queryKey: ['agent-customers'] })
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create customer')
    },
  })

  const customers: AgentCustomer[] = data?.data?.customers ?? []
  const totalCount: number = Number(data?.data?.total_count ?? customers.length)

  const filteredCustomers = customers
    .filter((c) => {
      if (filterStatus === 'active' && c.status !== 'active') return false
      if (filterStatus === 'inactive' && c.status !== 'inactive') return false
      if (filterStatus === 'vip' && !c.is_vip) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.user.name || '').localeCompare(b.user.name || '')
        case 'bookings':
          return (b.total_bookings || 0) - (a.total_bookings || 0)
        case 'spent':
          return (b.total_spent || 0) - (a.total_spent || 0)
        case 'last_booking':
          return new Date(b.last_booking_at || 0).getTime() - new Date(a.last_booking_at || 0).getTime()
        case 'assigned':
        default:
          return new Date(b.assigned_at || 0).getTime() - new Date(a.assigned_at || 0).getTime()
      }
    })

  if (isLoading) return <CustomersSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load customers</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4" leftIcon={<RefreshCw className="w-5 h-5" />}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">My Customers</h1>
          <p className="text-eventra-slate-600 mt-1">Manage your customer relationships</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<UserPlus className="w-5 h-5" />}>
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Customers" value={customers.length} color="eventra-blue" />
        <StatCard icon={<UserCheck className="w-6 h-6" />} label="Active" value={customers.filter((c) => c.status === 'active').length} color="eventra-green" />
        <StatCard icon={<UserX className="w-6 h-6" />} label="Inactive" value={customers.filter((c) => c.status === 'inactive').length} color="eventra-amber" />
        <StatCard icon={<Star className="w-6 h-6" />} label="VIP Customers" value={customers.filter((c) => c.is_vip).length} color="eventra-teal" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'inactive', 'vip'] as const).map((status) => (
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
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <div className="w-64">
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              options={[
                { value: 'assigned', label: 'Recently Assigned' },
                { value: 'name', label: 'Name' },
                { value: 'bookings', label: 'Total Bookings' },
                { value: 'spent', label: 'Total Spent' },
                { value: 'last_booking', label: 'Last Booking' },
              ]}
              className="w-48"
              aria-label="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Customers Grid */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <EmptyCustomersState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <>
            <p className="text-body-md text-eventra-slate-600">
              Showing <strong>{filteredCustomers.length}</strong> of <strong>{totalCount}</strong> customers
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 12) * 0.03 }}
                >
                  <CustomerCard
                    customer={customer}
                    onView={() => { setSelectedCustomer(customer); setShowDetailModal(true); }}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Customer"
        size="lg"
      >
        <CreateCustomerForm
          onSubmit={(payload) => createCustomer.mutate(payload)}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={createCustomer.isPending}
        />
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedCustomer(null); }}
        title={selectedCustomer ? selectedCustomer.user.name || 'Customer Details' : 'Customer Details'}
        size="xl"
      >
        {selectedCustomer && <CustomerDetailModal customer={selectedCustomer} />}
      </Modal>
    </div>
  )
}

function getInitials(name?: string): string {
  if (!name) return '??'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function CustomerCard({ customer, onView }: { customer: AgentCustomer; onView: () => void }) {
  return (
    <Card variant="interactive" onClick={onView} className="h-full">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-medium text-lg flex-shrink-0">
              {getInitials(customer.user.name)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-eventra-navy-900 truncate">{customer.user.name || '—'}</h3>
              <p className="text-body-sm text-eventra-slate-600 truncate">{customer.user.email || '—'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {customer.is_vip && <Badge variant="primary" size="sm">VIP</Badge>}
            <Badge variant={customer.status === 'active' ? 'success' : 'neutral'} size="sm">
              {customer.status}
            </Badge>
          </div>
        </div>

        <div className="space-y-3 text-body-sm">
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{customer.customer_number}</span>
          </div>
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{customer.user.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>Assigned: {formatDate(customer.assigned_at)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-eventra-slate-200">
            <div className="text-center p-2 bg-eventra-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-eventra-navy-900">{customer.total_bookings ?? 0}</p>
              <p className="text-body-xs text-eventra-slate-500">Total Bookings</p>
            </div>
            <div className="text-center p-2 bg-eventra-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-eventra-navy-900">{formatCurrency(customer.total_spent || 0)}</p>
              <p className="text-body-xs text-eventra-slate-500">Total Spent</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t border-eventra-slate-200">
            <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); onView(); }}>
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyCustomersState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Users className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No customers found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        {search ? 'No customers match your search.' : 'Start building your customer base by adding your first customer.'}
      </p>
      <Button onClick={onAdd} leftIcon={<UserPlus className="w-5 h-5" />}>
        Add Your First Customer
      </Button>
    </motion.div>
  )
}

function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-eventra-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="outlined" padding="lg" className="animate-pulse h-64" />
        ))}
      </div>
    </div>
  )
}

function CustomerDetailModal({ customer }: { customer: AgentCustomer }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-2xl">
          {getInitials(customer.user.name)}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{customer.user.name || '—'}</h3>
          <p className="text-eventra-slate-600">{customer.user.email || '—'}</p>
          {customer.is_vip && <Badge variant="primary" size="sm" className="mt-1">VIP Customer</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Contact Information</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span>{customer.user.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Phone className="w-4 h-4" />
              <span>{customer.user.phone || '—'}</span>
            </div>
            {customer.date_of_birth && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <Calendar className="w-4 h-4" />
                <span>DOB: {formatDate(customer.date_of_birth)}</span>
              </div>
            )}
            {customer.nationality && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <Globe className="w-4 h-4" />
                <span>Nationality: {customer.nationality}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Booking Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Star className="w-5 h-5" />} label="Total Bookings" value={customer.total_bookings ?? 0} color="eventra-blue" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={customer.completed_bookings ?? 0} color="eventra-green" />
            <StatCard icon={<X className="w-5 h-5" />} label="Cancelled" value={customer.cancelled_bookings ?? 0} color="eventra-red" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Spent" value={formatCurrency(customer.total_spent || 0)} color="eventra-teal" />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-body-sm text-eventra-slate-600">Loyalty Points: <span className="font-semibold text-eventra-navy-900">{(customer.loyalty_points ?? 0).toLocaleString()}</span></p>
            <p className="text-body-sm text-eventra-slate-600">Assigned: {formatDate(customer.assigned_at)}</p>
            {customer.last_booking_at && <p className="text-body-sm text-eventra-slate-600">Last Booking: {formatDate(customer.last_booking_at)}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

interface CreateCustomerPayload {
  name: string
  email: string
  phone: string
  password: string
}

function CreateCustomerForm({ onSubmit, onCancel, isSubmitting }: { onSubmit: (payload: CreateCustomerPayload) => void; onCancel: () => void; isSubmitting: boolean }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-eventra-blue-50 border border-eventra-blue-200 rounded-xl">
        <p className="text-body-sm text-eventra-blue-800">
          The customer receives these sign-in credentials. Password must be at least 8 characters.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" required />
        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" required />
      </div>
      <Input label="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
      <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Minimum 8 characters" minLength={8} required />
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Create Customer</Button>
      </div>
    </form>
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
      <p className="text-heading-md font-display font-bold text-eventra-navy-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </Card>
  )
}
