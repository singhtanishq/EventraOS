import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2, RotateCcw as RotateCcwIcon3, RefreshCw, Layers, FileText as FileTextIcon2, CheckCircle2, X, AlertCircle, Info, HelpCircle, ExternalLink, ChevronsRight, ChevronsLeft, ChevronUp as ChevronUpIcon, ChevronDown as ChevronDownIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminPayment {
  id: number
  uuid: string
  payment_reference: string
  payment_number: string
  booking_id: number
  booking_reference: string
  customer_id: number
  customer_name: string
  payment_method_id: number
  payment_method_name: string
  customer_payment_method_id?: number
  provider_id?: number
  provider_payment_id?: string
  provider_order_id?: string
  status: string
  amount: number
  fee_amount: number
  net_amount: number
  currency: string
  base_currency: string
  exchange_rate: number
  idempotency_key: string
  gateway_request: any
  gateway_response: any
  gateway_status?: string
  failure_reason?: string
  failure_details?: any
  initiated_at: string
  processed_at?: string
  authorized_at?: string
  captured_at?: string
  failed_at?: string
  refunded_at?: string
  expires_at?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export function AdminPayments() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'initiated' | 'processing' | 'authorized' | 'captured' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded' | 'pending_verification' | 'expired'>('all')
  const [filterMethod, setFilterMethod] = useState<'all' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'bank_transfer'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc'>('created_desc')
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', search, filterStatus, filterMethod, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterMethod !== 'all') params.set('method', filterMethod)
      params.set('sort', sortBy)
      const response = await api.get('/admin/payments', { params })
      return response.data
    },
  })

  const payments = data?.data?.payments || []

  const filteredPayments = payments.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterMethod !== 'all' && p.payment_method_id !== filterMethod) return false
    return true
  })

  if (isLoading) return <AdminPaymentsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Payments</h1>
          <p className="text-eventra-slate-600 mt-1">Manage all payment transactions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<CreditCard className="w-6 h-6" />} label="Total Payments" value={payments.length} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Successful" value={payments.filter(p => ['captured', 'authorized'].includes(p.status)).length} color="eventra-green" />
        <StatCard icon={<X className="w-6 h-6" />} label="Failed" value={payments.filter(p => ['failed', 'cancelled'].includes(p.status)).length} color="eventra-red" />
        <StatCard icon={<Wallet className="w-6 h-6" />} label="Total Amount" value={formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0), 'INR')} color="eventra-green" />
        <StatCard icon={<RotateCcw className="w-6 h-6" />} label="Refunded" value={formatCurrency(payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0), 'INR')} color="eventra-amber" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'initiated', 'processing', 'authorized', 'captured', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'pending_verification', 'expired'] as const).map((status) => (
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
              value={filterMethod}
              onValueChange={setFilterMethod}
              options={[
                { value: 'all', label: 'All Methods' },
                { value: 'card', label: 'Credit/Debit Card' },
                { value: 'upi', label: 'UPI' },
                { value: 'netbanking', label: 'Net Banking' },
                { value: 'wallet', label: 'Wallet' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
              ]}
              className="w-48"
              placeholder="Filter by method"
            />
            <Input
              placeholder="Search payments..."
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

      {/* Payments Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminPaymentsSkeleton />
        ) : filteredPayments.length === 0 ? (
          <EmptyPaymentsState />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredPayments.length}</strong> of <strong>{payments.length}</strong> payments
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Booking</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Gateway</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment, index) => (
                    <tr key={payment.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-mono text-body-sm text-eventra-navy-900">{payment.payment_reference}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-eventra-navy-900">{payment.booking_reference}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-eventra-navy-900">{payment.customer_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('badge',
                          payment.payment_method_name === 'Credit/Debit Card' ? 'badge-blue' :
                          payment.payment_method_name === 'UPI' ? 'badge-green' :
                          payment.payment_method_name === 'Net Banking' ? 'badge-purple' :
                          payment.payment_method_name === 'Wallet' ? 'badge-amber' :
                          'badge-neutral'
                        )}>
                          {payment.payment_method_name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-eventra-navy-900">{formatCurrency(payment.amount, payment.currency)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          payment.status === 'captured' ? 'badge-success' :
                          payment.status === 'authorized' ? 'badge-primary' :
                          payment.status === 'processing' ? 'badge-warning' :
                          payment.status === 'initiated' ? 'badge-neutral' :
                          payment.status === 'failed' ? 'badge-danger' :
                          payment.status === 'cancelled' ? 'badge-danger' :
                          payment.status === 'refunded' ? 'badge-success' :
                          payment.status === 'partially_refunded' ? 'badge-warning' :
                          payment.status === 'pending_verification' ? 'badge-warning' :
                          payment.status === 'expired' ? 'badge-danger' : 'badge-neutral'
                        )}>
                          {payment.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {payment.gateway_status && (
                          <Badge className="badge-neutral">{payment.gateway_status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="text-body-sm text-eventra-slate-600">{formatDate(payment.initiated_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedPayment(payment); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
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
            {payments.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(payments.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Payment Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedPayment(null); }}
        title={selectedPayment ? `Payment ${selectedPayment.payment_reference}` : 'Payment Details'}
        size="xl"
      >
        {selectedPayment && <PaymentDetailModal payment={selectedPayment} />}
      </Modal>
    </div>
  )
}

function AdminPaymentsSkeleton() {
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
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Gateway</th>
              <th className="px-4 py-3">Date</th>
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

function EmptyPaymentsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <CreditCard className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No payments found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No payments match your current filters.
      </p>
    </motion.div>
  )
}

function AdminPaymentsSkeleton() {
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
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Gateway</th>
              <th className="px-4 py-3">Date</th>
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