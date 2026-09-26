import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Clock, RefreshCw, CheckSquare, Plus, Calendar, Users, AlertTriangle, Edit2, Square, FileText, Trash2, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AgentTask {
  id: number
  uuid?: string
  title: string
  description?: string | null
  due_date?: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  customer_id?: number | null
  booking_id?: number | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
type FilterPriority = 'all' | 'low' | 'normal' | 'high' | 'urgent'
type SortKey = 'due_asc' | 'due_desc' | 'created_desc' | 'priority_desc'

const PRIORITY_ORDER: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 }

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function priorityVariant(priority?: string): 'danger' | 'warning' | 'primary' | 'neutral' {
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

function statusVariant(status?: string): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'primary'
    case 'cancelled':
      return 'danger'
    case 'pending':
    default:
      return 'warning'
  }
}

export function AgentTasks() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [sortBy, setSortBy] = useState<SortKey>('due_asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editTask, setEditTask] = useState<AgentTask | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailTask, setDetailTask] = useState<AgentTask | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['agent-tasks'],
    queryFn: async () => {
      const body = await api.get<any>('/agent/tasks')
      return body
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['agent-tasks'] })
    queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] })
  }

  const createTask = useMutation({
    mutationFn: async (payload: { title: string; description?: string; due_date: string; priority: string }) => {
      return api.post<any>('/agent/tasks', payload)
    },
    onSuccess: (body: any) => {
      toast.success(body?.message || 'Task created')
      setShowCreateModal(false)
      invalidate()
    },
    onError: (err: any) => {
      const validationErrors = err?.response?.data?.errors
      const firstError = validationErrors ? Object.values(validationErrors)[0] : null
      toast.error(Array.isArray(firstError) ? String(firstError[0]) : err?.response?.data?.message || 'Failed to create task')
    },
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Record<string, unknown> }) => {
      return api.put<any>(`/agent/tasks/${id}`, payload)
    },
    onSuccess: (body: any) => {
      toast.success(body?.message || 'Task updated')
      setEditTask(null)
      invalidate()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update task')
    },
  })

  const toggleStatus = useMutation({
    mutationFn: async (task: AgentTask) => {
      const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
      return api.put<any>(`/agent/tasks/${task.id}`, { status: nextStatus })
    },
    onSuccess: (body: any, task) => {
      toast.success(body?.message || (task.status === 'completed' ? 'Task reopened' : 'Task completed'))
      invalidate()
    },
    onError: () => {
      toast.error('Failed to update task')
    },
  })

  const deleteTask = useMutation({
    mutationFn: async (task: AgentTask) => {
      return api.put<any>(`/agent/tasks/${task.id}`, { status: 'cancelled' })
    },
    onSuccess: () => {
      toast.success('Task cancelled')
      setShowDetailModal(false)
      setDetailTask(null)
      invalidate()
    },
    onError: () => {
      toast.error('Failed to cancel task')
    },
  })

  const tasks: AgentTask[] = useMemo(() => data?.data?.tasks ?? [], [data])

  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((t) => {
          if (filterStatus !== 'all' && t.status !== filterStatus) return false
          if (filterPriority !== 'all' && t.priority !== filterPriority) return false
          if (search.trim()) {
            const q = search.trim().toLowerCase()
            const haystack = `${t.title || ''} ${t.description || ''}`.toLowerCase()
            if (!haystack.includes(q)) return false
          }
          return true
        })
        .sort((a, b) => {
          switch (sortBy) {
            case 'due_desc':
              return new Date(b.due_date || 0).getTime() - new Date(a.due_date || 0).getTime()
            case 'created_desc':
              return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            case 'priority_desc':
              return (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0)
            case 'due_asc':
            default:
              return new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()
          }
        }),
    [tasks, filterStatus, filterPriority, search, sortBy]
  )

  if (isLoading) return <TasksSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load tasks</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4" leftIcon={<RefreshCw className="w-5 h-5" />}>Retry</Button>
      </div>
    )
  }

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
        <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={tasks.filter((t) => t.status === 'pending').length} color="eventra-amber" />
        <StatCard icon={<RefreshCw className="w-6 h-6" />} label="In Progress" value={tasks.filter((t) => t.status === 'in_progress').length} color="eventra-cyan" />
        <StatCard icon={<CheckSquare className="w-6 h-6" />} label="Completed" value={tasks.filter((t) => t.status === 'completed').length} color="eventra-green" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16 z-10">
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
                {status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <Select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'normal', label: 'Normal' },
                { value: 'low', label: 'Low' },
              ]}
              className="w-40"
              aria-label="Filter by priority"
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              options={[
                { value: 'due_asc', label: 'Due Date (Soonest)' },
                { value: 'due_desc', label: 'Due Date (Latest)' },
                { value: 'created_desc', label: 'Newest First' },
                { value: 'priority_desc', label: 'Highest Priority' },
              ]}
              className="w-48"
              aria-label="Sort by"
            />
            <div className="w-56">
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <EmptyTasksState onCreate={() => setShowCreateModal(true)} hasFilters={filterStatus !== 'all' || filterPriority !== 'all' || !!search.trim()} />
        ) : (
          <>
            <p className="text-body-md text-eventra-slate-600">
              Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> tasks
            </p>
            <div className="space-y-4">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 10) * 0.03 }}
                >
                  <TaskCard
                    task={task}
                    isToggling={toggleStatus.isPending}
                    onView={() => { setDetailTask(task); setShowDetailModal(true); }}
                    onToggle={() => toggleStatus.mutate(task)}
                    onEdit={() => setEditTask(task)}
                  />
                </motion.div>
              ))}
            </div>
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
        <TaskForm
          onSubmit={(payload) => createTask.mutate(payload)}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={createTask.isPending}
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        title="Edit Task"
        size="lg"
      >
        {editTask && (
          <TaskForm
            initial={editTask}
            onSubmit={(payload) => updateTask.mutate({ id: editTask.id, payload })}
            onCancel={() => setEditTask(null)}
            isSubmitting={updateTask.isPending}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setDetailTask(null); }}
        title={detailTask ? `Task: ${detailTask.title}` : 'Task Details'}
        size="lg"
      >
        {detailTask && (
          <TaskDetailModal
            task={detailTask}
            isToggling={toggleStatus.isPending}
            onToggle={() => toggleStatus.mutate(detailTask)}
            onCancelTask={() => deleteTask.mutate(detailTask)}
            isCancelling={deleteTask.isPending}
          />
        )}
      </Modal>
    </div>
  )
}

