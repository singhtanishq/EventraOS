import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Coins, Gift, ArrowUpRight, ArrowDownRight, Plus, Minus, Wallet as WalletIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface WalletInfo {
  balance: number
  pending_balance: number
  blocked_balance: number
  currency: string
}

interface WalletTransaction {
  id: number
  uuid: string
  transaction_reference: string
  type: string
  status: string
  amount: number
  currency: string
  description?: string | null
  created_at: string
}

const CREDIT_TYPES = new Set(['credit', 'refund', 'cashback', 'promotional', 'compensation', 'transfer_in'])

const TXN_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'credit', label: 'Credits' },
  { value: 'debit', label: 'Debits' },
  { value: 'refund', label: 'Refunds' },
]

export function Wallet() {
  const queryClient = useQueryClient()
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [addFundsAmount, setAddFundsAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [txnFilter, setTxnFilter] = useState('all')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer-wallet'],
    queryFn: async () => {
      const body = await api.get<any>('/customer/wallet')
      return body
    },
  })

  const wallet: WalletInfo | undefined = data?.data?.wallet
  const transactions: WalletTransaction[] = data?.data?.transactions ?? []

  const filteredTransactions = useMemo(() => {
    if (txnFilter === 'all') return transactions
    if (txnFilter === 'refund') return transactions.filter(t => t.type === 'refund')
    if (txnFilter === 'credit') return transactions.filter(t => CREDIT_TYPES.has(t.type))
    return transactions.filter(t => !CREDIT_TYPES.has(t.type))
  }, [transactions, txnFilter])

  const { totalCredited, totalDebited } = useMemo(() => {
    let credited = 0
    let debited = 0
    for (const txn of transactions) {
      if (txn.status && txn.status !== 'completed') continue
      if (CREDIT_TYPES.has(txn.type)) credited += Number(txn.amount) || 0
      else debited += Number(txn.amount) || 0
    }
    return { totalCredited: credited, totalDebited: debited }
  }, [transactions])

  const currency = wallet?.currency || 'INR'

  const refreshWallet = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-wallet'] })
  }

  const handleAddFunds = async () => {
    const amount = parseFloat(addFundsAmount)
    if (!amount || amount < 100) {
      toast.error('Minimum amount is ₹100')
      return
    }
    setIsProcessing(true)
    try {
      const body = await api.post<any>('/customer/wallet/add-funds', { amount })
      if (body.success) {
        toast.success('Funds added successfully')
        setShowAddFunds(false)
        setAddFundsAmount('')
        refreshWallet()
      } else {
        toast.error(body.message || 'Failed to add funds')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Wallet top-up is not available yet')
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
      const body = await api.post<any>('/customer/wallet/withdraw', { amount })
      if (body.success) {
        toast.success('Withdrawal request submitted')
        setShowWithdraw(false)
        setWithdrawAmount('')
        refreshWallet()
      } else {
        toast.error(body.message || 'Failed to withdraw')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Withdrawals are not available yet')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) return <WalletSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load wallet</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

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
          <Button variant="outline" onClick={() => setShowWithdraw(true)} leftIcon={<Minus className="w-5 h-5" />}>
            Withdraw
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <Card variant="elevated" padding="lg" className="bg-gradient-to-r from-eventra-navy-900 to-eventra-blue-800 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <p className="text-eventra-slate-300 text-body-md mb-2">Current Balance</p>
            <p className="text-4xl lg:text-5xl font-display font-bold">{formatCurrency(wallet?.balance || 0, currency)}</p>
            <p className="text-eventra-slate-400 text-body-sm mt-2">
              Pending: {formatCurrency(wallet?.pending_balance || 0, currency)} • Blocked: {formatCurrency(wallet?.blocked_balance || 0, currency)}
            </p>
          </div>
          <div className="flex gap-3 lg:ml-auto">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setShowAddFunds(true)} leftIcon={<Plus className="w-5 h-5" />}>
              Add Funds
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => setShowWithdraw(true)} leftIcon={<Minus className="w-5 h-5" />}>
              Withdraw
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<ArrowUpRight className="w-6 h-6" />} label="Total Credited" value={formatCurrency(totalCredited, currency)} iconClass="bg-eventra-green-100 text-eventra-green-600" />
        <StatCard icon={<ArrowDownRight className="w-6 h-6" />} label="Total Debited" value={formatCurrency(totalDebited, currency)} iconClass="bg-eventra-red-100 text-eventra-red-600" />
        <StatCard icon={<Coins className="w-6 h-6" />} label="Pending Balance" value={formatCurrency(wallet?.pending_balance || 0, currency)} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
        <StatCard icon={<Gift className="w-6 h-6" />} label="Blocked Balance" value={formatCurrency(wallet?.blocked_balance || 0, currency)} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
      </div>

      {/* Transactions */}
      <Card variant="elevated" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Transaction History</h2>
          <Select
            value={txnFilter}
            onChange={(e) => setTxnFilter(e.target.value)}
            options={TXN_FILTERS}
            aria-label="Filter transactions"
            className="sm:w-40"
          />
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            {filteredTransactions.map((txn, index) => {
              const isCredit = CREDIT_TYPES.has(txn.type)
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
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isCredit ? 'bg-eventra-green-100 text-eventra-green-600' : 'bg-eventra-red-100 text-eventra-red-600')}>
                        {isCredit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-eventra-navy-900">{txn.description || getTransactionLabel(txn.type)}</h4>
                        <p className="text-body-sm text-eventra-slate-600">{txn.transaction_reference || txn.uuid || txn.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-semibold text-body-lg', isCredit ? 'text-eventra-green-600' : 'text-eventra-red-600')}>
                        {isCredit ? '+' : '-'}{formatCurrency(txn.amount, txn.currency || currency)}
                      </p>
                      <p className="text-body-xs text-eventra-slate-500">{formatDate(txn.created_at)}</p>
                      <span className={cn('badge text-body-xs mt-1', txn.status === 'completed' ? 'badge-success' : 'badge-warning')}>
                        {txn.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
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
          <div className="p-4 bg-eventra-blue-50 border border-eventra-blue-200 rounded-xl">
            <p className="text-body-sm text-eventra-blue-800">
              Wallet top-up may not be available yet. Your balance updates automatically after bookings, refunds and cashback.
            </p>
          </div>
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
            <p className="font-medium text-eventra-amber-800">Available Balance: {formatCurrency(wallet?.balance || 0, currency)}</p>
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

function StatCard({ icon, label, value, iconClass }: { icon: React.ReactNode; label: string; value: string; iconClass: string }) {
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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 skeleton" />
        <div className="flex-1">
          <div className="h-8 w-48 rounded-lg skeleton mb-2" />
          <div className="h-4 w-72 rounded skeleton" />
        </div>
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse h-40" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse h-32 text-center" />
        ))}
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse h-64" />
      <div className="flex items-center gap-2 text-body-sm text-eventra-slate-400">
        <WalletIcon className="w-4 h-4" />
        Loading wallet…
      </div>
    </div>
  )
}
