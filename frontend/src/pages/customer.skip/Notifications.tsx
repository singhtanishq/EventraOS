import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Headphones, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface Notification {
  id: string
  uuid: string
  type: string
  title: string
  message: string
  channel: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  data: any
  action_url?: string
  is_read: boolean
  read_at?: string
  is_sent: boolean
  sent_at?: string
  sent_via?: string
  created_at: string
}

export function Notifications() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customer-notifications', filterStatus, filterType],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      const response = await api.get('/customer/notifications', { params })
      return response.data
    },
  })

  const notifications = data?.data?.notifications || []
  const types = data?.data?.types || ['booking_confirmed', 'payment_confirmed', 'travel_reminder', 'event_reminder', 'promo', 'general']

  const filteredNotifications = notifications.filter(n => {
    if (filterStatus === 'unread' && n.is_read) return false
    if (filterStatus === 'read' && !n.is_read) return false
    if (filterType !== 'all' && n.type !== filterType) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = async (id: string) => {
    try {
      const response = await api.put(`/customer/notifications/${id}/read`)
      if (response.data.success) {
        // Update local state
      }
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await api.put('/customer/notifications/read-all')
      if (response.data.success) {
        toast.success('All notifications marked as read')
      }
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  if (isLoading) return <NotificationsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Notifications</h1>
          <p className="text-eventra-slate-600 mt-1">Stay updated with your bookings and account</p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} leftIcon={<Check className="w-5 h-5" />}>
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Bell className="w-6 h-6" />} label="Total" value={notifications.length} color="eventra-blue" />
        <StatCard icon={<BellOff className="w-6 h-6" />} label="Unread" value={unreadCount} color="eventra-amber" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Read" value={notifications.length - unreadCount} color="eventra-green" />
        <StatCard icon={<AlertCircle className="w-6 h-6" />} label="Urgent" value={notifications.filter(n => n.priority === 'urgent' && !n.is_read).length} color="eventra-red" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'unread', 'read'] as const).map((status) => (
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
            <Select
              value={filterType}
              onValueChange={setFilterType}
              options={[
                { value: 'all', label: 'All Types' },
                ...types.map(t => ({ value: t, label: t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) })),
              ]}
              className="w-48"
              placeholder="Filter by type"
            />
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : filteredNotifications.length === 0 ? (
          <EmptyNotificationsState />
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={filterStatus}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <NotificationCard
                      notification={notification}
                      onClick={() => markAsRead(notification.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {notifications.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(notifications.length / 20)} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function NotificationCard({ notification, onClick }: { notification: Notification; onClick: () => void }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed': return <CheckCircle2 className="w-5 h-5" />
      case 'payment_confirmed': return <CreditCard className="w-5 h-5" />
      case 'payment_failed': return <AlertCircle className="w-5 h-5" />
      case 'travel_reminder': return <Calendar className="w-5 h-5" />
      case 'event_reminder': return <Calendar className="w-5 h-5" />
      case 'cancellation_deadline': return <AlertTriangle className="w-5 h-5" />
      case 'promo': return <TicketPercent className="w-5 h-5" />
      case 'booking_cancelled': return <XIcon className="w-5 h-5" />
      case 'refund_initiated': return <RotateCcw className="w-5 h-5" />
      case 'refund_completed': return <CheckCircle2 className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-eventra-blue-100 text-eventra-blue-600'
      case 'normal': return 'bg-eventra-slate-100 text-eventra-slate-600'
      case 'high': return 'bg-eventra-amber-100 text-eventra-amber-600'
      case 'urgent': return 'bg-eventra-red-100 text-eventra-red-600'
      default: return 'bg-eventra-slate-100 text-eventra-slate-600'
    }
  }

  return (
    <Card
      variant={notification.is_read ? 'outlined' : 'elevated'}
      onClick={onClick}
      className={cn('relative overflow-hidden', !notification.is_read && 'ring-2 ring-eventra-blue-200')}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', getPriorityColor(notification.priority))}>
              {getTypeIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={cn('font-semibold text-eventra-navy-900', notification.is_read ? '' : 'font-bold')}>
                  {notification.title}
                </h3>
                {!notification.is_read && (
                  <span className="w-2 h-2 rounded-full bg-eventra-blue-600 flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
            <span className={cn('badge px-2 py-1 text-body-xs', getPriorityColor(notification.priority))}>
              {notification.priority}
            </span>
          </div>
          <p className={cn('text-eventra-slate-600 mt-2', notification.is_read ? 'text-eventra-slate-500' : 'text-eventra-slate-700')}>
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-eventra-slate-200">
            <div className="flex items-center gap-4 text-body-xs text-eventra-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {getRelativeTime(notification.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <TagIcon className="w-3 h-3" />
                {notification.type.replace('_', ' ')}
              </span>
            </div>
            {notification.action_url && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); window.location.href = notification.action_url }}>
                View Details
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  )
}

function EmptyNotificationsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Bell className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No notifications</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        You're all caught up! New notifications will appear here.
      </p>
    </motion.div>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i} variant="elevated" padding="md" className="animate-pulse" />
      ))}
    </div>
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