function TaskCard({ task, isToggling, onView, onToggle, onEdit }: {
  task: AgentTask
  isToggling: boolean
  onView: () => void
  onToggle: () => void
  onEdit: () => void
}) {
  const isOverdue = !!task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'
  const isDone = task.status === 'completed'

  return (
    <Card variant="interactive" onClick={onView} padding="md" className={cn(isDone && 'bg-eventra-green-50')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={isDone}
              onClick={(e) => e.stopPropagation()}
              onChange={onToggle}
              disabled={isToggling}
              className="form-checkbox"
              aria-label={isDone ? 'Reopen task' : 'Complete task'}
            />
            <h3 className={cn('font-semibold text-eventra-navy-900', isDone && 'line-through text-eventra-slate-400')}>{task.title}</h3>
            <Badge variant={priorityVariant(task.priority)} size="sm">{task.priority}</Badge>
            <Badge variant={statusVariant(task.status)} size="sm">{String(task.status || '').replace(/_/g, ' ')}</Badge>
          </div>
          {task.description && <p className="text-body-sm text-eventra-slate-600 mb-3 line-clamp-2">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-4 text-body-sm text-eventra-slate-600">
            {task.due_date && (
              <span className={cn('flex items-center gap-1', isOverdue && 'text-eventra-red-600 font-medium')}>
                <Calendar className="w-4 h-4" />
                Due: {formatDate(task.due_date)}
                {isOverdue && ' (Overdue)'}
              </span>
            )}
            {task.customer_id && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Customer #{task.customer_id}
              </span>
            )}
            {task.booking_id && (
              <span className="flex items-center gap-1">
                <ClipboardList className="w-4 h-4" />
                Booking #{task.booking_id}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={isDone ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            disabled={isToggling}
          >
            {isDone ? 'Reopen' : 'Complete'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Edit2 className="w-4 h-4" />}
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            Edit
          </Button>
        </div>
      </div>
    </Card>
  )
}

function EmptyTasksState({ onCreate, hasFilters }: { onCreate: () => void; hasFilters?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <CheckSquare className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No tasks found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        {hasFilters ? 'No tasks match your current filters.' : 'Create your first task to start managing your to-dos.'}
      </p>
      <Button onClick={onCreate} leftIcon={<Plus className="w-5 h-5" />}>
        Create Your First Task
      </Button>
    </motion.div>
  )
}

function TasksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-44 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-eventra-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="outlined" padding="md" className="animate-pulse h-28" />
        ))}
      </div>
    </div>
  )
}

