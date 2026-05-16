import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  UserCog,
  Calendar,
  TrendingUp,
  DollarSign,
  CreditCard,
  Clock,
  RotateCcw,
  Luggage,
  MessageSquare,
  ChevronRight,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Info,
  Package,
  Building,
  MapPin,
  Plus,
  TicketPercent,
  Database,
  Server,
  Mail,
  HardDrive,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { DashboardSkeleton } from '@/components/ui/LoadingScreen'

interface DashboardKpis {
  total_customers?: number
  total_agents?: number
  bookings_today?: number
  bookings_this_month?: number
  gross_booking_value?: number
  net_revenue?: number
  pending_payments?: number
  refunds?: number
  upcoming_travel?: number
  support_tickets?: number
}

interface HealthService {
  status?: string
  [key: string]: unknown
}

interface SystemHealth {
  database?: HealthService
  cache?: HealthService
  queue?: HealthService
  mail?: HealthService
  payment_gateway?: HealthService
  disk_space?: HealthService
  providers?: { code?: string; type?: string; mode?: string; status?: string; last_sync?: string }[]
}

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
]

const CATEGORY_BAR_COLORS: Record<string, string> = {
  hotel: 'bg-eventra-blue-500',
  flight: 'bg-eventra-cyan-500',
  venue: 'bg-eventra-red-500',
  train: 'bg-eventra-teal-500',
  bus: 'bg-eventra-amber-500',
  car: 'bg-eventra-green-500',
  activity: 'bg-eventra-navy-500',
  transfer: 'bg-eventra-slate-500',
  package: 'bg-eventra-teal-500',
}

