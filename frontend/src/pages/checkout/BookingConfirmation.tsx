import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Building2,
  Bus,
  Calendar,
  Car,
  CheckCircle2,
  Download,
  Home,
  Loader2,
  MapPin,
  Package,
  Plane,
  Sparkles,
  Train,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'react-hot-toast'

interface BookingTraveler {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  title?: string
  is_primary?: boolean
  is_lead_guest?: boolean
}

interface BookingItemData {
  id: number
  item_type: string
  service_name?: string
  service_details?: Record<string, unknown> | null
  configuration?: Record<string, unknown> | null
  travelers?: BookingTraveler[] | null
  guests?: BookingTraveler[] | null
  total_price?: number | string
  item_status?: string
}

interface BookingData {
  id: number
  booking_reference: string
  status?: string
  payment_status?: string
  grand_total?: number | string
  subtotal?: number | string
  tax_total?: number | string
  currency?: string
  items?: BookingItemData[]
  customer?: {
    name?: string
    email?: string
    user?: { name?: string; email?: string }
  } | null
}

const formatStatusLabel = (status?: string): string =>
  (status || '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Unknown'

const statusBadgeVariant = (status?: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  const value = (status || '').toLowerCase()
  if (['confirmed', 'completed', 'paid', 'captured'].includes(value)) return 'success'
  if (['draft', 'pending', 'payment_pending', 'initiated', 'processing'].includes(value)) return 'warning'
  if (['cancelled', 'failed', 'expired', 'refunded'].includes(value)) return 'danger'
  return 'neutral'
}

const getServiceIcon = (type: string, className = 'w-6 h-6') => {
  switch (type) {
    case 'hotel':
      return <Building2 className={cn(className, 'text-eventra-blue-600')} />
    case 'flight':
      return <Plane className={cn(className, 'text-eventra-cyan-600')} />
    case 'venue':
      return <Building2 className={cn(className, 'text-eventra-red-600')} />
    case 'train':
      return <Train className={cn(className, 'text-eventra-teal-600')} />
    case 'bus':
      return <Bus className={cn(className, 'text-eventra-amber-600')} />
    case 'car':
      return <Car className={cn(className, 'text-eventra-green-600')} />
    case 'activity':
      return <Sparkles className={cn(className, 'text-eventra-blue-600')} />
    case 'transfer':
      return <MapPin className={cn(className, 'text-eventra-cyan-600')} />
    default:
      return <Package className={cn(className, 'text-eventra-navy-600')} />
  }
}

// Dates live inside the item configuration (shape varies per service type)
const getItemDates = (item: BookingItemData): { start?: string; end?: string } => {
  const config = (item.configuration || {}) as Record<string, any>
  const details = (item.service_details || {}) as Record<string, any>
  const configDates = (config.dates || {}) as Record<string, any>
  const detailsDates = (details.dates || {}) as Record<string, any>

  const start =
    configDates.start ??
    config.check_in ??
    config.start_date ??
    config.departure_date ??
    config.pickup_date ??
    config.journey_date ??
    config.date ??
    detailsDates.start ??
    details.check_in

  const end =
    configDates.end ??
    config.check_out ??
    config.end_date ??
    config.return_date ??
    detailsDates.end ??
    details.check_out

  return { start, end }
}

const getItemTravelers = (item: BookingItemData): BookingTraveler[] =>
  (item.travelers || item.guests || []) as BookingTraveler[]

export function BookingConfirmation() {
  const { reference } = useParams<{ reference: string }>()
  const navigate = useNavigate()
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false)

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['booking-confirmation', reference],
    queryFn: async () => {
      const body = await api.get<any>(`/bookings/reference/${reference}`)
      return body
    },
    enabled: !!reference,
  })

  const booking: BookingData | undefined = data?.data
  const items: BookingItemData[] = booking?.items || []
  const currency = booking?.currency || 'INR'
  const customerEmail = booking?.customer?.user?.email || booking?.customer?.email

  const handleDownloadInvoice = async () => {
    if (!booking?.id) return
    setIsDownloadingInvoice(true)
    try {
      const response = await api.getClient().get<Blob>(`/bookings/${booking.id}/invoice`, {
        responseType: 'blob',
      })
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      )
      window.open(blobUrl, '_blank')
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not download the invoice. Please try again.')
    } finally {
      setIsDownloadingInvoice(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-eventra-slate-50 flex items-center justify-center py-12 px-4">
        <Card variant="elevated" padding="lg" className="w-full max-w-2xl text-center">
          <div className="w-24 h-24 mx-auto mb-6">
            <div className="w-full h-full rounded-full border-4 border-eventra-slate-200 animate-pulse" />
          </div>
          <div className="h-8 w-3/4 mx-auto skeleton rounded-xl mb-4" />
          <div className="h-4 w-1/2 mx-auto skeleton-text rounded" />
          <div className="mt-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl skeleton" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (isError || !booking) {
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
          <p className="text-eventra-slate-600 mb-6">
            We couldn't load the booking{reference ? ` “${reference}”` : ''}. It may not exist or you may
            not have access to it.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => refetch()} leftIcon={<Loader2 className="w-5 h-5" />}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  const isConfirmed = (booking.status || '').toLowerCase() === 'confirmed'
  const subtotal = Number(booking.subtotal ?? 0)
  const taxTotal = Number(booking.tax_total ?? 0)
  const grandTotal = Number(booking.grand_total ?? 0)

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      <div className="section-container py-8">
        {/* Success Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-eventra-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-eventra-green-600" />
          </div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900 mb-2">
            {isConfirmed ? 'Booking Confirmed!' : 'Booking Received!'}
          </h1>
          <p className="text-body-lg text-eventra-slate-600 max-w-2xl mx-auto">
            {isConfirmed
              ? 'Your booking is confirmed.'
              : 'Your booking has been received and is awaiting payment confirmation.'}
            {customerEmail ? ` A confirmation email has been sent to ${customerEmail}.` : ''}
          </p>
        </motion.div>

        {/* Booking Reference */}
        <Card variant="elevated" padding="lg" className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-body-sm text-eventra-slate-500 mb-1">Booking Reference</p>
              <p className="text-display-sm font-display font-bold text-eventra-navy-900 tracking-wider">
                {booking.booking_reference}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={statusBadgeVariant(booking.status)} size="lg">
                {formatStatusLabel(booking.status)}
              </Badge>
              <Badge variant={statusBadgeVariant(booking.payment_status)} size="lg">
                Payment: {formatStatusLabel(booking.payment_status)}
              </Badge>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Your Bookings</h2>
                <Badge variant="primary">
                  {items.length} item{items.length === 1 ? '' : 's'}
                </Badge>
              </div>

              {items.length === 0 ? (
                <p className="text-eventra-slate-600">No items on this booking.</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const dates = getItemDates(item)
                    const travelers = getItemTravelers(item)
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="border border-eventra-slate-200 rounded-xl p-5"
                      >
                        <div className="flex gap-4">
                          <div className="w-14 h-14 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                            {getServiceIcon(item.item_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-eventra-navy-900">
                                  {item.service_name || 'Booking item'}
                                </h3>
                                <p className="text-body-sm text-eventra-slate-600 capitalize mt-0.5">
                                  {item.item_type}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="price-md text-eventra-navy-900">
                                  {formatCurrency(Number(item.total_price ?? 0), currency)}
                                </p>
                                {item.item_status && (
                                  <p className="text-body-xs text-eventra-slate-500 capitalize">
                                    {formatStatusLabel(item.item_status)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-eventra-slate-200">
                              <div>
                                <p className="text-body-xs text-eventra-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" /> Date
                                </p>
                                <p className="font-medium text-eventra-navy-900 text-body-sm">
                                  {dates.start ? formatDate(dates.start) : '—'}
                                  {dates.end ? ` - ${formatDate(dates.end)}` : ''}
                                </p>
                              </div>
                              <div>
                                <p className="text-body-xs text-eventra-slate-500 flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" /> Travelers
                                </p>
                                <p className="font-medium text-eventra-navy-900 text-body-sm">
                                  {travelers.length}
                                </p>
                              </div>
                            </div>

                            {travelers.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-eventra-slate-200">
                                <p className="text-body-xs text-eventra-slate-500 mb-2">Travelers</p>
                                <div className="flex flex-wrap gap-2">
                                  {travelers.map((traveler, travelerIndex) => (
                                    <span
                                      key={`${item.id}-traveler-${travelerIndex}`}
                                      className={cn(
                                        'badge text-body-xs',
                                        traveler.is_primary || traveler.is_lead_guest
                                          ? 'badge-primary'
                                          : 'badge-neutral'
                                      )}
                                    >
                                      {[traveler.title, traveler.first_name, traveler.last_name]
                                        .filter(Boolean)
                                        .join(' ')}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Price Breakdown */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Price Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-body-sm">
                  <span className="text-eventra-slate-600">Subtotal</span>
                  <span className="text-eventra-navy-900">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-eventra-slate-600">Taxes & Fees</span>
                  <span className="text-eventra-navy-900">{formatCurrency(taxTotal, currency)}</span>
                </div>
                <div className="border-t border-eventra-slate-200 pt-3 flex justify-between font-semibold text-lg">
                  <span className="text-eventra-navy-900">Total</span>
                  <span className="price-lg text-eventra-navy-900">{formatCurrency(grandTotal, currency)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card variant="elevated" padding="lg">
              <h3 className="font-semibold text-eventra-navy-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link to="/customer/trips" className="btn-outline w-full justify-center flex">
                  <Calendar className="w-5 h-5" />
                  View My Trips
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadInvoice}
                  loading={isDownloadingInvoice}
                  leftIcon={isDownloadingInvoice ? undefined : <Download className="w-5 h-5" />}
                >
                  Download Invoice
                </Button>
                <Link to="/" className="btn-ghost w-full justify-center flex">
                  <Home className="w-5 h-5" />
                  Back to Home
                </Link>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
                What's Next?
              </h3>
              <ul className="space-y-3 text-body-sm text-eventra-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-eventra-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Keep your booking reference <strong>{booking.booking_reference}</strong> handy for
                    check-in and support requests.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-eventra-green-600 flex-shrink-0 mt-0.5" />
                  <span>Carry a valid government-issued photo ID for check-in.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-eventra-green-600 flex-shrink-0 mt-0.5" />
                  <span>Manage or cancel this booking anytime from My Trips.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
