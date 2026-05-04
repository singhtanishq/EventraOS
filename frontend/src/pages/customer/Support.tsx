import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Headphones, Mail, Phone, MessageSquare, Plus, Calendar, Building2,
  ChevronRight, Bell,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, getRelativeTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface SupportTicket {
  id: number
  uuid: string
  ticket_number: string
  booking_id?: number | null
  subject: string
  description: string
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_provider' | 'resolved' | 'closed' | 'reopened'
  response_count?: number
  created_at: string
  updated_at: string
  booking?: { booking_reference: string; service_name?: string } | null
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'

const CATEGORIES = [
  { value: 'booking', label: 'Booking Issue' },
  { value: 'payment', label: 'Payment Problem' },
  { value: 'refund', label: 'Refund Request' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'reschedule', label: 'Reschedule' },
  { value: 'service_quality', label: 'Service Quality' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'account', label: 'Account Issue' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'feedback', label: 'Feedback' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const STATUS_FILTERS: StatusFilter[] = ['all', 'open', 'in_progress', 'resolved', 'closed']

function getStatusColor(status: string): string {
  switch (status) {
    case 'open': return 'bg-eventra-blue-100 text-eventra-blue-700'
    case 'assigned': return 'bg-eventra-cyan-100 text-eventra-cyan-700'
    case 'in_progress': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'waiting_for_customer': return 'bg-eventra-teal-100 text-eventra-teal-700'
    case 'waiting_for_provider': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'resolved': return 'bg-eventra-green-100 text-eventra-green-700'
    case 'closed': return 'bg-eventra-slate-100 text-eventra-slate-700'
    case 'reopened': return 'bg-eventra-red-100 text-eventra-red-700'
    default: return 'bg-eventra-slate-100 text-eventra-slate-700'
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'low': return 'text-eventra-blue-600'
    case 'normal': return 'text-eventra-slate-600'
    case 'high': return 'text-eventra-amber-600'
    case 'urgent': return 'text-eventra-red-600'
    default: return 'text-eventra-slate-600'
  }
}

export function Support() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer-support'],
    queryFn: async () => {
      const body = await api.get<any>('/customer/support')
      return body
    },
  })

  const tickets: SupportTicket[] = data?.data?.tickets ?? []

  const filteredTickets = useMemo(() => tickets.filter(t => {
    if (filterStatus === 'resolved') {
      if (!['resolved', 'closed'].includes(t.status)) return false
    } else if (filterStatus === 'open') {
      if (!['open', 'assigned', 'reopened'].includes(t.status)) return false
    } else if (filterStatus !== 'all' && t.status !== filterStatus) {
      return false
    }
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    return true
  }), [tickets, filterStatus, filterCategory])

  const categoryOptions = useMemo(() => {
    const present = new Set(tickets.map(t => t.category))
    return [
      { value: 'all', label: 'All Categories' },
      ...CATEGORIES.filter(c => present.size === 0 || present.has(c.value)),
    ]
  }, [tickets])

  const handleTicketCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-support'] })
    setShowCreateModal(false)
  }

  if (isLoading) return <SupportSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load support tickets</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Customer Support</h1>
          <p className="text-eventra-slate-600 mt-1">Get help with your bookings and account</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Create Ticket
        </Button>
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="md" className="sticky top-16 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
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
                {status === 'all' ? 'All' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={categoryOptions}
              aria-label="Filter by category"
              className="lg:w-48"
            />
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ActionCard
          icon={<Headphones className="w-6 h-6" />}
          title="Live Chat"
          description="Chat with support agent"
          onClick={() => toast('Live chat coming soon')}
        />
        <ActionCard
          icon={<Mail className="w-6 h-6" />}
          title="Email Support"
          description="support@eventraos.com"
          onClick={() => { window.location.href = 'mailto:support@eventraos.com' }}
        />
        <ActionCard
          icon={<Phone className="w-6 h-6" />}
          title="Call Us"
          description="+1-800-EVENTRA"
          onClick={() => { window.location.href = 'tel:+18003836872' }}
        />
        <ActionCard
          icon={<MessageSquare className="w-6 h-6" />}
          title="Notifications"
          description="View booking updates"
          onClick={() => { window.location.href = '/customer/notifications' }}
        />
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <EmptyTicketsState onCreate={() => setShowCreateModal(true)} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-body-md text-eventra-slate-600">
              Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> tickets
            </p>
          </div>

          <motion.div
            key={filterStatus}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <TicketCard
                  ticket={ticket}
                  onClick={() => { setSelectedTicket(ticket); setShowTicketModal(true) }}
                />
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Support Ticket"
        size="lg"
      >
        <CreateTicketForm onSubmit={handleTicketCreated} onClose={() => setShowCreateModal(false)} />
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => { setShowTicketModal(false); setSelectedTicket(null) }}
        title={selectedTicket ? `Ticket ${selectedTicket.ticket_number || selectedTicket.id}` : 'Ticket Details'}
        size="lg"
      >
        {selectedTicket && (
          <TicketDetail ticket={selectedTicket} />
        )}
      </Modal>
    </div>
  )
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  return (
    <Card variant="interactive" padding="md" onClick={onClick}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-mono text-body-sm text-eventra-slate-500">{ticket.ticket_number || `#${ticket.id}`}</span>
            <span className={cn('badge px-3 py-1 text-body-xs capitalize', getStatusColor(ticket.status))}>
              {String(ticket.status || 'open').replace(/_/g, ' ')}
            </span>
            <span className={cn('badge px-3 py-1 text-body-xs capitalize bg-eventra-slate-100', getPriorityColor(ticket.priority))}>
              {ticket.priority || 'normal'}
            </span>
            {ticket.category && (
              <span className="badge badge-neutral text-body-xs capitalize">{String(ticket.category).replace(/_/g, ' ')}</span>
            )}
          </div>
          <h3 className="font-semibold text-eventra-navy-900 truncate">{ticket.subject}</h3>
          <p className="text-body-sm text-eventra-slate-600 mt-1 line-clamp-2">{ticket.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-body-xs text-eventra-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(ticket.created_at)}
            </span>
            {ticket.booking?.booking_reference && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {ticket.booking.booking_reference}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {ticket.response_count ?? 0} {ticket.response_count === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-eventra-slate-400 flex-shrink-0" />
      </div>
    </Card>
  )
}

function TicketDetail({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn('badge px-3 py-1 text-body-xs capitalize', getStatusColor(ticket.status))}>
          {String(ticket.status || 'open').replace(/_/g, ' ')}
        </span>
        <span className={cn('badge px-3 py-1 text-body-xs capitalize bg-eventra-slate-100', getPriorityColor(ticket.priority))}>
          {ticket.priority || 'normal'} priority
        </span>
        <span className="badge badge-neutral text-body-xs capitalize">{String(ticket.category || 'general').replace(/_/g, ' ')}</span>
      </div>

      <div>
        <h3 className="font-semibold text-eventra-navy-900">{ticket.subject}</h3>
        <p className="text-body-xs text-eventra-slate-500 mt-1">
          Created {getRelativeTime(ticket.created_at)} • {formatDate(ticket.created_at)}
        </p>
      </div>

      <div className="p-4 bg-eventra-slate-50 rounded-xl">
        <p className="text-body-sm font-medium text-eventra-navy-900 mb-2">Your description</p>
        <p className="text-body-sm text-eventra-slate-600 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      {ticket.booking?.booking_reference && (
        <div className="p-4 bg-eventra-blue-50 rounded-xl">
          <p className="text-body-sm font-medium text-eventra-navy-900 mb-1">Related booking</p>
          <p className="text-body-sm text-eventra-slate-600">{ticket.booking.booking_reference}</p>
          {ticket.booking.service_name && (
            <p className="text-body-xs text-eventra-slate-500">{ticket.booking.service_name}</p>
          )}
        </div>
      )}

      <div className="alert alert-info">
        <p>Live messaging is coming soon. Updates about this ticket will arrive via email and notifications.</p>
        <Link to="/customer/notifications" className="link inline-flex items-center gap-1 mt-2">
          <Bell className="w-4 h-4" /> Go to notifications
        </Link>
      </div>
    </div>
  )
}

