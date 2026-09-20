import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AgentCustomer {
  id: string
  uuid: string
  customer_number: string
  user: {
    name: string
    email: string
    phone: string
    avatar?: string
  }
  date_of_birth?: string
  nationality?: string
  total_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  total_spent: number
  loyalty_points: number
  assigned_at: string
  last_booking_at?: string
  is_vip: boolean
  status: 'active' | 'inactive'
}

export function AgentCustomers() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'vip'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'bookings' | 'spent' | 'assigned' | 'last_booking'>('assigned')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<AgentCustomer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['agent-customers', search, filterStatus, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      params.set('sort', sortBy)
      const response = await api.get('/agent/customers', { params })
      return response.data
    },
  })

  const customers = data?.data?.customers || []

  if (isLoading) return <CustomersSkeleton />

  const filteredCustomers = customers.filter(c => {
    if (filterStatus === 'active' && c.status !== 'active') return false
    if (filterStatus === 'inactive' && c.status !== 'inactive') return false
    if (filterStatus === 'vip' && !c.is_vip) return false
    return true
  })

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
        <StatCard icon={<UserCheck className="w-6 h-6" />} label="Active" value={customers.filter(c => c.status === 'active').length} color="eventra-green" />
        <StatCard icon={<UserX className="w-6 h-6" />} label="Inactive" value={customers.filter(c => c.status === 'inactive').length} color="eventra-amber" />
        <StatCard icon={<Star className="w-6 h-6" />} label="VIP Customers" value={customers.filter(c => c.is_vip).length} color="eventra-purple" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
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
            <div className="relative flex-1 max-w-xs">
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={setSortBy}
              options={[
                { value: 'assigned', label: 'Recently Assigned' },
                { value: 'name', label: 'Name' },
                { value: 'bookings', label: 'Total Bookings' },
                { value: 'spent', label: 'Total Spent' },
                { value: 'last_booking', label: 'Last Booking' },
              ]}
              className="w-48"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Customers Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <CustomersSkeleton />
        ) : filteredCustomers.length === 0 ? (
          <EmptyCustomersState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div
                key="customers"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredCustomers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <CustomerCard
                      customer={customer}
                      onView={() => { setSelectedCustomer(customer); setShowDetailModal(true); }}
                      onEdit={() => navigate(`/agent/customers/${customer.id}/edit`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {customers.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(customers.length / 20)} />
            )}
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
        <CreateCustomerForm onSubmit={() => { setShowCreateModal(false); toast.success('Customer created') }} />
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedCustomer(null); }}
        title={selectedCustomer ? `${selectedCustomer.user.name}` : 'Customer Details'}
        size="xl"
      >
        {selectedCustomer && <CustomerDetailModal customer={selectedCustomer} />}
      </Modal>
    </div>
  )
}

function CustomerCard({ customer, onView, onEdit }: { customer: AgentCustomer; onView: () => void; onEdit: () => void }) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Card variant="interactive" onClick={onView} className="h-full">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-medium text-lg">
              {getInitials(customer.user.name)}
            </div>
            <div>
              <h3 className="font-semibold text-eventra-navy-900">{customer.user.name}</h3>
              <p className="text-body-sm text-eventra-slate-600">{customer.user.email}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {customer.is_vip && <Badge className="badge-purple text-xs">VIP</Badge>}
            <Badge className={cn('badge text-xs', customer.status === 'active' ? 'badge-success' : 'badge-neutral')}>
              {customer.status}
            </Badge>
          </div>
        </div>

        <div className="space-y-3 text-body-sm">
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <User className="w-4 h-4" />
            <span>{customer.customer_number}</span>
          </div>
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <Phone className="w-4 h-4" />
            <span>{customer.user.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Assigned: {formatDate(customer.assigned_at)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-eventra-slate-200">
            <div className="text-center p-2 bg-eventra-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-eventra-navy-900">{customer.total_bookings}</p>
              <p className="text-body-xs text-eventra-slate-500">Total Bookings</p>
            </div>
            <div className="text-center p-2 bg-eventra-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-eventra-navy-900">{formatCurrency(customer.total_spent, 'INR')}</p>
              <p className="text-body-xs text-eventra-slate-500">Total Spent</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t border-eventra-slate-200">
            <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); window.location.href = `/agent/customers/${customer.id}` }}>
              View Details
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }} leftIcon={<Edit2 className="w-4 h-4" />}>
              Edit
            </Button>
          </div>
        </div>
      </Card>
    )
  )
}

