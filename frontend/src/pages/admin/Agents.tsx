import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserCheck,
  UserX,
  UserCog,
  DollarSign,
  Search,
  Eye,
  Trash2,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  ClipboardList,
  Target,
  UserPlus,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface AdminAgent {
  id: number
  uuid?: string
  agent_number?: string
  user?: { name?: string; email?: string; phone?: string; is_active?: boolean }
  employee_id?: string
  agency_name?: string
  agency_license?: string
  commission_rate?: number
  commission_type?: string
  monthly_target?: number
  status?: string
  total_customers?: number
  total_bookings?: number
  total_commission?: number
  created_at?: string
}

const STATUS_FILTERS = ['all', 'active', 'inactive', 'suspended', 'terminated'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'created_asc', label: 'Oldest First' },
  { value: 'commission_desc', label: 'Highest Commission' },
  { value: 'commission_asc', label: 'Lowest Commission' },
  { value: 'bookings_desc', label: 'Most Bookings' },
  { value: 'bookings_asc', label: 'Fewest Bookings' },
  { value: 'name', label: 'Name' },
]

const COMMISSION_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'tiered', label: 'Tiered' },
]

const PAGE_SIZE = 20

export function AdminAgents() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AdminAgent | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [agentToTerminate, setAgentToTerminate] = useState<AdminAgent | null>(null)
  const [isTerminating, setIsTerminating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-agents', search, filterStatus, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      const body = await api.get<any>('/admin/agents', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const agents: AdminAgent[] = data?.data?.agents ?? []
  const totalCount: number = data?.data?.total_count ?? 0
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const sortedAgents = useMemo(() => {
    const list = [...agents]
    switch (sortBy) {
      case 'created_asc':
        return list.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
      case 'commission_desc':
        return list.sort((a, b) => (b.total_commission ?? 0) - (a.total_commission ?? 0))
      case 'commission_asc':
        return list.sort((a, b) => (a.total_commission ?? 0) - (b.total_commission ?? 0))
      case 'bookings_desc':
        return list.sort((a, b) => (b.total_bookings ?? 0) - (a.total_bookings ?? 0))
      case 'bookings_asc':
        return list.sort((a, b) => (a.total_bookings ?? 0) - (b.total_bookings ?? 0))
      case 'name':
        return list.sort((a, b) => String(a.user?.name || '').localeCompare(String(b.user?.name || '')))
      default:
        return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    }
  }, [agents, sortBy])

  const handleTerminate = async () => {
    if (!agentToTerminate) return
    setIsTerminating(true)
    try {
      const body = await api.delete<any>(`/admin/agents/${agentToTerminate.id}`)
      if (body.success) {
        toast.success(body.message || 'Agent terminated')
        queryClient.invalidateQueries({ queryKey: ['admin-agents'] })
      } else {
        toast.error(body.message || 'Failed to terminate agent')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to terminate agent')
    } finally {
      setIsTerminating(false)
      setAgentToTerminate(null)
    }
  }

  if (isLoading && agents.length === 0) {
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
          <p className="font-medium">Failed to load agents</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />} label="Total Agents" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<UserCheck className="w-5 h-5" />} label="Active" value={agents.filter(a => a.status === 'active').length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<UserX className="w-5 h-5" />} label="Inactive" value={agents.filter(a => a.status === 'inactive').length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<UserCog className="w-5 h-5" />} label="Suspended" value={agents.filter(a => a.status === 'suspended').length} iconClass="bg-eventra-red-100 text-eventra-red-600" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Commission (page)" value={formatCurrency(agents.reduce((sum, a) => sum + (a.total_commission ?? 0), 0))} iconClass="bg-eventra-green-100 text-eventra-green-600" />
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
                  placeholder="Search agents..."
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

          {/* Agents Table */}
          {sortedAgents.length === 0 ? (
            <EmptyAgentsState onAdd={() => setShowCreateModal(true)} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{sortedAgents.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> agents
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Contact</th>
                      <th>Agency</th>
                      <th className="text-center">Customers</th>
                      <th className="text-center">Bookings</th>
                      <th className="text-right">Commission</th>
                      <th className="text-center">Rate</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Joined</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold">
                              {(agent.user?.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-eventra-navy-900">{agent.user?.name || '—'}</p>
                              <p className="text-body-xs text-eventra-slate-500 font-mono">{agent.agent_number || agent.uuid || agent.id}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="space-y-1">
                            <p className="text-body-sm text-eventra-navy-900">{agent.user?.email || '—'}</p>
                            <p className="text-body-xs text-eventra-slate-500">{agent.user?.phone || '—'}</p>
                          </div>
                        </td>
                        <td>
                          <p className="text-body-sm text-eventra-navy-900">{agent.agency_name || '—'}</p>
                          <p className="text-body-xs text-eventra-slate-500">{agent.agency_license || 'No license'}</p>
                        </td>
                        <td className="text-center">
                          <p className="font-medium text-eventra-navy-900">{agent.total_customers ?? 0}</p>
                        </td>
                        <td className="text-center">
                          <p className="font-medium text-eventra-navy-900">{agent.total_bookings ?? 0}</p>
                        </td>
                        <td className="text-right">
                          <p className="font-semibold text-eventra-navy-900">{formatCurrency(agent.total_commission ?? 0)}</p>
                        </td>
                        <td className="text-center">
                          <p className="font-medium text-eventra-navy-900">{agent.commission_rate ?? 0}%</p>
                        </td>
                        <td className="text-center">
                          <span className={cn('badge',
                            agent.status === 'active' ? 'badge-success' :
                            agent.status === 'inactive' ? 'badge-neutral' :
                            agent.status === 'suspended' ? 'badge-warning' : 'badge-danger'
                          )}>
                            {agent.status || 'unknown'}
                          </span>
                        </td>
                        <td className="text-center">
                          <p className="text-body-sm text-eventra-slate-600">{agent.created_at ? formatDate(agent.created_at) : '—'}</p>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="xs" onClick={() => { setSelectedAgent(agent); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                              View
                            </Button>
                            <Button variant="ghost" size="xs" className="text-eventra-red-600 hover:bg-eventra-red-50" onClick={() => setAgentToTerminate(agent)} aria-label="Terminate agent">
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

      {/* Create Agent Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Agent"
        size="lg"
      >
        <CreateAgentForm
          onSubmit={async (payload) => {
            const body = await api.post<any>('/admin/agents', payload)
            if (!body.success) throw new Error(body.message || 'Failed to create agent')
            toast.success(body.message || 'Agent created')
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['admin-agents'] })
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Agent Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedAgent(null); }}
        title={selectedAgent?.user?.name || 'Agent Details'}
        size="xl"
      >
        {selectedAgent && <AgentDetailModal agent={selectedAgent} />}
      </Modal>

      {/* Terminate Confirmation */}
      <ConfirmDialog
        isOpen={!!agentToTerminate}
        onClose={() => setAgentToTerminate(null)}
        onConfirm={handleTerminate}
        title="Terminate Agent"
        message={`Terminate ${agentToTerminate?.user?.name || 'this agent'}? Their account will be deactivated.`}
        confirmText="Terminate"
        variant="danger"
        loading={isTerminating}
      />
    </div>
  )
}

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Agents</h1>
        <p className="text-eventra-slate-600 mt-1">Manage travel agents</p>
      </div>
      <Button onClick={onAdd} leftIcon={<UserPlus className="w-5 h-5" />}>
        Add Agent
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-2xl">
          {(agent.user?.name || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{agent.user?.name || '—'}</h3>
          <p className="text-eventra-slate-600">{agent.user?.email || '—'}</p>
          <span className={cn('badge mt-1',
            agent.status === 'active' ? 'badge-success' : agent.status === 'inactive' ? 'badge-neutral' : 'badge-danger'
          )}>
            {agent.status || 'unknown'}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Contact Information</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span>{agent.user?.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Phone className="w-4 h-4" />
              <span>{agent.user?.phone || '—'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Agent Information</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <UserCog className="w-4 h-4" />
              <span>Agent Number: {agent.agent_number || '—'}</span>
            </div>
            {agent.employee_id && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <ClipboardList className="w-4 h-4" />
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
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-eventra-navy-900">Performance</h4>
        <div className="grid grid-cols-2 gap-4">
          <DetailStat icon={<Users className="w-4 h-4" />} label="Customers" value={String(agent.total_customers ?? 0)} />
          <DetailStat icon={<ClipboardList className="w-4 h-4" />} label="Bookings" value={String(agent.total_bookings ?? 0)} />
          <DetailStat icon={<DollarSign className="w-4 h-4" />} label="Total Commission" value={formatCurrency(agent.total_commission ?? 0)} />
          <DetailStat icon={<Target className="w-4 h-4" />} label="Commission Rate" value={`${agent.commission_rate ?? 0}%`} />
        </div>
        <div className="mt-2">
          <p className="text-body-sm text-eventra-slate-600">
            Commission Type: <span className="font-semibold text-eventra-navy-900 capitalize">{agent.commission_type || '—'}</span>
          </p>
          <p className="text-body-sm text-eventra-slate-600">
            Monthly Target: <span className="font-semibold text-eventra-navy-900">{formatCurrency(agent.monthly_target ?? 0)}</span>
          </p>
          <p className="text-body-sm text-eventra-slate-600">Joined: {agent.created_at ? formatDate(agent.created_at) : '—'}</p>
        </div>
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

function CreateAgentForm({ onSubmit, onCancel }: { onSubmit: (payload: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        employee_id: formData.employee_id || undefined,
        agency_name: formData.agency_name || undefined,
        agency_license: formData.agency_license || undefined,
        commission_rate: parseFloat(formData.commission_rate) || 0,
        commission_type: formData.commission_type,
        monthly_target: parseFloat(formData.monthly_target) || 0,
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create agent')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" required />
        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" required />
      </div>
      <Input label="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Employee ID" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} placeholder="EMP001" />
        <Input label="Agency Name" value={formData.agency_name} onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })} placeholder="Travel Agency Name" />
      </div>
      <Input label="Agency License" value={formData.agency_license} onChange={(e) => setFormData({ ...formData, agency_license: e.target.value })} placeholder="LIC12345" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Commission Rate (%)" type="number" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })} placeholder="10" required min="0" max="100" step="0.1" />
        <Select
          label="Commission Type"
          value={formData.commission_type}
          onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
          options={COMMISSION_TYPE_OPTIONS}
        />
      </div>
      <Input label="Monthly Target (INR)" type="number" value={formData.monthly_target} onChange={(e) => setFormData({ ...formData, monthly_target: e.target.value })} placeholder="100000" min="0" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" required minLength={8} />
        <Input label="Confirm Password" type="password" value={formData.password_confirmation} onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })} placeholder="••••••••" required />
      </div>
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Create Agent</Button>
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