function categoryLabel(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function AdminDashboard() {
  const [dateRange, setDateRange] = useState('month')
  const [showHealthModal, setShowHealthModal] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-dashboard', dateRange],
    queryFn: async () => {
      const body = await api.get<any>('/admin/dashboard', { range: dateRange })
      return body
    },
  })

  const healthQuery = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const body = await api.get<any>('/admin/system-health')
      return body
    },
    enabled: showHealthModal,
  })

  const kpis: DashboardKpis | undefined = data?.data?.kpis
  const revenueChart: { date: string; revenue: number }[] = data?.data?.revenue_chart ?? []
  const bookingTrends: { date: string; bookings: number }[] = data?.data?.booking_trends ?? []
  const categoryDist: { category: string; count: number }[] = data?.data?.category_distribution ?? []
  const recentBookings: any[] = data?.data?.recent_bookings ?? []
  const systemHealth: SystemHealth | undefined = healthQuery.data?.data ?? data?.data?.system_health

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

  const healthRows: { name: string; icon: React.ReactNode; service?: HealthService; detail?: string }[] = [
    { name: 'Database', icon: <Database className="w-4 h-4" />, service: systemHealth?.database },
    { name: 'Cache', icon: <Server className="w-4 h-4" />, service: systemHealth?.cache, detail: String(systemHealth?.cache?.driver ?? '—') },
    { name: 'Queue', icon: <Activity className="w-4 h-4" />, service: systemHealth?.queue, detail: String(systemHealth?.queue?.connection ?? '—') },
    { name: 'Mail Service', icon: <Mail className="w-4 h-4" />, service: systemHealth?.mail, detail: String(systemHealth?.mail?.mailer ?? '—') },
    { name: 'Payment Gateway', icon: <CreditCard className="w-4 h-4" />, service: systemHealth?.payment_gateway, detail: String(systemHealth?.payment_gateway?.mode ?? '—') },
    { name: 'Storage', icon: <HardDrive className="w-4 h-4" />, service: systemHealth?.disk_space },
  ]

  const degradedProviders = (systemHealth?.providers ?? []).filter(p => p.status && p.status !== 'active')
  const alerts = [
    ...(systemHealth?.database && systemHealth.database.status !== 'healthy'
      ? [{ type: 'error', message: 'Database check failed', time: 'now' }]
      : []),
    ...degradedProviders.map(p => ({
      type: p.status === 'error' ? 'error' : 'warning',
      message: `Provider ${p.code || 'unknown'} (${p.type || '?'}) is ${p.status}`,
      time: p.last_sync ? `synced ${formatDateTime(p.last_sync)}` : 'never synced',
    })),
  ]

  const maxRevenue = Math.max(...revenueChart.map(r => Number(r.revenue) || 0), 1)
  const maxCategoryCount = Math.max(...categoryDist.map(c => Number(c.count) || 0), 1)

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Admin Dashboard</h1>
          <p className="text-eventra-slate-600 mt-1">System overview and key metrics</p>
        </div>
        <div className="flex gap-3">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={RANGE_OPTIONS}
            aria-label="Time range"
            className="w-40"
          />
          <Button variant="outline" onClick={() => setShowHealthModal(true)} leftIcon={<Activity className="w-5 h-5" />}>
            System Health
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Customers" value={(kpis?.total_customers ?? 0).toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" to="/admin/customers" />
        <StatCard icon={<UserCog className="w-5 h-5" />} label="Total Agents" value={(kpis?.total_agents ?? 0).toLocaleString()} iconClass="bg-eventra-cyan-100 text-eventra-cyan-600" to="/admin/agents" />
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Bookings Today" value={(kpis?.bookings_today ?? 0).toLocaleString()} iconClass="bg-eventra-green-100 text-eventra-green-600" to="/admin/bookings" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Bookings This Month" value={(kpis?.bookings_this_month ?? 0).toLocaleString()} iconClass="bg-eventra-amber-100 text-eventra-amber-600" to="/admin/bookings" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Gross Booking Value" value={formatCurrency(kpis?.gross_booking_value ?? 0)} iconClass="bg-eventra-green-100 text-eventra-green-600" to="/admin/reports" />
        <StatCard icon={<CreditCard className="w-5 h-5" />} label="Net Revenue" value={formatCurrency(kpis?.net_revenue ?? 0)} iconClass="bg-eventra-teal-100 text-eventra-teal-600" to="/admin/payments" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Payments" value={(kpis?.pending_payments ?? 0).toLocaleString()} iconClass="bg-eventra-amber-100 text-eventra-amber-600" to="/admin/payments" />
        <StatCard icon={<RotateCcw className="w-5 h-5" />} label="Refunds" value={(kpis?.refunds ?? 0).toLocaleString()} iconClass="bg-eventra-red-100 text-eventra-red-600" to="/admin/refunds" />
        <StatCard icon={<Luggage className="w-5 h-5" />} label="Upcoming Travel" value={(kpis?.upcoming_travel ?? 0).toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" to="/admin/bookings" />
        <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Support Tickets" value={(kpis?.support_tickets ?? 0).toLocaleString()} iconClass="bg-eventra-red-100 text-eventra-red-600" />
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid lg:grid-cols-2 gap-6"
      >
        {/* Revenue Chart */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900">Revenue Trend (Last 30 Days)</h3>
          </div>
          {revenueChart.length > 0 ? (
            <div className="h-56 flex items-end gap-1">
              {revenueChart.map((point) => (
                <div
                  key={point.date}
                  className="flex-1 bg-eventra-navy-900/80 hover:bg-eventra-navy-900 rounded-t transition-colors min-w-[4px]"
                  style={{ height: `${Math.max((Number(point.revenue) / maxRevenue) * 100, 2)}%` }}
                  title={`${formatDate(point.date)}: ${formatCurrency(point.revenue)}`}
                />
              ))}
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-eventra-slate-400">
              <BarChart3 className="w-12 h-12 mb-3" />
              <span className="text-body-md">No revenue data yet</span>
            </div>
          )}
        </Card>

        {/* Booking Categories */}
        <Card variant="elevated" padding="lg">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Booking Categories</h3>
          {categoryDist.length > 0 ? (
            <div className="space-y-4">
              {categoryDist.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-3 h-3 rounded-full flex-shrink-0', CATEGORY_BAR_COLORS[cat.category] || 'bg-eventra-slate-400')} />
                    <span className="font-medium text-eventra-navy-900 capitalize truncate">{categoryLabel(cat.category)}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-semibold text-eventra-navy-900">{Number(cat.count).toLocaleString()}</span>
                    <div className="w-32 h-2 bg-eventra-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', CATEGORY_BAR_COLORS[cat.category] || 'bg-eventra-slate-400')}
                        style={{ width: `${(Number(cat.count) / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-eventra-slate-500">No booking category data yet</div>
          )}
        </Card>
      </motion.div>

      {/* System Health Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid lg:grid-cols-2 gap-6"
      >
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900">System Health</h3>
            <Button variant="outline" onClick={() => setShowHealthModal(true)} size="sm" leftIcon={<Activity className="w-4 h-4" />}>
              View Details
            </Button>
          </div>
          <div className="space-y-4">
            {healthRows.map((row) => {
              const healthy = row.service?.status === 'healthy'
              return (
                <div key={row.name} className="flex items-center justify-between p-3 rounded-xl bg-eventra-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      healthy ? 'bg-eventra-green-100 text-eventra-green-600' : row.service?.status === 'error' ? 'bg-eventra-red-100 text-eventra-red-600' : 'bg-eventra-amber-100 text-eventra-amber-600'
                    )}>
                      {row.icon}
                    </div>
                    <span className="font-medium text-eventra-navy-900">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {row.detail && <span className="text-body-xs text-eventra-slate-500">{row.detail}</span>}
                    <span className={cn('badge px-2 py-1 text-body-xs', healthy ? 'badge-success' : row.service?.status === 'error' ? 'badge-danger' : 'badge-warning')}>
                      {row.service?.status || 'unknown'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* System Alerts */}
        <Card variant="elevated" padding="lg">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">System Alerts</h3>
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl',
                    alert.type === 'warning' ? 'bg-eventra-amber-50' : 'bg-eventra-red-50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    alert.type === 'warning' ? 'bg-eventra-amber-100 text-eventra-amber-600' : 'bg-eventra-red-100 text-eventra-red-600'
                  )}>
                    {alert.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-eventra-navy-900">{alert.message}</p>
                    <p className="text-body-xs text-eventra-slate-500">{alert.time}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-eventra-green-50">
                <div className="w-8 h-8 rounded-full bg-eventra-green-100 text-eventra-green-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-eventra-navy-900">All systems operational</p>
                  <p className="text-body-xs text-eventra-slate-500">No active alerts</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid lg:grid-cols-3 gap-6"
      >
        {/* Recent Bookings */}
        <Card variant="elevated" padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900">Recent Bookings</h3>
            <Link to="/admin/bookings" className="link text-body-sm">View all</Link>
          </div>
          <div className="space-y-3">
            {recentBookings.length > 0 ? (
              recentBookings.slice(0, 10).map((booking: any, index: number) => (
                <motion.div
                  key={booking.id ?? index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border border-eventra-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-eventra-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-eventra-navy-900 truncate">{booking.service_name || '—'}</h4>
                        <p className="text-body-sm text-eventra-slate-600 truncate">{booking.customer_name} • {booking.booking_reference}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-eventra-navy-900">{formatCurrency(Number(booking.amount) || 0, booking.currency || 'INR')}</p>
                      <p className="text-body-xs text-eventra-slate-500">{formatDate(booking.created_at)}</p>
                      <span className={cn('badge mt-1', booking.status === 'confirmed' || booking.status === 'completed' ? 'badge-success' : booking.status === 'cancelled' ? 'badge-danger' : 'badge-warning')}>
                        {String(booking.status || '').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-eventra-slate-600">No recent bookings</div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card variant="elevated" padding="lg" className="h-fit">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Quick Actions</h3>
          <div className="grid gap-3">
            <Link to="/admin/agents" className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center">
                <UserCog className="w-5 h-5" />
              </div>
              <span className="font-medium text-eventra-navy-900">Add Agent</span>
              <ChevronRight className="w-4 h-4 text-eventra-slate-400 ml-auto" />
            </Link>
            <Link to="/admin/bookings" className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-eventra-green-100 text-eventra-green-600 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-medium text-eventra-navy-900">Manage Bookings</span>
              <ChevronRight className="w-4 h-4 text-eventra-slate-400 ml-auto" />
            </Link>
            <Link to="/admin/suppliers" className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-eventra-cyan-100 text-eventra-cyan-600 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <span className="font-medium text-eventra-navy-900">Add Supplier</span>
              <ChevronRight className="w-4 h-4 text-eventra-slate-400 ml-auto" />
            </Link>
            <Link to="/admin/venues" className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-eventra-red-100 text-eventra-red-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="font-medium text-eventra-navy-900">Add Venue</span>
              <ChevronRight className="w-4 h-4 text-eventra-slate-400 ml-auto" />
            </Link>
            <Link to="/admin/promotions" className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-eventra-amber-100 text-eventra-amber-600 flex items-center justify-center">
                <TicketPercent className="w-5 h-5" />
              </div>
              <span className="font-medium text-eventra-navy-900">Create Promotion</span>
              <ChevronRight className="w-4 h-4 text-eventra-slate-400 ml-auto" />
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* System Health Modal */}
      <Modal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        title="System Health"
        size="lg"
      >
        {healthQuery.isLoading ? (
          <div className="py-8 text-center text-eventra-slate-500">Loading health data…</div>
        ) : healthQuery.isError ? (
          <div className="alert alert-danger">
            Failed to load system health.{' '}
            <button className="link" onClick={() => healthQuery.refetch()}>Retry</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {healthRows.map((row) => {
                const healthy = row.service?.status === 'healthy'
                return (
                  <div key={row.name} className="flex items-center justify-between p-3 rounded-xl bg-eventra-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        healthy ? 'bg-eventra-green-100 text-eventra-green-600' : row.service?.status === 'error' ? 'bg-eventra-red-100 text-eventra-red-600' : 'bg-eventra-amber-100 text-eventra-amber-600'
                      )}>
                        {row.icon}
                      </div>
                      <span className="font-medium text-eventra-navy-900">{row.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {row.detail && <span className="text-body-xs text-eventra-slate-500">{row.detail}</span>}
                      <span className={cn('badge px-2 py-1 text-body-xs', healthy ? 'badge-success' : row.service?.status === 'error' ? 'badge-danger' : 'badge-warning')}>
                        {row.service?.status || 'unknown'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {(systemHealth?.providers ?? []).length > 0 && (
              <div>
                <h4 className="font-semibold text-eventra-navy-900 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Providers
                </h4>
                <div className="space-y-2">
                  {(systemHealth?.providers ?? []).map((p, i) => (
                    <div key={`${p.code}-${i}`} className="flex items-center justify-between p-3 rounded-xl border border-eventra-slate-200">
                      <div>
                        <p className="font-medium text-eventra-navy-900">{p.code || '—'}</p>
                        <p className="text-body-xs text-eventra-slate-500 capitalize">{p.type || '—'} • {p.mode || '—'}</p>
                      </div>
                      <span className={cn('badge', p.status === 'active' ? 'badge-success' : p.status === 'error' ? 'badge-danger' : 'badge-warning')}>
                        {p.status || 'unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function StatCard({ icon, label, value, iconClass, to }: { icon: React.ReactNode; label: string; value: string | number; iconClass?: string; to?: string }) {
  const inner = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconClass || 'bg-eventra-blue-100 text-eventra-blue-600')}>
          {icon}
        </div>
        {to && <ChevronRight className="w-5 h-5 text-eventra-slate-400" />}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-lg font-display font-bold text-eventra-navy-900 mt-1">{value}</p>
    </>
  )
  const cls = 'card p-5 hover:shadow-card-hover transition-shadow'
  if (to) {
    return <Link to={to} className={cls}>{inner}</Link>
  }
  return <div className={cls}>{inner}</div>
}
