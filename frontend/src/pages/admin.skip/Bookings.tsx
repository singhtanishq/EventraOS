import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminBooking {
  id: number
  uuid: string
  booking_reference: string
  booking_number: string
  customer_id: number
  customer_name: string
  customer_email: string
  agent_id?: number
  agent_name?: string
  status: string
  payment_status: string
  items: AdminBookingItem[]
  subtotal: number
  tax_total: number
  fee_total: number
  service_fee_total: number
  discount_total: number
  grand_total: number
  amount_paid: number
  amount_refunded: number
  currency: string
  confirmed_at?: string
  cancelled_at?: string
  created_at: string
}

interface AdminBookingItem {
  id: number
  item_type: string
  service_name: string
  service_details: any
  service_date: string
  service_end_date?: string
  item_status: string
  total_price: number
  currency: string
}

export function AdminBookings() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'payment_pending' | 'payment_processing' | 'partially_confirmed' | 'cancel_requested' | 'reschedule_requested' | 'refund_pending' | 'refunded' | 'failed'>('all')
  const [filterType, setFilterType] = useState<'all' | 'hotel' | 'flight' | 'venue' | 'train' | 'bus' | 'car' | 'activity' | 'transfer' | 'package'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc' | 'date_desc' | 'date_asc'>('created_desc')
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', search, filterStatus, filterType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('sort', sortBy)
      const response = await api.get('/admin/bookings', { params })
      return response.data
    },
  })

  const bookings = data?.data?.bookings || []

  const filteredBookings = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (filterType !== 'all' && !b.items.some((item: any) => item.item_type === filterType)) return false
    return true
  })

  if (isLoading) return <AdminBookingsSkeleton />

  const filteredBookings = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (filterType !== 'all' && !b.items.some((item: any) => item.item_type === filterType)) return false
    return true
  })

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Bookings</h1>
          <p className="text-eventra-slate-600 mt-1">Manage all bookings across the platform</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<ClipboardList className="w-6 h-6" />} label="Total Bookings" value={bookings.length} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Confirmed" value={bookings.filter(b => b.status === 'confirmed').length} color="eventra-green" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={bookings.filter(b => b.status === 'pending' || b.status === 'payment_pending').length} color="eventra-amber" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Completed" value={bookings.filter(b => b.status === 'completed').length} color="eventra-green" />
        <StatCard icon={<X className="w-6 h-6" />} label="Cancelled" value={bookings.filter(b => b.status === 'cancelled').length} color="eventra-red" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Total Value" value={formatCurrency(bookings.reduce((sum, b) => sum + b.grand_total, 0), 'INR')} color="eventra-green" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'confirmed', 'pending', 'cancelled', 'completed', 'payment_pending', 'payment_processing', 'partially_confirmed', 'cancel_requested', 'reschedule_requested', 'refund_pending', 'refunded', 'failed'] as const).map((status) => (
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
            <div className="relative">
              <Select
                value={filterType}
                onValueChange={setFilterType}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'hotel', label: 'Hotels' },
                  { value: 'flight', label: 'Flights' },
                  { value: 'venue', label: 'Venues' },
                  { value: 'train', label: 'Trains' },
                  { value: 'bus', label: 'Buses' },
                  { value: 'car', label: 'Cars' },
                  { value: 'activity', label: 'Activities' },
                  { value: 'transfer', label: 'Transfers' },
                  { value: 'package', label: 'Packages' },
                ]}
                className="w-40"
                placeholder="Filter by type"
              />
            </div>
            <div className="relative flex-1 max-w-xs">
              <Input
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={setSortBy}
              options={[
                { value: 'created_desc', label: 'Newest First' },
                { value: 'created_asc', label: 'Oldest First' },
                { value: 'amount_desc', label: 'Highest Value' },
                { value: 'amount_asc', label: 'Lowest Value' },
                { value: 'date_desc', label: 'Latest Travel' },
                { value: 'date_asc', label: 'Earliest Travel' },
              ]}
              className="w-48"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminBookingsSkeleton />
        ) : filteredBookings.length === 0 ? (
          <EmptyBookingsState />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredBookings.length}</strong> of <strong>{bookings.length}</strong> bookings
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Agent</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Payment</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, index) => (
                    <tr key={booking.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-mono text-body-sm text-eventra-navy-900">{booking.booking_reference}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-eventra-navy-900">{booking.customer_name}</p>
                        <p className="text-body-xs text-eventra-slate-500">{booking.customer_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {booking.items.map((item: any) => (
                            <Badge key={item.id} className="badge-neutral capitalize">{item.item_type}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {booking.agent_name ? (
                          <span className="text-body-sm text-eventra-slate-600">{booking.agent_name}</span>
                        ) : (
                          <span className="text-body-xs text-eventra-slate-400">Direct</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-eventra-navy-900">{formatCurrency(booking.grand_total, booking.currency)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          booking.status === 'confirmed' ? 'badge-success' :
                          booking.status === 'pending' ? 'badge-warning' :
                          booking.status === 'cancelled' ? 'badge-danger' :
                          booking.status === 'completed' ? 'badge-primary' :
                          booking.status === 'partially_confirmed' ? 'badge-warning' :
                          booking.status === 'cancel_requested' ? 'badge-danger' :
                          booking.status === 'reschedule_requested' ? 'badge-warning' :
                          booking.status === 'refund_pending' ? 'badge-warning' :
                          booking.status === 'refunded' ? 'badge-success' :
                          booking.status === 'failed' ? 'badge-danger' :
                          'badge-neutral'
                        )}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          booking.payment_status === 'paid' ? 'badge-success' :
                          booking.payment_status === 'partial' ? 'badge-warning' :
                          booking.payment_status === 'refunded' ? 'badge-success' :
                          booking.payment_status === 'partially_refunded' ? 'badge-warning' :
                          booking.payment_status === 'failed' ? 'badge-danger' :
                          booking.payment_status === 'pending_verification' ? 'badge-warning' :
                          'badge-danger'
                        )}>
                          {booking.payment_status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="text-body-sm text-eventra-slate-600">{formatDate(booking.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedBooking(booking); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
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
            {bookings.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(bookings.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedBooking(null); }}
        title={selectedBooking ? `Booking ${selectedBooking.booking_reference}` : 'Booking Details'}
        size="xl"
      >
        {selectedBooking && <AdminBookingDetailModal booking={selectedBooking} />}
      </Modal>
    </div>
  )
}

function AdminBookingsSkeleton() {
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
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
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

function EmptyBookingsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <ClipboardList className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No bookings found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No bookings match your current filters.
      </p>
    </motion.div>
  )
}

function AdminBookingsSkeleton() {
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
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
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