import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Clock, Send, CheckCircle2, DollarSign, X, Plus, Calendar, Search, User, Mail, Trash2, RefreshCw, Copy } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface QuoteItem {
  id?: number | string
  service_type?: string
  service_name?: string
  unit_price?: number
  quantity?: number
  total_price?: number
}

interface AgentQuote {
  id: number
  quote_number: string
  customer_id?: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  items?: QuoteItem[] | null
  subtotal: number
  tax_total: number
  discount_total: number
  grand_total: number
  currency: string
  valid_until?: string | null
  sent_at?: string | null
  accepted_at?: string | null
  rejected_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

interface CustomerLite {
  id: number
  user: { name?: string; email?: string }
}

type FilterStatus = 'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
type SortKey = 'created_desc' | 'created_asc' | 'amount_desc' | 'amount_asc' | 'valid_asc'

function quoteStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
  switch (status) {
    case 'accepted':
    case 'converted':
      return 'success'
    case 'sent':
      return 'primary'
    case 'rejected':
      return 'danger'
    case 'expired':
      return 'warning'
    case 'draft':
      return 'neutral'
    default:
      return 'default'
  }
}

export function AgentQuotes() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortKey>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<AgentQuote | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['agent-quotes'],
    queryFn: async () => {
      const body = await api.get<any>('/agent/quotes')
      return body
    },
  })

  const customersQuery = useQuery({
    queryKey: ['agent-quotes-customers'],
    queryFn: async () => {
      const body = await api.get<any>('/agent/customers', { per_page: 100 })
      return body
    },
  })

  const customerMap = useMemo(() => {
    const map = new Map<number, CustomerLite>()
    for (const c of (customersQuery.data?.data?.customers ?? []) as CustomerLite[]) {
      map.set(c.id, c)
    }
    return map
  }, [customersQuery.data])

  const createQuote = useMutation({
    mutationFn: async (payload: {
      customer_id: number
      items: { service_name: string; service_type: string; unit_price: number; quantity: number }[]
      valid_until: string
      notes?: string
    }) => api.post<any>('/agent/quotes', payload),
    onSuccess: (body: any) => {
      if (body?.success === false) {
        toast.error(body?.message || 'Failed to create quote')
        return
      }
      toast.success(body?.message || 'Quote created')
      setShowCreateModal(false)
      queryClient.invalidateQueries({ queryKey: ['agent-quotes'] })
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] })
    },
    onError: (err: any) => {
      const validationErrors = err?.response?.data?.errors
      const firstError = validationErrors ? Object.values(validationErrors)[0] : null
      toast.error(Array.isArray(firstError) ? String(firstError[0]) : err?.response?.data?.message || 'Failed to create quote')
    },
  })

  const quotes: AgentQuote[] = data?.data?.quotes ?? []

  const filteredQuotes = quotes
    .filter((q) => {
      if (filterStatus !== 'all' && q.status !== filterStatus) return false
      if (search.trim()) {
        const q2 = search.trim().toLowerCase()
        const customerName = (customerMap.get(q.customer_id ?? -1)?.user?.name || '').toLowerCase()
        if (!q.quote_number.toLowerCase().includes(q2) && !customerName.includes(q2)) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'amount_desc':
          return (b.grand_total || 0) - (a.grand_total || 0)
        case 'amount_asc':
          return (a.grand_total || 0) - (b.grand_total || 0)
        case 'valid_asc':
          return new Date(a.valid_until || 0).getTime() - new Date(b.valid_until || 0).getTime()
        case 'created_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  if (isLoading) return <QuotesSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load quotes</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4" leftIcon={<RefreshCw className="w-5 h-5" />}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Quotes</h1>
          <p className="text-eventra-slate-600 mt-1">Create and manage quotes for your customers</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Create Quote
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<FileText className="w-6 h-6" />} label="Total Quotes" value={quotes.length} color="eventra-blue" />
        <StatCard icon={<FileText className="w-6 h-6" />} label="Draft" value={quotes.filter((q) => q.status === 'draft').length} color="eventra-slate" />
        <StatCard icon={<Send className="w-6 h-6" />} label="Sent" value={quotes.filter((q) => q.status === 'sent').length} color="eventra-cyan" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Accepted" value={quotes.filter((q) => q.status === 'accepted').length} color="eventra-green" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Converted" value={quotes.filter((q) => q.status === 'converted').length} color="eventra-teal" />
        <StatCard icon={<X className="w-6 h-6" />} label="Rejected/Expired" value={quotes.filter((q) => ['rejected', 'expired'].includes(q.status)).length} color="eventra-red" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16 z-10">
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
            <div className="w-56">
              <Input
                placeholder="Search quotes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              options={[
                { value: 'created_desc', label: 'Newest First' },
                { value: 'created_asc', label: 'Oldest First' },
                { value: 'amount_desc', label: 'Highest Value' },
                { value: 'amount_asc', label: 'Lowest Value' },
                { value: 'valid_asc', label: 'Expiring Soon' },
              ]}
              className="w-48"
              aria-label="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Quotes Grid */}
      <div className="space-y-4">
        {filteredQuotes.length === 0 ? (
          <EmptyQuotesState onCreate={() => setShowCreateModal(true)} hasSearch={!!search.trim() || filterStatus !== 'all'} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredQuotes.map((quote, index) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 9) * 0.03 }}
              >
                <QuoteCard
                  quote={quote}
                  customerName={customerMap.get(quote.customer_id ?? -1)?.user?.name}
                  onView={() => { setSelectedQuote(quote); setShowDetailModal(true); }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Quote Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Quote"
        size="lg"
      >
        <CreateQuoteForm
          customers={(customersQuery.data?.data?.customers ?? []) as CustomerLite[]}
          onSubmit={(payload) => createQuote.mutate(payload)}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={createQuote.isPending}
        />
      </Modal>

      {/* Quote Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedQuote(null); }}
        title={selectedQuote ? `Quote ${selectedQuote.quote_number}` : 'Quote Details'}
        size="xl"
      >
        {selectedQuote && (
          <QuoteDetailModal
            quote={selectedQuote}
            customer={selectedQuote.customer_id ? customerMap.get(selectedQuote.customer_id) : undefined}
          />
        )}
      </Modal>
    </div>
  )
}

function QuoteCard({ quote, customerName, onView }: { quote: AgentQuote; customerName?: string; onView: () => void }) {
  const items = quote.items ?? []
  const isExpired = quote.valid_until ? new Date(quote.valid_until) < new Date() && quote.status !== 'accepted' && quote.status !== 'converted' : false
  const isExpiringSoon = !isExpired && quote.valid_until ? new Date(quote.valid_until).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 : false

  return (
    <Card variant="elevated" padding="lg" className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <span className="text-body-xs text-eventra-slate-500 font-mono">{quote.quote_number}</span>
        <div className="flex items-center gap-2">
          <Badge variant={quoteStatusVariant(quote.status)} size="sm">
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </Badge>
          {isExpired && <Badge variant="warning" size="sm">Expired</Badge>}
          {isExpiringSoon && <Badge variant="warning" size="sm">Expiring Soon</Badge>}
        </div>
      </div>

      <div className="space-y-3 mb-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-eventra-navy-900 truncate">Quote for {customerName || `Customer #${quote.customer_id ?? '—'}`}</h3>
          <span className="price-md text-eventra-navy-900 flex-shrink-0">{formatCurrency(quote.grand_total, quote.currency)}</span>
        </div>
        <div className="flex items-center gap-4 text-body-sm text-eventra-slate-600">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Valid until: {formatDate(quote.valid_until)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        {quote.notes && <p className="text-body-sm text-eventra-slate-500 line-clamp-2">{quote.notes}</p>}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-eventra-slate-200">
        <span className="text-body-xs text-eventra-slate-500">Created: {formatDate(quote.created_at)}</span>
        <Button variant="outline" size="sm" leftIcon={<Copy className="w-4 h-4" />} onClick={onView}>
          View
        </Button>
      </div>
    </Card>
  )
}

function EmptyQuotesState({ onCreate, hasSearch }: { onCreate: () => void; hasSearch?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <FileText className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No quotes found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        {hasSearch ? 'No quotes match your current filters.' : 'Create your first quote for a customer to get started.'}
      </p>
      <Button onClick={onCreate} leftIcon={<Plus className="w-5 h-5" />}>
        Create Your First Quote
      </Button>
    </motion.div>
  )
}

function QuotesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-eventra-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse h-56" />
        ))}
      </div>
    </div>
  )
}

interface CreateQuotePayload {
  customer_id: number
  items: { service_name: string; service_type: string; unit_price: number; quantity: number }[]
  valid_until: string
  notes?: string
}

function CreateQuoteForm({ customers, onSubmit, onCancel, isSubmitting }: {
  customers: CustomerLite[]
  onSubmit: (payload: CreateQuotePayload) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const [customerId, setCustomerId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([
    { service_name: '', service_type: 'hotel', unit_price: '', quantity: '1' },
  ])

  const updateItem = (index: number, key: keyof typeof items[0], value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const customer = customers.find((c) => String(c.id) === customerId)
    if (!customer) {
      toast.error('Please select a customer')
      return
    }
    if (!validUntil) {
      toast.error('Please choose a validity date')
      return
    }
    const validItems = items
      .filter((item) => item.service_name.trim() && Number(item.unit_price) > 0 && Number(item.quantity) > 0)
      .map((item) => ({
        service_name: item.service_name.trim(),
        service_type: item.service_type,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
      }))
    if (validItems.length === 0) {
      toast.error('Add at least one item with a name and price')
      return
    }
    onSubmit({
      customer_id: customer.id,
      items: validItems,
      valid_until: new Date(`${validUntil}T23:59:59`).toISOString(),
      notes: notes.trim() || undefined,
    })
  }

  const total = items.reduce((sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0), 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <Select
        label="Customer"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        options={customers.map((c) => ({ value: String(c.id), label: c.user?.name || `Customer #${c.id}` }))}
        placeholder={customers.length ? 'Select a customer' : 'No customers assigned'}
        required
      />
      {customers.length === 0 && (
        <div className="alert alert-warning text-body-sm">You need at least one customer before creating a quote.</div>
      )}

      <div>
        <label className="label">Items</label>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="p-3 rounded-xl bg-eventra-slate-50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Service name"
                  value={item.service_name}
                  onChange={(e) => updateItem(index, 'service_name', e.target.value)}
                />
                <Select
                  value={item.service_type}
                  onChange={(e) => updateItem(index, 'service_type', e.target.value)}
                  options={[
                    { value: 'hotel', label: 'Hotel' },
                    { value: 'flight', label: 'Flight' },
                    { value: 'train', label: 'Train' },
                    { value: 'bus', label: 'Bus' },
                    { value: 'venue', label: 'Venue' },
                    { value: 'car', label: 'Car Rental' },
                    { value: 'activity', label: 'Activity' },
                    { value: 'transfer', label: 'Transfer' },
                    { value: 'package', label: 'Package' },
                  ]}
                  aria-label="Service type"
                />
              </div>
              <div className="flex items-end gap-3">
                <Input
                  label="Unit Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                  placeholder="0"
                />
                <Input
                  label="Qty"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                />
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => removeItem(index)}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, { service_name: '', service_type: 'hotel', unit_price: '', quantity: '1' }])}
          className="link text-body-sm mt-2 inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Valid Until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
        <div className="p-4 bg-eventra-slate-50 rounded-xl self-end">
          <p className="text-body-sm text-eventra-slate-600">Subtotal</p>
          <p className="price-md text-eventra-navy-900">{formatCurrency(total)}</p>
          <p className="text-body-xs text-eventra-slate-500">18% GST is added automatically</p>
        </div>
      </div>

      <Textarea
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything the customer should know…"
        rows={3}
      />

      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting} disabled={customers.length === 0}>Create Quote</Button>
      </div>
    </form>
  )
}

function QuoteDetailModal({ quote, customer }: { quote: AgentQuote; customer?: CustomerLite }) {
  const items = quote.items ?? []

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-eventra-slate-500 font-mono">{quote.quote_number}</span>
        <Badge variant={quoteStatusVariant(quote.status)}>{quote.status.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Customer</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <User className="w-4 h-4" />
              <span>{customer?.user?.name || `Customer #${quote.customer_id ?? '—'}`}</span>
            </div>
            {customer?.user?.email && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <Mail className="w-4 h-4" />
                <span>{customer.user.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Quote Details</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Valid Until</span>
              <span className="font-medium text-eventra-navy-900">{formatDate(quote.valid_until)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Items</span>
              <span className="font-medium text-eventra-navy-900">{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Created</span>
              <span className="font-medium text-eventra-navy-900">{formatDate(quote.created_at)}</span>
            </div>
            {quote.sent_at && (
              <div className="flex items-center justify-between">
                <span className="text-eventra-slate-600">Sent</span>
                <span className="font-medium text-eventra-navy-900">{formatDate(quote.sent_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-eventra-slate-200">
        <h4 className="font-semibold text-eventra-navy-900 mb-4">Quote Items</h4>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => {
              const qty = Number(item.quantity) || 1
              const unit = Number(item.unit_price) || 0
              const lineTotal = Number(item.total_price) || unit * qty
              return (
                <div key={item.id ?? index} className="border border-eventra-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-eventra-navy-900">{item.service_name || 'Service'}</h4>
                      <p className="text-body-sm text-eventra-slate-600 capitalize">{item.service_type || '—'}</p>
                    </div>
                    <span className="price-md text-eventra-navy-900">{formatCurrency(lineTotal, quote.currency)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-body-sm text-eventra-slate-600">
                    <div>
                      <p className="text-eventra-slate-500">Quantity</p>
                      <p className="font-medium text-eventra-navy-900">{qty}</p>
                    </div>
                    <div>
                      <p className="text-eventra-slate-500">Unit Price</p>
                      <p className="font-medium text-eventra-navy-900">{formatCurrency(unit, quote.currency)}</p>
                    </div>
                    <div>
                      <p className="text-eventra-slate-500">Total</p>
                      <p className="font-medium text-eventra-navy-900">{formatCurrency(lineTotal, quote.currency)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-eventra-slate-600 text-center py-4">No items recorded on this quote</p>
        )}

        <div className="mt-4 p-4 bg-eventra-slate-50 rounded-xl space-y-2">
          <div className="flex justify-between text-body-sm">
            <span className="text-eventra-slate-600">Subtotal</span>
            <span className="text-eventra-navy-900">{formatCurrency(quote.subtotal, quote.currency)}</span>
          </div>
          {Number(quote.tax_total) > 0 && (
            <div className="flex justify-between text-body-sm">
              <span className="text-eventra-slate-600">Taxes</span>
              <span className="text-eventra-navy-900">{formatCurrency(quote.tax_total, quote.currency)}</span>
            </div>
          )}
          {Number(quote.discount_total) > 0 && (
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

      {quote.notes && (
        <div className="p-4 bg-eventra-blue-50 border border-eventra-blue-200 rounded-xl">
          <p className="text-body-sm text-eventra-blue-900">{quote.notes}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-body-xs text-eventra-slate-500">
        <Clock className="w-4 h-4" />
        Quotes are managed by the platform — status changes are applied by the system.
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const map: Record<string, string> = {
    'eventra-blue': 'bg-eventra-blue-100 text-eventra-blue-600',
    'eventra-cyan': 'bg-eventra-cyan-100 text-eventra-cyan-600',
    'eventra-teal': 'bg-eventra-teal-100 text-eventra-teal-600',
    'eventra-green': 'bg-eventra-green-100 text-eventra-green-600',
    'eventra-amber': 'bg-eventra-amber-100 text-eventra-amber-600',
    'eventra-red': 'bg-eventra-red-100 text-eventra-red-600',
    'eventra-slate': 'bg-eventra-slate-100 text-eventra-slate-600',
  }
  return (
    <Card variant="elevated" padding="md" className="text-center">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3', map[color] || map['eventra-blue'])}>
        {icon}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-md font-display font-bold text-eventra-navy-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </Card>
  )
}
