import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2, Megaphone, Gift, Calendar, Clock, Tag } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminPromotion {
  id: number
  uuid: string
  name: string
  slug: string
  description: string
  type: string
  value: number
  currency: string
  applicable_to: string
  service_restrictions: any
  destination_restrictions: any
  customer_restrictions: any
  min_booking_value: number
  max_discount_amount: number
  usage_limit_total: number
  usage_limit_per_customer: number
  used_count: number
  valid_from: string
  valid_to: string
  can_stack: boolean
  requires_promo_code: boolean
  promo_code: string
  is_auto_apply: boolean
  priority: number
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export function AdminPromotions() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'featured'>('all')
  const [filterType, setFilterType] = useState<'all' | 'percentage_discount' | 'fixed_discount' | 'cashback' | 'loyalty_bonus' | 'free_addon' | 'upgrade' | 'early_bird' | 'last_minute' | 'group_discount'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name' | 'value'>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState<AdminPromotion | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promotions', search, filterStatus, filterType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('sort', sortBy)
      const response = await api.get('/admin/promotions', { params })
      return response.data
    },
  )

  const promotions = data?.data?.promotions || []

  const filteredPromotions = promotions.filter(p => {
    if (filterStatus === 'active' && !p.is_active) return false
    if (filterStatus === 'inactive' && p.is_active) return false
    if (filterStatus === 'featured' && !p.is_featured) return false
    if (filterType !== 'all' && p.type !== filterType) return false
    return true
  })

  if (isLoading) return <AdminPromotionsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Promotions</h1>
          <p className="text-eventra-slate-600 mt-1">Manage promotional campaigns and discount codes</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Create Promotion
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<TicketPercent className="w-6 h-6" />} label="Total Promotions" value={promotions.length} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Active" value={promotions.filter(p => p.is_active).length} color="eventra-green" />
        <StatCard icon={<Star className="w-6 h-6" />} label="Featured" value={promotions.filter(p => p.is_featured).length} color="eventra-amber" />
        <StatCard icon={<Gift className="w-6 h-6" />} label="Total Usage" value={promotions.reduce((sum, p) => sum + (p.used_count || 0), 0)} color="eventra-purple" />
        <StatCard icon={<Gift className="w-6 h-6" />} label="Total Discount Given" value={formatCurrency(promotions.reduce((sum, p) => sum + (p.used_count || 0) * (p.value || 0), 0), 'INR')} color="eventra-green" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'inactive', 'featured'] as const).map((status) => (
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
                { value: 'percentage_discount', label: '% Discount' },
                { value: 'fixed_discount', label: 'Fixed Discount' },
                { value: 'cashback', label: 'Cashback' },
                { value: 'loyalty_bonus', label: 'Loyalty Bonus' },
                { value: 'free_addon', label: 'Free Add-on' },
                { value: 'upgrade', label: 'Upgrade' },
                { value: 'early_bird', label: 'Early Bird' },
                { value: 'last_minute', label: 'Last Minute' },
                { value: 'group_discount', label: 'Group Discount' },
              ]}
              className="w-48"
              placeholder="Filter by type"
            />
            <Input
              placeholder="Search promotions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="w-64"
            />
            <Select
              value={sortBy}
              onValueChange={setSortBy}
              options={[
                { value: 'created_desc', label: 'Newest First' },
                { value: 'created_asc', label: 'Oldest First' },
                { value: 'name', label: 'Name A-Z' },
                { value: 'value', label: 'Discount Value' },
              ]}
              className="w-48"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Promotions Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminPromotionsSkeleton />
        ) : filteredPromotions.length === 0 ? (
          <EmptyPromotionsState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredPromotions.length}</strong> of <strong>{promotions.length}</strong> promotions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Promotion</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-right text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Value</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Applicable To</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Validity</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Usage</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromotions.map((promo, index) => (
                    <tr key={promo.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-eventra-navy-900">{promo.name}</p>
                          <p className="text-body-xs text-eventra-slate-500 font-mono">{promo.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('badge capitalize',
                          promo.type === 'percentage_discount' ? 'badge-blue' :
                          promo.type === 'fixed_discount' ? 'badge-green' :
                          promo.type === 'cashback' ? 'badge-amber' :
                          promo.type === 'loyalty_bonus' ? 'badge-purple' :
                          promo.type === 'free_addon' ? 'badge-teal' :
                          promo.type === 'upgrade' ? 'badge-purple' :
                          promo.type === 'early_bird' ? 'badge-blue' :
                          promo.type === 'last_minute' ? 'badge-red' :
                          promo.type === 'group_discount' ? 'badge-teal' : 'badge-neutral'
                        )}>
                          {promo.type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-eventra-navy-900">
                          {promo.type === 'percentage_discount' ? `${promo.value}%` : formatCurrency(promo.value, promo.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-neutral capitalize">{promo.applicable_to.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-body-sm text-eventra-slate-600">
                          <p>{formatDate(promo.valid_from)}</p>
                          <p className="text-eventra-slate-500">to {formatDate(promo.valid_to)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="font-medium text-eventra-navy-900">{promo.used_count}/{promo.usage_limit_total || '∞'}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Badge className={cn('badge',
                            promo.is_active ? 'badge-success' : 'badge-neutral'
                          )}>
                            {promo.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {promo.is_featured && <Badge className="badge-amber ml-1">Featured</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {promo.promo_code ? (
                          <span className="font-mono text-body-sm text-eventra-navy-900">{promo.promo_code}</span>
                        ) : (
                          <span className="text-body-xs text-eventra-slate-400">Auto-apply</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedPromo(promo); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                            View
                          </Button>
                          <Button variant="ghost" size="xs" className="text-eventra-red-600 hover:bg-eventra-red-50" onClick={() => {}}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {promotions.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(promotions.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Create Promotion Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Promotion"
        size="xl"
      >
        <CreatePromotionForm onSubmit={() => { setShowCreateModal(false); toast.success('Promotion created') }} />
      </Modal>

      {/* Promotion Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedPromo(null); }}
        title={selectedPromo ? selectedPromo.name : 'Promotion Details'}
        size="xl"
      >
        {selectedPromo && <PromotionDetailModal promo={selectedPromo} />}
      </Modal>
    </div>
  )
}

function AdminPromotionsSkeleton() {
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
              <th className="px-4 py-3">Promotion</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Applicable To</th>
              <th className="px-4 py-3">Validity</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
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

function EmptyPromotionsState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <TicketPercent className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No promotions yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Create your first promotional campaign to attract more customers.
      </p>
      <Button onClick={onAdd} leftIcon={<Plus className="w-5 h-5" />}>
        Create Promotion
      </Button>
    </motion.div>
  )
}