function EmptyCustomersState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Users className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No customers yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Start building your customer base by adding your first customer.
      </p>
      <Button onClick={onAdd} leftIcon={<UserPlus className="w-5 h-5" />}>
        Add Your First Customer
      </Button>
    </motion.div>
  )
}

function CustomersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} variant="outlined" padding="lg" className="animate-pulse" />
      ))}
    </div>
  )
}

function CustomerDetailModal({ customer }: { customer: AgentCustomer }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-2xl">
          {customer.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{customer.user.name}</h3>
          <p className="text-eventra-slate-600">{customer.user.email}</p>
          {customer.is_vip && <Badge className="badge-purple mt-1">VIP Customer</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Contact Information</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span>{customer.user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Phone className="w-4 h-4" />
              <span>{customer.user.phone}</span>
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
            <StatCard icon={<Suitcase className="w-5 h-5" />} label="Total Bookings" value={customer.total_bookings} color="eventra-blue" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={customer.completed_bookings} color="eventra-green" />
            <StatCard icon={<X className="w-5 h-5" />} label="Cancelled" value={customer.cancelled_bookings} color="eventra-red" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Spent" value={formatCurrency(customer.total_spent, 'INR')} color="eventra-green" />
          </div>
          <div className="mt-4">
            <p className="text-body-sm text-eventra-slate-600">Loyalty Points: <span className="font-semibold text-eventra-navy-900">{customer.loyalty_points.toLocaleString()}</span></p>
            <p className="text-body-sm text-eventra-slate-600">Assigned: {formatDate(customer.assigned_at)}</p>
            {customer.last_booking_at && <p className="text-body-sm text-eventra-slate-600">Last Booking: {formatDate(customer.last_booking_at)}</p>}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-eventra-slate-200">
        <h4 className="font-semibold text-eventra-navy-900 mb-4">Recent Bookings</h4>
        <p className="text-eventra-slate-600 text-center py-8">Booking history would be loaded here</p>
      </div>
    </div>
  )
}

function CreateCustomerForm({ onSubmit }: { onSubmit: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" required />
        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" required />
      </div>
      <Input label="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date of Birth" type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
        <Select label="Nationality" value={formData.nationality} onValueChange={(v) => setFormData({ ...formData, nationality: v })} options={[
          { value: 'IN', label: 'Indian' },
          { value: 'US', label: 'American' },
          { value: 'GB', label: 'British' },
          { value: 'AE', label: 'Emirati' },
        ]} />
      </div>
      <Input label="Passport Number" value={formData.passport_number} onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })} placeholder="A1234567" />
      <Input label="Passport Expiry" type="date" value={formData.passport_expiry} onChange={(e) => setFormData({ ...formData, passport_expiry: e.target.value })} />
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
        <Button type="submit">Create Customer</Button>
      </div>
    </form>
  )
}

function EmptyCustomersState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Users className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No customers yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">Start building your customer base by adding your first customer.</p>
      <Button onClick={onAdd} leftIcon={<UserPlus className="w-5 h-5" />}>Add Your First Customer</Button>
    </motion.div>
  )
}

function CustomersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} variant="outlined" padding="lg" className="animate-pulse" />
      ))}
    </div>
  )
}

import { Globe, Mail, Phone } from 'lucide-react'