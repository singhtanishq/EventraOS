import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2, RotateCcw as RotateCcwIcon3, RefreshCw, Layers, FileText as FileTextIcon2, CheckCircle2, X, AlertCircle, Info, HelpCircle, ExternalLink, ChevronsRight, ChevronsLeft, ChevronUp as ChevronUpIcon, ChevronDown as ChevronDownIcon, RotateCcw as RotateCcwIcon4 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminRefund {
  id: number
  uuid: string
  refund_reference: string
  booking_id: number
  booking_reference: string
  booking_item_id?: number
  payment_id: number
  customer_id: number
  customer_name: string
  provider_id?: number
  provider_refund_id?: string
  status: string
  refund_type: string
  reason: string
  reason_details?: string
  requested_amount: number
  approved_amount?: number
  processed_amount?: number
  fee_deducted: number
  net_refund?: number
  currency: string
  requested_by: number
  reviewed_by?: number
  reviewed_at?: string
  rejection_reason?: string
  processed_at?: string
  gateway_response?: any
  created_at: string
  updated_at: string
}

export function AdminRefunds() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'requested' | 'under_review' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed' | 'cancelled'>('all')
  const [filterType, setFilterType] = useState<'all' | 'full' | 'partial' | 'wallet_credit' | 'loyalty_points'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc'>('created_desc')
  const [selectedRefund, setSelectedRefund] = useState<AdminRefund | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-refunds', search, filterStatus, filterType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('sort', sortBy)
      const response = await api.get('/admin/refunds', { params })
      return response.data
    },
  )

  const refunds = data?.data?.refunds || []

  const filteredRefunds = refunds.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterType !== 'all' && r.refund_type !== filterType) return false
    return true
  })

  if (isLoading) return <AdminRefundsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Refunds</h1>
          <p className="text-eventra-slate-600 mt-1">Manage refund requests and processing</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<RotateCcw className="w-6 h-6" />} label="Total Refunds" value={refunds.length} color="eventra-blue" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={refunds.filter(r => ['requested', 'under_review', 'approved', 'processing'].includes(r.status)).length} color="eventra-amber" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Completed" value={refunds.filter(r => r.status === 'completed').length} color="eventra-green" />
        <StatCard icon={<X className="w-6 h-6" />} label="Failed/Rejected" value={refunds.filter(r => ['rejected', 'failed'].includes(r.status)).length} color="eventra-red" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Total Refunded" value={formatCurrency(refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.processed_amount || 0), 0), 'INR')} color="eventra-green" />
        <StatCard icon={<AlertCircle className="w-6 h-6" />} label="Under Review" value={refunds.filter(r => r.status === 'under_review').length} color="eventra-amber" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'requested', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'failed', 'cancelled'] as const).map((status) => (
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
              value={filterType}
              onValueChange={setFilterType}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'full', label: 'Full Refund' },
                { value: 'partial', label: 'Partial Refund' },
                { value: 'wallet_credit', label: 'Wallet Credit' },
                { value: 'loyalty_points', label: 'Loyalty Points' },
              ]}
              className="w-40"
              placeholder="Filter by type"
            />
            <Input
              placeholder="Search refunds..."
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
                { value: 'amount_desc', label: 'Highest Amount' },
                { value: 'amount_asc', label: 'Lowest Amount' },
              ]}
              className="w-48"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Refunds Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminRefundsSkeleton />
        ) : filteredRefunds.length === 0 ? (
          <EmptyRefundsState />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredRefunds.length}</strong> of <strong>{refunds.length}</strong> refunds
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Booking</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Requested</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Approved</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Net Refund</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.map((refund, index) => (
                    <tr key={refund.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-mono text-body-sm text-eventra-navy-900">{refund.refund_reference}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-eventra-navy-900">{refund.booking_reference}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-eventra-navy-900">{refund.customer_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('badge capitalize',
                          refund.refund_type === 'full' ? 'badge-primary' :
                          refund.refund_type === 'partial' ? 'badge-warning' :
                          refund.refund_type === 'wallet_credit' ? 'badge-amber' :
                          'badge-purple'
                        )}>
                          {refund.refund_type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-eventra-navy-900">{formatCurrency(refund.requested_amount, refund.currency)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-eventra-green-600">{refund.approved_amount ? formatCurrency(refund.approved_amount, refund.currency) : '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-eventra-green-600">{refund.net_refund ? formatCurrency(refund.net_refund, refund.currency) : '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          refund.status === 'requested' ? 'badge-warning' :
                          refund.status === 'under_review' ? 'badge-warning' :
                          refund.status === 'approved' ? 'badge-primary' :
                          refund.status === 'rejected' ? 'badge-danger' :
                          refund.status === 'processing' ? 'badge-warning' :
                          refund.status === 'completed' ? 'badge-success' :
                          refund.status === 'failed' ? 'badge-danger' :
                          refund.status === 'cancelled' ? 'badge-neutral' : 'badge-neutral'
                        )}>
                          {refund.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge badge-neutral text-body-xs">{refund.reason}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedRefund(refund); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {refunds.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(refunds.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Refund Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedRefund(null); }}
        title={selectedRefund ? `Refund ${selectedRefund.refund_reference}` : 'Refund Details'}
        size="xl"
      >
        {selectedRefund && <RefundDetailModal refund={selectedRefund} />}
      </Modal>
    </div>
  )
}

function AdminRefundsSkeleton() {
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
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Approved</th>
              <th className="px-4 py-3">Net Refund</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyRefundsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <RotateCcw className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No refunds found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No refund requests match your current filters.
      </p>
    </motion.div>
  )
}