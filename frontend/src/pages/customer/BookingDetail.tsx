import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Calendar, MapPin, Users, CreditCard, Download, Share2, Mail, AlertCircle, Ticket, Building2, Plane, Utensils, Sparkles, Shield, CheckCircle2, XCircle, Clock, RotateCcw, FileText, MessageSquare, AlertTriangle, Printer } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'
import { jsPDF } from 'jspdf'

interface BookingDetailData {
  booking: {
    id: string
    uuid: string
    booking_reference: string
    booking_number: string
    status: string
    payment_status: string
    currency: string
    grand_total: number
    amount_paid: number
    amount_refunded: number
    confirmed_at: string
    cancelled_at?: string
    completed_at?: string
    special_requests?: any
    customer_notes?: any
  }
  customer: {
    id: string
    user: {
      name: string
      email: string
      phone: string
    }
  }
  items: BookingItem[]
  payments: Payment[]
  refunds: Refund[]
  cancellations: Cancellation[]
  reschedules: Reschedule[]
  vouchers: Voucher[]
  invoices: Invoice[]
}

interface BookingItem {
  id: string
  uuid: string
  item_type: string
  service_name: string
  service_details: any
  configuration: any
  travelers: BookingGuest[]
  service_date: string
  service_end_date?: string
  service_time?: string
  service_timezone?: string
  item_status: string
  provider_booking_reference?: string
  provider_confirmation_number?: string
  total_price: number
  currency: string
  cancellation_policy: any
}

interface BookingGuest {
  id: string
  title: string
  first_name: string
  middle_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  passport_number?: string
  passport_expiry?: string
  is_primary: boolean
  is_lead_guest: boolean
}

interface Payment {
  id: string
  payment_reference: string
  amount: number
  currency: string
  status: string
  payment_method: {
    name: string
    code: string
  }
  processed_at?: string
}

interface Refund {
  id: string
  refund_reference: string
  amount: number
  currency: string
  status: string
  reason: string
  processed_at?: string
}

interface Cancellation {
  id: string
  cancellation_reference: string
  refundable_amount: number
  cancellation_fee: number
  final_refund: number
  status: string
  reason: string
  processed_at?: string
}

interface Reschedule {
  id: string
  reschedule_reference: string
  original_schedule: any
  requested_schedule: any
  confirmed_schedule?: any
  status: string
  change_fee: number
  fare_difference: number
  refund_amount: number
  new_total: number
  processed_at?: string
}

interface Voucher {
  id: string
  voucher_type: string
  file_path: string
  generated_at: string
}

interface Invoice {
  id: string
  invoice_number: string
  status: string
  grand_total: number
  currency: string
  issued_at: string
  pdf_path?: string
}

const typeIcons: Record<string, React.ReactNode> = {
  hotel: <Building2 className="w-5 h-5" />,
  flight: <Plane className="w-5 h-5" />,
  venue: <MapPin className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  bus: <Bus className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  activity: <Sparkles className="w-5 h-5" />,
  transfer: <Truck className="w-5 h-5" />,
  package: <Package className="w-5 h-5" />,
}

import { Train, Bus, Car, Truck, Package } from 'lucide-react'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-eventra-green-100 text-eventra-green-700'
    case 'pending': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'cancelled': return 'bg-eventra-red-100 text-eventra-red-700'
    case 'completed': return 'bg-eventra-blue-100 text-eventra-blue-700'
    case 'partially_confirmed': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'cancel_requested': return 'bg-eventra-red-100 text-eventra-red-700'
    case 'reschedule_requested': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'rescheduled': return 'bg-eventra-blue-100 text-eventra-blue-700'
    case 'refund_pending': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'refunded': return 'bg-eventra-green-100 text-eventra-green-700'
    case 'failed': return 'bg-eventra-red-100 text-eventra-red-700'
    default: return 'bg-eventra-slate-100 text-eventra-slate-700'
  }
}

