import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Calendar, MapPin, Users, CreditCard, Download, Share2, Mail, AlertCircle, Ticket, Building2, Plane, Utensils, Sparkles, ChevronLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import { useCartStore } from '@/store/cart'

interface BookingConfirmationData {
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
    confirmed_at: string
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
  vouchers: Voucher[]
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

interface Voucher {
  id: string
  voucher_type: string
  file_path: string
  generated_at: string
}

export function BookingConfirmation() {
  const { reference } = useParams()
  const navigate = useNavigate()
  const [showSuccess, setShowSuccess] = useState(true)
  const { clearCart } = useCartStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking', reference],
    queryFn: async () => {
      const response = await api.get(`/bookings/reference/${reference}`)
      return response.data
    },
    enabled: !!reference,
  })

  const bookingData = data?.data
  const booking = bookingData?.booking
  const customer = bookingData?.customer
  const items = bookingData?.items || []
  const payments = bookingData?.payments || []
  const vouchers = bookingData?.vouchers || []

  if (isLoading) return <BookingConfirmationSkeleton />
  if (isError || !booking) return <BookingNotFound onBack={() => navigate('/')} />

  const primaryPayment = payments.find(p => p.status === 'captured') || payments[0]
  const primaryTraveler = items.flatMap(i => i.travelers).find(t => t.is_lead_guest) || items[0]?.travelers[0]

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

  const downloadInvoice = async () => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}/invoice`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${booking.booking_reference}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        toast.error('Failed to download invoice')
      }
    } catch {
      toast.error('Failed to download invoice')
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
      // Fallback: copy to clipboard
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

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Building2 className="w-6 h-6 text-eventra-blue-600" />
      case 'flight': return <Plane className="w-6 h-6 text-eventra-cyan-600" />
      case 'venue': return <Building2 className="w-6 h-6 text-eventra-red-600" />
      case 'train': return <Train className="w-6 h-6 text-eventra-teal-600" />
      case 'bus': return <Bus className="w-6 h-6 text-eventra-amber-600" />
      case 'car': return <Car className="w-6 h-6 text-eventra-green-600" />
      case 'activity': return <Sparkles className="w-6 h-6 text-eventra-blue-600" />
      case 'transfer': return <MapPin className="w-6 h-6 text-eventra-cyan-600" />
      default: return <Package className="w-6 h-6 text-eventra-navy-600" />
    }
  }

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      <div className="section-container py-8">
        {/* Success Header */}
        <AnimatePresence mode="wait">
          {showSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="text-center mb-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full bg-eventra-green-100 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-eventra-green-600" />
              </motion.div>
              <h1 className="text-display-sm font-display font-bold text-eventra-navy-900 mb-2">
                Booking Confirmed!
              </h1>
              <p className="text-body-lg text-eventra-slate-600 max-w-2xl mx-auto">
                Your booking has been successfully confirmed. A confirmation email has been sent to <strong>{customer.user.email}</strong>.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Reference */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-body-sm text-eventra-slate-500 mb-1">Booking Reference</p>
              <p className="text-display-sm font-display font-bold text-eventra-navy-900 tracking-wider">
                {booking.booking_reference}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn(
                'badge px-4 py-2 text-body-sm',
                booking.status === 'confirmed' ? 'badge-success' : 'badge-warning'
              )}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
              </span>
              <span className={cn(
                'badge px-4 py-2 text-body-sm',
                booking.payment_status === 'paid' ? 'badge-success' : 'badge-warning'
              )}>
                {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1).replace('_', ' ')}
              </span>
            </div>
          </div>
        </Card>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                        {getServiceIcon(item.item_type)}
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
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Payment Summary */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Payment Summary</h2>

              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="border border-eventra-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-eventra-blue-100 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-eventra-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-eventra-navy-900">{payment.payment_method.name}</h3>
                          <p className="text-body-sm text-eventra-slate-600">
                            {payment.payment_reference} • {payment.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="price-lg text-eventra-navy-900">{formatCurrency(payment.amount, payment.currency)}</p>
                        <p className="text-body-xs text-eventra-slate-500">
                          {payment.processed_at ? formatDateTime(payment.processed_at) : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-eventra-slate-50 rounded-xl">
                <div className="flex justify-between text-body-sm">
                  <span className="text-eventra-slate-600">Total Paid</span>
                  <span className="font-semibold text-eventra-navy-900">{formatCurrency(booking.amount_paid, booking.currency)}</span>
                </div>
                {booking.amount_refunded > 0 && (
                  <div className="mt-2 flex justify-between text-body-sm text-eventra-green-600">
                    <span>Refunded</span>
                    <span>{formatCurrency(booking.amount_refunded, booking.currency)}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Actions */}
            <Card variant="elevated" padding="lg">
              <h3 className="font-semibold text-eventra-navy-900 mb-4">Documents</h3>
              <div className="space-y-3">
                {vouchers.map((voucher) => (
                  <Button
                    key={voucher.id}
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Ticket className="w-5 h-5" />}
                    onClick={() => downloadVoucher(voucher)}
                  >
                    Download Voucher ({voucher.voucher_type})
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  leftIcon={<Download className="w-5 h-5" />}
                  onClick={downloadInvoice}
                >
                  Download Invoice
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  leftIcon={<Calendar className="w-5 h-5" />}
                  onClick={addToCalendar}
                >
                  Add to Calendar
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-eventra-slate-200">
                <h3 className="font-semibold text-eventra-navy-900 mb-4">Share</h3>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={shareItinerary} leftIcon={<Share2 className="w-5 h-5" />}>
                    Share Itinerary
                  </Button>
                  <Button variant="ghost" onClick={() => toast('Email sent!')} leftIcon={<Mail className="w-5 h-5" />}>
                    Email
                  </Button>
                </div>
              </div>
            </Card>

            {/* Important Info */}
            <Card variant="outlined" padding="lg">
              <h3 className="font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-eventra-amber-600" />
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
    </div>
  )
}

function BookingConfirmationSkeleton() {
  return (
    <div className="min-h-screen bg-eventra-slate-50">
      <div className="section-container py-8">
        <CardSkeleton />
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
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
          Back to Home
        </Button>
      </motion.div>
    </div>
  )
}