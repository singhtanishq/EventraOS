import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { TicketPercent, CheckCircle2, Clock, Gift, Tag, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'react-hot-toast'

interface CouponPromotion {
  id: number | string
  name?: string
  type: string
  value: number
  currency: string
  applicable_to?: string
  description?: string | null
  valid_from?: string
  valid_to?: string
  min_booking_value?: number | null
  max_discount_amount?: number | null
}

interface Coupon {
  id: number | string
  code: string
  promotion: CouponPromotion
  status: 'active' | 'used' | 'expired' | 'revoked'
  expires_at: string
}

type CouponTab = 'active' | 'used' | 'expired'

export function Coupons() {
  const [activeTab, setActiveTab] = useState<CouponTab>('active')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer-coupons'],
    queryFn: async () => {
      const body = await api.get<any>('/customer/coupons')
      return body
    },
  })

  const coupons: Coupon[] = data?.data?.coupons ?? []

  const { activeCoupons, usedCoupons, expiredCoupons } = useMemo(() => {
    const now = Date.now()
    const active: Coupon[] = []
    const expired: Coupon[] = []
    for (const coupon of coupons) {
      const isExpired = coupon.expires_at ? new Date(coupon.expires_at).getTime() <= now : false
      if (coupon.status === 'used') continue
      if (coupon.status === 'expired' || coupon.status === 'revoked' || isExpired) expired.push(coupon)
      else active.push(coupon)
    }
    return { activeCoupons: active, usedCoupons: [] as Coupon[], expiredCoupons: expired }
  }, [coupons])

  if (isLoading) return <CouponsSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load coupons</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

  const tabContent: Record<CouponTab, Coupon[]> = {
    active: activeCoupons,
    used: usedCoupons,
    expired: expiredCoupons,
  }
  const visibleCoupons = tabContent[activeTab]

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">My Coupons</h1>
          <p className="text-eventra-slate-600 mt-1">Manage your promotional codes and discounts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TicketPercent className="w-6 h-6" />} label="Active" value={activeCoupons.length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Used" value={usedCoupons.length} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Expired" value={expiredCoupons.length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
        <StatCard icon={<Gift className="w-6 h-6" />} label="Total Available" value={coupons.length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {(['active', 'used', 'expired'] as CouponTab[]).map((tab) => (
          <button
            key={tab}
            className={cn('tab capitalize', activeTab === tab && 'tab-active')}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Coupons */}
      {visibleCoupons.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCoupons.map((coupon, index) => (
            <motion.div key={coupon.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <CouponCard coupon={coupon} />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyCouponsState type={activeTab} />
      )}
    </div>
  )
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const promo = coupon.promotion
  const isExpiringSoon =
    activeExpiry(coupon) &&
    new Date(coupon.expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000

  const handleCopy = () => {
    navigator.clipboard?.writeText(coupon.code).then(
      () => toast.success(`Code ${coupon.code} copied`),
      () => toast.error('Could not copy code')
    )
  }

  const getDiscountLabel = () => {
    if (!promo) return 'Special Offer'
    if (promo.type === 'percentage_discount') return `${promo.value}% OFF`
    if (promo.type === 'fixed_discount') return `${formatCurrency(promo.value, promo.currency || 'INR')} OFF`
    if (promo.type === 'cashback') return `${promo.value}% Cashback`
    return 'Special Offer'
  }

  return (
    <Card variant="elevated" padding="lg" className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-eventra-blue-100 rounded-full blur-3xl opacity-50" />

      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex items-start gap-2 flex-wrap">
          <span className={cn('badge px-3 py-1 text-body-sm', promo?.type === 'percentage_discount' ? 'badge-primary' : 'badge-success')}>
            {promo?.type ? promo.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Offer'}
          </span>
          {isExpiringSoon && (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Expiring Soon
            </Badge>
          )}
        </div>
        <span className={cn('text-2xl font-display font-bold whitespace-nowrap', promo?.type === 'percentage_discount' ? 'text-eventra-blue-600' : 'text-eventra-green-600')}>
          {getDiscountLabel()}
        </span>
      </div>

      <p className="text-eventra-slate-600 text-body-sm mb-4">{promo?.description || 'Discount on your next booking'}</p>

      <div className="grid grid-cols-2 gap-4 mb-4 text-body-sm">
        {promo?.valid_to && (
          <div>
            <p className="text-eventra-slate-500">Valid Until</p>
            <p className="font-medium text-eventra-navy-900">{formatDate(promo.valid_to)}</p>
          </div>
        )}
        <div>
          <p className="text-eventra-slate-500">Minimum Booking</p>
          <p className="font-medium text-eventra-navy-900">{formatCurrency(promo?.min_booking_value || 0, promo?.currency || 'INR')}</p>
        </div>
        {promo?.max_discount_amount != null && (
          <div>
            <p className="text-eventra-slate-500">Max Discount</p>
            <p className="font-medium text-eventra-navy-900">{formatCurrency(promo.max_discount_amount, promo.currency || 'INR')}</p>
          </div>
        )}
        {promo?.applicable_to && promo.applicable_to !== 'all' && (
          <div>
            <p className="text-eventra-slate-500">Applicable To</p>
            <p className="font-medium text-eventra-navy-900 capitalize">{promo.applicable_to}</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-eventra-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-body-xs text-eventra-slate-500">
          <Tag className="w-4 h-4" />
          <span>Code: <strong className="text-eventra-navy-900">{coupon.code}</strong></span>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          Copy Code
        </Button>
      </div>
    </Card>
  )
}

function activeExpiry(coupon: Coupon): boolean {
  return coupon.status === 'active' && !!coupon.expires_at
}

function EmptyCouponsState({ type }: { type: CouponTab }) {
  const messages: Record<CouponTab, { title: string; desc: string }> = {
    active: { title: 'No active coupons', desc: 'Check back soon for new offers!' },
    used: { title: 'No used coupons', desc: 'Your used coupons will appear here' },
    expired: { title: 'No expired coupons', desc: 'Great! All your coupons are still valid' },
  }
  const msg = messages[type] || messages.active

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <TicketPercent className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">{msg.title}</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">{msg.desc}</p>
    </motion.div>
  )
}

function StatCard({ icon, label, value, iconClass }: { icon: React.ReactNode; label: string; value: number; iconClass: string }) {
  return (
    <Card variant="elevated" padding="lg" className="text-center">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', iconClass)}>
        {icon}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-md font-display font-bold text-eventra-navy-900 mt-1">{value}</p>
    </Card>
  )
}

function CouponsSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-8 w-44 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse h-32 text-center" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse h-64" />
        ))}
      </div>
    </div>
  )
}
