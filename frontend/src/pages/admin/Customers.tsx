import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminCustomer {
  id: number
  uuid: string
  customer_number: string
  user: {
    id: number
    name: string
    email: string
    phone: string
    avatar?: string
    is_active: boolean
    email_verified_at?: string
    created_at: string
  }
  date_of_birth?: string
  nationality?: string
  total_bookings: number
  completed_bookings: number
  cancelled_bookings: number
  total_spent: number
  loyalty_points: number
  assigned_agent_id?: number
  assigned_agent?: {
    id: number
    agent_number: string
    user: { name: string }
  }
  is_vip: boolean
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  last_booking_at?: string
}

export function AdminCustomers() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'vip'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'bookings_desc' | 'bookings_asc' | 'spent_desc' | 'spent_asc' | 'name'>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, filterStatus, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      params.set('sort', sortBy)
      const response = await api.get('/admin/customers', { params })
      return response.data
    },
  })

  const customers = data?.data?.customers || []

  const filteredCustomers = customers.filter(c => {
    if (filterStatus === 'active' && c.status !== 'active') return false
    if (filterStatus === 'inactive' && c.status !== 'inactive') return false
    if (filterStatus === 'suspended' && c.status !== 'suspended') return false
    if (filterStatus === 'vip' && !c.is_vip) return false
    return true
  })

  if (isLoading) return <AdminCustomersSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Customers</h1>
          <p className="text-eventra-slate-600 mt-1">Manage customer accounts</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<UserPlus className="w-5 h-5" />}>
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Customers" value={customers.length} color="eventra-blue" />
        <StatCard icon={<UserCheck className="w-6 h-6" />} label="Active" value={customers.filter(c => c.status === 'active').length} color="eventra-green" />
        <StatCard icon={<UserX className="w-6 h-6" />} label="Inactive" value={customers.filter(c => c.status === 'inactive').length} color="eventra-amber" />
        <StatCard icon={<UserCog className="w-6 h-6" />} label="Suspended" value={customers.filter(c => c.status === 'suspended').length} color="eventra-red" />
        <StatCard icon={<Star className="w-6 h-6" />} label="VIP" value={customers.filter(c => c.is_vip).length} color="eventra-purple" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'inactive', 'suspended', 'vip'] as const).map((status) => (
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
                { value: 'created_desc', label: 'Newest First' },
                { value: 'created_asc', label: 'Oldest First' },
                { value: 'bookings_desc', label: 'Most Bookings' },
                { value: 'bookings_asc', label: 'Fewest Bookings' },
                { value: 'spent_desc', label: 'Highest Spend' },
                { value: 'spent_asc', label: 'Lowest Spend' },
                { value: 'name', label: 'Name' },
              ]}
              className="w-48"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminCustomersSkeleton />
        ) : filteredCustomers.length === 0 ? (
          <EmptyCustomersState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Bookings</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Total Spent</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Loyalty</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Agent</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr key={customer.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-lg">
                            {customer.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-eventra-navy-900">{customer.user.name}</p>
                            <p className="text-body-xs text-eventra-slate-500 font-mono">{customer.customer_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-body-sm text-eventra-navy-900">{customer.user.email}</p>
                          <p className="text-body-xs text-eventra-slate-500">{customer.user.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-medium text-eventra-navy-900">{customer.total_bookings}</p>
                          <p className="text-body-xs text-eventra-slate-500">{customer.completed_bookings} completed</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-eventra-navy-900">{formatCurrency(customer.total_spent, 'INR')}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-eventra-amber-600">{customer.loyalty_points.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {customer.assigned_agent ? (
                          <span className="text-body-sm text-eventra-slate-600">{customer.assigned_agent.user.name}</span>
                        ) : (
                          <span className="text-body-xs text-eventra-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          customer.status === 'active' ? 'badge-success' :
                          customer.status === 'inactive' ? 'badge-neutral' :
                          customer.status === 'suspended' ? 'badge-danger' : 'badge-warning'
                        )}>
                          {customer.status}
                        </Badge>
                        {customer.is_vip && <Badge className="badge-purple mt-1">VIP</Badge>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="text-body-sm text-eventra-slate-600">{formatDate(customer.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedCustomer(customer); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                            View
                          </Button>
                          <Button variant="ghost" size="xs" className="text-eventra-red-600 hover:bg-eventra-red-50" onClick={() => {}}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
        title="Add Customer"
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

function AdminCustomersSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-eventra-slate-200">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Loyalty</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-32 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
        No customers match your current filters. Try adjusting your search criteria.
      </p>
    </motion.div>
  )
}

function CustomerDetailModal({ customer }: { customer: AdminCustomer }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-2xl">
          {customer.user.name.charAt(0).toUpperCase()}
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
            <p className="text-body-sm text-eventra-slate-600">Assigned: {formatDate(customer.created_at)}</p>
            {customer.last_booking_at && <p className="text-body-sm text-eventra-slate-600">Last Booking: {formatDate(customer.last_booking_at)}</p>}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-eventra-slate-200">
        <h4 className="font-semibold text-eventra-navy-900 mb-4">Assigned Agent</h4>
        {customer.assigned_agent ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold">
              {customer.assigned_agent.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-eventra-navy-900">{customer.assigned_agent.user.name}</p>
              <p className="text-body-sm text-eventra-slate-600">{customer.assigned_agent.agent_number}</p>
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

function AdminCustomersSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-eventra-slate-200">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Loyalty</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-32 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}