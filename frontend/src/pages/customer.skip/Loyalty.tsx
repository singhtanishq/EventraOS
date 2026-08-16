import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Coins, PieChart, ArrowUpRight, ArrowDownRight, Target, Gift, Star, Award, Trophy, Crown, Medal } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface LoyaltyData {
  account: {
    tier: string
    points_balance: number
    points_pending: number
    points_lifetime_earned: number
    points_lifetime_redeemed: number
    points_expired: number
    tier_achieved_at: string
    tier_expires_at: string
    next_tier: string
    points_to_next_tier: number
    tier_progress: number
    tier_benefits: any
  }
  transactions: LoyaltyTransaction[]
}

interface LoyaltyTransaction {
  id: string
  type: string
  status: string
  points: number
  balance_before: number
  balance_after: number
  description: string
  booking_amount: number
  earn_rate: number
  expires_at: string
  completed_at: string
}

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum']
const TIER_COLORS = {
  bronze: 'eventra-amber',
  silver: 'eventra-slate',
  gold: 'eventra-yellow',
  platinum: 'eventra-purple',
}

export function Loyalty() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-loyalty'],
    queryFn: async () => {
      const response = await api.get('/customer/loyalty')
      return response.data
    },
  })

  const account = data?.data?.account
  const transactions = data?.data?.transactions || []

  if (isLoading) return <LoyaltySkeleton />

  const tierColor = TIER_COLORS[account?.tier as keyof typeof TIER_COLORS] || 'eventra-slate'

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Eventra Rewards</h1>
          <p className="text-eventra-slate-600 mt-1">Earn points on every booking and redeem for rewards</p>
        </div>
      </div>

      {/* Tier Card */}
      <Card variant="elevated" padding="xl" className={cn('relative overflow-hidden', `bg-gradient-to-r from-${tierColor}-600 to-${tierColor}-800 text-white`)}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <TierIcon tier={account?.tier || 'bronze'} className="w-8 h-8" />
              </div>
              <div>
                <p className="text-eventra-slate-200 text-body-md">Current Tier</p>
                <h1 className="text-3xl font-display font-bold capitalize">{account?.tier || 'bronze'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-8 text-center lg:text-left">
              <div className="flex-1">
                <p className="text-eventra-slate-200 text-body-sm">Points Balance</p>
                <p className="text-3xl font-display font-bold">{account?.points_balance?.toLocaleString() || '0'}</p>
              </div>
              <div className="flex-1">
                <p className="text-eventra-slate-200 text-body-sm">Pending Points</p>
                <p className="text-3xl font-display font-bold">{account?.points_pending?.toLocaleString() || '0'}</p>
              </div>
              <div className="flex-1">
                <p className="text-eventra-slate-200 text-body-sm">Lifetime Earned</p>
                <p className="text-3xl font-display font-bold">{account?.points_lifetime_earned?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>

          {/* Progress to next tier */}
          {(account?.next_tier && account?.next_tier !== account?.tier) && (
            <div className="mt-8 p-6 bg-white/10 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-eventra-slate-200 text-body-sm">Progress to {account.next_tier}</p>
                  <p className="text-eventra-slate-100 font-semibold">{account.points_to_next_tier} points to go</p>
                </div>
                <span className={cn('badge px-3 py-1 capitalize', `bg-white/20 text-white`)}>
                  {Math.round(account.tier_progress)}% Complete
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${account.tier_progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Tier Benefits */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Tier Benefits</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderTierBenefits(account?.tier_benefits || {})}
          </div>
        </Card>

        {/* Tier Comparison */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Tier Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-eventra-slate-200">
                  <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Benefit</th>
                  {TIER_ORDER.map(tier => (
                    <th key={tier} className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider capitalize">
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2', `bg-${TIER_COLORS[tier as keyof typeof TIER_COLORS]}-100 text-${TIER_COLORS[tier as keyof typeof TIER_COLORS]}-600`)}>
                        <TierIcon tier={tier} className="w-5 h-5" />
                      </div>
                      {tier}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'earn_rate', label: 'Earn Rate', values: { bronze: '1x', silver: '1.25x', gold: '1.5x', platinum: '2x' } },
                  { key: 'welcome_bonus', label: 'Welcome Bonus', values: { bronze: '100 pts', silver: '500 pts', gold: '1,000 pts', platinum: '2,500 pts' } },
                  { key: 'priority_support', label: 'Priority Support', values: { bronze: '✗', silver: '✓', gold: '✓', platinum: '✓ (24/7)' } },
                  { key: 'free_cancellation', label: 'Free Cancellation', values: { bronze: '✗', silver: '✗', gold: '✓', platinum: '✓' } },
                  { key: 'lounge_access', label: 'Lounge Access', values: { bronze: '✗', silver: '✗', gold: '2 visits/yr', platinum: 'Unlimited' } },
                  { key: 'upgrade_priority', label: 'Upgrade Priority', values: { bronze: '✗', silver: '✗', gold: '✗', platinum: '✓' } },
                  { key: 'dedicated_agent', label: 'Dedicated Agent', values: { bronze: '✗', silver: '✗', gold: '✗', platinum: '✓' } },
                ].map((row) => (
                  <tr key={row.key} className="border-b border-eventra-slate-100">
                    <td className="px-4 py-3 text-body-sm text-eventra-navy-700">{row.label}</td>
                    {TIER_ORDER.map(tier => (
                      <td key={tier} className="px-4 py-3 text-center text-body-sm text-eventra-slate-600">
                        {row.values[tier as keyof typeof row.values]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Transactions */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Points History</h2>
            <div className="flex gap-2">
              <Select
                value="all"
                onValueChange={() => {}}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'earned', label: 'Earned' },
                  { value: 'redeemed', label: 'Redeemed' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'bonus', label: 'Bonus' },
                ]}
                className="w-40"
              />
            </div>
          </div>

          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((txn: any, index: number) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border border-eventra-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', 
                        txn.type === 'earned' ? 'bg-eventra-green-100 text-eventra-green-600' :
                        txn.type === 'redeemed' ? 'bg-eventra-red-100 text-eventra-red-600' :
                        txn.type === 'expired' ? 'bg-eventra-slate-100 text-eventra-slate-600' :
                        'bg-eventra-amber-100 text-eventra-amber-600'
                      )}>
                        {txn.type === 'earned' && <ArrowUpRight className="w-5 h-5" />}
                        {txn.type === 'redeemed' && <ArrowDownRight className="w-5 h-5" />}
                        {txn.type === 'expired' && <X className="w-5 h-5" />}
                        {txn.type === 'bonus' && <Gift className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-eventra-navy-900">{getTransactionLabel(txn.type)}</h4>
                        <p className="text-body-sm text-eventra-slate-600">{txn.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold text-body-lg', 
                        txn.points > 0 ? 'text-eventra-green-600' : 'text-eventra-red-600'
                      )}>
                        {txn.points > 0 ? '+' : ''}{txn.points.toLocaleString()} pts
                      </p>
                      <p className="text-body-xs text-eventra-slate-500">{formatDate(txn.completed_at || txn.created_at)}</p>
                      {txn.booking_amount && (
                        <p className="text-body-xs text-eventra-slate-500">Booking: {formatCurrency(txn.booking_amount, 'INR')}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            )}
          </div>
        </Card>

        {/* Redeem Points */}
        <Card variant="elevated" padding="lg" className="bg-eventra-slate-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-heading-lg font-semibold text-eventra-navy-900">Redeem Points</h3>
              <p className="text-eventra-slate-600 mt-1">Use your points for discounts on future bookings</p>
            </div>
            <div className="flex gap-4 lg:ml-auto mt-4 lg:mt-0">
              <div className="flex items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-eventra-green-100 text-eventra-green-600 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold">100 pts</span>
                  <span className="text-body-xs">= ₹1 discount</span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold">5,000 pts</span>
                  <span className="text-body-xs">= ₹50 discount</span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-eventra-amber-100 text-eventra-amber-600 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold">10,000 pts</span>
                  <span className="text-body-xs">= ₹100 discount</span>
                </div>
              </div>
              <Button leftIcon={<Gift className="w-5 h-5" />}>
                Redeem Points
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function TierIcon({ tier, className }: { tier: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    bronze: <Medal className="w-8 h-8" />,
    silver: <Medal className="w-8 h-8" />,
    gold: <Trophy className="w-8 h-8" />,
    platinum: <Crown className="w-8 h-8" />,
  }
  return <span className={className}>{icons[tier] || <Medal className="w-8 h-8" />}</span>
}

function renderTierBenefits(benefits: any) {
  const benefitItems = [
    { key: 'welcome_bonus', icon: Gift, label: 'Welcome Bonus', desc: `${benefits.welcome_bonus || 0} bonus points` },
    { key: 'priority_support', icon: Shield, label: 'Priority Support', desc: benefits.priority_support ? 'Dedicated support channel' : 'Standard support' },
    { key: 'bonus_multiplier', icon: Target, label: 'Bonus Multiplier', desc: `${benefits.bonus_multiplier || 1}x points on bookings` },
    { key: 'free_cancellation', icon: RotateCcw, label: 'Free Cancellation', desc: benefits.free_cancellation ? 'On eligible bookings' : 'Standard policy' },
    { key: 'lounge_access', icon: Crown, label: 'Lounge Access', desc: benefits.lounge_access ? `${benefits.lounge_access} visits/year` : 'Not available' },
    { key: 'upgrade_priority', icon: ArrowUpRight, label: 'Upgrade Priority', desc: benefits.upgrade_priority ? 'Priority upgrades' : 'Standard' },
    { key: 'dedicated_agent', icon: User, label: 'Dedicated Agent', desc: benefits.dedicated_agent ? 'Personal travel agent' : 'Not available' },
    { key: 'tier_expiry_protection', icon: Shield, label: 'Tier Protection', desc: 'Maintain tier for 12 months' },
  ]

  return benefitItems.filter(b => benefits[b.key] !== undefined && benefits[b.key] !== false).map((benefit) => (
    <Card key={benefit.key} variant="outlined" padding="lg" className="text-center">
      <div className="w-12 h-12 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center mx-auto mb-3">
        <benefit.icon className="w-6 h-6" />
      </div>
      <h4 className="font-semibold text-eventra-navy-900 mb-1">{benefit.label}</h4>
      <p className="text-body-sm text-eventra-slate-600">{benefit.desc}</p>
    </Card>
  ))
}

function getTransactionLabel(type: string): string {
  const labels: Record<string, string> = {
    earned: 'Points Earned',
    redeemed: 'Points Redeemed',
    expired: 'Points Expired',
    reversed: 'Points Reversed',
    adjusted: 'Points Adjusted',
    bonus: 'Bonus Points',
  }
  return labels[type] || type
}

function LoyaltySkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <Card variant="elevated" padding="xl" className="animate-pulse" />
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <Card variant="elevated" padding="lg" className="animate-pulse" />
    </div>
  )
}