function CreateTicketForm({ onSubmit, onClose }: { onSubmit: () => void; onClose: () => void }) {
  const [formData, setFormData] = useState({
    category: 'general',
    priority: 'normal',
    subject: '',
    description: '',
    booking_id: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
      }
      if (formData.booking_id && /^\d+$/.test(formData.booking_id.trim())) {
        payload.booking_id = parseInt(formData.booking_id.trim(), 10)
      }
      const body = await api.post<any>('/customer/support', payload)
      if (body.success) {
        toast.success('Ticket created successfully')
        onSubmit()
      } else {
        toast.error(body.message || 'Failed to create ticket')
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to create ticket'
      const errors = err?.response?.data?.errors
      toast.error(typeof errors === 'object' && errors ? Object.values(errors)[0]?.[0] || message : message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        options={CATEGORIES}
      />

      <Select
        label="Priority"
        value={formData.priority}
        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        options={PRIORITIES}
      />

      <Input
        label="Subject"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        placeholder="Brief summary of your issue"
        required
      />

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe your issue in detail..."
        rows={5}
        required
      />

      <Input
        label="Related Booking ID (Optional)"
        value={formData.booking_id}
        onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
        placeholder="e.g. 42"
        inputMode="numeric"
      />

      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button variant="outline" className="flex-1" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>Create Ticket</Button>
      </div>
    </form>
  )
}

function EmptyTicketsState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Headphones className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No support tickets</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        You haven't created any support tickets yet. Need help with a booking?
      </p>
      <Button onClick={onCreate} leftIcon={<Plus className="w-5 h-5" />}>
        Create Your First Ticket
      </Button>
    </motion.div>
  )
}

function SupportSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-8 w-56 rounded-lg skeleton" />
      <Card variant="elevated" padding="md" className="animate-pulse h-20" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse h-28" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <Card key={i} variant="elevated" padding="md" className="animate-pulse h-32" />
      ))}
    </div>
  )
}

function ActionCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-4 text-left hover:shadow-card-hover transition-shadow group">
      <div className="w-10 h-10 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-semibold text-eventra-navy-900 mb-1">{title}</h4>
      <p className="text-body-sm text-eventra-slate-600">{description}</p>
    </button>
  )
}

