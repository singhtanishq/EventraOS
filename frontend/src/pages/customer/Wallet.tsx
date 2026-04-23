import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Coins, PieChart, ArrowUpRight, ArrowDownRight, Target, Gift, Star, Award } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

export function Wallet() {
  const navigate = useNavigate()
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [addFundsAmount, setAddFundsAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['customer-wallet'],
    queryFn: async () => {
      const response = await api.get('/customer/wallet')
      return response.data
    },
  })

  const wallet = data?.data?.wallet
  const transactions = data?.data?.transactions || []

  const handleAddFunds = async () => {
    const amount = parseFloat(addFundsAmount)
    if (!amount || amount < 100) {
      toast.error('Minimum amount is ₹100')
      return
    }
    setIsProcessing(true)
    try {
      const response = await api.post('/customer/wallet/add-funds', { amount })
      if (response.data.success) {
        toast.success('Funds added successfully')
        setShowAddFunds(false)
        setAddFundsAmount('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add funds')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount < 100) {
      toast.error('Minimum amount is ₹100')
      return
    }
    if (amount > (wallet?.balance || 0)) {
      toast.error('Insufficient balance')
      return
    }
    setIsProcessing(true)
    try {
      const response = await api.post('/customer/wallet/withdraw', { amount })
      if (response.data.success) {
        toast.success('Withdrawal request submitted')
        setShowWithdraw(false)
        setWithdrawAmount('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to withdraw')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) return <WalletSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Wallet</h1>
          <p className="text-eventra-slate-600 mt-1">Manage your EventraOS wallet balance</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddFunds(true)} leftIcon={<Plus className="w-5 h-5" />}>
            Add Funds
          </Button>
          <Button variant="outline" onClick={() => setShowWithdraw(true)} leftIcon={<Minuses className="w-5 h-5" />}>
            Withdraw
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <Card variant="elevated" padding="xl" className="bg-gradient-to-r from-eventra-navy-900 to-eventra-blue-800 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <p className="text-eventra-slate-300 text-body-md mb-2">Current Balance</p>
            <p className="text-4xl lg:text-5xl font-display font-bold">{formatCurrency(wallet?.balance || 0, wallet?.currency || 'INR')}</p>
            <p className="text-eventra-slate-400 text-body-sm mt-2">
              Pending: {formatCurrency(wallet?.pending_balance || 0, wallet?.currency || 'INR')} • Blocked: {formatCurrency(wallet?.blocked_balance || 0, wallet?.currency || 'INR')}
            </p>
          </div>
          <div className="flex gap-3 lg:ml-auto">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setShowAddFunds(true)} leftIcon={<Plus className="w-5 h-5" />}>
              Add Funds
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setShowWithdraw(true)} leftIcon={<Minuses className="w-5 h-5" />}>
              Withdraw
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<ArrowUpRight className="w-6 h-6" />} label="Total Credited" value={formatCurrency(wallet?.total_credited || 0, 'INR')} color="eventra-green" />
        <StatCard icon={<ArrowDownRight className="w-6 h-6" />} label="Total Debited" value={formatCurrency(wallet?.total_debited || 0, 'INR')} color="eventra-red" />
        <StatCard icon={<Coins className="w-6 h-6" />} label="Cashback Earned" value={formatCurrency(wallet?.cashback_earned || 0, 'INR')} color="eventra-amber" />
        <StatCard icon={<Gift className="w-6 h-6" />} label="Promotional Credits" value={formatCurrency(wallet?.promotional_credits || 0, 'INR')} color="eventra-purple" />
      </div>

      {/* Transactions */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Transaction History</h2>
          <div className="flex gap-2">
            <Select
              value="all"
              onValueChange={() => {}}
              options={[
                { value: 'all', label: 'All' },
                { value: 'credit', label: 'Credits' },
                { value: 'debit', label: 'Debits' },
                { value: 'refund', label: 'Refunds' },
              ]}
              className="w-40"
            />
          </div>
        </div>

        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((txn: any, index: number) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border border-eventra-slate-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', txn.type === 'credit' ? 'bg-eventra-green-100 text-eventra-green-600' : 'bg-eventra-red-100 text-eventra-red-600')}>
                      {txn.type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-eventra-navy-900">{txn.description || getTransactionLabel(txn.type)}</h4>
                      <p className="text-body-sm text-eventra-slate-600">{txn.reference || txn.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-semibold text-body-lg', txn.type === 'credit' ? 'text-eventra-green-600' : 'text-eventra-red-600')}>
                      {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount, wallet?.currency || 'INR')}
                    </p>
                    <p className="text-body-xs text-eventra-slate-500">{formatDate(txn.created_at)}</p>
                    <span className={cn('badge text-body-xs mt-1', txn.status === 'completed' ? 'badge-success' : 'badge-warning')}>
                      {txn.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Coins className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
            <p className="text-eventra-slate-600">No transactions yet</p>
            <p className="text-body-sm text-eventra-slate-500 mt-1">Your wallet transactions will appear here</p>
          </div>
        )}
      </Card>

      {/* Add Funds Modal */}
      <Modal
        isOpen={showAddFunds}
        onClose={() => { setShowAddFunds(false); setAddFundsAmount(''); }}
        title="Add Funds to Wallet"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-eventra-slate-600">Enter amount to add to your wallet</p>
          <Input
            label="Amount (INR)"
            type="number"
            value={addFundsAmount}
            onChange={(e) => setAddFundsAmount(e.target.value)}
            placeholder="1000"
            min="100"
            step="100"
          />
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                onClick={() => setAddFundsAmount(String(amt))}
                className={cn('px-4 py-2 rounded-xl text-body-sm font-medium transition-colors',
                  addFundsAmount === String(amt)
                    ? 'bg-eventra-navy-900 text-white'
                    : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                )}
              >
                ₹{amt.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowAddFunds(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFunds} loading={isProcessing}>
              Add Funds
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdraw}
        onClose={() => { setShowWithdraw(false); setWithdrawAmount(''); }}
        title="Withdraw Funds"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-eventra-amber-50 border border-eventra-amber-200 rounded-xl">
            <p className="font-medium text-eventra-amber-800">Available Balance: {formatCurrency(wallet?.balance || 0, 'INR')}</p>
            <p className="text-body-sm text-eventra-amber-700 mt-1">Minimum withdrawal: ₹100 • Processing time: 1-3 business days</p>
          </div>
          <Input
            label="Amount (INR)"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="1000"
            min="100"
            step="100"
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowWithdraw(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw} loading={isProcessing}>
              Withdraw
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card variant="elevated" padding="lg" className="text-center">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', `bg-${color}-100 text-${color}-600`)}>
        {icon}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-md font-display font-bold text-eventra-navy-900 mt-1">{value}</p>
    </Card>
  )
}

function getTransactionLabel(type: string): string {
  const labels: Record<string, string> = {
    credit: 'Wallet Credit',
    debit: 'Wallet Debit',
    refund: 'Refund Received',
    cashback: 'Cashback',
    promotional: 'Promotional Credit',
    compensation: 'Compensation',
    loyalty_redemption: 'Loyalty Redemption',
    loyalty_expiry: 'Loyalty Points Expired',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
  }
  return labels[type] || type
}

function WalletSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <Card variant="elevated" padding="xl" className="animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse" />
    </div>
  )
}