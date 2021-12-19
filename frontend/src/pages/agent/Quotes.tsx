import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AgentQuote {
  id: string
  uuid: string
  quote_number: string
  customer_id: string
  customer_name: string
  customer_email: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  items: QuoteItem[]
  subtotal: number
  tax_total: number
  discount_total: number
  grand_total: number
  currency: string
  valid_until: string
  sent_at?: string
  accepted_at?: string
  rejected_at?: string
  created_at: string
  updated_at: string
  notes?: string
}

interface QuoteItem {
  id: string
  service_type: string
  service_name: string
  service_details: any
  quantity: number
  unit_price: number
  total_price: number
}

export function Quotes() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc' | 'valid_desc' | 'valid_asc'>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<AgentQuote | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['agent-quotes', search, filterStatus, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      params.set('sort', sortBy)
      const response = await api.get('/agent/quotes', { params })
      return response.data
    },
  })

  const quotes = data?.data?.quotes || []

  const filteredQuotes = quotes.filter(q => {
    if (filterStatus !== 'all' && q.status !== filterStatus) return false
    return true
  })

  if (isLoading) return <QuotesSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Quotes</h1>
          <p className="text-eventra-slate-600 mt-1">Manage quotes for your customers</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Create Quote
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<FileTextIcon className="w-6 h-6" />} label="Total Quotes" value={quotes.length} color="eventra-blue" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Draft" value={quotes.filter(q => q.status === 'draft').length} color="eventra-slate" />
        <StatCard icon={<Send className="w-6 h-6" />} label="Sent" value={quotes.filter(q => q.status === 'sent').length} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Accepted" value={quotes.filter(q => q.status === 'accepted').length} color="eventra-green" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Converted" value={quotes.filter(q => q.status === 'converted').length} color="eventra-green" />
        <StatCard icon={<X className="w-6 h-6" />} label="Rejected/Expired" value={quotes.filter(q => ['rejected', 'expired'].includes(q.status)).length} color="eventra-red" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'] as const).map((status) => (
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
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <Input
              placeholder="Search quotes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="w-64"
            />
            <Select
              value={sortBy}
              onValueChange={setSortBy}
              options={[
                { value: 'created_desc', label: 'Newest First' },
                { value: 'created_asc', label: 'Oldest First' },
                { value: 'amount_desc', label: 'Highest Value' },
                { value: 'amount_asc', label: 'Lowest Value' },
                { value: 'valid_desc', label: 'Expiring Last' },
                { value: 'valid_asc', label: 'Expiring Soon' },
              ]}
              className="w-48"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Quotes Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <QuotesSkeleton />
        ) : filteredQuotes.length === 0 ? (
          <EmptyQuotesState />
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <motion.div
                key="quotes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
              >
                {filteredQuotes.map((quote, index) => (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <QuoteCard
                      quote={quote}
                      onView={() => { setSelectedQuote(quote); setShowDetailModal(true); }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {quotes.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(quotes.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Quote Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedQuote(null); }}
        title={selectedQuote ? `Quote ${selectedQuote.quote_number}` : 'Quote Details'}
        size="xl"
      >
        {selectedQuote && <QuoteDetailModal quote={selectedQuote} />}
      </Modal>
    </div>
  )
}

function QuoteCard({ quote }: { quote: AgentQuote }) {
  const isExpired = new Date(quote.valid_until) < new Date() && quote.status !== 'accepted' && quote.status !== 'converted'
  const isExpiringSoon = !isExpired && new Date(quote.valid_until).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-eventra-slate-100 text-eventra-slate-700'
      case 'sent': return 'bg-eventra-blue-100 text-eventra-blue-700'
      case 'accepted': return 'bg-eventra-green-100 text-eventra-green-700'
      case 'rejected': return 'bg-eventra-red-100 text-eventra-red-700'
      case 'expired': return 'bg-eventra-slate-100 text-eventra-slate-700'
      case 'converted': return 'bg-eventra-green-100 text-eventra-green-700'
      default: return 'bg-eventra-slate-100 text-eventra-slate-700'
    }
  }

  return (
    <Card variant="elevated" padding="lg" className="relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-body-xs text-eventra-slate-500 font-mono">{quote.quote_number}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('badge', getStatusColor(quote.status))}>
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
          {new Date(quote.valid_until) < new Date() && quote.status !== 'accepted' && quote.status !== 'converted' && (
            <Badge className="badge-warning">Expired</Badge>
          )}
          {quote.valid_until && !isExpired && new Date(quote.valid_until).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 && (
            <Badge className="badge-warning">Expiring Soon</Badge>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-eventra-navy-900">Quote for {quote.customer_name}</h3>
          <span className="price-lg text-eventra-navy-900">{formatCurrency(quote.grand_total, quote.currency)}</span>
        </div>
        <p className="text-body-sm text-eventra-slate-600">{quote.customer_email}</p>
        <div className="flex items-center gap-4 text-body-sm text-eventra-slate-600">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Valid until: {formatDate(quote.valid_until)}
          </span>
          <span className="flex items-center gap-1">
            <FileTextIcon className="w-4 h-4" />
            {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
          </span>
        </div>
        {quote.notes && (
          <p className="text-body-sm text-eventra-slate-500 line-clamp-2">{quote.notes}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-eventra-slate-200">
        <div className="flex items-center gap-2 text-body-xs text-eventra-slate-500">
          <span>Created: {formatDate(quote.created_at)}</span>
          {quote.sent_at && <span className="flex items-center gap-1"><Send className="w-3 h-3" /> Sent: {formatDate(quote.sent_at)}</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Send className="w-4 h-4" />}>
            Send
          </Button>
        </div>
      </div>
    </Card>
  )
}

function EmptyQuotesState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <FileTextIcon className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No quotes yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Create your first quote for a customer to get started.
      </p>
      <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
        Create Your First Quote
      </Button>
    </motion.div>
  )
}

function QuotesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} variant="elevated" padding="lg" className="animate-pulse" />
      ))}
    </div>
  )
}

