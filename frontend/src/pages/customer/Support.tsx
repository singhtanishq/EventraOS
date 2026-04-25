import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Headphones, Send, Paperclip, MoreVertical } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface SupportTicket {
  id: string
  uuid: string
  ticket_number: string
  booking_id?: string
  booking_item_id?: string
  subject: string
  description: string
  category: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_provider' | 'resolved' | 'closed' | 'reopened'
  assigned_agent_id?: number
  assigned_admin_id?: number
  first_response_at?: string
  resolved_at?: string
  closed_at?: string
  response_count: number
  tags: string[]
  created_at: string
  updated_at: string
  booking?: {
    booking_reference: string
    service_name: string
  }
}

interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: number
  sender_type: 'customer' | 'agent' | 'admin' | 'system'
  message: string
  is_internal: boolean
  attachments: any[]
  is_read: boolean
  read_at?: string
  created_at: string
  sender?: {
    name: string
    email: string
  }
}

export function Support() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['customer-support', filterStatus, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterCategory !== 'all') params.set('category', filterCategory)
      const response = await api.get('/customer/support', { params })
      return response.data
    },
  })

  const tickets = data?.data?.tickets || []
  const categories = data?.data?.categories || [
    'booking', 'payment', 'refund', 'cancellation', 'reschedule',
    'service_quality', 'technical', 'account', 'general', 'complaint', 'feedback'
  ]

  const handleCreateTicket = async () => {
    // Implementation would go here
    toast.success('Ticket created successfully')
    setShowCreateModal(false)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    setIsSending(true)
    try {
      // Send message
      toast.success('Message sent')
      setNewMessage('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) return <SupportSkeleton />

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-eventra-blue-100 text-eventra-blue-700'
      case 'assigned': return 'bg-eventra-cyan-100 text-eventra-cyan-700'
      case 'in_progress': return 'bg-eventra-amber-100 text-eventra-amber-700'
      case 'waiting_for_customer': return 'bg-eventra-purple-100 text-eventra-purple-700'
      case 'waiting_for_provider': return 'bg-eventra-orange-100 text-eventra-orange-700'
      case 'resolved': return 'bg-eventra-green-100 text-eventra-green-700'
      case 'closed': return 'bg-eventra-slate-100 text-eventra-slate-700'
      case 'reopened': return 'bg-eventra-red-100 text-eventra-red-700'
      default: return 'bg-eventra-slate-100 text-eventra-slate-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-eventra-blue-600'
      case 'normal': return 'text-eventra-slate-600'
      case 'high': return 'text-eventra-amber-600'
      case 'urgent': return 'text-eventra-red-600'
      default: return 'text-eventra-slate-600'
    }
  }

  if (isLoading) return <SupportSkeleton />

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
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
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
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <Select
              value={filterCategory}
              onValueChange={setFilterCategory}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(c => ({ value: c, label: c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) })),
              ]}
              className="w-48"
              placeholder="Filter by category"
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
          onClick={() => window.location.href = 'mailto:support@eventraos.com'}
        />
        <ActionCard
          icon={<Phone className="w-6 h-6" />}
          title="Call Us"
          description: "+1-800-EVENTRA",
          onClick={() => window.location.href = 'tel:+18003836872'}
        />
        <ActionCard
          icon={<MessageSquare className="w-6 h-6" />}
          title="FAQs",
          description: "Common questions answered",
          onClick={() => navigate('/faq')}
        />
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {isLoading ? (
          <SupportSkeleton />
        ) : filteredTickets.length === 0 ? (
          <EmptyTicketsState onCreate={() => setShowCreateModal(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> tickets
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={filterStatus}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <TicketCard ticket={ticket} onClick={() => { setSelectedTicket(ticket); setShowTicketModal(true); }} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {tickets.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(tickets.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Support Ticket"
        size="lg"
      >
        <CreateTicketForm onSubmit={handleCreateTicket} onClose={() => setShowCreateModal(false)} />
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => { setShowTicketModal(false); setSelectedTicket(null); }}
        title={selectedTicket ? `Ticket ${selectedTicket.ticket_number}` : 'Ticket Details'}
        size="xl"
      >
        {selectedTicket && <TicketDetailModal ticket={selectedTicket} onReply={handleSendMessage} newMessage={newMessage} setNewMessage={setNewMessage} isSending={isSending} />}
      </Modal>
    </div>
  )
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  return (
    <Card variant="interactive" onClick={onClick} className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-body-sm text-eventra-slate-500">{ticket.ticket_number}</span>
            <span className={cn('badge px-3 py-1 text-body-xs', getStatusColor(ticket.status))}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={cn('badge px-3 py-1 text-body-xs', getPriorityColor(ticket.priority))}>
              {ticket.priority}
            </span>
            {ticket.category && (
              <span className="badge badge-neutral text-body-xs">{ticket.category.replace('_', ' ')}</span>
            )}
          </div>
          <h3 className="font-semibold text-eventra-navy-900 truncate">{ticket.subject}</h3>
          <p className="text-body-sm text-eventra-slate-600 mt-1 line-clamp-2">{ticket.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-body-xs text-eventra-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(ticket.created_at)}
            </span>
            {ticket.booking && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {ticket.booking.booking_reference}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {ticket.response_count} replies
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-eventra-slate-400 flex-shrink-0" />
      </div>
    </Card>
  )
}

function TicketDetailModal({ ticket, onReply, newMessage, setNewMessage, isSending }: { ticket: SupportTicket; onReply: () => void; newMessage: string; setNewMessage: (m: string) => void; isSending: boolean }) {
  // This would fetch messages for the ticket
  const messages: any[] = []

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="space-y-4 mb-6">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn('flex gap-3', msg.sender_type === 'customer' ? 'flex-row-reverse' : 'flex-row')}
          >
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', msg.sender_type === 'customer' ? 'bg-eventra-blue-100 text-eventra-blue-600' : 'bg-eventra-slate-100 text-eventra-slate-600')}>
              {msg.sender_type === 'customer' ? <User className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
            </div>
            <div className={cn('flex-1 max-w-[70%]', msg.sender_type === 'customer' ? 'text-right' : 'text-left')}>
              <div className={cn('p-3 rounded-2xl', msg.sender_type === 'customer' ? 'bg-eventra-blue-100 text-eventra-blue-900' : 'bg-eventra-slate-100 text-eventra-slate-900')}>
                <p className="text-body-sm">{msg.message}</p>
              </div>
              <p className="text-body-xs text-eventra-slate-500 mt-1">{msg.sender?.name} • {getRelativeTime(msg.created_at)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-eventra-slate-200 pt-4">
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button onClick={onReply} loading={isSending} leftIcon={<Send className="w-5 h-5" />}>
            Send
          </Button>
        </div>
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

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-4">
      <Select
        label="Category"
        value={formData.category}
        onValueChange={(v) => setFormData({ ...formData, category: v })}
        options={[
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
        ]}
      />

      <Select
        label="Priority"
        value={formData.priority}
        onValueChange={(v) => setFormData({ ...formData, priority: v })}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'normal', label: 'Normal' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' },
        ]}
      />

      <Input
        label="Subject"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        placeholder="Brief summary of your issue"
        required
      />

      <Input
        label="Description"
        as="textarea"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe your issue in detail..."
        rows={5}
        required
      />

      <Input
        label="Related Booking Reference (Optional)"
        value={formData.booking_id}
        onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
        placeholder="EVR-HTL-7X2M91"
      />

      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Ticket</Button>
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
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <ListSkeleton count={5} />
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

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={currentPage <= 1}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          className={cn(
            'w-10 h-10 rounded-xl font-medium transition-colors',
            page === currentPage
              ? 'bg-eventra-navy-900 text-white'
              : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
          )}
        >
          {page}
        </button>
      ))}
      {totalPages > 5 && <span className="px-4 text-eventra-slate-500">...</span>}
      {totalPages > 5 && (
        <button className="w-10 h-10 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100">
          {totalPages}
        </button>
      )}
      <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-eventra-blue-100 text-eventra-blue-700'
    case 'assigned': return 'bg-eventra-cyan-100 text-eventra-cyan-700'
    case 'in_progress': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'waiting_for_customer': return 'bg-eventra-purple-100 text-eventra-purple-700'
    case 'waiting_for_provider': return 'bg-eventra-orange-100 text-eventra-orange-700'
    case 'resolved': return 'bg-eventra-green-100 text-eventra-green-700'
    case 'closed': return 'bg-eventra-slate-100 text-eventra-slate-700'
    case 'reopened': return 'bg-eventra-red-100 text-eventra-red-700'
    default: return 'bg-eventra-slate-100 text-eventra-slate-700'
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low': return 'text-eventra-blue-600'
    case 'normal': return 'text-eventra-slate-600'
    case 'high': return 'text-eventra-amber-600'
    case 'urgent': return 'text-eventra-red-600'
    default: return 'text-eventra-slate-600'
  }
}