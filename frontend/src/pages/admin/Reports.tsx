import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  Calendar,
  TrendingUp,
  BarChart3,
  Users,
  UserCog,
  RefreshCw,
  Percent,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DashboardSkeleton } from '@/components/ui/LoadingScreen'

interface ReportSummary {
  total_bookings?: number
  total_revenue?: number
  avg_booking_value?: number
  cancellation_rate?: number
}

interface ProductRow {
  item_type?: string
  count?: number
  revenue?: number | string
}

interface DailyRevenuePoint {
  date?: string
  revenue?: number | string
  bookings?: number
}

interface NamedCount {
  name?: string
  bookings?: number
}

const RANGE_OPTIONS = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: '365', label: '1Y' },
]

const PRODUCT_BAR_COLORS: Record<string, string> = {
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

function productLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function AdminReports() {
  const [days, setDays] = useState('30')

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-reports', days],
    queryFn: async () => {
      const body = await api.get<any>('/admin/reports', { days: Number(days) })
      return body
    },
  })

  const sales = data?.data?.sales ?? {}
  const summary: ReportSummary = sales?.summary ?? {}
  const byProduct: ProductRow[] = sales?.by_product ?? []
  const dailyRevenue: DailyRevenuePoint[] = sales?.daily_revenue ?? []
  const customers = data?.data?.customers ?? {}
  const topCustomers: NamedCount[] = customers?.top_customers ?? []
  const agents = data?.data?.agents ?? {}
  const topAgents: NamedCount[] = agents?.top_agents ?? []

  if (isLoading) return <DashboardSkeleton />

  if (isError) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader />
        <div className="alert alert-danger text-center py-12">
          <p className="font-medium">Failed to load reports</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  const maxDailyRevenue = Math.max(...dailyRevenue.map(r => Number(r.revenue) || 0), 1)
  const maxProductRevenue = Math.max(...byProduct.map(p => Number(p.revenue) || 0), 1)

  return (
    <div className="space-y-6 animate-in">
      <PageHeader />

      {/* Range Selector */}
      <Card variant="elevated" padding="md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((range) => (
              <button
                key={range.value}
                onClick={() => setDays(range.value)}
                className={cn(
                  'px-4 py-2 rounded-xl text-body-sm font-medium transition-all',
                  days === range.value
                    ? 'bg-eventra-navy-900 text-white shadow-card'
                    : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 lg:ml-auto">
            <Button variant="outline" onClick={() => refetch()} loading={isFetching} leftIcon={<RefreshCw className="w-5 h-5" />}>
              Refresh Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Gross Booking Value" value={formatCurrency(Number(summary.total_revenue) || 0)} iconClass="bg-eventra-green-100 text-eventra-green-600" />
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Total Bookings" value={(Number(summary.total_bookings) || 0).toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Avg Booking Value" value={formatCurrency(Number(summary.avg_booking_value) || 0)} iconClass="bg-eventra-cyan-100 text-eventra-cyan-600" />
        <StatCard icon={<Percent className="w-5 h-5" />} label="Cancellation Rate" value={`${Number(summary.cancellation_rate) || 0}%`} iconClass="bg-eventra-red-100 text-eventra-red-600" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Customers" value={(Number(customers.total) || 0).toLocaleString()} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
        <StatCard icon={<UserCog className="w-5 h-5" />} label="Active Agents" value={`${(Number(agents.active_agents) || 0).toLocaleString()} / ${(Number(agents.total_agents) || 0).toLocaleString()}`} iconClass="bg-eventra-teal-100 text-eventra-teal-600" />
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid lg:grid-cols-2 gap-6"
      >
        {/* Revenue Trend */}
        <Card variant="elevated" padding="lg">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Revenue Trend (Last {days} Days)</h3>
          {dailyRevenue.length > 0 ? (
            <div className="h-56 flex items-end gap-1">
              {dailyRevenue.map((point, i) => (
                <div
                  key={point.date || i}
                  className="flex-1 bg-eventra-navy-900/80 hover:bg-eventra-navy-900 rounded-t transition-colors min-w-[4px]"
                  style={{ height: `${Math.max((Number(point.revenue) / maxDailyRevenue) * 100, 2)}%` }}
                  title={`${point.date ? formatDate(point.date) : '—'}: ${formatCurrency(Number(point.revenue) || 0)} • ${Number(point.bookings) || 0} bookings`}
                />
              ))}
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-eventra-slate-400">
              <BarChart3 className="w-12 h-12 mb-3" />
              <span className="text-body-md">No revenue data for this period</span>
            </div>
          )}
        </Card>

        {/* Revenue by Product */}
        <Card variant="elevated" padding="lg">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Revenue by Product</h3>
          {byProduct.length > 0 ? (
            <div className="space-y-4">
              {byProduct.map((product, i) => (
                <div key={product.item_type || i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-3 h-3 rounded-full flex-shrink-0', PRODUCT_BAR_COLORS[String(product.item_type)] || 'bg-eventra-slate-400')} />
                    <span className="font-medium text-eventra-navy-900 capitalize truncate">{productLabel(String(product.item_type || 'Other'))}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-semibold text-eventra-navy-900">{(Number(product.count) || 0).toLocaleString()}</span>
                    <div className="w-32 h-2 bg-eventra-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', PRODUCT_BAR_COLORS[String(product.item_type)] || 'bg-eventra-slate-400')}
                        style={{ width: `${(Number(product.revenue) / maxProductRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-eventra-navy-900 w-24 text-right">{formatCurrency(Number(product.revenue) || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-eventra-slate-500">No product revenue data yet</div>
          )}
        </Card>
      </motion.div>

      {/* Top Customers & Top Agents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid lg:grid-cols-2 gap-6"
      >
        <Card variant="elevated" padding="lg">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Top Customers</h3>
          {topCustomers.length > 0 ? (
            <div className="space-y-3">
              {topCustomers.map((customer, i) => (
                <div key={customer.name || i} className="flex items-center justify-between p-3 rounded-xl bg-eventra-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-eventra-navy-900 truncate">{customer.name || '—'}</span>
                  </div>
                  <span className="text-body-sm text-eventra-slate-600 flex-shrink-0">{(Number(customer.bookings) || 0).toLocaleString()} bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-eventra-slate-500">No customer data yet</div>
          )}
        </Card>

        <Card variant="elevated" padding="lg">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Top Agents</h3>
          {topAgents.length > 0 ? (
            <div className="space-y-3">
              {topAgents.map((agent, i) => (
                <div key={agent.name || i} className="flex items-center justify-between p-3 rounded-xl bg-eventra-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-eventra-cyan-100 text-eventra-cyan-600 flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-eventra-navy-900 truncate">{agent.name || '—'}</span>
                  </div>
                  <span className="text-body-sm text-eventra-slate-600 flex-shrink-0">{(Number(agent.bookings) || 0).toLocaleString()} bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-eventra-slate-500">No agent data yet</div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Reports & Analytics</h1>
        <p className="text-eventra-slate-600 mt-1">Business performance across sales, customers, and agents</p>
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