function QuoteDetailModal({ quote }: { quote: AgentQuote }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-body-xs text-eventra-slate-500 font-mono">{quote.quote_number}</span>
        </div>
        <Badge className={cn('badge', 
          quote.status === 'draft' ? 'badge-neutral' :
          quote.status === 'sent' ? 'badge-primary' :
          quote.status === 'accepted' ? 'badge-success' :
          quote.status === 'rejected' ? 'badge-danger' :
          quote.status === 'expired' ? 'badge-warning' :
          quote.status === 'converted' ? 'badge-success' : 'badge-neutral'
        )}>
          {quote.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Customer Details</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <User className="w-4 h-4" />
              <span>{quote.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span>{quote.customer_email}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Quote Details</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Quote Number</span>
              <span className="font-medium text-eventra-navy-900 font-mono">{quote.quote_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Status</span>
              <Badge className={cn('badge',
                quote.status === 'draft' ? 'badge-neutral' :
                quote.status === 'sent' ? 'badge-primary' :
                quote.status === 'accepted' ? 'badge-success' :
                quote.status === 'rejected' ? 'badge-danger' :
                quote.status === 'expired' ? 'badge-warning' :
                quote.status === 'converted' ? 'badge-success' : 'badge-neutral'
              )}>
                {quote.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Valid Until</span>
              <span className="font-medium text-eventra-navy-900">{formatDate(quote.valid_until)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Items</span>
              <span className="font-medium text-eventra-navy-900">{quote.items.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-eventra-slate-200">
        <h4 className="font-semibold text-eventra-navy-900 mb-4">Quote Items</h4>
        <div className="space-y-3">
          {quote.items.map((item, index) => (
            <div key={item.id} className="border border-eventra-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-eventra-navy-900">{item.service_name}</h4>
                  <p className="text-body-sm text-eventra-slate-600 capitalize">{item.service_type}</p>
                </div>
                <span className="price-md text-eventra-navy-900">{formatCurrency(item.total_price, quote.currency)}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-body-sm text-eventra-slate-600">
                <div>
                  <p className="text-eventra-slate-500">Quantity</p>
                  <p className="font-medium text-eventra-navy-900">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-eventra-slate-500">Unit Price</p>
                  <p className="font-medium text-eventra-navy-900">{formatCurrency(item.unit_price, quote.currency)}</p>
                </div>
                <div>
                  <p className="text-eventra-slate-500">Total</p>
                  <p className="font-medium text-eventra-navy-900">{formatCurrency(item.total_price, quote.currency)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-eventra-slate-50 rounded-xl space-y-2">
          <div className="flex justify-between text-body-sm">
            <span className="text-eventra-slate-600">Subtotal</span>
            <span className="text-eventra-navy-900">{formatCurrency(quote.subtotal, quote.currency)}</span>
          </div>
          {quote.tax_total > 0 && (
            <div className="flex justify-between text-body-sm">
              <span className="text-eventra-slate-600">Taxes</span>
              <span className="text-eventra-navy-900">{formatCurrency(quote.tax_total, quote.currency)}</span>
            </div>
          )}
          {quote.discount_total > 0 && (
            <div className="flex justify-between text-body-sm text-eventra-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(quote.discount_total, quote.currency)}</span>
            </div>
          )}
          <div className="border-t border-eventra-slate-200 pt-2 flex justify-between font-semibold text-lg">
            <span className="text-eventra-navy-900">Total</span>
            <span className="price-lg text-eventra-navy-900">{formatCurrency(quote.grand_total, quote.currency)}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-eventra-slate-200 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => {}}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => {}}>
          <Send className="w-4 h-4 mr-2" />
          Send to Customer
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => {}}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Convert to Booking
        </Button>
      </div>
    </div>
  )
}