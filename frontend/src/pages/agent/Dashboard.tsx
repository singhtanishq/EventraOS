import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Headphones, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, Briefcase, ClipboardList, Target, FileText, DollarSign, TrendingUp, Clock, BarChart3, PieChart, Award, Trophy, Crown, Medal } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AgentDashboardData {
  stats: {
    today_bookings: number
    pending_requests: number
    upcoming_trips: number
    commission_earned: number
    revenue: number
    customers_count: number
    tasks_count: number
    support_cases: number
  }
  recent_bookings: AgentBooking[]
  pending_requests_list: AgentRequest[]
  upcoming_trips_list: AgentTrip[]
  commission_summary: CommissionSummary
  tasks: AgentTask[]
  support_cases: AgentSupportCase[]
}

interface AgentBooking {
  id: string
  booking_reference: string
  customer_name: string
  customer_email: string
  service_type: string
  service_name: string
  status: string
  amount: number
  currency: string
  created_at: string
  travel_date: string
}

interface AgentRequest {
  id: string
  customer_name: string
  customer_email: string
  request_type: string
  details: string
  status: string
  created_at: string
}

interface AgentTrip {
  id: string
  booking_reference: string
  customer_name: string
  service_type: string
  service_name: string
  travel_date: string
  status: string
}

interface CommissionSummary {
  total_earned: number
  pending: number
  eligible: number
  paid_this_month: number
  this_month_target: number
}

interface AgentTask {
  id: string
  title: string
  description: string
  due_date: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  customer_name?: string
  booking_reference?: string
}

interface AgentSupportCase {
  id: string
  ticket_number: string
  customer_name: string
  subject: string
  status: string
  priority: string
  created_at: string
}

