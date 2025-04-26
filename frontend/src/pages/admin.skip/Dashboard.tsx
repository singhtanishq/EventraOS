import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminDashboardData {
  kpis: {
    total_customers: number
    total_agents: number
    bookings_today: number
    bookings_this_month: number
    gross_booking_value: number
    net_revenue: number
    pending_payments: number
    refunds: number
    upcoming_travel: number
    support_tickets: number
    top_destinations: string[]
    top_suppliers: string[]
  }
  revenue_chart: { date: string; revenue: number }[]
  booking_trends: { date: string; bookings: number }[]
  category_distribution: { category: string; count: number }[]
  recent_bookings: any[]
  recent_payments: any[]
  pending_refunds: any[]
  system_health: any
}

export function AdminDashboard() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month')
  const [showHealthModal, setShowHealthModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard', dateRange],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard', { params: { range: dateRange } })
      return response.data
    },
  })

  const kpis = data?.data?.kpis
  const revenueChart = data?.data?.revenue_chart || []
  const bookingTrends = data?.data?.booking_trends || []
  const categoryDist = data?.data?.category_distribution || []
  const recentBookings = data?.data?.recent_bookings || []
  const recentPayments = data?.data?.recent_payments || []
  const pendingRefunds = data?.data?.pending_refunds || []
  const systemHealth = data?.data?.system_health

  if (isLoading) return <AdminDashboardSkeleton />

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Admin Dashboard</h1>
          <p className="text-eventra-slate-600 mt-1">System overview and key metrics</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Select
              value={dateRange}
              onValueChange={setDateRange}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'quarter', label: 'This Quarter' },
                { value: 'year', label: 'This Year' },
              ]}
              className="w-40"
              placeholder="Time Range"
            />
          </div>
          <Button variant="outline" onClick={() => setShowHealthModal(true)} leftIcon={<Activity className="w-5 h-5" />}>
            System Health
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4"
      >
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Customers" value={kpis?.total_customers?.toLocaleString() || '0'} color="eventra-blue" link="/admin/customers" />
        <StatCard icon={<UserCog className="w-6 h-6" />} label="Total Agents" value={kpis?.total_agents?.toLocaleString() || '0'} color="eventra-cyan" link="/admin/agents" />
        <StatCard icon={<Calendar className="w-6 h-6" />} label="Bookings Today" value={kpis?.bookings_today?.toLocaleString() || '0'} color="eventra-green" link="/admin/bookings?filter=today" />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Bookings This Month" value={kpis?.bookings_this_month?.toLocaleString() || '0'} color="eventra-amber" link="/admin/bookings?filter=month" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Gross Booking Value" value={formatCurrency(kpis?.gross_booking_value || 0, 'INR')} color="eventra-purple" link="/admin/reports" />
        <StatCard icon={<CreditCard className="w-6 h-6" />} label="Net Revenue" value={formatCurrency(kpis?.net_revenue || 0, 'INR')} color="eventra-green" link="/admin/payments" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Pending Payments" value={kpis?.pending_payments?.toLocaleString() || '0'} color="eventra-amber" link="/admin/payments?filter=pending" />
        <StatCard icon={<RotateCcwIcon className="w-6 h-6" />} label="Refunds" value={kpis?.refunds?.toLocaleString() || '0'} color="eventra-red" link="/admin/refunds" />
        <StatCard icon={<Suitcase className="w-6 h-6" />} label="Upcoming Travel" value={kpis?.upcoming_travel?.toLocaleString() || '0'} color="eventra-blue" link="/admin/bookings?filter=upcoming" />
        <StatCard icon={<MessageSquare className="w-6 h-6" />} label="Support Tickets" value={kpis?.support_tickets?.toLocaleString() || '0'} color="eventra-red" link="/admin/support" />
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
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900">Revenue Trend</h3>
            <div className="flex gap-2">
              {['7d', '30d', '90d', '1y'].map((range) => (
                <button key={range} className={cn('px-3 py-1 rounded-xl text-body-xs font-medium', dateRange === range ? 'bg-eventra-navy-900 text-white' : 'text-eventra-slate-600 hover:bg-eventra-slate-100')}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            {/* Revenue Chart Placeholder */}
            <div className="h-full flex items-center justify-center text-eventra-slate-400">
              <BarChart3Icon className="w-12 h-12" />
              <span className="ml-3 text-body-md">Revenue Chart (connect to chart library)</span>
            </div>
          </div>
        </Card>

        {/* Booking Trends */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900">Booking Trends</h3>
            <div className="flex gap-2">
              {['7d', '30d', '90d', '1y'].map((range) => (
                <button key={range} className={cn('px-3 py-1 rounded-xl text-body-xs font-medium', dateRange === range ? 'bg-eventra-navy-900 text-white' : 'text-eventra-slate-600 hover:bg-eventra-slate-100')}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <div className="h-full flex items-center justify-center text-eventra-slate-400">
              <ActivityIcon className="w-12 h-12" />
              <span className="ml-3 text-body-md">Booking Trends Chart</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Category Distribution & System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid lg:grid-cols-2 gap-6"
      >
        <Card variant="elevated" padding="lg">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Booking Categories</h3>
          <div className="space-y-4">
            {[
              { name: 'Hotels', count: 1250, color: 'eventra-blue' },
              { name: 'Flights', count: 890, color: 'eventra-cyan' },
              { name: 'Venues', count: 340, color: 'eventra-red' },
              { name: 'Trains', count: 560, color: 'eventra-teal' },
              { name: 'Buses', count: 230, color: 'eventra-amber' },
              { name: 'Cars', count: 180, color: 'eventra-green' },
              { name: 'Activities', count: 120, color: 'eventra-purple' },
              { name: 'Transfers', count: 90, color: 'eventra-pink' },
              { name: 'Packages', count: 75, color: 'eventra-indigo' },
            ].map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', `bg-${cat.color}-500`)} />
                  <span className="font-medium text-eventra-navy-900">{cat.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-eventra-navy-900">{cat.count.toLocaleString()}</span>
                  <div className="w-32 h-2 bg-eventra-slate-200 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', `bg-${cat.color}-500`)} style={{ width: `${(cat.count / 1250) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900">System Health</h3>
            <Button variant="outline" onClick={() => setShowHealthModal(true)} size="sm" leftIcon={<Activity className="w-4 h-4" />}>
              View Details
            </Button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Database', status: 'healthy', latency: '12ms' },
              { name: 'Redis Cache', status: 'healthy', latency: '3ms' },
              { name: 'Mail Service', status: 'healthy', latency: '45ms' },
              { name: 'Payment Gateway', status: 'healthy', latency: '120ms' },
              { name: 'Flight API', status: 'degraded', latency: '2.3s' },
              { name: 'Hotel API', status: 'healthy', latency: '800ms' },
              { name: 'Queue Workers', status: 'healthy', latency: '5 workers' },
              { name: 'Storage', status: 'healthy', usage: '45%' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 rounded-xl bg-eventra-slate-50">
                <div className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', service.status === 'healthy' ? 'bg-eventra-green-500' : 'bg-eventra-amber-500')} />
                  <span className="font-medium text-eventra-navy-900">{service.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('badge px-2 py-1 text-body-xs', service.status === 'healthy' ? 'badge-success' : 'badge-warning')}>
                    {service.status}
                  </span>
                  <span className="text-body-xs text-eventra-slate-500">{service.latency || service.usage}</span>
                </div>
              </div>
            ))}
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
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border border-eventra-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-eventra-slate-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-eventra-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-eventra-navy-900">{booking.service_name}</h4>
                        <p className="text-body-sm text-eventra-slate-600">{booking.customer_name} • {booking.booking_reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-eventra-navy-900">{formatCurrency(booking.amount, booking.currency)}</p>
                      <p className="text-body-xs text-eventra-slate-500">{formatDate(booking.created_at)}</p>
                      <Badge className={cn('badge mt-1', booking.status === 'confirmed' ? 'badge-success' : 'badge-warning')}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-eventra-slate-600">No recent bookings</div>
            )}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card variant="elevated" padding="lg" className="sticky top-24 h-fit">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/admin/customers/new" className="ActionCard onClick={() => {}}">
              <UserPlus className="w-6 h-6" />
              <span>Add Customer</span>
            </Link>
            <Link to="/admin/agents/new" className="ActionCard">
              <UserCog className="w-6 h-6" />
              <span>Add Agent</span>
            </Link>
            <Link to="/admin/bookings/new" className="ActionCard">
              <Plus className="w-6 h-6" />
              <span>Create Booking</span>
            </Link>
            <Link to="/admin/suppliers/new" className="ActionCard">
              <Building className="w-6 h-6" />
              <span>Add Supplier</span>
            </Link>
            <Link to="/admin/venues/new" className="ActionCard">
              <MapPin className="w-6 h-6" />
              <span>Add Venue</span>
            </Link>
            <Link to="/admin/promotions/new" className="ActionCard">
              <TicketPercent className="w-6 h-6" />
              <span>Create Promotion</span>
            </Link>
          </div>
        </Card>

        {/* System Alerts */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900">System Alerts</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowHealthModal(true)} leftIcon={<Activity className="w-4 h-4" />}>
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {[
              { type: 'warning', message: 'Flight API latency increased to 2.3s', time: '5 min ago' },
              { type: 'info', message: 'New agent registered: John Smith', time: '12 min ago' },
              { type: 'success', message: 'Daily backup completed successfully', time: '1 hour ago' },
              { type: 'info', message: 'New promotion created: Summer Sale 2024', time: '3 hours ago' },
              { type: 'warning', message: 'Queue worker 3 restarted', time: '4 hours ago' },
            ].map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn('flex items-center gap-3 p-3 rounded-xl', alert.type === 'warning' ? 'bg-eventra-amber-50' : alert.type === 'error' ? 'bg-eventra-red-50' : alert.type === 'success' ? 'bg-eventra-green-50' : 'bg-eventra-blue-50')}
              >
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', alert.type === 'warning' ? 'bg-eventra-amber-100 text-eventra-amber-600' : alert.type === 'error' ? 'bg-eventra-red-100 text-eventra-red-600' : alert.type === 'success' ? 'bg-eventra-green-100 text-eventra-green-600' : 'bg-eventra-blue-100 text-eventra-blue-600')}>
                  {alert.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                  {alert.type === 'error' && <XCircle className="w-5 h-5" />}
                  {alert.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {alert.type === 'info' && <Info className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-eventra-navy-900">{alert.message}</p>
                  <p className="text-body-xs text-eventra-slate-500">{alert.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-28 bg-eventra-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, link }: { icon: React.ReactNode; label: string; value: string; color: string; link?: string }) {
  return (
    <Link to={link || '#'} className={cn('card p-5 hover:shadow-card-hover transition-shadow', link ? 'cursor-pointer' : '')}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', `bg-${color}-100 text-${color}-600`)}>
          {icon}
        </div>
        {link && <ChevronRight className="w-5 h-5 text-eventra-slate-400" />}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-lg font-display font-bold text-eventra-navy-900 mt-1">{value}</p>
    </Link>
  )
}

function ActionCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-4 text-left hover:shadow-card-hover transition-shadow group">
      <div className="w-10 h-10 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-semibold text-eventra-navy-900 mb-1">{title}</h4>
      <p className="text-body-sm text-eventra-slate-600">{description}</p>
    </button>
  )
}

import { Info } from 'lucide-react'