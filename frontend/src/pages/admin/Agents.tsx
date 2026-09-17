import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminAgent {
  id: number
  uuid: string
  agent_number: string
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
  employee_id?: string
  agency_name?: string
  agency_license?: string
  commission_rate: number
  commission_type: string
  monthly_target: number
  monthly_booking_target: number
  monthly_revenue_target: number
  status: 'active' | 'inactive' | 'suspended' | 'terminated'
  joined_at?: string
  last_active_at?: string
  manager_id?: number
  total_customers: number
  total_bookings: number
  total_commission: number
  created_at: string
}

export function AdminAgents() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'terminated'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'commission_desc' | 'commission_asc' | 'bookings_desc' | 'bookings_asc' | 'name'>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-agents', search, filterStatus, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      params.set('sort', sortBy)
      const response = await api.get('/admin/agents', { params })
      return response.data
    },
  })

  const agents = data?.data?.agents || []

  const filteredAgents = agents.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    return true
  })

  if (isLoading) return <AdminAgentsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Agents</h1>
          <p className="text-eventra-slate-600 mt-1">Manage travel agents</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<UserPlus className="w-5 h-5" />}>
          Add Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Agents" value={agents.length} color="eventra-blue" />
        <StatCard icon={<UserCheck className="w-6 h-6" />} label="Active" value={agents.filter(a => a.status === 'active').length} color="eventra-green" />
        <StatCard icon={<UserX className="w-6 h-6" />} label="Inactive" value={agents.filter(a => a.status === 'inactive').length} color="eventra-amber" />
        <StatCard icon={<UserCog className="w-6 h-6" />} label="Suspended" value={agents.filter(a => a.status === 'suspended').length} color="eventra-red" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Total Commission" value={formatCurrency(agents.reduce((sum, a) => sum + a.total_commission, 0), 'INR')} color="eventra-green" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'inactive', 'suspended', 'terminated'] as const).map((status) => (
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
            <Input
              placeholder="Search agents..."
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
                { value: 'commission_desc', label: 'Highest Commission' },
                { value: 'commission_asc', label: 'Lowest Commission' },
                { value: 'bookings_desc', label: 'Most Bookings' },
                { value: 'bookings_asc', label: 'Fewest Bookings' },
                { value: 'name', label: 'Name' },
              ]}
              className="w-48"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Agents Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminAgentsSkeleton />
        ) : filteredAgents.length === 0 ? (
          <EmptyAgentsState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredAgents.length}</strong> of <strong>{agents.length}</strong> agents
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Agent</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Agency</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Customers</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Bookings</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Commission</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Rate</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent, index) => (
                    <tr key={agent.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-lg">
                            {agent.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-eventra-navy-900">{agent.user.name}</p>
                            <p className="text-body-xs text-eventra-slate-500 font-mono">{agent.agent_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-body-sm text-eventra-navy-900">{agent.user.email}</p>
                          <p className="text-body-xs text-eventra-slate-500">{agent.user.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-body-sm text-eventra-navy-900">{agent.agency_name || '—'}</p>
                        <p className="text-body-xs text-eventra-slate-500">{agent.agency_license || 'No license'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="font-medium text-eventra-navy-900">{agent.total_customers}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="font-medium text-eventra-navy-900">{agent.total_bookings}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-eventra-navy-900">{formatCurrency(agent.total_commission, 'INR')}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="font-medium text-eventra-navy-900">{agent.commission_rate}%</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          agent.status === 'active' ? 'badge-success' :
                          agent.status === 'inactive' ? 'badge-neutral' :
                          agent.status === 'suspended' ? 'badge-danger' :
                          'badge-danger'
                        )}>
                          {agent.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="text-body-sm text-eventra-slate-600">{formatDate(agent.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedAgent(agent); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
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
            {agents.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(agents.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Create Agent Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Agent"
        size="lg"
      >
        <CreateAgentForm onSubmit={() => { setShowCreateModal(false); toast.success('Agent created') }} />
      </Modal>

      {/* Agent Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedAgent(null); }}
        title={selectedAgent ? `${selectedAgent.user.name}` : 'Agent Details'}
        size="xl"
      >
        {selectedAgent && <AgentDetailModal agent={selectedAgent} />}
      </Modal>
    </div>
  )
}

function AdminAgentsSkeleton() {
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
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Agency</th>
              <th className="px-4 py-3">Customers</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Rate</th>
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
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyAgentsState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <UserCog className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No agents yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Add your first agent to start building your team.
      </p>
      <Button onClick={onAdd} leftIcon={<UserPlus className="w-5 h-5" />}>
        Add Your First Agent
      </Button>
    </motion.div>
  )
}

function AgentDetailModal({ agent }: { agent: AdminAgent }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-2xl">
          {agent.user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{agent.user.name}</h3>
          <p className="text-eventra-slate-600">{agent.user.email}</p>
          <Badge className={cn('badge mt-1', agent.status === 'active' ? 'badge-success' : agent.status === 'inactive' ? 'badge-neutral' : 'badge-danger')}>
            {agent.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Contact Information</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span>{agent.user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Phone className="w-4 h-4" />
              <span>{agent.user.phone}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Agent Information</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <UserCog className="w-4 h-4" />
              <span>Agent Number: {agent.agent_number}</span>
            </div>
            {agent.employee_id && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <UserCog className="w-4 h-4" />
                <span>Employee ID: {agent.employee_id}</span>
              </div>
            )}
            {agent.agency_name && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <Building className="w-4 h-4" />
                <span>Agency: {agent.agency_name}</span>
              </div>
            )}
            {agent.agency_license && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <ShieldCheck className="w-4 h-4" />
                <span>License: {agent.agency_license}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Performance</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />} label="Customers" value={agent.total_customers} color="eventra-blue" />
            <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Bookings" value={agent.total_bookings} color="eventra-green" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Commission" value={formatCurrency(agent.total_commission, 'INR')} color="eventra-green" />
            <StatCard icon={<Target className="w-5 h-5" />} label="Commission Rate" value={`${agent.commission_rate}%`} color="eventra-amber" />
          </div>
          <div className="mt-4">
            <p className="text-body-sm text-eventra-slate-600">Commission Type: <span className="font-semibold text-eventra-navy-900">{agent.commission_type}</span></p>
            <p className="text-body-sm text-eventra-slate-600">Monthly Target: <span className="font-semibold text-eventra-navy-900">{formatCurrency(agent.monthly_target, 'INR')}</span></p>
            <p className="text-body-sm text-eventra-slate-600">Joined: {formatDate(agent.joined_at || agent.created_at)}</p>
            {agent.last_active_at && <p className="text-body-sm text-eventra-slate-600">Last Active: {formatDate(agent.last_active_at)}</p>}
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

function CreateAgentForm({ onSubmit }: { onSubmit: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    agency_name: '',
    agency_license: '',
    commission_rate: '10',
    commission_type: 'percentage',
    monthly_target: '100000',
    password: '',
    password_confirmation: '',
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" required />
        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" required />
      </div>
      <Input label="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Employee ID" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} placeholder="EMP001" />
        <Input label="Agency Name" value={formData.agency_name} onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })} placeholder="Travel Agency Name" />
      </div>
      <Input label="Agency License" value={formData.agency_license} onChange={(e) => setFormData({ ...formData, agency_license: e.target.value })} placeholder="LIC12345" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Commission Rate (%)" type="number" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })} placeholder="10" required />
        <Select label="Commission Type" value={formData.commission_type} onValueChange={(v) => setFormData({ ...formData, commission_type: v })} options={[
          { value: 'percentage', label: 'Percentage' },
          { value: 'fixed', label: 'Fixed Amount' },
          { value: 'tiered', label: 'Tiered' },
        ]} />
      </div>
      <Input label="Monthly Target (INR)" type="number" value={formData.monthly_target} onChange={(e) => setFormData({ ...formData, monthly_target: e.target.value })} placeholder="100000" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" required />
        <Input label="Confirm Password" type="password" value={formData.password_confirmation} onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })} placeholder="••••••••" required />
      </div>
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
        <Button type="submit">Create Agent</Button>
      </div>
    </form>
  )
}

function EmptyAgentsState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <UserCog className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No agents yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Add your first agent to start building your team.
      </p>
      <Button onClick={onAdd} leftIcon={<UserPlus className="w-5 h-5" />}>
        Add Your First Agent
      </Button>
    </motion.div>
  )
}

function AdminAgentsSkeleton() {
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
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Agency</th>
              <th className="px-4 py-3">Customers</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Rate</th>
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
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}