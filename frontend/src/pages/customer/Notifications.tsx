import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell, BellOff, CheckCircle2, AlertCircle, AlertTriangle, Calendar, Tag,
  CreditCard, TicketPercent, Check, X, RotateCcw, ChevronRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getRelativeTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'

interface NotificationItem {
  id: number
  uuid: string
  type: string
  title: string
  message: string
  channel?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  action_url?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
}

type StatusFilter = 'all' | 'unread' | 'read'

const NOTIFICATION_TYPES = [
  'booking_confirmed',
  'payment_confirmed',
  'payment_failed',
  'travel_reminder',
  'event_reminder',
  'cancellation_deadline',
  'booking_cancelled',
  'refund_initiated',
  'refund_completed',
  'promo',
  'general',
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  ...NOTIFICATION_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })),
]

export function Notifications() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterType, setFilterType] = useState('all')
  const [markingAll, setMarkingAll] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer-notifications'],
    queryFn: async () => {
      const body = await api.get<any>('/customer/notifications', { per_page: 50 })
      return body
    },
  })

  const notifications: NotificationItem[] = data?.data?.notifications ?? []
  const unreadCount: number = data?.data?.unread_count ?? notifications.filter(n => !n.is_read).length

  const filteredNotifications = useMemo(() => notifications.filter(n => {
    if (filterStatus === 'unread' && n.is_read) return false
    if (filterStatus === 'read' && !n.is_read) return false
    if (filterType !== 'all' && n.type !== filterType) return false
    return true
  }), [notifications, filterStatus, filterType])

  const markAsRead = async (id: number) => {
    try {
      const body = await api.put<any>(`/customer/notifications/${id}/read`)
      if (body.success) {
        queryClient.invalidateQueries({ queryKey: ['customer-notifications'] })
      }
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    try {
      const body = await api.put<any>('/customer/notifications/read-all')
      if (body.success) {
        toast.success('All notifications marked as read')
        queryClient.invalidateQueries({ queryKey: ['customer-notifications'] })
      } else {
        toast.error(body.message || 'Failed to mark all as read')
      }
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  if (isLoading) return <NotificationsSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load notifications</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Notifications</h1>
          <p className="text-eventra-slate-600 mt-1">Stay updated with your bookings and account</p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} loading={markingAll} leftIcon={<Check className="w-5 h-5" />}>
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Bell className="w-6 h-6" />} label="Total" value={notifications.length} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
        <StatCard icon={<BellOff className="w-6 h-6" />} label="Unread" value={unreadCount} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Read" value={notifications.length - unreadCount} iconClass="bg-eventra-green-100 text-eventra-green-600" />
        <StatCard icon={<AlertCircle className="w-6 h-6" />} label="Urgent" value={notifications.filter(n => n.priority === 'urgent' && !n.is_read).length} iconClass="bg-eventra-red-100 text-eventra-red-600" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="md" className="sticky top-16 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'unread', 'read'] as StatusFilter[]).map((status) => (
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
              onChange={(e) => setFilterType(e.target.value)}
              options={TYPE_OPTIONS}
              aria-label="Filter by type"
              className="lg:w-48"
            />
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <EmptyNotificationsState filtered={filterStatus !== 'all' || filterType !== 'all'} />
      ) : (
        <motion.div
          key={`${filterStatus}-${filterType}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
                onClick={() => { if (!notification.is_read) markAsRead(notification.id) }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function NotificationCard({ notification, onClick }: { notification: NotificationItem; onClick: () => void }) {
  const priority = notification.priority || 'normal'

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed': return <CheckCircle2 className="w-5 h-5" />
      case 'payment_confirmed': return <CreditCard className="w-5 h-5" />
      case 'payment_failed': return <AlertCircle className="w-5 h-5" />
      case 'travel_reminder': return <Calendar className="w-5 h-5" />
      case 'event_reminder': return <Calendar className="w-5 h-5" />
      case 'cancellation_deadline': return <AlertTriangle className="w-5 h-5" />
      case 'promo': return <TicketPercent className="w-5 h-5" />
      case 'booking_cancelled': return <X className="w-5 h-5" />
      case 'refund_initiated': return <RotateCcw className="w-5 h-5" />
      case 'refund_completed': return <CheckCircle2 className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
    }
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'low': return 'bg-eventra-blue-100 text-eventra-blue-600'
      case 'high': return 'bg-eventra-amber-100 text-eventra-amber-600'
      case 'urgent': return 'bg-eventra-red-100 text-eventra-red-600'
      default: return 'bg-eventra-slate-100 text-eventra-slate-600'
    }
  }

  return (
    <Card
      variant={notification.is_read ? 'outlined' : 'elevated'}
      onClick={onClick}
      className={cn('relative overflow-hidden cursor-pointer', !notification.is_read && 'ring-2 ring-eventra-blue-200')}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', getPriorityColor(priority))}>
          {getTypeIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn('font-semibold text-eventra-navy-900 truncate', notification.is_read ? '' : 'font-bold')}>
              {notification.title}
            </h3>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-eventra-blue-600 flex-shrink-0" />
            )}
            <span className={cn('badge px-2 py-0.5 text-body-xs ml-auto flex-shrink-0', getPriorityColor(priority))}>
              {priority}
            </span>
          </div>
          <p className={cn('text-body-sm mt-1', notification.is_read ? 'text-eventra-slate-500' : 'text-eventra-slate-700')}>
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-eventra-slate-200">
            <div className="flex items-center gap-4 text-body-xs text-eventra-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {getRelativeTime(notification.created_at)}
              </span>
              <span className="flex items-center gap-1 capitalize">
                <Tag className="w-3 h-3" />
                {String(notification.type || 'general').replace(/_/g, ' ')}
              </span>
            </div>
            {notification.action_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); window.location.href = notification.action_url! }}
              >
                View Details <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyNotificationsState({ filtered }: { filtered: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Bell className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">{filtered ? 'No matching notifications' : 'No notifications'}</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        {filtered ? 'Try changing the filters above.' : "You're all caught up! New notifications will appear here."}
      </p>
      {!filtered && (
        <Link to="/customer/trips" className="link">View my trips</Link>
      )}
    </motion.div>
  )
}

function StatCard({ icon, label, value, iconClass }: { icon: React.ReactNode; label: string; value: number; iconClass: string }) {
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

function NotificationsSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-8 w-52 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse h-32 text-center" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} variant="elevated" padding="md" className="animate-pulse h-24" />
        ))}
      </div>
    </div>
  )
}
