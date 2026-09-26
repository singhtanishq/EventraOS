import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Briefcase,
  ClipboardList,
  Luggage,
  DollarSign,
  Target,
  Users,
  CheckSquare,
  MessageSquare,
  Plus,
  UserPlus,
  FileText,
  AlertCircle,
  Trophy,
  Building2,
  Plane,
  MapPin,
  Train,
  Bus,
  Car,
  Sparkles,
  Truck,
  Package,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { DashboardSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface AgentStats {
  today_bookings?: number
  pending_requests?: number
  upcoming_trips?: number
  commission_earned?: number
  revenue?: number
  customers_count?: number
  tasks_count?: number
  support_cases?: number
}

interface CommissionSummary {
  total_earned?: number
  total_net?: number
  pending?: number
  eligible?: number
  approved?: number
  paid?: number
  this_month_target?: number
  paid_this_month?: number
}

interface AgentBooking {
  id: number
  booking_reference: string
  customer_name: string
  customer_email: string
  service_type: string
  service_name: string
  status: string
  payment_status?: string
  amount: number
  currency: string
  travel_date?: string
  created_at: string
}

interface AgentTrip {
  id: number
  booking_reference: string
  customer_name: string
  service_type: string
  service_name: string
  travel_date?: string
  status: string
}

interface AgentRequest {
  id: number
  customer_name: string
  request_type: string
  details: string
  status: string
}

interface AgentTaskItem {
  id: number
  title: string
  description?: string | null
  due_date?: string | null
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  booking_id?: number | null
}

function statusVariant(status?: string): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
  switch (status) {
    case 'confirmed':
    case 'completed':
    case 'rescheduled':
    case 'refunded':
      return 'success'
    case 'pending':
    case 'partially_confirmed':
    case 'reschedule_requested':
    case 'refund_pending':
    case 'in_progress':
      return 'warning'
    case 'cancelled':
    case 'cancel_requested':
    case 'failed':
      return 'danger'
    case 'sent':
    case 'accepted':
      return 'primary'
    default:
      return 'neutral'
  }
}

