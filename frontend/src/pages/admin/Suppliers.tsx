import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminSupplier {
  id: number
  uuid: string
  name: string
  code: string
  type: 'hotel' | 'flight' | 'train' | 'bus' | 'venue' | 'car' | 'activity' | 'transfer' | 'payment'
  country: string
  contact_name: string
  contact_email: string
  contact_phone: string
  integration_type: 'api' | 'manual' | 'email' | 'ftp' | 'xml'
  api_endpoint?: string
  api_credentials?: any
  configuration?: any
  status: 'active' | 'inactive' | 'maintenance' | 'error'
  priority: number
  commission_rate: number
  commission_type: string
  last_sync_at?: string
  last_error_at?: string
  last_error_message?: string
  error_count: number
  success_count: number
  avg_latency_ms: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export function AdminSuppliers() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'maintenance' | 'error'>('all')
  const [filterType, setFilterType] = useState<'all' | 'hotel' | 'flight' | 'train' | 'bus' | 'venue' | 'car' | 'activity' | 'transfer' | 'payment'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name' | 'priority' | 'status'>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-suppliers', search, filterStatus, filterType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('sort', sortBy)
      const response = await api.get('/admin/suppliers', { params })
      return response.data
    },
  })

  const suppliers = data?.data?.suppliers || []

  const filteredSuppliers = suppliers.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (filterType !== 'all' && s.type !== filterType) return false
    return true
  })

  if (isLoading) return <AdminSuppliersSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Suppliers</h1>
          <p className="text-eventra-slate-600 mt-1">Manage inventory suppliers and providers</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Add Supplier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<Building className="w-6 h-6" />} label="Total Suppliers" value={suppliers.length} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Active" value={suppliers.filter(s => s.status === 'active').length} color="eventra-green" />
        <StatCard icon={<AlertTriangle className="w-6 h-6" />} label="Maintenance" value={suppliers.filter(s => s.status === 'maintenance').length} color="eventra-amber" />
        <StatCard icon={<AlertCircle className="w-6 h-6" />} label="Error" value={suppliers.filter(s => s.status === 'error').length} color="eventra-red" />
        <StatCard icon={<Wifi className="w-6 h-6" />} label="API Connected" value={suppliers.filter(s => s.integration_type === 'api' && s.status === 'active').length} color="eventra-green" />
        <StatCard icon={<Globe className="w-6 h-6" />} label="Countries" value={new Set(suppliers.map(s => s.country)).size} color="eventra-blue" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'inactive', 'maintenance', 'error'] as const).map((status) => (
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
            <Select
              value={filterType}
              onValueChange={setFilterType}
              options={[
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
              ]}
              className="w-40"
              placeholder="Filter by type"
            />
            <Select
              value={sortBy}
              onValueChange={setSortBy}
              options={[
                { value: 'created_desc', label: 'Newest First' },
                { value: 'created_asc', label: 'Oldest First' },
                { value: 'name', label: 'Name A-Z' },
                { value: 'priority', label: 'Priority' },
                { value: 'status', label: 'Status' },
              ]}
              className="w-40"
              placeholder="Sort by"
            />
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="w-64"
            />
          </div>
        </div>
      </Card>

      {/* Suppliers Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminSuppliersSkeleton />
        ) : filteredSuppliers.length === 0 ? (
          <EmptySuppliersState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredSuppliers.length}</strong> of <strong>{suppliers.length}</strong> suppliers
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Country</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Integration</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Commission</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Default</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Last Sync</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Errors</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier, index) => (
                    <tr key={supplier.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-lg">
                            {supplier.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-eventra-navy-900">{supplier.name}</p>
                            <p className="text-body-xs text-eventra-slate-500 font-mono">{supplier.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('badge capitalize',
                          supplier.type === 'hotel' ? 'badge-blue' :
                          supplier.type === 'flight' ? 'badge-cyan' :
                          supplier.type === 'train' ? 'badge-teal' :
                          supplier.type === 'bus' ? 'badge-amber' :
                          supplier.type === 'venue' ? 'badge-red' :
                          supplier.type === 'car' ? 'badge-green' :
                          supplier.type === 'activity' ? 'badge-purple' :
                          supplier.type === 'transfer' ? 'badge-cyan' :
                          'badge-purple'
                        )}>
                          {supplier.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-body-sm text-eventra-navy-900">{supplier.contact_name}</p>
                          <p className="text-body-xs text-eventra-slate-500">{supplier.contact_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-body-sm text-eventra-navy-900">{supplier.country}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          supplier.integration_type === 'api' ? 'badge-primary' :
                          supplier.integration_type === 'manual' ? 'badge-neutral' :
                          supplier.integration_type === 'email' ? 'badge-amber' :
                          supplier.integration_type === 'ftp' ? 'badge-teal' :
                          supplier.integration_type === 'xml' ? 'badge-purple' : 'badge-neutral'
                        )}>
                          {supplier.integration_type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-eventra-navy-900">{supplier.commission_rate}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {supplier.is_default && <Badge className="badge-primary">Default</Badge>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          supplier.status === 'active' ? 'badge-success' :
                          supplier.status === 'inactive' ? 'badge-neutral' :
                          supplier.status === 'maintenance' ? 'badge-warning' :
                          'badge-danger'
                        )}>
                          {supplier.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {supplier.last_sync_at ? formatDateTime(supplier.last_sync_at) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('font-medium', supplier.error_count > 0 ? 'text-eventra-red-600' : 'text-eventra-green-600')}>
                          {supplier.error_count} / {supplier.success_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedSupplier(supplier); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
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
            {suppliers.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(suppliers.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Create Supplier Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Supplier"
        size="lg"
      >
        <CreateSupplierForm onSubmit={() => { setShowCreateModal(false); toast.success('Supplier created') }} />
      </Modal>

      {/* Supplier Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedSupplier(null); }}
        title={selectedSupplier ? selectedSupplier.name : 'Supplier Details'}
        size="xl"
      >
        {selectedSupplier && <SupplierDetailModal supplier={selectedSupplier} />}
      </Modal>
    </div>
  )
}

function AdminSuppliersSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-eventra-slate-200">
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Integration</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Default</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Sync</th>
              <th className="px-4 py-3">Errors</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
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

function AdminSuppliersSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-eventra-slate-200">
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Integration</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Default</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Sync</th>
              <th className="px-4 py-3">Errors</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
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