import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Medal, Trophy, Crown, Gift, Shield, Target, RotateCcw, ArrowUpRight, ArrowDownRight, User, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'

interface LoyaltyAccount {
  tier: string
  points_balance: number
  points_pending: number
  points_lifetime_earned: number
  points_lifetime_redeemed: number
  next_tier: string
  points_to_next_tier: number
  tier_benefits: Record<string, unknown>
}

interface LoyaltyTransaction {
  id: number
  type: string
  status: string
  points: number
  description?: string | null
  booking_amount?: number | null
  completed_at?: string | null
  created_at: string
}

// Tier thresholds mirror the backend (CustomerController::loyalty)
const TIER_THRESHOLDS: Record<string, number> = {
  bronze: 0,
  silver: 5000,
  gold: 20000,
  platinum: 50000,
}
const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum']

// Static gradient classes per tier (palette-safe, no dynamic class names)
const TIER_GRADIENTS: Record<string, string> = {
  bronze: 'from-eventra-amber-600 to-eventra-amber-800',
  silver: 'from-eventra-slate-500 to-eventra-slate-700',
  gold: 'from-eventra-amber-500 to-eventra-amber-700',
  platinum: 'from-eventra-navy-600 to-eventra-navy-800',
}

const TIER_CHIP_CLASSES: Record<string, string> = {
  bronze: 'bg-eventra-amber-100 text-eventra-amber-600',
  silver: 'bg-eventra-slate-100 text-eventra-slate-600',
  gold: 'bg-eventra-amber-100 text-eventra-amber-700',
  platinum: 'bg-eventra-navy-100 text-eventra-navy-700',
}

const POINTS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'earned', label: 'Earned' },
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'expired', label: 'Expired' },
  { value: 'bonus', label: 'Bonus' },
]

