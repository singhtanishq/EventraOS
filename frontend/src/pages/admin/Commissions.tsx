import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2, PieChart as PieChartIcon, Users as UsersIcon, DollarSign as DollarSignIcon, TrendingUp as TrendingUpIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminCommission {
  id: number
  uuid: string
  commission_reference: string
  booking_id: number
  booking_reference: string
  booking_item_id?: number
  agent_id: number
  agent_name: string
  agent_number: string
  customer_id: number
  customer_name: string
  provider_id?: number
  status: string
  booking_amount: number
  commission_rate: number
  commission_amount: number
  tax_amount: number
  net_commission: number
  currency: string
  commission_type: string
  calculation_details: any
  eligible_date?: string
  approved_at?: string
  approved_by?: number
  paid_at?: string
  paid_by?: number
  payout_reference?: string
  reversed_at?: string
  reversal_reason?: string
  reversed_by?: number
  created_at: string
  updated_at: string
}

export function AdminCommissions() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'eligible' | 'approved' | 'paid' | 'reversed' | 'cancelled' | 'on_hold'>('all')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc' | 'eligible_desc' | 'eligible_asc'>('created_desc')
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month')
  const [selectedCommission, setSelectedCommission] = useState<AdminCommission | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-commissions', search, filterStatus, filterAgent, sortBy, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterAgent !== 'all') params.set('agent', filterAgent)
      params.set('sort', sortBy)
      params.set('range', dateRange)
      const response = await api.get('/admin/commissions', { params })
      return response.data
    },
  )

  const commissions = data?.data?.commissions || []
  const agents = data?.data?.agents || []

  const filteredCommissions = commissions.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (filterAgent !== 'all' && c.agent_id !== parseInt(filterAgent)) return false
    return true
  })

  if (isLoading) return <AdminCommissionsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Commissions</h1>
          <p className="text-eventra-slate-600 mt-1">Manage agent commissions and payouts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {}} leftIcon={<Download className="w-5 h-5" />}>
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
      >
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Total Commission" value={formatCurrency(commissions.reduce((sum, c) => sum + c.commission_amount, 0), 'INR')} color="eventra-green" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={formatCurrency(commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0), 'INR')} color="eventra-amber" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Eligible" value={formatCurrency(commissions.filter(c => c.status === 'eligible').reduce((sum, c) => sum + c.net_commission, 0), 'INR')} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Approved" value={formatCurrency(commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.net_commission, 0), 'INR')} color="eventra-green" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Paid" value={formatCurrency(commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.net_commission, 0), 'INR')} color="eventra-green" />
      </motion.div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'eligible', 'approved', 'paid', 'reversed', 'cancelled', 'on_hold'] as const).map((status) => (
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
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <Select
              value="month"
              onValueChange={() => {}}
              options={[
                { value: 'month', label: 'This Month' },
                { value: 'quarter', label: 'This Quarter' },
                { value: 'year', label: 'This Year' },
                { value: 'all', label: 'All Time' },
              ]}
              className="w-36"
              placeholder="Period"
            />
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'eligible', label: 'Eligible' },
                { value: 'approved', label: 'Approved' },
                { value: 'paid', label: 'Paid' },
                { value: 'reversed', label: 'Reversed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'on_hold', label: 'On Hold' },
              ]}
              className="w-40"
              placeholder="Filter by status"
            />
            <Input
              placeholder="Search commissions..."
              className="w-64"
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
        </div>
      </Card>

      {/* Commissions Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminCommissionsSkeleton />
        ) : filteredCommissions.length === 0 ? (
          <EmptyCommissionsState />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredCommissions.length}</strong> of <strong>{commissions.length}</strong> commissions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Booking</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Agent</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Booking Amt</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Rate</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Commission</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Net</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Eligible</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommissions.map((commission, index) => (
                    <tr key={commission.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-body-sm text-eventra-navy-900">{commission.commission_reference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-eventra-navy-900">{commission.booking_reference}</p>
                          <p className="text-body-xs text-eventra-slate-500">{commission.service_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-eventra-navy-900">{commission.agent_name}</p>
                          <p className="text-body-xs text-eventra-slate-500">{commission.agent_number}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-eventra-navy-900">{formatCurrency(commission.booking_amount, commission.currency)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-body-sm text-eventra-slate-600">{commission.commission_rate}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-eventra-navy-900">{formatCurrency(commission.commission_amount, commission.currency)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-eventra-green-600">{formatCurrency(commission.net_commission, commission.currency)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          commission.status === 'pending' ? 'badge-warning' :
                          commission.status === 'eligible' ? 'badge-primary' :
                          commission.status === 'approved' ? 'badge-success' :
                          commission.status === 'paid' ? 'badge-success' :
                          commission.status === 'reversed' ? 'badge-danger' :
                          commission.status === 'cancelled' ? 'badge-danger' :
                          commission.status === 'on_hold' ? 'badge-warning' : 'badge-neutral'
                        )}>
                          {commission.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {commission.eligible_date ? formatDate(commission.eligible_date) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => {}}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {commissions.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(commissions.length / 20)} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AdminCommissionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-eventra-slate-200">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Booking Amt</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Eligible</th>
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

function EmptyCommissionsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <DollarSign className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No commissions yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Complete bookings for agents to start generating commissions.
      </p>
    </motion.div>
  )
}