import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Tag, TicketPercent, Gift, Clock, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface Coupon {
  id: string
  uuid: string
  code: string
  promotion: {
    id: string
    name: string
    type: string
    value: number
    currency: string
    applicable_to: string
    description: string
    valid_from: string
    valid_to: string
    min_booking_value: number
    max_discount_amount: number
    can_stack: boolean
  }
  status: 'active' | 'used' | 'expired' | 'revoked'
  issued_at: string
  used_at?: string
  used_booking_id?: string
  expires_at: string
}

export function Coupons() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-coupons'],
    queryFn: async () => {
      const response = await api.get('/customer/coupons')
      return response.data
    },
  })

  const coupons = data?.data?.coupons || []

  if (isLoading) return <CouponsSkeleton />

  const activeCoupons = coupons.filter(c => c.status === 'active' && new Date(c.expires_at) > new Date())
  const usedCoupons = coupons.filter(c => c.status === 'used')
  const expiredCoupons = coupons.filter(c => c.status === 'expired' || new Date(c.expires_at) <= new Date())

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
        <StatCard icon={<TicketPercent className="w-6 h-6" />} label="Active" value={activeCoupons.length} color="eventra-green" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Used" value={usedCoupons.length} color="eventra-blue" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Expired" value={expiredCoupons.length} color="eventra-amber" />
        <StatCard icon={<Gift className="w-6 h-6" />} label="Total Savings" value={formatCurrency(
          coupons.filter(c => c.status === 'used').reduce((sum, c) => sum + (c.promotion?.value || 0), 0), 'INR')} color="eventra-amber" />
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <button className="tab tab-active">Active</button>
        <button className="tab">Used</button>
        <button className="tab">Expired</button>
      </div>

      {/* Coupons */}
      <AnimatePresence mode="wait">
        <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {activeCoupons.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCoupons.map((coupon, index) => (
                <motion.div key={coupon.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <CouponCard coupon={coupon} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyCouponsState type="active" />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const promo = coupon.promotion
  const isExpiringSoon = new Date(coupon.expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000

  const getDiscountLabel = () => {
    if (promo.type === 'percentage_discount') return `${promo.value}% OFF`
    if (promo.type === 'fixed_discount') return `${formatCurrency(promo.value, promo.currency)} OFF`
    if (promo.type === 'cashback') return `${promo.value}% Cashback`
    return 'Special Offer'
  }

  return (
    <Card variant="elevated" padding="lg" className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-eventra-blue-100 rounded-full blur-3xl opacity-50" />
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={cn('badge px-3 py-1 text-body-sm', promo.type === 'percentage_discount' ? 'badge-primary' : 'badge-success')}>
            {promo.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          {isExpiringSoon && (
            <Badge className="badge-warning ml-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Expiring Soon
            </Badge>
          )}
        </div>
        <span className={cn('text-2xl font-display font-bold', promo.type === 'percentage_discount' ? 'text-eventra-blue-600' : 'text-eventra-green-600')}>
          {getDiscountLabel()}
        </span>
      </div>

      <p className="text-eventra-slate-600 text-body-sm mb-4">{promo.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4 text-body-sm">
        <div>
          <p className="text-eventra-slate-500">Valid Until</p>
          <p className="font-medium text-eventra-navy-900">{formatDate(promo.valid_to)}</p>
        </div>
        <div>
          <p className="text-eventra-slate-500">Minimum Booking</p>
          <p className="font-medium text-eventra-navy-900">{formatCurrency(promo.min_booking_value || 0, promo.currency)}</p>
        </div>
        {promo.max_discount_amount && (
          <div>
            <p className="text-eventra-slate-500">Max Discount</p>
            <p className="font-medium text-eventra-navy-900">{formatCurrency(promo.max_discount_amount, promo.currency)}</p>
          </div>
        )}
        {promo.applicable_to !== 'all' && (
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
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(coupon.code)}>
          Copy Code
        </Button>
      </div>
    </Card>
  )
}

function EmptyCouponsState({ type }: { type: string }) {
  const messages = {
    active: { title: 'No active coupons', desc: 'Check back soon for new offers!' },
    used: { title: 'No used coupons', desc: 'Your used coupons will appear here' },
    expired: { title: 'No expired coupons', desc: 'Great! All your coupons are still valid' },
  }
  const msg = messages[type as keyof typeof messages] || messages.active

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <TicketPercent className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">{msg.title}</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">{msg.desc}</p>
    </motion.div>
  )
}

function CouponsSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse" />
        ))}
      </div>
    </div>
  )
}