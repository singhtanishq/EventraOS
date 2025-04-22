import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2, FileText, FileTextIcon2, Search, MoreVertical as MoreVerticalIcon, Filter as FilterIcon2, Clock, Bell, BellOff, AlertTriangle, ShieldAlert, UserCheck, UserX, Activity as ActivityIcon2, LayoutDashboard, Suitcase, TrendingUp, BarChart3 as BarChart3Icon2, PieChart, Award, Trophy, Crown, Medal, Settings as SettingsIcon, Building as BuildingIcon, UserCog as UserCogIcon, TicketPercent, RotateCcw as RotateCcwIcon3, CreditCard as CreditCardIcon2, BarChart3 as BarChart3Icon3, Activity as ActivityIcon3, FileText as FileTextIcon3, ArrowRight as ArrowRightIcon, ArrowLeft as ArrowLeftIcon, RefreshCw as RefreshCwIcon, UserCog as UserCogIcon2, Building as BuildingIcon2, UserCog as UserCogIcon3, TicketPercent as TicketPercentIcon, RotateCcw as RotateCcwIcon4, CreditCard as CreditCardIcon3, BarChart3 as BarChart3Icon4, Activity as ActivityIcon4, FileText as FileTextIcon4, ArrowRight as ArrowRightIcon2, ArrowLeft as ArrowLeftIcon2, RefreshCw as RefreshCwIcon2, UserCog as UserCogIcon4, Building as BuildingIcon3, UserCog as UserCogIcon5, TicketPercent as TicketPercentIcon2, RotateCcw as RotateCcwIcon5, CreditCard as CreditCardIcon4, BarChart3 as BarChart3Icon5, Activity as ActivityIcon5, FileText as FileTextIcon5, ArrowRight as ArrowRightIcon3, ArrowLeft as ArrowLeftIcon3, RefreshCw as RefreshCwIcon3, UserCog as UserCogIcon6, Building as BuildingIcon4, UserCog as UserCogIcon7, TicketPercent as TicketPercentIcon3, RotateCcw as RotateCcwIcon6, CreditCard as CreditCardIcon5, BarChart3 as BarChart3Icon6, Activity as ActivityIcon6, FileText as FileTextIcon6, ArrowRight as ArrowRightIcon4, ArrowLeft as ArrowLeftIcon4, RefreshCw as RefreshCwIcon4, UserCog as UserCogIcon8, Building as BuildingIcon5, UserCog as UserCogIcon9, TicketPercent as TicketPercentIcon4, RotateCcw as RotateCcwIcon7, CreditCard as CreditCardIcon6, BarChart3 as BarChart3Icon7, Activity as ActivityIcon7, FileText as FileTextIcon7, ArrowRight as ArrowRightIcon5, ArrowLeft as ArrowLeftIcon5, RefreshCw as RefreshCwIcon5, UserCog as UserCogIcon10, Building as BuildingIcon6, UserCog as UserCogIcon11, TicketPercent as TicketPercentIcon5, RotateCcw as RotateCcwIcon8, CreditCard as CreditCardIcon7, BarChart3 as BarChart3Icon8, Activity as ActivityIcon8, FileText as FileTextIcon8, ArrowRight as ArrowRightIcon6, ArrowLeft as ArrowLeftIcon6, RefreshCw as RefreshCwIcon6, UserCog as UserCogIcon12, Building as BuildingIcon7, UserCog as UserCogIcon13, TicketPercent as TicketPercentIcon6, RotateCcw as RotateCcwIcon9, CreditCard as CreditCardIcon8, BarChart3 as BarChart3Icon9, Activity as ActivityIcon9, FileText as FileTextIcon9, ArrowRight as ArrowRightIcon7, ArrowLeft as ArrowLeftIcon7, RefreshCw as RefreshCwIcon7, UserCog as UserCogIcon14, Building as BuildingIcon8, UserCog as UserCogIcon15, TicketPercent as TicketPercentIcon7, RotateCcw as RotateCcwIcon10, CreditCard as CreditCardIcon9, BarChart3 as BarChart3Icon10, Activity as ActivityIcon10, FileText as FileTextIcon10 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AuditLog {
  id: number
  uuid: string
  correlation_id?: string
  actor_id?: number
  actor_type: string
  actor_role?: string
  actor_ip?: string
  actor_user_agent?: string
  action: string
  entity_type: string
  entity_id?: number
  entity_reference?: string
  old_values?: any
  new_values?: any
  changed_attributes?: string[]
  description?: string
  metadata?: any
  severity: 'info' | 'warning' | 'critical'
  created_at: string
}

