import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Users,
  Eye,
  Search,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatDateTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'

interface AuditLog {
  id: number
  uuid?: string
  correlation_id?: string
  actor_id?: number | null
  actor_type?: string
  actor_role?: string
  actor_ip?: string | null
  actor_user_agent?: string | null
  action?: string
  entity_type?: string
  entity_id?: number | null
  entity_reference?: string | null
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  changed_attributes?: string[] | null
  description?: string | null
  metadata?: Record<string, unknown> | null
  severity?: string
  created_at?: string
}

const PAGE_SIZE = 50

const SEVERITY_FILTERS = ['all', 'info', 'warning', 'critical'] as const

const RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

const SEVERITY_BADGE: Record<string, string> = {
  info: 'badge-primary',
  warning: 'badge-warning',
  critical: 'badge-danger',
}

const RANGE_DAYS: Record<string, number> = {
  today: 1,
  week: 7,
  month: 30,
}

export function AdminAuditLogs() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<(typeof SEVERITY_FILTERS)[number]>('all')
  const [filterAction, setFilterAction] = useState('all')
  const [filterEntity, setFilterEntity] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-audit-logs', search, filterSeverity, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterSeverity !== 'all') params.severity = filterSeverity
      const body = await api.get<any>('/admin/audit-logs', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const logs: AuditLog[] = data?.data?.logs ?? []
  const actions: string[] = data?.data?.actions ?? []
  const entities: string[] = data?.data?.entities ?? []
  const totalCount: number = data?.data?.total_count ?? logs.length
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const filteredLogs = useMemo(() => {
    let list = [...logs]
    if (filterAction !== 'all') {
      list = list.filter(log => log.action === filterAction)
    }
    if (filterEntity !== 'all') {
      list = list.filter(log => log.entity_type === filterEntity)
    }
    if (dateRange !== 'all') {
      const days = RANGE_DAYS[dateRange] ?? 0
      if (days > 0) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).getTime()
        list = list.filter(log => {
          if (!log.created_at) return false
          const t = new Date(log.created_at).getTime()
          return !Number.isNaN(t) && t >= cutoff
        })
      }
    }
    return list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  }, [logs, filterAction, filterEntity, dateRange])

  const actionOptions = [
    { value: 'all', label: 'All Actions' },
    ...actions.map(a => ({ value: a, label: String(a).replace(/_/g, ' ') })),
  ]

  const entityOptions = [
    { value: 'all', label: 'All Entities' },
    ...entities.map(e => ({ value: e, label: String(e).replace(/_/g, ' ') })),
  ]

  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader />
        <TableSkeleton rows={10} columns={7} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader />

      {isError ? (
        <div className="alert alert-danger text-center py-12">
          <p className="font-medium">Failed to load audit logs</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<Activity className="w-5 h-5" />} label="Total Events" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Info" value={logs.filter(l => l.severity === 'info').length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Warnings" value={logs.filter(l => l.severity === 'warning').length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Critical" value={logs.filter(l => l.severity === 'critical').length} iconClass="bg-eventra-red-100 text-eventra-red-600" />
            <StatCard icon={<Users className="w-5 h-5" />} label="Unique Actors" value={new Set(logs.map(l => l.actor_id ?? 'anonymous')).size} iconClass="bg-eventra-cyan-100 text-eventra-cyan-600" />
          </div>

          {/* Filters */}
          <Card variant="elevated" padding="md">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {SEVERITY_FILTERS.map((severity) => (
                  <button
                    key={severity}
                    onClick={() => { setFilterSeverity(severity); setPage(1) }}
                    className={cn(
                      'px-4 py-2 rounded-xl text-body-sm font-medium transition-all',
                      filterSeverity === severity
                        ? 'bg-eventra-navy-900 text-white shadow-card'
                        : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                    )}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
                <Select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  options={actionOptions}
                  aria-label="Filter by action"
                  className="w-40"
                />
                <Select
                  value={filterEntity}
                  onChange={(e) => setFilterEntity(e.target.value)}
                  options={entityOptions}
                  aria-label="Filter by entity"
                  className="w-40"
                />
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  options={RANGE_OPTIONS}
                  aria-label="Time range"
                  className="w-32"
                />
                <Input
                  placeholder="Search logs..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="max-w-xs"
                />
              </div>
            </div>
          </Card>

          {/* Audit Logs Table */}
          {filteredLogs.length === 0 ? (
            <EmptyAuditLogsState />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{filteredLogs.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> audit entries
                  {isFetching && <Loader2 className="inline w-4 h-4 ml-2 animate-spin text-eventra-slate-400" />}
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Reference</th>
                      <th className="text-center">Severity</th>
                      <th className="text-center">IP</th>
                      <th className="text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <p className="text-body-sm text-eventra-slate-600">{log.created_at ? formatDateTime(log.created_at) : '—'}</p>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-eventra-navy-900 capitalize">{log.actor_type || 'system'}{log.actor_id != null ? ` #${log.actor_id}` : ''}</p>
                            <p className="text-body-xs text-eventra-slate-500">{log.actor_role || 'Unknown role'}</p>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-body-sm text-eventra-navy-900">{log.action || '—'}</span>
                        </td>
                        <td>
                          <span className="text-body-sm text-eventra-slate-600">{log.entity_type || '—'}{log.entity_id != null ? ` #${log.entity_id}` : ''}</span>
                        </td>
                        <td>
                          {log.entity_reference ? (
                            <span className="font-mono text-body-sm text-eventra-navy-900">{log.entity_reference}</span>
                          ) : (
                            <span className="text-body-xs text-eventra-slate-400">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className={cn('badge', SEVERITY_BADGE[String(log.severity)] || 'badge-neutral')}>
                            {String(log.severity || 'info').toUpperCase()}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="font-mono text-body-xs text-eventra-slate-500">{log.actor_ip || '—'}</span>
                        </td>
                        <td className="text-center">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedLog(log); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />} aria-label="View log details">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {/* Audit Log Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedLog(null); }}
        title={selectedLog?.action ? `Audit: ${selectedLog.action.replace(/_/g, ' ')}` : 'Audit Log Details'}
        size="lg"
      >
        {selectedLog && <AuditLogDetail log={selectedLog} />}
      </Modal>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Audit Logs</h1>
        <p className="text-eventra-slate-600 mt-1">Track all system activities and changes</p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, iconClass }: { icon: React.ReactNode; label: string; value: string | number; iconClass?: string }) {
  return (
    <Card variant="elevated" padding="lg" className="text-center">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3', iconClass || 'bg-eventra-blue-100 text-eventra-blue-600')}>
        {icon}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-lg font-display font-bold text-eventra-navy-900 mt-1">{value}</p>
    </Card>
  )
}

function EmptyAuditLogsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Activity className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No audit logs found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No audit log entries match your current filters.
      </p>
    </motion.div>
  )
}

function AuditLogDetail({ log }: { log: AuditLog }) {
  const changedAttributes: string[] = log.changed_attributes ?? []
  const hasOldNew = log.old_values != null || log.new_values != null

  return (
    <div className="space-y-6">
      {log.description && (
        <div className="alert alert-info text-body-sm">{log.description}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <DetailStat label="Severity" value={String(log.severity || 'info').toUpperCase()} />
        <DetailStat label="Timestamp" value={log.created_at ? formatDateTime(log.created_at) : '—'} />
        <DetailStat label="Actor" value={`${log.actor_type || 'system'}${log.actor_id != null ? ` #${log.actor_id}` : ''}`} />
        <DetailStat label="Actor Role" value={log.actor_role || '—'} />
        <DetailStat label="Entity" value={`${log.entity_type || '—'}${log.entity_id != null ? ` #${log.entity_id}` : ''}`} />
        <DetailStat label="Reference" value={log.entity_reference || '—'} />
        <DetailStat label="IP Address" value={log.actor_ip || '—'} />
        <DetailStat label="Correlation ID" value={log.correlation_id || '—'} />
      </div>

      {log.actor_user_agent && (
        <div>
          <h4 className="font-semibold text-eventra-navy-900 mb-2">User Agent</h4>
          <p className="text-body-xs text-eventra-slate-500 break-all font-mono">{log.actor_user_agent}</p>
        </div>
      )}

      {changedAttributes.length > 0 && (
        <div>
          <h4 className="font-semibold text-eventra-navy-900 mb-2">Changed Attributes</h4>
          <div className="flex flex-wrap gap-2">
            {changedAttributes.map(attr => (
              <span key={attr} className="tag">{attr.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      {hasOldNew && (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-eventra-navy-900 mb-2">Old Values</h4>
            <pre className="text-body-xs font-mono bg-eventra-slate-50 rounded-xl p-3 overflow-x-auto max-h-48">
              {log.old_values ? JSON.stringify(log.old_values, null, 2) : '—'}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-eventra-navy-900 mb-2">New Values</h4>
            <pre className="text-body-xs font-mono bg-eventra-slate-50 rounded-xl p-3 overflow-x-auto max-h-48">
              {log.new_values ? JSON.stringify(log.new_values, null, 2) : '—'}
            </pre>
          </div>
        </div>
      )}

      {log.metadata != null && Object.keys(log.metadata).length > 0 && (
        <div>
          <h4 className="font-semibold text-eventra-navy-900 mb-2">Metadata</h4>
          <pre className="text-body-xs font-mono bg-eventra-slate-50 rounded-xl p-3 overflow-x-auto max-h-48">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-eventra-slate-50 p-3">
      <p className="text-body-xs text-eventra-slate-500 mb-1">{label}</p>
      <p className="font-semibold text-eventra-navy-900 break-all">{value}</p>
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Previous
      </Button>
      <span className="text-body-sm font-medium text-eventra-navy-900 px-4">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next
      </Button>
    </div>
  )
}
