import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AgentTask {
  id: string
  uuid: string
  title: string
  description: string
  due_date: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  customer_id?: string
  customer_name?: string
  booking_id?: string
  booking_reference?: string
  assigned_by?: number
  assigned_by_name?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export function Tasks() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all')
  const [sortBy, setSortBy] = useState<'due_asc' | 'due_desc' | 'created_desc' | 'priority_desc'>('due_asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['agent-tasks', search, filterStatus, filterPriority, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterPriority !== 'all') params.set('priority', filterPriority)
      params.set('sort', sortBy)
      const response = await api.get('/agent/tasks', { params })
      return response.data
    },
  )

  const tasks = data?.data?.tasks || []

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    return true
  })

  if (isLoading) return <TasksSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Tasks</h1>
          <p className="text-eventra-slate-600 mt-1">Manage your tasks and to-dos</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Create Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<ClipboardList className="w-6 h-6" />} label="Total Tasks" value={tasks.length} color="eventra-blue" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={tasks.filter(t => t.status === 'pending').length} color="eventra-amber" />
        <StatCard icon={<RefreshCw className="w-6 h-6" />} label="In Progress" value={tasks.filter(t => t.status === 'in_progress').length} color="eventra-blue" />
        <StatCard icon={<CheckSquare className="w-6 h-6" />} label="Completed" value={tasks.filter(t => t.status === 'completed').length} color="eventra-green" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
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
              value={filterPriority}
              onValueChange={setFilterPriority}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'normal', label: 'Normal' },
                { value: 'low', label: 'Low' },
              ]}
              className="w-40"
              placeholder="Priority"
            />
            <Select
              value={sortBy}
              onValueChange={setSortBy}
              options={[
                { value: 'due_asc', label: 'Due Date (Soonest)' },
                { value: 'due_desc', label: 'Due Date (Latest)' },
                { value: 'created_desc', label: 'Newest First' },
                { value: 'priority_desc', label: 'Highest Priority' },
              ]}
              className="w-44"
              placeholder="Sort by"
            />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="w-64"
            />
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {isLoading ? (
          <TasksSkeleton />
        ) : filteredTasks.length === 0 ? (
          <EmptyTasksState />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> tasks
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div
                key="tasks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <TaskCard
                      task={task}
                      onView={() => { setSelectedTask(task); setShowDetailModal(true); }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {tasks.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(tasks.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Task"
        size="lg"
      >
        <CreateTaskForm onSubmit={() => { setShowCreateModal(false); toast.success('Task created') }} />
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedTask(null); }}
        title={selectedTask ? `Task: ${selectedTask.title}` : 'Task Details'}
        size="lg"
      >
        {selectedTask && <TaskDetailModal task={selectedTask} />}
      </Modal>
    </div>
  )
}

function TaskCard({ task, onView }: { task: AgentTask; onView: () => void }) {
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'completed'

  return (
    <Card variant="interactive" onClick={onView} className={cn('p-4', task.status === 'completed' && 'bg-eventra-green-50')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={task.status === 'completed'}
              onChange={(e) => { e.stopPropagation(); }}
              className="form-checkbox"
            />
            <h3 className={cn('font-semibold text-eventra-navy-900', task.status === 'completed' ? 'line-through text-eventra-slate-400' : '')}>{task.title}</h3>
            <Badge className={cn('badge',
              task.priority === 'urgent' ? 'badge-danger' :
              task.priority === 'high' ? 'badge-danger' :
              task.priority === 'normal' ? 'badge-primary' :
              'badge-neutral'
            )}>
              {task.priority}
            </Badge>
            <Badge className={cn('badge',
              task.status === 'completed' ? 'badge-success' :
              task.status === 'in_progress' ? 'badge-primary' :
              task.status === 'cancelled' ? 'badge-danger' :
              'badge-warning'
            )}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-body-sm text-eventra-slate-600 mb-3">{task.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-body-sm text-eventra-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Due: {formatDate(task.due_date)} {isOverdue && <span className="text-eventra-red-600 font-medium">(Overdue)</span>}
            </span>
            {task.customer_name && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {task.customer_name}
              </span>
            )}
            {task.booking_reference && (
              <span className="flex items-center gap-1">
                <ClipboardList className="w-4 h-4" />
                {task.booking_reference}
              </span>
            )}
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {task.priority}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }} leftIcon={<Square className="w-4 h-4" />}>
            {task.status === 'completed' ? 'Reopen' : 'Complete'}
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }} leftIcon={<Edit2 className="w-4 h-4" />}>
            Edit
          </Button>
        </div>
      </div>
    </Card>
  )
}

function EmptyTasksState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <CheckSquare className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No tasks yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Create your first task to start managing your to-dos.
      </p>
      <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
        Create Your First Task
      </Button>
    </motion.div>
  )
}

function TasksSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} variant="outlined" padding="md" className="animate-pulse" />
      ))}
    </div>
  )
}

function CreateTaskForm({ onSubmit }: { onSubmit: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'normal',
    customer_id: '',
    booking_id: '',
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-4">
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Task title"
        required
      />
      <Input
        label="Description"
        as="textarea"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Task description"
        rows={3}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Due Date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          required
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
      </div>
      <Input
        label="Customer (Optional)"
        value={formData.customer_id}
        onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
        placeholder="Customer name or ID"
      />
      <Input
        label="Related Booking (Optional)"
        value={formData.booking_id}
        onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
        placeholder="Booking reference"
      />
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
          Cancel
        </Button>
        <Button type="submit">Create Task</Button>
      </div>
    </form>
  )
}

function TasksSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} variant="outlined" padding="md" className="animate-pulse" />
      ))}
    </div>
  )
}