import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Clock, RefreshCw, CheckCircle2, X, AlertTriangle, Calendar, Building2, User, Mail, Phone, Headphones, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, getRelativeTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ListSkeleton } from '@/components/ui/LoadingScreen'

interface TicketCustomer {
  id?: number
  user?: {
    name?: string
    email?: string
    phone?: string | null
  }
}

interface SupportTicket {
  id: number
  uuid?: string
  ticket_number: string
  customer_id?: number | null
  booking_id?: number | null
  subject: string
  description: string
  category?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_provider' | 'resolved' | 'closed' | 'reopened'
  first_response_at?: string | null
  resolved_at?: string | null
  closed_at?: string | null
  response_count: number
  tags?: string[] | null
  created_at: string
  updated_at?: string
  customer?: TicketCustomer | null
}

type FilterStatus = 'all' | 'open' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_provider' | 'resolved' | 'closed' | 'reopened'

const DEFAULT_CATEGORIES = [
  'booking', 'payment', 'refund', 'cancellation', 'reschedule',
  'service_quality', 'technical', 'account', 'general', 'complaint', 'feedback',
]

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
  switch (status) {
    case 'resolved':
      return 'success'
    case 'open':
    case 'assigned':
      return 'primary'
    case 'in_progress':
    case 'waiting_for_customer':
    case 'waiting_for_provider':
      return 'warning'
    case 'reopened':
      return 'danger'
    case 'closed':
    default:
      return 'neutral'
  }
}

function priorityVariant(priority: string): 'danger' | 'warning' | 'primary' | 'neutral' {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'danger'
    case 'normal':
      return 'primary'
    case 'low':
    default:
      return 'neutral'
  }
}