interface TaskFormPayload {
  title: string
  description?: string
  due_date: string
  priority: string
}

function TaskForm({ initial, onSubmit, onCancel, isSubmitting, submitLabel = 'Create Task' }: {
  initial?: AgentTask
  onSubmit: (payload: TaskFormPayload) => void
  onCancel: () => void
  isSubmitting: boolean
  submitLabel?: string
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [dueDate, setDueDate] = useState(initial?.due_date ? String(initial.due_date).slice(0, 10) : '')
  const [priority, setPriority] = useState(initial?.priority || 'normal')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a task title')
      return
    }
    if (!dueDate) {
      toast.error('Please choose a due date')
      return
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: new Date(`${dueDate}T23:59:59`).toISOString(),
      priority,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
      />
      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Task description"
        rows={3}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={PRIORITY_OPTIONS}
        />
      </div>
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
      </div>
    </form>
  )
}

function TaskDetailModal({ task, isToggling, onToggle, onCancelTask, isCancelling }: {
  task: AgentTask
  isToggling: boolean
  onToggle: () => void
  onCancelTask: () => void
  isCancelling: boolean
}) {
  const isOverdue = !!task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{task.title}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={priorityVariant(task.priority)} size="sm">{task.priority}</Badge>
          <Badge variant={statusVariant(task.status)} size="sm">{String(task.status || '').replace(/_/g, ' ')}</Badge>
        </div>
      </div>

      {task.description && (
        <div className="p-4 bg-eventra-slate-50 rounded-xl">
          <p className="text-body-md text-eventra-slate-700">{task.description}</p>
        </div>
      )}

      <div className="space-y-3 text-body-sm">
        {task.due_date && (
          <div className={cn('flex items-center justify-between', isOverdue && 'text-eventra-red-600')}>
            <span className="text-eventra-slate-600">Due Date</span>
            <span className="font-medium flex items-center gap-1">
              <AlertTriangle className={cn('w-4 h-4', !isOverdue && 'hidden')} />
              {formatDate(task.due_date)}{isOverdue && ' (Overdue)'}
            </span>
          </div>
        )}
        {task.customer_id && (
          <div className="flex items-center justify-between">
            <span className="text-eventra-slate-600">Customer</span>
            <span className="font-medium text-eventra-navy-900">#{task.customer_id}</span>
          </div>
        )}
        {task.booking_id && (
          <div className="flex items-center justify-between">
            <span className="text-eventra-slate-600">Booking</span>
            <span className="font-medium text-eventra-navy-900">#{task.booking_id}</span>
          </div>
        )}
        {task.created_at && (
          <div className="flex items-center justify-between">
            <span className="text-eventra-slate-600">Created</span>
            <span className="font-medium text-eventra-navy-900">{formatDate(task.created_at)}</span>
          </div>
        )}
        {task.completed_at && (
          <div className="flex items-center justify-between">
            <span className="text-eventra-slate-600">Completed</span>
            <span className="font-medium text-eventra-green-600">{formatDate(task.completed_at)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-eventra-slate-200">
        <Button
          className="flex-1"
          leftIcon={task.status === 'completed' ? <Square className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
          onClick={onToggle}
          loading={isToggling}
          disabled={task.status === 'cancelled'}
        >
          {task.status === 'completed' ? 'Reopen Task' : 'Mark Completed'}
        </Button>
        {task.status !== 'cancelled' && task.status !== 'completed' && (
          <Button
            variant="outline"
            className="flex-1 text-eventra-red-600 border-eventra-red-300 hover:bg-eventra-red-50"
            leftIcon={<Trash2 className="w-5 h-5" />}
            onClick={onCancelTask}
            loading={isCancelling}
          >
            Cancel Task
          </Button>
        )}
      </div>

      {task.status === 'cancelled' && (
        <div className="alert alert-warning text-body-sm">
          This task was cancelled. Reopen it to continue working.
        </div>
      )}

      <div className="flex items-center gap-2 text-body-xs text-eventra-slate-500">
        <FileText className="w-4 h-4" />
        Task IDs link to customers and bookings in your workspace.
      </div>
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
