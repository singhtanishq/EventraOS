import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AgentBooking {
  id: string
  uuid: string
  booking_reference: string
  booking_number: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: string
  payment_status: string
  items: AgentBookingItem[]
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
  agent_notes?: string
}

interface AgentBookingItem {
  id: string
  item_type: string
  service_name: string
  service_details: any
  service_date: string
  service_end_date?: string
  service_time?: string
  item_status: string
  total_price: number
  currency: string
}

export function AgentBookings() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'pending_payment'>('all')
  const [filterType, setFilterType] = useState<'all' | 'hotel' | 'flight' | 'venue' | 'train' | 'bus' | 'car' | 'activity' | 'transfer' | 'package'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc' | 'date_desc' | 'date_asc'>('created_desc')
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['agent-bookings', search, filterStatus, filterType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('sort', sortBy)
      const response = await api.get('/agent/bookings', { params })
      return response.data
    },
  })

  const bookings = data?.data?.bookings || []

  const filteredBookings = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (filterType !== 'all' && !b.items.some((item: any) => item.item_type === filterType)) return false
    return true
  })

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }
    try {
      const response = await api.post(`/agent/bookings/${selectedBooking.id}/cancel`, { reason: cancelReason })
      if (response.data.success) {
        toast.success('Cancellation requested')
        setShowCancelModal(false)
        setCancelReason('')
      }
    } catch {
      toast.error('Failed to cancel booking')
    }
  }

  if (isLoading) return <AgentBookingsSkeleton />

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
          <p className="text-eventra-slate-600 mt-1">Manage your customers' bookings</p>
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
            {(['all', 'confirmed', 'pending', 'cancelled', 'completed'] as const).map((status) => (
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

      {/* Bookings Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <AgentBookingsSkeleton />
        ) : filteredBookings.length === 0 ? (
          <EmptyBookingsState />
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <motion.div
                key="bookings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <AgentBookingCard
                      booking={booking}
                      onView={() => { setSelectedBooking(booking); setShowDetailModal(true); }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

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
        {selectedBooking && <AgentBookingDetailModal booking={selectedBooking} />}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelReason(''); }}
        title="Cancel Booking"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-eventra-amber-50 border border-eventra-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-eventra-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-eventra-amber-800">This action cannot be undone</p>
                <p className="text-body-sm text-eventra-amber-700 mt-1">
                  Cancelling this booking may incur fees based on the provider's cancellation policy.
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Reason for Cancellation</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please tell us why you're cancelling..."
              rows={4}
              className="input"
              required
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>
              Keep Booking
            </Button>
            <Button
              className="flex-1 bg-eventra-red-600 hover:bg-eventra-red-700 text-white"
              onClick={handleCancel}
              loading={false}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function AgentBookingCard({ booking, onView }: { booking: AgentBooking; onView: () => void }) {
  const firstItem = booking.items[0]
  const itemTypes = [...new Set(booking.items.map((item: any) => item.item_type))]

  return (
    <Card variant="interactive" onClick={onView} className="p-4">
      <div className="flex gap-4">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-eventra-slate-100 flex items-center justify-center">
            {firstItem && getServiceIcon(firstItem.item_type)}
          </div>
          <span className={cn('absolute top-2 right-2 badge px-2 py-1 text-body-xs', getStatusColor(booking.status))}>
            {booking.status}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {booking.items.slice(0, 3).map((item: any, i) => (
                  <span key={i} className="w-8 h-8 rounded-xl bg-eventra-slate-100 flex items-center justify-center">
                    {getServiceIcon(item.item_type)}
                  </span>
                ))}
              </div>
              <div>
                <h3 className="font-semibold text-eventra-navy-900 truncate">
                  {booking.items.map((i: any) => i.service_name).join(', ')}
                </h3>
                <p className="text-body-sm text-eventra-slate-600">{booking.booking_reference}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="price-md text-eventra-navy-900">{formatCurrency(booking.grand_total, booking.currency)}</p>
              <p className="text-body-xs text-eventra-slate-500">Total</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-body-sm text-eventra-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {booking.items[0]?.service_date ? formatDate(booking.items[0].service_date) : 'TBD'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {booking.items.reduce((sum: number, item: any) => sum + (item.configuration?.guests?.adults || 1), 0)} travelers
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              {booking.payment_status}
            </span>
          </div>
        </div>
      </div>
    </Card>
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
        No bookings match your current filters. Try adjusting your search criteria.
      </p>
    </motion.div>
  )
}

function AgentBookingsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} variant="outlined" padding="md" className="animate-pulse" />
      ))}
    </div>
  )
}

function AgentBookingDetailModal({ booking }: { booking: any }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-body-xs text-eventra-slate-500 font-mono">{booking.booking_reference}</span>
        </div>
        <Badge className={cn('badge', 
          booking.status === 'confirmed' ? 'badge-success' :
          booking.status === 'pending' ? 'badge-warning' :
          booking.status === 'cancelled' ? 'badge-danger' :
          booking.status === 'completed' ? 'badge-primary' : 'badge-neutral'
        )}>
          {booking.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Customer Details</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <User className="w-4 h-4" />
              <span>{booking.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span>{booking.customer_email}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Phone className="w-4 h-4" />
              <span>{booking.customer_phone}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Booking Details</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Booking Reference</span>
              <span className="font-medium text-eventra-navy-900 font-mono">{booking.booking_reference}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Status</span>
              <Badge className={cn('badge', 
                booking.status === 'confirmed' ? 'badge-success' :
                booking.status === 'pending' ? 'badge-warning' :
                booking.status === 'cancelled' ? 'badge-danger' :
                'badge-neutral'
              )}>
                {booking.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Payment Status</span>
              <Badge className={cn('badge', 
                booking.payment_status === 'paid' ? 'badge-success' :
                booking.payment_status === 'partial' ? 'badge-warning' :
                'badge-danger'
              )}>
                {booking.payment_status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Total Amount</span>
              <span className="font-semibold text-eventra-navy-900">{formatCurrency(booking.grand_total, booking.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Amount Paid</span>
              <span className="font-medium text-eventra-green-600">{formatCurrency(booking.amount_paid, booking.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-eventra-slate-200">
        <h4 className="font-semibold text-eventra-navy-900 mb-4">Booking Items</h4>
        <div className="space-y-3">
          {booking.items.map((item: any, index: number) => (
            <div key={item.id} className="border border-eventra-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                    {getServiceIcon(item.item_type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-eventra-navy-900">{item.service_name}</h4>
                    <p className="text-body-sm text-eventra-slate-600 capitalize">{item.item_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="price-md text-eventra-navy-900">{formatCurrency(item.total_price, item.currency)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-eventra-slate-200">
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Date</p>
                  <p className="font-medium text-eventra-navy-900">{formatDate(item.service_date)}</p>
                </div>
                {item.service_end_date && (
                  <div>
                    <p className="text-body-xs text-eventra-slate-500">End Date</p>
                    <p className="font-medium text-eventra-navy-900">{formatDate(item.service_end_date)}</p>
                  </div>
                )}
                <div>
                  <p className="text-body-xs text-eventra-slate-500">Status</p>
                  <p className="font-medium text-eventra-navy-900">{item.item_status}</p>
                </div>
              </div>
              {item.travelers && item.travelers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-eventra-slate-200">
                  <p className="text-body-xs text-eventra-slate-500 mb-2">Travelers</p>
                  <div className="flex flex-wrap gap-2">
                    {item.travelers.map((t: any) => (
                      <span key={t.id} className={cn('badge px-3 py-1 text-body-xs', t.is_lead_guest ? 'badge-primary' : 'badge-neutral')}>
                        {t.title} {t.first_name} {t.last_name} {t.is_lead_guest && ' (Lead)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-eventra-slate-200 flex gap-3">
        <Button variant="outline" className="flex-1" leftIcon={<Download className="w-5 h-5" />} onClick={() => {}}>
          Download Invoice
        </Button>
        <Button variant="outline" className="flex-1" leftIcon={<Ticket className="w-5 h-5" />} onClick={() => {}}>
          Download Voucher
        </Button>
        <Button variant="outline" className="flex-1" leftIcon={<Share2 className="w-5 h-5" />} onClick={() => {}}>
          Share
        </Button>
        <Button variant="outline" className="flex-1 text-eventra-red-600 border-eventra-red-300 hover:bg-eventra-red-50" leftIcon={<RotateCcw className="w-5 h-5" />} onClick={() => {}}>
          Request Cancel
        </Button>
      </div>
    </div>
  )
}

function AgentBookingsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} variant="outlined" padding="md" className="animate-pulse" />
      ))}
    </div>
  )
}