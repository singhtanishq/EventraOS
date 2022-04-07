import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2, PieChart as PieChartIcon, Users as UsersIcon, DollarSign as DollarSignIcon, TrendingUp as TrendingUpIcon, ArrowRight, ArrowLeft, RefreshCw, Settings as SettingsIcon, FileText as FileTextIcon2, Printer, Mail, AlertTriangle, Hash, FileSpreadsheet, Download as DownloadIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminReport {
  id: number
  name: string
  type: string
  description: string
  schedule: string
  last_generated?: string
  next_run?: string
  format: string[]
  parameters: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export function AdminReports() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'customers' | 'agents' | 'destinations' | 'products' | 'financial' | 'operational'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name' | 'schedule'>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', search, filterType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('sort', sortBy)
      const response = await api.get('/admin/reports', { params })
      return response.data
    },
  })

  const reports = data?.data?.reports || []

  const filteredReports = reports.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false
    return true
  })

  if (isLoading) return <AdminReportsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Reports & Analytics</h1>
          <p className="text-eventra-slate-600 mt-1">Generate and manage business reports</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
            Create Report
          </Button>
          <Button leftIcon={<DownloadIcon className="w-5 h-5" />} onClick={() => {}}>
            Export All
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card variant="elevated" padding="lg" className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'quarter', 'year', 'custom'] as const).map((range) => (
              <button
                key={range}
                onClick={() => { setDateRange(range); setCustomStartDate(''); setCustomEndDate(''); }}
                className={cn(
                  'px-4 py-2 rounded-xl text-body-sm font-medium transition-all',
                  dateRange === range
                    ? 'bg-eventra-navy-900 text-white shadow-card'
                    : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                )}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-4">
              <Input
                type="date"
                label="Start Date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-48"
              />
              <Input
                type="date"
                label="End Date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-48"
              />
            </div>
          )}
          <div className="flex gap-3 lg:ml-auto">
            <Button variant="outline" onClick={() => {}} leftIcon={<RefreshCw className="w-5 h-5" />}>
              Refresh Data
            </Button>
            <Button leftIcon={<DownloadIcon className="w-5 h-5" />} onClick={() => {}}>
              Export Dashboard
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
      >
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Gross Booking Value" value="₹2.45 Cr" color="eventra-green" link="/admin/reports?type=sales" />
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Customers" value="12,450" color="eventra-blue" link="/admin/reports?type=customers" />
        <StatCard icon={<UserCog className="w-6 h-6" />} label="Active Agents" value="87" color="eventra-cyan" link="/admin/reports?type=agents" />
        <StatCard icon={<Building2 className="w-6 h-6" />} label="Bookings This Month" value="3,420" color="eventra-amber" link="/admin/reports?type=products" />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Revenue Growth" value="+12.5%" color="eventra-green" link="/admin/reports?type=financial" />
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
            <div className="h-full flex items-center justify-center text-eventra-slate-400">
              <BarChart3 className="w-12 h-12" />
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
              <Activity className="w-12 h-12" />
              <span className="ml-3 text-body-md">Booking Trends Chart</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Category Distribution & Top Reports */}
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
              { name: 'Hotels', count: 1250, value: '₹1.2 Cr', color: 'eventra-blue' },
              { name: 'Flights', count: 890, value: '₹85 L', color: 'eventra-cyan' },
              { name: 'Venues', count: 340, value: '₹45 L', color: 'eventra-red' },
              { name: 'Trains', count: 560, value: '₹28 L', color: 'eventra-teal' },
              { name: 'Buses', count: 230, value: '₹12 L', color: 'eventra-amber' },
              { name: 'Cars', count: 180, value: '₹9 L', color: 'eventra-green' },
              { name: 'Activities', count: 120, value: '₹6 L', color: 'eventra-purple' },
              { name: 'Transfers', count: 90, value: '₹4 L', color: 'eventra-pink' },
              { name: 'Packages', count: 75, value: '₹35 L', color: 'eventra-indigo' },
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
                  <span className="font-medium text-eventra-navy-900">{cat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Top Reports</h3>
          <div className="space-y-4">
            {[
              { name: 'Monthly Sales Report', type: 'sales', schedule: 'Monthly', lastRun: '2024-01-01', status: 'completed' },
              { name: 'Customer Acquisition', type: 'customers', schedule: 'Weekly', lastRun: '2024-01-15', status: 'completed' },
              { name: 'Agent Performance', type: 'agents', schedule: 'Monthly', lastRun: '2024-01-10', status: 'pending' },
              { name: 'Top Destinations', type: 'destinations', schedule: 'Quarterly', lastRun: '2023-12-31', status: 'completed' },
              { name: 'Revenue by Product', type: 'products', schedule: 'Monthly', lastRun: '2024-01-05', status: 'completed' },
              { name: 'Commission Payout', type: 'financial', schedule: 'Monthly', lastRun: '2024-01-01', status: 'completed' },
            ].map((report) => (
              <motion.div
                key={report.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-eventra-slate-50 hover:bg-eventra-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-eventra-navy-900">{report.name}</h4>
                    <p className="text-body-sm text-eventra-slate-600">{report.type} • {report.schedule}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-body-sm text-eventra-slate-600">Last: {formatDate(report.lastRun)}</span>
                  <Badge className={cn('badge px-2 py-1 text-body-xs',
                    report.status === 'completed' ? 'badge-success' :
                    report.status === 'pending' ? 'badge-warning' :
                    report.status === 'failed' ? 'badge-danger' : 'badge-neutral'
                  )}>
                    {report.status}
                  </Badge>
                  <Button variant="ghost" size="xs" leftIcon={<DownloadIcon className="w-4 h-4" />}>
                    Download
                  </Button>
                  <Button variant="ghost" size="xs" leftIcon={<Play className="w-4 h-4" />}>
                    Run
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Report Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900">Report Templates</h3>
            <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
              Create Custom Report
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Sales Summary', icon: DollarSign, color: 'eventra-green', description: 'Monthly sales performance with breakdown by product and channel' },
              { name: 'Customer Analytics', icon: Users, color: 'eventra-blue', description: 'Customer acquisition, retention, and lifetime value analysis' },
              { name: 'Agent Performance', icon: Users, color: 'eventra-cyan', description: 'Agent bookings, commissions, and conversion rates' },
              { name: 'Destination Trends', icon: MapPin, color: 'eventra-red', description: 'Popular destinations, seasonal patterns, and market share' },
              { name: 'Product Mix', icon: Package, color: 'eventra-purple', description: 'Booking distribution across hotels, flights, venues, and more' },
              { name: 'Financial Summary', icon: CreditCard, color: 'eventra-amber', description: 'Revenue, refunds, commissions, and net revenue tracking' },
              { name: 'Agent Commissions', icon: Target, color: 'eventra-amber', description: 'Commission tracking, payouts, and agent performance' },
              { name: 'Customer Loyalty', icon: Award, color: 'eventra-purple', description: 'Loyalty points, tier distribution, and redemption rates' },
              { name: 'Operational Metrics', icon: Activity, color: 'eventra-teal', description: 'Booking conversion, cancellation rates, and support tickets' },
            ].map((template) => (
              <motion.div
                key={template.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="card p-6 hover:shadow-card-hover transition-shadow cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', `bg-${template.color}-100 text-${template.color}-600`)}>
                    <template.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-eventra-navy-900">{template.name}</h4>
                    <p className="text-body-sm text-eventra-slate-600">{template.description}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="flex-1" leftIcon={<Play className="w-4 h-4" />}>
                    Run Report
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1" leftIcon={<SettingsIcon className="w-4 h-4" />}>
                    Customize
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

function AdminReportsSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <div className="grid lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <Card variant="elevated" padding="lg" className="animate-pulse" />
    </div>
  )
}