import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2, Bus as BusIcon, Train as TrainIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminTransport {
  id: number
  uuid: string
  name: string
  code: string
  type: 'flight' | 'train' | 'bus'
  provider_id?: number
  provider_name?: string
  operator_name?: string
  operator_code?: string
  status: 'active' | 'inactive' | 'maintenance' | 'error'
  is_demo: boolean
  routes_count: number
  schedules_count: number
  created_at: string
  updated_at: string
}

export function AdminTransports() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'maintenance' | 'error'>('all')
  const [filterType, setFilterType] = useState<'all' | 'flight' | 'train' | 'bus'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name' | 'routes'>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTransport, setSelectedTransport] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transports', search, filterStatus, filterType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('sort', sortBy)
      const response = await api.get('/admin/transports', { params })
      return response.data
    },
  )

  const transports = data?.data?.transports || []

  const filteredTransports = transports.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterType !== 'all' && t.type !== filterType) return false
    return true
  })

  if (isLoading) return <AdminTransportsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Transport Inventory</h1>
          <p className="text-eventra-slate-600 mt-1">Manage airlines, train operators, and bus operators</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Add Transport
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<Plane className="w-6 h-6" />} label="Total Airlines" value={transports.filter(t => t.type === 'flight').length} color="eventra-blue" />
        <StatCard icon={<Train className="w-6 h-6" />} label="Train Operators" value={transports.filter(t => t.type === 'train').length} color="eventra-teal" />
        <StatCard icon={<Bus className="w-6 h-6" />} label="Bus Operators" value={transports.filter(t => t.type === 'bus').length} color="eventra-amber" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Active" value={transports.filter(t => t.status === 'active').length} color="eventra-green" />
        <StatCard icon={<Route className="w-6 h-6" />} label="Total Routes" value={transports.reduce((sum, t) => sum + (t.routes_count || 0), 0)} color="eventra-purple" />
        <StatCard icon={<Calendar className="w-6 h-6" />} label="Total Schedules" value={transports.reduce((sum, t) => sum + (t.schedules_count || 0), 0)} color="eventra-amber" />
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
                { value: 'flight', label: 'Flights' },
                { value: 'train', label: 'Trains' },
                { value: 'bus', label: 'Buses' },
              ]}
              className="w-40"
              placeholder="Filter by type"
            />
            <Input
              placeholder="Search transports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="w-64"
            />
            <Select
              value={sortBy}
              onValueChange={setSortBy}
              options={[
                { value: 'created_desc', label: 'Newest First' },
                { value: 'created_asc', label: 'Oldest First' },
                { value: 'name', label: 'Name A-Z' },
                { value: 'routes', label: 'Most Routes' },
              ]}
              className="w-40"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Transports Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminTransportsSkeleton />
        ) : filteredTransports.length === 0 ? (
          <EmptyTransportsState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredTransports.length}</strong> of <strong>{transports.length}</strong> transports
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Transport</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Operator</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Routes</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Schedules</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Provider</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransports.map((transport, index) => (
                    <tr key={transport.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-eventra-slate-100 flex items-center justify-center">
                            {transport.type === 'flight' && <Plane className="w-5 h-5 text-eventra-blue-600" />}
                            {transport.type === 'train' && <Train className="w-5 h-5 text-eventra-teal-600" />}
                            {transport.type === 'bus' && <Bus className="w-5 h-5 text-eventra-amber-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-eventra-navy-900">{transport.name}</p>
                            <p className="text-body-xs text-eventra-slate-500 font-mono">{transport.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('badge capitalize',
                          transport.type === 'flight' ? 'badge-blue' :
                          transport.type === 'train' ? 'badge-teal' :
                          'badge-amber'
                        )}>
                          {transport.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-medium text-eventra-navy-900">{transport.operator_name || '—'}</p>
                          <p className="text-body-xs text-eventra-slate-500">{transport.operator_code || 'No code'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="font-medium text-eventra-navy-900">{transport.routes_count || 0}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="font-medium text-eventra-navy-900">{transport.schedules_count || 0}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          transport.status === 'active' ? 'badge-success' :
                          transport.status === 'inactive' ? 'badge-neutral' :
                          transport.status === 'maintenance' ? 'badge-warning' :
                          'badge-danger'
                        )}>
                          {transport.status}
                        </Badge>
                        {transport.is_demo && <Badge className="badge-neutral mt-1">Demo</Badge>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-body-sm text-eventra-slate-600">{transport.provider_name || 'Internal'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="text-body-sm text-eventra-slate-600">{formatDate(transport.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedTransport(transport); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
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
            {transports.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(transports.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Create Transport Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Transport"
        size="lg"
      >
        <CreateTransportForm onSubmit={() => { setShowCreateModal(false); toast.success('Transport created') }} />
      </Modal>

      {/* Transport Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedTransport(null); }}
        title={selectedTransport ? selectedTransport.name : 'Transport Details'}
        size="xl"
      >
        {selectedTransport && <TransportDetailModal transport={selectedTransport} />}
      </Modal>
    </div>
  )
}

function AdminTransportsSkeleton() {
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
              <th className="px-4 py-3">Transport</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Routes</th>
              <th className="px-4 py-3">Schedules</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Created</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
    </motion.div>
  )
}

function AdminTransportsSkeleton() {
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
              <th className="px-4 py-3">Transport</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Routes</th>
              <th className="px-4 py-3">Schedules</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Created</th>
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
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}