function categoryLabel(category?: string): string {
  if (!category) return 'General'
  return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export function AgentSupport() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['agent-support'],
    queryFn: async () => {
      const body = await api.get<any>('/agent/support')
      return body
    },
  })

  const tickets: SupportTicket[] = data?.data?.tickets ?? []

  const categories = useMemo(() => {
    const fromTickets = Array.from(new Set(tickets.map((t) => t.category).filter(Boolean))) as string[]
    return fromTickets.length > 0 ? fromTickets : DEFAULT_CATEGORIES
  }, [tickets])

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    return true
  })

  if (isLoading) return <SupportSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load support tickets</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4" leftIcon={<RefreshCw className="w-5 h-5" />}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Support Center</h1>
          <p className="text-eventra-slate-600 mt-1">Support tickets assigned to you</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<MessageSquare className="w-6 h-6" />} label="Total Tickets" value={tickets.length} color="eventra-blue" />
        <StatCard icon={<MessageSquare className="w-6 h-6" />} label="Open" value={tickets.filter((t) => t.status === 'open').length} color="eventra-cyan" />
        <StatCard icon={<RefreshCw className="w-6 h-6" />} label="In Progress" value={tickets.filter((t) => t.status === 'in_progress').length} color="eventra-amber" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Resolved" value={tickets.filter((t) => t.status === 'resolved').length} color="eventra-green" />
        <StatCard icon={<X className="w-6 h-6" />} label="Closed" value={tickets.filter((t) => t.status === 'closed').length} color="eventra-slate" />
        <StatCard icon={<AlertTriangle className="w-6 h-6" />} label="Urgent" value={tickets.filter((t) => t.priority === 'urgent').length} color="eventra-red" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'open', 'in_progress', 'waiting_for_customer', 'waiting_for_provider', 'resolved', 'closed', 'reopened'] as const).map((status) => (
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
                {status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 lg:ml-auto">
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((c) => ({ value: c, label: categoryLabel(c) })),
              ]}
              className="w-48"
              aria-label="Filter by category"
            />
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <EmptyTicketsState hasFilters={filterStatus !== 'all' || filterCategory !== 'all'} />
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 10) * 0.03 }}
              >
                <TicketCard
                  ticket={ticket}
                  onClick={() => { setSelectedTicket(ticket); setShowTicketModal(true); }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => { setShowTicketModal(false); setSelectedTicket(null); }}
        title={selectedTicket ? `Ticket ${selectedTicket.ticket_number}` : 'Ticket Details'}
        size="xl"
      >
        {selectedTicket && <TicketDetailModal ticket={selectedTicket} />}
      </Modal>
    </div>
  )
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  return (
    <Card variant="interactive" onClick={onClick} padding="md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-mono text-body-sm text-eventra-slate-500">{ticket.ticket_number}</span>
            <Badge variant={statusVariant(ticket.status)} size="sm">{String(ticket.status || '').replace(/_/g, ' ')}</Badge>
            <Badge variant={priorityVariant(ticket.priority)} size="sm">{ticket.priority}</Badge>
            {ticket.category && (
              <span className="badge badge-neutral text-body-xs">{categoryLabel(ticket.category)}</span>
            )}
          </div>
          <h3 className="font-semibold text-eventra-navy-900 truncate">{ticket.subject}</h3>
          <p className="text-body-sm text-eventra-slate-600 mt-1 line-clamp-2">{ticket.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-body-xs text-eventra-slate-500">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {ticket.customer?.user?.name || `Customer #${ticket.customer_id ?? '—'}`}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(ticket.created_at)} • {getRelativeTime(ticket.created_at)}
            </span>
            {ticket.booking_id && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Booking #{ticket.booking_id}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {ticket.response_count ?? 0} replies
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-eventra-slate-400 flex-shrink-0 mt-1" />
      </div>
    </Card>
  )
}

function TicketDetailModal({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{ticket.subject}</h3>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <Badge variant={statusVariant(ticket.status)}>{String(ticket.status || '').replace(/_/g, ' ')}</Badge>
          <Badge variant={priorityVariant(ticket.priority)} size="sm">{ticket.priority} priority</Badge>
        </div>
      </div>

      <div className="p-4 bg-eventra-slate-50 rounded-xl">
        <p className="text-body-md text-eventra-slate-700 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Customer</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <User className="w-4 h-4" />
              <span>{ticket.customer?.user?.name || `Customer #${ticket.customer_id ?? '—'}`}</span>
            </div>
            {ticket.customer?.user?.email && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <Mail className="w-4 h-4" />
                <span>{ticket.customer.user.email}</span>
              </div>
            )}
            {ticket.customer?.user?.phone && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <Phone className="w-4 h-4" />
                <span>{ticket.customer.user.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Ticket Details</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Category</span>
              <span className="font-medium text-eventra-navy-900">{categoryLabel(ticket.category)}</span>
            </div>
            {ticket.booking_id && (
              <div className="flex items-center justify-between">
                <span className="text-eventra-slate-600">Booking</span>
                <span className="font-medium text-eventra-navy-900">#{ticket.booking_id}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Replies</span>
              <span className="font-medium text-eventra-navy-900">{ticket.response_count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Created</span>
              <span className="font-medium text-eventra-navy-900">{formatDate(ticket.created_at)}</span>
            </div>
            {ticket.first_response_at && (
              <div className="flex items-center justify-between">
                <span className="text-eventra-slate-600">First Response</span>
                <span className="font-medium text-eventra-navy-900">{formatDate(ticket.first_response_at)}</span>
              </div>
            )}
            {ticket.resolved_at && (
              <div className="flex items-center justify-between">
                <span className="text-eventra-slate-600">Resolved</span>
                <span className="font-medium text-eventra-green-600">{formatDate(ticket.resolved_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {Array.isArray(ticket.tags) && ticket.tags.length > 0 && (
        <div>
          <h4 className="font-semibold text-eventra-navy-900 mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {ticket.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="alert alert-info">
        <div className="flex items-start gap-3">
          <Headphones className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Ticket conversations</p>
            <p className="text-body-sm mt-1">
              Replies are managed from the platform support desk. Contact the customer directly using the details above if urgent.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-body-xs text-eventra-slate-500">
        <Clock className="w-4 h-4" />
        Last updated {ticket.updated_at ? getRelativeTime(ticket.updated_at) : '—'}
      </div>
    </div>
  )
}

function EmptyTicketsState({ hasFilters }: { hasFilters?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Headphones className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No support tickets</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        {hasFilters ? 'No tickets match your current filters.' : 'Tickets assigned to you will appear here.'}
      </p>
    </motion.div>
  )
}

function SupportSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-8 w-56 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-eventra-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse h-20" />
      <ListSkeleton count={4} />
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const map: Record<string, string> = {
    'eventra-blue': 'bg-eventra-blue-100 text-eventra-blue-600',
    'eventra-cyan': 'bg-eventra-cyan-100 text-eventra-cyan-600',
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
      <p className="text-heading-md font-display font-bold text-eventra-navy-900 mt-1">{value.toLocaleString()}</p>
    </Card>
  )
}