export function AgentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: async () => {
      const response = await api.get('/agent/dashboard')
      return response.data
    },
  })

  const stats = data?.data?.stats
  const recentBookings = data?.data?.recent_bookings || []
  const pendingRequests = data?.data?.pending_requests || []
  const upcomingTrips = data?.data?.upcoming_trips || []
  const commissionSummary = data?.data?.commission_summary
  const tasks = data?.data?.tasks || []
  const supportCases = data?.data?.support_cases || []

  if (isLoading) return <AgentDashboardSkeleton />

  return (
    <div className="space-y-6 animate-in">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 bg-gradient-to-r from-eventra-blue-600 to-eventra-cyan-600 rounded-2xl text-white"
      >
        <div>
          <h1 className="text-display-sm font-display font-bold mb-2">Welcome back, Agent!</h1>
          <p className="text-eventra-blue-100">Here's your performance overview</p>
        </div>
        <div className="flex gap-3 lg:ml-auto">
          <Link to="/agent/booking-workspace" className="btn-secondary bg-white/20 border-white/30 text-white hover:bg-white/30">
            <Plus className="w-5 h-5 mr-2" />
            New Booking
          </Link>
          <Link to="/agent/customers" className="btn-primary bg-white text-eventra-blue-600 hover:bg-eventra-slate-100">
            <Users className="w-5 h-5 mr-2" />
            Manage Customers
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-8 gap-4"
      >
        <StatCard icon={<Briefcase className="w-6 h-6" />} label="Today's Bookings" value={stats?.today_bookings || 0} color="eventra-blue" link="/agent/bookings" />
        <StatCard icon={<ClipboardList className="w-6 h-6" />} label="Pending Requests" value={stats?.pending_requests || 0} color="eventra-amber" link="/agent/booking-workspace" />
        <StatCard icon={<Suitcase className="w-6 h-6" />} label="Upcoming Trips" value={stats?.upcoming_trips || 0} color="eventra-cyan" link="/agent/bookings?filter=upcoming" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Revenue" value={formatCurrency(stats?.revenue || 0, 'INR')} color="eventra-green" link="/agent/bookings" />
        <StatCard icon={<Target className="w-6 h-6" />} label="Commission Earned" value={formatCurrency(stats?.commission_earned || 0, 'INR')} color="eventra-amber" link="/agent/commissions" />
        <StatCard icon={<Users className="w-6 h-6" />} label="Customers" value={stats?.customers_count || 0} color="eventra-purple" link="/agent/customers" />
        <StatCard icon={<CheckSquare className="w-6 h-6" />} label="Tasks" value={stats?.tasks_count || 0} color="eventra-red" link="/agent/tasks" />
        <StatCard icon={<MessageSquare className="w-6 h-6" />} label="Support Cases" value={stats?.support_cases || 0} color="eventra-pink" link="/agent/support" />
      </motion.div>

      {/* Commission Progress */}
      {commissionSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid lg:grid-cols-2 gap-6"
        >
          <Card variant="elevated" padding="lg" className="bg-gradient-to-r from-eventra-amber-600 to-eventra-orange-600 text-white">
            <div className="mb-6">
              <p className="text-eventra-amber-100 text-body-md">Monthly Commission Target</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold">{formatCurrency(commissionSummary.paid_this_month || 0, 'INR')}</span>
                <span className="text-eventra-amber-200">/ {formatCurrency(commissionSummary.this_month_target || 0, 'INR')}</span>
              </div>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (commissionSummary.paid_this_month || 0) / (commissionSummary.this_month_target || 1) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <div className="flex justify-between text-eventra-amber-100 text-body-sm mt-3">
              <span>Pending: {formatCurrency(commissionSummary.pending || 0, 'INR')}</span>
              <span>Eligible: {formatCurrency(commissionSummary.eligible || 0, 'INR')}</span>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <h3 className="font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-eventra-amber-600" />
              Commission Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-eventra-slate-600">Total Earned</span>
                <span className="font-semibold text-eventra-navy-900">{formatCurrency(commissionSummary.total_earned || 0, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-eventra-slate-600">This Month</span>
                <span className="font-semibold text-eventra-green-600">{formatCurrency(commissionSummary.paid_this_month || 0, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-eventra-slate-600">Pending Approval</span>
                <span className="font-semibold text-eventra-amber-600">{formatCurrency(commissionSummary.pending || 0, 'INR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-eventra-slate-600">Eligible for Payout</span>
                <span className="font-semibold text-eventra-blue-600">{formatCurrency(commissionSummary.eligible || 0, 'INR')}</span>
              </div>
              <div className="border-t border-eventra-slate-200 pt-3 flex justify-between font-semibold">
                <span className="text-eventra-navy-900">Target Progress</span>
                <span className={cn('text-lg', (commissionSummary.paid_this_month || 0) >= (commissionSummary.this_month_target || 1) ? 'text-eventra-green-600' : 'text-eventra-amber-600')}>
                  {Math.round(((commissionSummary.paid_this_month || 0) / (commissionSummary.this_month_target || 1)) * 100)}%
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Recent Bookings</h2>
              <Link to="/agent/bookings" className="link text-body-sm">View all</Link>
            </div>
            <div className="space-y-3">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                      {getServiceIcon(booking.service_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-eventra-navy-900 truncate">{booking.service_name}</h3>
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                      </div>
                      <p className="text-body-sm text-eventra-slate-600 mt-1">{booking.customer_name} • {booking.customer_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-eventra-navy-900">{formatCurrency(booking.amount, booking.currency)}</p>
                      <p className="text-body-xs text-eventra-slate-500">{formatDate(booking.travel_date)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/agent/bookings/${booking.id}`)}>
                      View
                    </Button>
                  </motion.div>
                ))
              ) : (
                <Card variant="outlined" padding="lg" className="text-center">
                  <Briefcase className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">No recent bookings</h3>
                  <p className="text-eventra-slate-600 mb-4">Start booking for your customers!</p>
                  <Link to="/agent/booking-workspace" className="btn-primary inline-flex">
                    <Plus className="w-5 h-5 mr-2" />
                    New Booking
                  </Link>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Pending Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Pending Requests</h2>
              <Link to="/agent/booking-workspace" className="link text-body-sm">View all</Link>
            </div>
            <div className="space-y-3">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-eventra-amber-100 text-eventra-amber-600 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-eventra-navy-900">{request.customer_name}</h3>
                      <p className="text-body-sm text-eventra-slate-600">{request.request_type} - {request.details}</p>
                    </div>
                    <Badge className="badge-warning">{request.status}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/agent/booking-workspace?request=${request.id}`)}>
                      Handle
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-eventra-slate-600">No pending requests</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <ActionCard
                icon={<Plus className="w-6 h-6" />}
                title="New Booking"
                description="Book for a customer"
                onClick={() => navigate('/agent/booking-workspace')}
              />
              <ActionCard
                icon={<UserPlus className="w-6 h-6" />}
                title="Add Customer"
                description="Register new customer"
                onClick={() => navigate('/agent/customers/new')}
              />
              <ActionCard
                icon={<FileText className="w-6 h-6" />}
                title="Create Quote"
                description="Generate quote for customer"
                onClick={() => navigate('/agent/quotes/new')}
              />
              <ActionCard
                icon={<Target className="w-6 h-6" />}
                title="View Commissions"
                description="Track your earnings"
                onClick={() => navigate('/agent/commissions')}
              />
              <ActionCard
                icon={<CheckSquare className="w-6 h-6" />}
                title="My Tasks"
                description="Manage your tasks"
                onClick={() => navigate('/agent/tasks')}
              />
              <ActionCard
                icon={<MessageSquare className="w-6 h-6" />}
                title="Support"
                description="Help customers"
                onClick={() => navigate('/agent/support')}
              />
            </div>
          </motion.div>

          {/* Upcoming Trips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Upcoming Trips</h2>
              <Link to="/agent/bookings?filter=upcoming" className="link text-body-sm">View all</Link>
            </div>
            <div className="space-y-3">
              {upcomingTrips.length > 0 ? (
                upcomingTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                      {getServiceIcon(trip.service_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-eventra-navy-900">{trip.service_name}</h3>
                      <p className="text-body-sm text-eventra-slate-600">{trip.customer_name} • {formatDate(trip.travel_date)}</p>
                    </div>
                    <Badge className={getStatusColor(trip.status)}>{trip.status}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/agent/bookings/${trip.id}`)}>
                      View
                    </Button>
                  </motion.div>
                ))
              ) : (
                <Card variant="outlined" padding="lg" className="text-center">
                  <Suitcase className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <p className="text-eventra-slate-600">No upcoming trips</p>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">My Tasks</h2>
              <Link to="/agent/tasks" className="link text-body-sm">View all</Link>
            </div>
            <Card variant="elevated" padding="lg">
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn('flex items-center justify-between p-3 rounded-xl', task.status === 'completed' ? 'bg-eventra-green-50' : 'bg-eventra-slate-50')}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => {}}
                          className="form-checkbox"
                        />
                        <div className="flex-1">
                          <h4 className={cn('font-medium text-eventra-navy-900', task.status === 'completed' ? 'line-through text-eventra-slate-400' : '')}>{task.title}</h4>
                          <p className="text-body-sm text-eventra-slate-600">{task.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={cn('badge', task.priority === 'urgent' ? 'badge-danger' : task.priority === 'high' ? 'badge-warning' : 'badge-neutral')}>
                            {task.priority}
                          </Badge>
                          <p className="text-body-xs text-eventra-slate-500 mt-1">{formatDate(task.due_date)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {tasks.length > 5 && (
                    <Link to="/agent/tasks" className="block text-center text-body-sm text-eventra-blue-600 hover:text-eventra-blue-700 mt-3">
                      View all {tasks.length} tasks
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <p className="text-eventra-slate-600">No tasks assigned</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function getServiceIcon(type: string) {
  switch (type) {
    case 'hotel': return <Building2 className="w-6 h-6 text-eventra-blue-600" />
    case 'flight': return <Plane className="w-6 h-6 text-eventra-cyan-600" />
    case 'venue': return <MapPin className="w-6 h-6 text-eventra-red-600" />
    case 'train': return <Train className="w-6 h-6 text-eventra-teal-600" />
    case 'bus': return <Bus className="w-6 h-6 text-eventra-amber-600" />
    case 'car': return <Car className="w-6 h-6 text-eventra-green-600" />
    case 'activity': return <Sparkles className="w-6 h-6 text-eventra-blue-600" />
    case 'transfer': return <Truck className="w-6 h-6 text-eventra-cyan-600" />
    case 'package': return <Package className="w-6 h-6 text-eventra-navy-600" />
    default: return <Package className="w-6 h-6 text-eventra-navy-600" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-eventra-green-100 text-eventra-green-700'
    case 'pending': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'cancelled': return 'bg-eventra-red-100 text-eventra-red-700'
    case 'completed': return 'bg-eventra-blue-100 text-eventra-blue-700'
    case 'partially_confirmed': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'cancel_requested': return 'bg-eventra-red-100 text-eventra-red-700'
    case 'reschedule_requested': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'rescheduled': return 'bg-eventra-blue-100 text-eventra-blue-700'
    case 'refund_pending': return 'bg-eventra-amber-100 text-eventra-amber-700'
    case 'refunded': return 'bg-eventra-green-100 text-eventra-green-700'
    case 'failed': return 'bg-eventra-red-100 text-eventra-red-700'
    default: return 'bg-eventra-slate-100 text-eventra-slate-700'
  }
}

function AgentDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-32 bg-eventra-slate-100 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-8 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 bg-eventra-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}

import { Suitcase, AlertCircle, UserPlus, Suitcase as SuitcaseIcon } from 'lucide-react'