export function AdminAuditLogs() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc'>('created_desc')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('week')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', search, filterSeverity, filterAction, filterEntity, sortBy, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterSeverity !== 'all') params.set('severity', filterSeverity)
      if (filterAction !== 'all') params.set('action', filterAction)
      if (filterEntity !== 'all') params.set('entity', filterEntity)
      params.set('sort', sortBy)
      params.set('range', dateRange)
      const response = await api.get('/admin/audit-logs', { params })
      return response.data
    },
  })

  const logs = data?.data?.logs || []
  const actions = data?.data?.actions || []
  const entities = data?.data?.entities || []

  const filteredLogs = logs.filter(log => {
    if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false
    if (filterAction !== 'all' && log.action !== filterAction) return false
    if (filterEntity !== 'all' && log.entity_type !== filterEntity) return false
    return true
  })

  if (isLoading) return <AdminAuditLogsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Audit Logs</h1>
          <p className="text-eventra-slate-600 mt-1">Track all system activities and changes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {}} leftIcon={<Download className="w-5 h-5" />}>
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<ActivityIcon2 className="w-6 h-6" />} label="Total Events" value={logs.length.toLocaleString()} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Info" value={logs.filter(l => l.severity === 'info').length} color="eventra-green" />
        <StatCard icon={<AlertTriangle className="w-6 h-6" />} label="Warnings" value={logs.filter(l => l.severity === 'warning').length} color="eventra-amber" />
        <StatCard icon={<AlertCircle className="w-6 h-6" />} label="Critical" value={logs.filter(l => l.severity === 'critical').length} color="eventra-red" />
        <StatCard icon={<Users className="w-6 h-6" />} label="Unique Actors" value={new Set(logs.map(l => l.actor_id)).size} color="eventra-purple" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'info', 'warning', 'critical'] as const).map((severity) => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
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
              onValueChange={setFilterAction}
              options={[
                { value: 'all', label: 'All Actions' },
                ...actions.map(a => ({ value: a, label: a.replace('_', ' ') })),
              ]}
              className="w-44"
              placeholder="Filter action"
            />
            <Select
              value={filterEntity}
              onValueChange={setFilterEntity}
              options={[
                { value: 'all', label: 'All Entities' },
                ...entities.map(e => ({ value: e, label: e.replace('_', ' ') })),
              ]}
              className="w-44"
              placeholder="Filter entity"
            />
            <Select
              value={dateRange}
              onValueChange={setDateRange}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'quarter', label: 'This Quarter' },
                { value: 'year', label: 'This Year' },
              ]}
              className="w-32"
              placeholder="Time range"
            />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="w-64"
            />
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminAuditLogsSkeleton />
        ) : filteredLogs.length === 0 ? (
          <EmptyAuditLogsState />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> audit entries
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actor</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Entity</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Severity</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">IP</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={log.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-body-sm text-eventra-slate-600">{formatDateTime(log.created_at)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-medium text-eventra-navy-900">{log.actor_type} #{log.actor_id}</p>
                          <p className="text-body-xs text-eventra-slate-500">{log.actor_role || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-body-sm text-eventra-navy-900">{log.action}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-body-sm text-eventra-slate-600">{log.entity_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        {log.entity_reference && (
                          <span className="font-mono text-body-sm text-eventra-navy-900">{log.entity_reference}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge px-3 py-1 text-body-xs',
                          log.severity === 'critical' ? 'bg-eventra-red-100 text-eventra-red-700' :
                          log.severity === 'warning' ? 'bg-eventra-amber-100 text-eventra-amber-700' :
                          'bg-eventra-blue-100 text-eventra-blue-700'
                        )}>
                          {log.severity.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-body-xs text-eventra-slate-500">{log.actor_ip || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="xs" onClick={() => {}}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(logs.length / 20)} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AdminAuditLogsSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-eventra-slate-200">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-32 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyAuditLogsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <ActivityIcon2 className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No audit logs found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No audit log entries match your current filters.
      </p>
    </motion.div>
  )
}