export function BookingDetail() {
  const { reference } = useParams()
  const navigate = useNavigate()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedItemForReschedule, setSelectedItemForReschedule] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking', reference],
    queryFn: async () => {
      const response = await api.get(`/customer/bookings/${reference}`)
      return response.data
    },
    enabled: !!reference,
  })

  const bookingData = data?.data
  const booking = bookingData?.booking
  const customer = bookingData?.customer
  const items = bookingData?.items || []
  const payments = bookingData?.payments || []
  const refunds = bookingData?.refunds || []
  const cancellations = bookingData?.cancellations || []
  const reschedules = bookingData?.reschedules || []
  const vouchers = bookingData?.vouchers || []
  const invoices = bookingData?.invoices || []

  const primaryPayment = payments.find(p => p.status === 'captured') || payments[0]
  const primaryTraveler = items.flatMap(i => i.travelers).find(t => t.is_lead_guest) || items[0]?.travelers[0]

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation')
      return
    }

    setIsCancelling(true)
    try {
      const response = await api.post(`/customer/bookings/${booking.id}/cancel`, { reason: cancelReason })
      if (response.data.success) {
        toast.success('Cancellation requested successfully')
        setShowCancelModal(false)
        setCancelReason('')
        refetch()
      } else {
        toast.error(response.data.message || 'Failed to cancel booking')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleReschedule = async (itemId: string) => {
    setSelectedItemForReschedule(itemId)
    setShowRescheduleModal(true)
  }

  const downloadVoucher = async (voucher: Voucher) => {
    try {
      const response = await fetch(`/api/vouchers/${voucher.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `voucher-${booking.booking_reference}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        toast.error('Failed to download voucher')
      }
    } catch {
      toast.error('Failed to download voucher')
    }
  }

  const downloadInvoice = async (invoice: Invoice) => {
    if (invoice.pdf_path) {
      const url = `/storage/${invoice.pdf_path}`
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${booking.booking_reference}.pdf`
      a.click()
    } else {
      toast.error('Invoice PDF not available')
    }
  }

  const shareItinerary = async () => {
    const url = window.location.href
    try {
      await navigator.share({
        title: `Booking Confirmation - ${booking.booking_reference}`,
        text: `Your booking for ${items.map(i => i.service_name).join(', ')} is confirmed!`,
        url,
      })
    } catch {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  const addToCalendar = () => {
    const firstItem = items[0]
    const startDate = new Date(firstItem.service_date)
    const endDate = firstItem.service_end_date ? new Date(firstItem.service_end_date) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventraOS//Booking//EN',
      'BEGIN:VEVENT',
      `UID:${booking.booking_reference}@eventraos.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${items.map(i => i.service_name).join(', ')}`,
      `DESCRIPTION:Booking Reference: ${booking.booking_reference}\\nTotal: ${formatCurrency(booking.grand_total, booking.currency)}\\nCustomer: ${customer.user.name}\\nEmail: ${customer.user.email}`,
      `LOCATION:${items.map(i => i.service_details?.location?.address || '').filter(Boolean).join(', ')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `booking-${booking.booking_reference}.ics`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Calendar file downloaded!')
  }

  const printDetails = () => {
    window.print()
  }

  const getServiceIcon = (type: string) => {
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

  if (isLoading) return <BookingDetailSkeleton />
  if (isError || !booking) return <BookingNotFound onBack={() => navigate('/customer/trips')} />

  const canCancel = ['confirmed', 'partially_confirmed'].includes(booking.status)
  const canReschedule = ['confirmed', 'partially_confirmed'].includes(booking.status)

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      <div className="section-container py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/customer/trips')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">
                Booking Details
              </h1>
              <p className="text-eventra-slate-600">Reference: <strong>{booking.booking_reference}</strong></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={printDetails} leftIcon={<Printer className="w-5 h-5" />}>
              Print
            </Button>
            <Button variant="outline" onClick={shareItinerary} leftIcon={<Share2 className="w-5 h-5" />}>
              Share
            </Button>
          </div>
        </div>

        {/* Status Header */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-eventra-navy-900 flex items-center justify-center text-white">
                {typeIcons[items[0]?.item_type] || <Package className="w-8 h-8" />}
              </div>
              <div>
                <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">
                  {items.map(i => i.service_name).join(', ')}
                </h1>
                <p className="text-eventra-slate-600 mt-1">{items.length} service{items.length > 1 ? 's' : ''} booked</p>
              </div>
            </div>
            <div className="flex items-center gap-6 lg:ml-auto flex-wrap">
              <div className="text-center">
                <span className={cn('badge px-4 py-2 text-body-sm', getStatusColor(booking.status))}>
                  {booking.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div className="text-center">
                <span className={cn('badge px-4 py-2 text-body-sm', 
                  booking.payment_status === 'paid' ? 'badge-success' : 
                  booking.payment_status === 'partial' ? 'badge-warning' : 'badge-danger')}>
                  {booking.payment_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Booking Timeline</h2>
              <div className="timeline">
                <TimelineItem
                  title="Booking Created"
                  description={`Booking ${booking.booking_reference} was created`}
                  time={booking.created_at}
                  completed={true}
                />
                <TimelineItem
                  title="Payment Processed"
                  description={`Payment of ${formatCurrency(booking.amount_paid, booking.currency)} received`}
                  time={primaryPayment?.processed_at || booking.confirmed_at}
                  completed={!!primaryPayment?.processed_at}
                />
                <TimelineItem
                  title="Booking Confirmed"
                  description="All services confirmed and vouchers generated"
                  time={booking.confirmed_at}
                  completed={booking.status === 'confirmed' || booking.status === 'completed'}
                  current={booking.status === 'confirmed' && !booking.confirmed_at}
                />
                {items.some(i => i.item_type === 'hotel') && (
                  <TimelineItem
                    title="Hotel Check-in"
                    description={`Check-in at ${items.find(i => i.item_type === 'hotel')?.service_name}`}
                    time={items.find(i => i.item_type === 'hotel')?.service_date}
                    completed={false}
                    current={new Date(items.find(i => i.item_type === 'hotel')?.service_date || '') > new Date() && booking.status === 'confirmed'}
                  />
                )}
                {items.some(i => i.item_type === 'flight') && (
                  <TimelineItem
                    title="Flight Departure"
                    description={`Flight ${items.find(i => i.item_type === 'flight')?.service_details?.metadata?.flight_number}`}
                    time={items.find(i => i.item_type === 'flight')?.service_date}
                    completed={false}
                    current={new Date(items.find(i => i.item_type === 'flight')?.service_date || '') > new Date() && booking.status === 'confirmed'}
                  />
                )}
                {items.some(i => i.item_type === 'venue') && (
                  <TimelineItem
                    title="Event Date"
                    description={`Event at ${items.find(i => i.item_type === 'venue')?.service_name}`}
                    time={items.find(i => i.item_type === 'venue')?.service_date}
                    completed={false}
                    current={new Date(items.find(i => i.item_type === 'venue')?.service_date || '') > new Date() && booking.status === 'confirmed'}
                  />
                )}
                <TimelineItem
                  title="Trip Complete"
                  description="Enjoy your trip!"
                  time={items.reduce((latest, item) => {
                    const end = item.service_end_date || item.service_date
                    return new Date(end) > new Date(latest) ? end : latest
                  }, items[0]?.service_date || '')}
                  completed={booking.status === 'completed'}
                />
              </div>
            </Card>

            {/* Items */}
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Your Bookings</h2>
                <span className="badge badge-primary">{items.length} item{items.length > 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-eventra-slate-200 rounded-xl p-5"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                        {typeIcons[item.item_type] || <Package className="w-8 h-8 text-eventra-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-eventra-navy-900">{item.service_name}</h3>
                            <p className="text-body-sm text-eventra-slate-600 mt-1 capitalize">{item.item_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="price-md text-eventra-navy-900">{formatCurrency(item.total_price, item.currency)}</p>
                            <p className="text-body-xs text-eventra-slate-500">{item.item_status}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-eventra-slate-200">
                          <div>
                            <p className="text-body-xs text-eventra-slate-500">Date</p>
                            <p className="font-medium text-eventra-navy-900">
                              {formatDate(item.service_date)}
                              {item.service_end_date && ` - ${formatDate(item.service_end_date)}`}
                            </p>
                          </div>
                          {item.service_time && (
                            <div>
                              <p className="text-body-xs text-eventra-slate-500">Time</p>
                              <p className="font-medium text-eventra-navy-900">{formatTime(item.service_time)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-body-xs text-eventra-slate-500">Travelers</p>
                            <p className="font-medium text-eventra-navy-900">{item.travelers.length}</p>
                          </div>
                          {item.provider_booking_reference && (
                            <div>
                              <p className="text-body-xs text-eventra-slate-500">Provider Ref</p>
                              <p className="font-medium text-eventra-navy-900">{item.provider_booking_reference}</p>
                            </div>
                          )}
                        </div>

                        {item.travelers.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-eventra-slate-200">
                            <p className="text-body-xs text-eventra-slate-500 mb-2">Travelers</p>
                            <div className="flex flex-wrap gap-2">
                              {item.travelers.map((traveler, i) => (
                                <span key={traveler.id} className={cn(
                                  'badge px-3 py-1 text-body-xs',
                                  traveler.is_lead_guest ? 'badge-primary' : 'badge-neutral'
                                )}>
                                  {traveler.title} {traveler.first_name} {traveler.last_name}
                                  {traveler.is_lead_guest && ' (Lead)'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.configuration && Object.keys(item.configuration).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-eventra-slate-200">
                            <p className="text-body-xs text-eventra-slate-500 mb-2">Selected Options</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(item.configuration).map(([key, value]) => (
                                <span key={key} className="badge badge-neutral text-body-xs">
                                  {key}: {JSON.stringify(value)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.cancellation_policy && (
                          <div className="mt-4 pt-4 border-t border-eventra-slate-200">
                            <p className="text-body-xs text-eventra-slate-500 mb-2">Cancellation Policy</p>
                            <p className="text-body-sm text-eventra-slate-600">
                              {item.cancellation_policy.cancellation_policy_text || 'Standard cancellation policy applies'}
                            </p>
                          </div>
                        )}

                        {canReschedule && (
                          <div className="mt-4 pt-4 border-t border-eventra-slate-200 flex items-center justify-between">
                            <span className="text-body-sm text-eventra-slate-600">Need to change dates?</span>
                            <Button variant="outline" size="sm" onClick={() => handleReschedule(item.id)}>
                              Reschedule
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </Card>

            {/* Travelers */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Travelers</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.flatMap(i => i.travelers).map((traveler, index) => (
                  <motion.div
                    key={traveler.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-eventra-slate-200 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-medium">
                        {traveler.first_name[0]}{traveler.last_name[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-eventra-navy-900">
                          {traveler.title} {traveler.first_name} {traveler.last_name}
                        </h4>
                        <p className="text-body-sm text-eventra-slate-600">
                          {traveler.email}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-body-sm">
                      <div>
                        <p className="text-eventra-slate-500">Phone</p>
                        <p className="font-medium text-eventra-navy-900">{traveler.phone}</p>
                      </div>
                      {traveler.date_of_birth && (
                        <div>
                          <p className="text-eventra-slate-500">Date of Birth</p>
                          <p className="font-medium text-eventra-navy-900">{formatDate(traveler.date_of_birth)}</p>
                        </div>
                      )}
                      {traveler.passport_number && (
                        <div>
                          <p className="text-eventra-slate-500">Passport</p>
                          <p className="font-medium text-eventra-navy-900">{traveler.passport_number}</p>
                        </div>
                      )}
                      {traveler.passport_expiry && (
                        <div>
                          <p className="text-eventra-slate-500">Passport Expiry</p>
                          <p className="font-medium text-eventra-navy-900">{formatDate(traveler.passport_expiry)}</p>
                        </div>
                      )}
                      {traveler.nationality && (
                        <div>
                          <p className="text-eventra-slate-500">Nationality</p>
                          <p className="font-medium text-eventra-navy-900">{traveler.nationality}</p>
                        </div>
                      )}
                      {traveler.gender && (
                        <div>
                          <p className="text-eventra-slate-500">Gender</p>
                          <p className="font-medium text-eventra-navy-900">{traveler.gender}</p>
                        </div>
                      )}
                    </div>
                    {traveler.is_lead_guest && (
                      <Badge className="badge-primary mt-3">Lead Guest</Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card variant="elevated" padding="lg" className="sticky top-16 h-fit">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">Booking Reference</span>
                  <span className="font-mono font-semibold text-eventra-navy-900">{booking.booking_reference}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">Booking Date</span>
                  <span className="text-eventra-slate-600">{formatDate(booking.created_at)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">Confirmed</span>
                  <span className={cn('text-sm font-medium', booking.confirmed_at ? 'text-eventra-green-600' : 'text-eventra-amber-600')}>
                    {booking.confirmed_at ? formatDateTime(booking.confirmed_at) : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-eventra-slate-600">Customer</span>
                  <span className="text-eventra-slate-600">{customer.user.name}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6 p-4 bg-eventra-slate-50 rounded-xl">
                <div className="flex justify-between text-body-sm">
                  <span className="text-eventra-slate-600">Subtotal</span>
                  <span className="text-eventra-navy-900">{formatCurrency(booking.grand_total - (booking.tax_total + booking.fee_total + booking.service_fee_total), booking.currency)}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-eventra-slate-600">Taxes & Fees</span>
                  <span className="text-eventra-navy-900">{formatCurrency(booking.tax_total + booking.fee_total + booking.service_fee_total, booking.currency)}</span>
                </div>
                {booking.discount_total > 0 && (
                  <div className="flex justify-between text-body-sm text-eventra-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(booking.discount_total, booking.currency)}</span>
                  </div>
                )}
                <div className="border-t border-eventra-slate-200 pt-3 flex justify-between font-semibold text-lg">
                  <span className="text-eventra-navy-900">Total</span>
                  <span className="price-lg text-eventra-navy-900">{formatCurrency(booking.grand_total, booking.currency)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-eventra-slate-50 rounded-xl">
                <div className="flex justify-between text-body-sm">
                  <span className="text-eventra-slate-600">Paid</span>
                  <span className="font-semibold text-eventra-green-600">{formatCurrency(booking.amount_paid, booking.currency)}</span>
                </div>
                {booking.amount_refunded > 0 && (
                  <div className="mt-2 flex justify-between text-body-sm text-eventra-green-600">
                    <span>Refunded</span>
                    <span>{formatCurrency(booking.amount_refunded, booking.currency)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" leftIcon={<Download className="w-5 h-5" />} onClick={() => invoices[0] && downloadInvoice(invoices[0])}>
                    Download Invoice
                  </Button>
                  <Button variant="outline" className="flex-1" leftIcon={<Ticket className="w-5 h-5" />} onClick={() => vouchers[0] && downloadVoucher(vouchers[0])}>
                    Download Voucher
                  </Button>
                </div>
                <Button variant="outline" className="w-full" leftIcon={<Calendar className="w-5 h-5" />} onClick={addToCalendar}>
                  Add to Calendar
                </Button>
                <Button variant="outline" className="w-full" leftIcon={<Share2 className="w-5 h-5" />} onClick={shareItinerary}>
                  Share Itinerary
                </Button>
                <Button variant="ghost" className="w-full" leftIcon={<MessageSquare className="w-5 h-5" />} onClick={() => navigate('/customer/support')}>
                  Need Help?
                </Button>
              </div>

              {/* Cancel/Reschedule Actions */}
              {(canCancel || canReschedule) && (
                <div className="mt-6 pt-6 border-t border-eventra-slate-200 space-y-2">
                  {canCancel && (
                    <Button
                      variant="outline"
                      className="w-full text-eventra-red-600 border-eventra-red-300 hover:bg-eventra-red-50"
                      onClick={() => setShowCancelModal(true)}
                      leftIcon={<XCircle className="w-5 h-5" />}
                    >
                      Cancel Booking
                    </Button>
                  )}
                  {canReschedule && (
                    <Button
                      variant="outline"
                      className="w-full"
                      leftIcon={<RotateCcw className="w-5 h-5" />}
                      onClick={() => handleReschedule(items[0].id)}
                    >
                      Reschedule
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Vouchers */}
            {vouchers.length > 0 && (
              <Card variant="elevated" padding="lg">
                <h3 className="font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Vouchers & Documents
                </h3>
                <div className="space-y-3">
                  {vouchers.map((voucher) => (
                    <Button
                      key={voucher.id}
                      variant="outline"
                      className="w-full justify-start"
                      leftIcon={<Ticket className="w-5 h-5" />}
                      onClick={() => downloadVoucher(voucher)}
                    >
                      Download {voucher.voucher_type} Voucher
                    </Button>
                  ))}
                  {invoices.map((invoice) => (
                    <Button
                      key={invoice.id}
                      variant="outline"
                      className="w-full justify-start"
                      leftIcon={<FileText className="w-5 h-5" />}
                      onClick={() => downloadInvoice(invoice)}
                    >
                      Download Invoice ({invoice.invoice_number})
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Important Info */}
            <Card variant="outlined" padding="lg">
              <h3 className="font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-eventra-amber-600" />
                Important Information
              </h3>
              <ul className="space-y-3 text-body-sm text-eventra-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-eventra-green-600 flex-shrink-0 mt-0.5" />
                  <span>Carry a valid government-issued photo ID for check-in</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-eventra-green-600 flex-shrink-0 mt-0.5" />
                  <span>Booking reference: <strong>{booking.booking_reference}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-eventra-green-600 flex-shrink-0 mt-0.5" />
                  <span>Contact support at least 24 hours before for any changes</span>
                </li>
                {items.some(i => i.item_type === 'flight') && (
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-eventra-green-600 flex-shrink-0 mt-0.5" />
                    <span>Arrive at airport 2-3 hours before departure for international flights</span>
                  </li>
                )}
              </ul>
            </Card>

            {/* Support */}
            <Card variant="elevated" padding="lg" className="text-center">
              <h3 className="font-semibold text-eventra-navy-900 mb-2">Need Help?</h3>
              <p className="text-eventra-slate-600 mb-4">Our support team is available 24/7</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" leftIcon={<Mail className="w-5 h-5" />}>
                  Email Support
                </Button>
                <Button variant="outline" className="flex-1" leftIcon={<MessageSquare className="w-5 h-5" />}>
                  Live Chat
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
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
                  Cancelling your booking may incur fees based on the provider's cancellation policy.
                  You will see the refund amount before confirming.
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
              loading={isCancelling}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => { setShowRescheduleModal(false); setSelectedItemForReschedule(null); }}
        title="Reschedule Booking"
        size="lg"
      >
        <RescheduleForm
          itemId={selectedItemForReschedule}
          onClose={() => { setShowRescheduleModal(false); setSelectedItemForReschedule(null); }}
          onSubmit={() => { setShowRescheduleModal(false); refetch(); }}
        />
      </Modal>
    </div>
  )
}

function RescheduleForm({ itemId, onClose, onSubmit }: { itemId: string | null; onClose: () => void; onSubmit: () => void }) {
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newDate || !reason.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // In production, call API to reschedule
      toast.success('Reschedule request submitted')
      onSubmit()
      onClose()
    } catch {
      toast.error('Failed to submit reschedule request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-eventra-slate-600">Select new date and time for your booking</p>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="New Date"
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          required
        />
        <Input
          label="New Time (Optional)"
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Reason for Reschedule</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please explain why you need to reschedule..."
          rows={3}
          className="input"
          required
        />
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={isSubmitting}>
          Submit Request
        </Button>
      </div>
    </div>
  )
}

function BookingDetailSkeleton() {
  return (
    <div className="min-h-screen bg-eventra-slate-50">
      <div className="section-container py-6">
        <CardSkeleton />
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-eventra-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-12 h-12 text-eventra-slate-400" />
        </div>
        <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">Booking not found</h2>
        <p className="text-eventra-slate-600 mb-6">The booking reference you're looking for doesn't exist.</p>
        <Button onClick={onBack} leftIcon={<ChevronLeft className="w-5 h-5" />}>
          Back to My Trips
        </Button>
      </motion.div>
    </div>
  )
}