export function AgentDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: async () => {
      const body = await api.get<any>('/agent/dashboard')
      return body
    },
  })

  const toggleTask = useMutation({
    mutationFn: async (task: AgentTaskItem) => {
      const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
      return api.put<any>(`/agent/tasks/${task.id}`, { status: nextStatus })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] })
      toast.success('Task updated')
    },
    onError: () => {
      toast.error('Failed to update task')
    },
  })

  const stats: AgentStats | undefined = data?.data?.stats
  const commissionSummary: CommissionSummary | undefined = data?.data?.commission_summary
  const recentBookings: AgentBooking[] = data?.data?.recent_bookings ?? []
  const pendingRequests: AgentRequest[] = data?.data?.pending_requests ?? []
  const upcomingTrips: AgentTrip[] = data?.data?.upcoming_trips ?? []
  const tasks: AgentTaskItem[] = data?.data?.tasks ?? []

  if (isLoading) return <DashboardSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load dashboard</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

  const target = Number(commissionSummary?.this_month_target) || 0
  const paidThisMonth = Number(commissionSummary?.paid_this_month) || 0
  const progressPct = target > 0 ? Math.min(100, Math.round((paidThisMonth / target) * 100)) : 0

  return (
    <div className="space-y-6 animate-in">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 bg-gradient-to-r from-eventra-blue-600 to-eventra-cyan-600 rounded-2xl text-white"
      >
        <div>
          <h1 className="text-display-sm font-display font-bold mb-2">Welcome back, Agent!</h1>
          <p className="text-eventra-blue-100">Here's your performance overview</p>
        </div>
        <div className="flex gap-3 lg:ml-auto">
          <Link to="/agent/booking-workspace" className="btn-secondary bg-white/20 border-white/30 text-white hover:bg-white/30">
            <Plus className="w-5 h-5 mr-2" />
            New Booking
          </Link>
          <Link to="/agent/customers" className="btn-primary bg-white text-eventra-blue-600 hover:bg-eventra-slate-100">
            <Users className="w-5 h-5 mr-2" />
            Manage Customers
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4"
      >
        <StatCard icon={<Briefcase className="w-6 h-6" />} label="Today's Bookings" value={stats?.today_bookings ?? 0} color="eventra-blue" link="/agent/bookings" />
        <StatCard icon={<ClipboardList className="w-6 h-6" />} label="Pending Requests" value={stats?.pending_requests ?? 0} color="eventra-amber" link="/agent/booking-workspace" />
        <StatCard icon={<Luggage className="w-6 h-6" />} label="Upcoming Trips" value={stats?.upcoming_trips ?? 0} color="eventra-cyan" link="/agent/bookings" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Revenue" value={formatCurrency(stats?.revenue ?? 0)} color="eventra-green" link="/agent/bookings" />
        <StatCard icon={<Target className="w-6 h-6" />} label="Commission Earned" value={formatCurrency(stats?.commission_earned ?? 0)} color="eventra-amber" link="/agent/commissions" />
        <StatCard icon={<Users className="w-6 h-6" />} label="Customers" value={stats?.customers_count ?? 0} color="eventra-teal" link="/agent/customers" />
        <StatCard icon={<CheckSquare className="w-6 h-6" />} label="Open Tasks" value={stats?.tasks_count ?? 0} color="eventra-red" link="/agent/tasks" />
        <StatCard icon={<MessageSquare className="w-6 h-6" />} label="Support Cases" value={stats?.support_cases ?? 0} color="eventra-slate" link="/agent/support" />
      </motion.div>

      {/* Commission Progress */}
      {commissionSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid lg:grid-cols-2 gap-6"
        >
          <Card padding="none" className="bg-gradient-to-r from-eventra-amber-600 to-eventra-amber-500 text-white p-6">
            <div className="mb-6">
              <p className="text-eventra-amber-100 text-body-md">Monthly Commission Target</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold">{formatCurrency(paidThisMonth)}</span>
                <span className="text-eventra-amber-200">/ {formatCurrency(target)}</span>
              </div>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <div className="flex justify-between text-eventra-amber-100 text-body-sm mt-3">
              <span>Pending: {formatCurrency(commissionSummary.pending ?? 0)}</span>
              <span>Eligible: {formatCurrency(commissionSummary.eligible ?? 0)}</span>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h3 className="font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-eventra-amber-600" />
              Commission Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-eventra-slate-600">Total Earned</span>
                <span className="font-semibold text-eventra-navy-900">{formatCurrency(commissionSummary.total_earned ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-eventra-slate-600">Paid This Month</span>
                <span className="font-semibold text-eventra-green-600">{formatCurrency(paidThisMonth)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-eventra-slate-600">Pending Approval</span>
                <span className="font-semibold text-eventra-amber-600">{formatCurrency(commissionSummary.pending ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-eventra-slate-600">Eligible for Payout</span>
                <span className="font-semibold text-eventra-blue-600">{formatCurrency(commissionSummary.eligible ?? 0)}</span>
              </div>
              <div className="border-t border-eventra-slate-200 pt-3 flex justify-between font-semibold">
                <span className="text-eventra-navy-900">Target Progress</span>
                <span className={cn('text-lg', progressPct >= 100 ? 'text-eventra-green-600' : 'text-eventra-amber-600')}>
                  {progressPct}%
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Recent Bookings</h2>
              <Link to="/agent/bookings" className="link text-body-sm">View all</Link>
            </div>
            <div className="space-y-3">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                      {getServiceIcon(booking.service_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-eventra-navy-900 truncate">{booking.service_name}</h3>
                        <Badge variant={statusVariant(booking.status)} size="sm">{String(booking.status || '').replace(/_/g, ' ')}</Badge>
                      </div>
                      <p className="text-body-sm text-eventra-slate-600 mt-1 truncate">{booking.customer_name} • {booking.booking_reference}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-eventra-navy-900">{formatCurrency(Number(booking.amount) || 0, booking.currency || 'INR')}</p>
                      <p className="text-body-xs text-eventra-slate-500">{formatDate(booking.travel_date || booking.created_at)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/agent/bookings')}>
                      View
                    </Button>
                  </motion.div>
                ))
              ) : (
                <Card variant="outlined" padding="lg" className="text-center">
                  <Briefcase className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">No recent bookings</h3>
                  <p className="text-eventra-slate-600 mb-4">Start booking for your customers!</p>
                  <Link to="/agent/booking-workspace" className="btn-primary inline-flex">
                    <Plus className="w-5 h-5 mr-2" />
                    New Booking
                  </Link>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Pending Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Pending Requests</h2>
              <Link to="/agent/booking-workspace" className="link text-body-sm">Open workspace</Link>
            </div>
            <div className="space-y-3">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-eventra-amber-100 text-eventra-amber-600 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-eventra-navy-900">{request.customer_name}</h3>
                      <p className="text-body-sm text-eventra-slate-600 truncate">{request.request_type} — {request.details}</p>
                    </div>
                    <Badge variant="warning" size="sm">{request.status}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/agent/booking-workspace')}>
                      Handle
                    </Button>
                  </motion.div>
                ))
              ) : (
                <Card variant="outlined" padding="lg" className="text-center">
                  <CheckSquare className="w-10 h-10 text-eventra-green-500 mx-auto mb-3" />
                  <p className="text-eventra-slate-600">No pending requests</p>
                </Card>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <ActionCard
                icon={<Plus className="w-6 h-6" />}
                title="New Booking"
                description="Book for a customer"
                onClick={() => navigate('/agent/booking-workspace')}
              />
              <ActionCard
                icon={<UserPlus className="w-6 h-6" />}
                title="Add Customer"
                description="Register new customer"
                onClick={() => navigate('/agent/customers')}
              />
              <ActionCard
                icon={<FileText className="w-6 h-6" />}
                title="Create Quote"
                description="Generate quote for customer"
                onClick={() => navigate('/agent/quotes')}
              />
              <ActionCard
                icon={<Target className="w-6 h-6" />}
                title="Commissions"
                description="Track your earnings"
                onClick={() => navigate('/agent/commissions')}
              />
              <ActionCard
                icon={<CheckSquare className="w-6 h-6" />}
                title="My Tasks"
                description="Manage your tasks"
                onClick={() => navigate('/agent/tasks')}
              />
              <ActionCard
                icon={<MessageSquare className="w-6 h-6" />}
                title="Support"
                description="Help customers"
                onClick={() => navigate('/agent/support')}
              />
            </div>
          </motion.div>

          {/* Upcoming Trips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Upcoming Trips</h2>
              <Link to="/agent/bookings" className="link text-body-sm">View all</Link>
            </div>
            <div className="space-y-3">
              {upcomingTrips.length > 0 ? (
                upcomingTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                      {getServiceIcon(trip.service_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-eventra-navy-900 truncate">{trip.service_name}</h3>
                      <p className="text-body-sm text-eventra-slate-600">{trip.customer_name} • {formatDate(trip.travel_date)}</p>
                    </div>
                    <Badge variant={statusVariant(trip.status)} size="sm">{String(trip.status || '').replace(/_/g, ' ')}</Badge>
                  </motion.div>
                ))
              ) : (
                <Card variant="outlined" padding="lg" className="text-center">
                  <Luggage className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <p className="text-eventra-slate-600">No upcoming trips yet</p>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">My Tasks</h2>
              <Link to="/agent/tasks" className="link text-body-sm">View all</Link>
            </div>
            <Card variant="elevated" padding="lg">
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn('flex items-start gap-3 p-3 rounded-xl', task.status === 'completed' ? 'bg-eventra-green-50' : 'bg-eventra-slate-50')}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => toggleTask.mutate(task)}
                        disabled={toggleTask.isPending}
                        className="form-checkbox mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={cn('font-medium text-eventra-navy-900', task.status === 'completed' ? 'line-through text-eventra-slate-400' : '')}>{task.title}</h4>
                        {task.description && <p className="text-body-sm text-eventra-slate-600 line-clamp-1">{task.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : 'neutral'} size="sm">
                          {task.priority || 'normal'}
                        </Badge>
                        {task.due_date && <p className="text-body-xs text-eventra-slate-500 mt-1">{formatDate(task.due_date)}</p>}
                      </div>
                    </motion.div>
                  ))}
                  {tasks.length > 5 && (
                    <Link to="/agent/tasks" className="block text-center text-body-sm text-eventra-blue-600 hover:text-eventra-blue-700 mt-3">
                      View all {tasks.length} tasks
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <p className="text-eventra-slate-600">No open tasks assigned</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, link }: { icon: React.ReactNode; label: string; value: string | number; color: string; link: string }) {
  return (
    <Link to={link} className="card p-5 hover:shadow-card-hover transition-shadow block">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', statIconClass(color))}>
          {icon}
        </div>
        <ChevronRight className="w-5 h-5 text-eventra-slate-400" />
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-lg font-display font-bold text-eventra-navy-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </Link>
  )
}

function ActionCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card p-4 text-left hover:shadow-card-hover transition-shadow"
    >
      <div className="w-10 h-10 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h4 className="font-medium text-eventra-navy-900 text-body-md">{title}</h4>
      <p className="text-body-xs text-eventra-slate-500 mt-0.5">{description}</p>
    </button>
  )
}

function statIconClass(color: string): string {
  const map: Record<string, string> = {
    'eventra-blue': 'bg-eventra-blue-100 text-eventra-blue-600',
    'eventra-cyan': 'bg-eventra-cyan-100 text-eventra-cyan-600',
    'eventra-teal': 'bg-eventra-teal-100 text-eventra-teal-600',
    'eventra-green': 'bg-eventra-green-100 text-eventra-green-600',
    'eventra-amber': 'bg-eventra-amber-100 text-eventra-amber-600',
    'eventra-red': 'bg-eventra-red-100 text-eventra-red-600',
    'eventra-slate': 'bg-eventra-slate-100 text-eventra-slate-600',
  }
  return map[color] || 'bg-eventra-blue-100 text-eventra-blue-600'
}

function getServiceIcon(type?: string) {
  switch (type) {
    case 'hotel': return <Building2 className="w-6 h-6 text-eventra-blue-600" />
    case 'flight': return <Plane className="w-6 h-6 text-eventra-cyan-600" />
    case 'venue': return <MapPin className="w-6 h-6 text-eventra-red-600" />
    case 'train': return <Train className="w-6 h-6 text-eventra-teal-600" />
    case 'bus': return <Bus className="w-6 h-6 text-eventra-amber-600" />
    case 'car': return <Car className="w-6 h-6 text-eventra-green-600" />
    case 'activity': return <Sparkles className="w-6 h-6 text-eventra-blue-600" />
    case 'transfer': return <Truck className="w-6 h-6 text-eventra-cyan-600" />
    case 'package': return <Package className="w-6 h-6 text-eventra-navy-600" />
    default: return <Package className="w-6 h-6 text-eventra-navy-600" />
  }
}