export function Loyalty() {
  const [pointsFilter, setPointsFilter] = useState('all')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer-loyalty'],
    queryFn: async () => {
      const body = await api.get<any>('/customer/loyalty')
      return body
    },
  })

  const account: LoyaltyAccount | undefined = data?.data?.account
  const transactions: LoyaltyTransaction[] = data?.data?.transactions ?? []

  const tier = account?.tier || 'bronze'
  const gradient = TIER_GRADIENTS[tier] || TIER_GRADIENTS.bronze

  // Backend does not send tier_progress - derive it from lifetime points vs next tier threshold
  const tierProgress = useMemo(() => {
    const earned = Number(account?.points_lifetime_earned) || 0
    const nextTier = account?.next_tier
    if (!nextTier || nextTier === tier) return 100
    const nextThreshold = TIER_THRESHOLDS[nextTier]
    if (!nextThreshold) return 100
    return Math.min(100, Math.max(0, Math.round((earned / nextThreshold) * 100)))
  }, [account?.points_lifetime_earned, account?.next_tier, tier])

  const filteredTransactions = useMemo(() => {
    if (pointsFilter === 'all') return transactions
    return transactions.filter(t => t.type === pointsFilter)
  }, [transactions, pointsFilter])

  if (isLoading) return <LoyaltySkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load rewards</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Eventra Rewards</h1>
          <p className="text-eventra-slate-600 mt-1">Earn points on every booking and redeem for rewards</p>
        </div>
      </div>

      {/* Tier Card */}
      <Card variant="elevated" padding="lg" className={cn('relative overflow-hidden bg-gradient-to-r text-white', gradient)}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <TierIcon tier={tier} className="w-8 h-8" />
              </div>
              <div>
                <p className="text-eventra-slate-200 text-body-md">Current Tier</p>
                <h1 className="text-3xl font-display font-bold capitalize">{tier}</h1>
              </div>
            </div>
            <div className="flex items-center gap-8 text-center lg:text-left">
              <div className="flex-1">
                <p className="text-eventra-slate-200 text-body-sm">Points Balance</p>
                <p className="text-3xl font-display font-bold">{(account?.points_balance ?? 0).toLocaleString()}</p>
              </div>
              <div className="flex-1">
                <p className="text-eventra-slate-200 text-body-sm">Pending Points</p>
                <p className="text-3xl font-display font-bold">{(account?.points_pending ?? 0).toLocaleString()}</p>
              </div>
              <div className="flex-1">
                <p className="text-eventra-slate-200 text-body-sm">Lifetime Earned</p>
                <p className="text-3xl font-display font-bold">{(account?.points_lifetime_earned ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Progress to next tier */}
          {(account?.next_tier && account?.next_tier !== tier) && (
            <div className="mt-8 lg:mt-0 p-6 bg-white/10 rounded-2xl w-full lg:w-96">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-eventra-slate-200 text-body-sm">Progress to {account.next_tier}</p>
                  <p className="text-eventra-slate-100 font-semibold">{account.points_to_next_tier ?? 0} points to go</p>
                </div>
                <span className="badge px-3 py-1 bg-white/20 text-white capitalize">
                  {tierProgress}% Complete
                </span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tierProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Tier Benefits */}
      <Card variant="elevated" padding="lg">
        <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Tier Benefits</h2>
        {renderTierBenefits(account?.tier_benefits).length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderTierBenefits(account?.tier_benefits)}
          </div>
        ) : (
          <div className="alert alert-info">
            Start booking to unlock tier benefits. Every booking earns points toward your next tier — see the tier comparison below.
          </div>
        )}
      </Card>

      {/* Tier Comparison */}
      <Card variant="elevated" padding="lg">
        <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Tier Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-eventra-slate-200">
                <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Benefit</th>
                {TIER_ORDER.map((tierName) => (
                  <th key={tierName} className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider capitalize">
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2', TIER_CHIP_CLASSES[tierName])}>
                      <TierIcon tier={tierName} className="w-5 h-5" />
                    </div>
                    {tierName}
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
                  {TIER_ORDER.map((tierName) => (
                    <td key={tierName} className="px-4 py-3 text-center text-body-sm text-eventra-slate-600">
                      {row.values[tierName as keyof typeof row.values]}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Points History</h2>
          <Select
            value={pointsFilter}
            onChange={(e) => setPointsFilter(e.target.value)}
            options={POINTS_FILTERS}
            aria-label="Filter points history"
            className="sm:w-40"
          />
        </div>

        <div className="space-y-3">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((txn, index) => {
              const points = Number(txn.points) || 0
              return (
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
                        {txn.type !== 'earned' && txn.type !== 'redeemed' && txn.type !== 'expired' && <Gift className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-eventra-navy-900">{getTransactionLabel(txn.type)}</h4>
                        <p className="text-body-sm text-eventra-slate-600">{txn.description || txn.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold text-body-lg',
                        points > 0 ? 'text-eventra-green-600' : 'text-eventra-red-600'
                      )}>
                        {points > 0 ? '+' : ''}{points.toLocaleString()} pts
                      </p>
                      <p className="text-body-xs text-eventra-slate-500">{formatDate(txn.completed_at || txn.created_at)}</p>
                      {txn.booking_amount ? (
                        <p className="text-body-xs text-eventra-slate-500">Booking: {formatCurrency(txn.booking_amount, 'INR')}</p>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <Medal className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
              <p className="text-eventra-slate-600">No points history yet</p>
              <p className="text-body-sm text-eventra-slate-500 mt-1">Points from your bookings will appear here</p>
            </div>
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
                <span className="text-body-sm font-bold">100 pts</span>
                <span className="text-body-xs">= ₹1 off</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center flex-col">
                <span className="text-body-sm font-bold">5,000 pts</span>
                <span className="text-body-xs">= ₹50 off</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-eventra-amber-100 text-eventra-amber-600 flex items-center justify-center flex-col">
                <span className="text-body-sm font-bold">10,000 pts</span>
                <span className="text-body-xs">= ₹100 off</span>
              </div>
            </div>
            <Button leftIcon={<Gift className="w-5 h-5" />} onClick={() => toast('Points redemption is available at checkout')}>
              Redeem Points
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function TierIcon({ tier, className }: { tier: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    bronze: <Medal className="w-5 h-5" />,
    silver: <Medal className="w-5 h-5" />,
    gold: <Trophy className="w-5 h-5" />,
    platinum: <Crown className="w-5 h-5" />,
  }
  return <span className={className}>{icons[tier] || <Medal className="w-5 h-5" />}</span>
}

function renderTierBenefits(benefits?: Record<string, unknown> | null) {
  if (!benefits || typeof benefits !== 'object') return []

  const benefitItems = [
    { key: 'welcome_bonus', icon: Gift, label: 'Welcome Bonus', desc: `${benefits.welcome_bonus || 0} bonus points` },
    { key: 'priority_support', icon: Shield, label: 'Priority Support', desc: benefits.priority_support ? 'Dedicated support channel' : 'Standard support' },
    { key: 'bonus_multiplier', icon: Target, label: 'Bonus Multiplier', desc: `${benefits.bonus_multiplier || 1}x points on bookings` },
    { key: 'free_cancellation', icon: RotateCcw, label: 'Free Cancellation', desc: benefits.free_cancellation ? 'On eligible bookings' : 'Standard policy' },
    { key: 'lounge_access', icon: Crown, label: 'Lounge Access', desc: benefits.lounge_access ? `${benefits.lounge_access} visits/year` : 'Not available' },
    { key: 'upgrade_priority', icon: ArrowUpRight, label: 'Upgrade Priority', desc: benefits.upgrade_priority ? 'Priority upgrades' : 'Standard' },
    { key: 'dedicated_agent', icon: User, label: 'Dedicated Agent', desc: benefits.dedicated_agent ? 'Personal travel agent' : 'Not available' },
  ]

  return benefitItems
    .filter(b => benefits[b.key] !== undefined && benefits[b.key] !== false)
    .map((benefit) => (
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
      <div className="h-8 w-56 rounded-lg skeleton" />
      <Card variant="elevated" padding="lg" className="animate-pulse h-52" />
      <Card variant="elevated" padding="lg" className="animate-pulse h-40" />
      <Card variant="elevated" padding="lg" className="animate-pulse h-64" />
    </div>
  )
}
