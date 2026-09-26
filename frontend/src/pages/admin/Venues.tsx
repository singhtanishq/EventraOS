import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MapPin,
  CheckCircle2,
  Star,
  Building2,
  Users,
  Search,
  Plus,
  Trophy,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminVenue {
  id: number
  name?: string
  slug?: string
  description?: string
  address?: string
  total_capacity?: number
  venue_types?: string[] | null
  has_indoor?: boolean
  has_outdoor?: boolean
  is_active?: boolean
  is_featured?: boolean
  is_demo?: boolean
  rating?: number | string | null
  review_count?: number
  images?: string[] | null
  city?: { name?: string; country?: { name?: string } } | null
  created_at?: string
}

const STATUS_FILTERS = ['all', 'active', 'inactive', 'featured', 'demo'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'conference', label: 'Conference' },
  { value: 'party', label: 'Party' },
  { value: 'concert', label: 'Concert' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'seminar', label: 'Seminar' },
]

const PAGE_SIZE = 20

export function AdminVenues() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterType, setFilterType] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<AdminVenue | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [venueToDeactivate, setVenueToDeactivate] = useState<AdminVenue | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-venues', search, filterStatus, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      const body = await api.get<any>('/admin/venues', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const venues: AdminVenue[] = data?.data?.venues ?? []
  const totalCount: number = data?.data?.total_count ?? 0
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const filteredVenues = useMemo(() => {
    if (filterType === 'all') return venues
    return venues.filter(v => Array.isArray(v.venue_types) && v.venue_types.includes(filterType))
  }, [venues, filterType])

  const handleDeactivate = async () => {
    if (!venueToDeactivate) return
    setIsDeactivating(true)
    try {
      const body = await api.delete<any>(`/admin/venues/${venueToDeactivate.id}`)
      if (body.success) {
        toast.success(body.message || 'Venue deactivated')
        queryClient.invalidateQueries({ queryKey: ['admin-venues'] })
      } else {
        toast.error(body.message || 'Failed to deactivate venue')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate venue')
    } finally {
      setIsDeactivating(false)
      setVenueToDeactivate(null)
    }
  }

  if (isLoading && venues.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader onAdd={() => setShowCreateModal(true)} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} variant="elevated" className="animate-pulse h-80" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader onAdd={() => setShowCreateModal(true)} />

      {isError ? (
        <div className="alert alert-danger text-center py-12">
          <p className="font-medium">Failed to load venues</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard icon={<MapPin className="w-5 h-5" />} label="Total Venues" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Active" value={venues.filter(v => v.is_active).length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<Star className="w-5 h-5" />} label="Featured" value={venues.filter(v => v.is_featured).length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<Building2 className="w-5 h-5" />} label="Indoor" value={venues.filter(v => v.has_indoor).length} iconClass="bg-eventra-cyan-100 text-eventra-cyan-600" />
            <StatCard icon={<Trophy className="w-5 h-5" />} label="Wedding" value={venues.filter(v => Array.isArray(v.venue_types) && v.venue_types.includes('wedding')).length} iconClass="bg-eventra-red-100 text-eventra-red-600" />
            <StatCard icon={<Users className="w-5 h-5" />} label="Total Capacity" value={venues.reduce((sum, v) => sum + (v.total_capacity || 0), 0).toLocaleString()} iconClass="bg-eventra-green-100 text-eventra-green-600" />
          </div>

          {/* Filters */}
          <Card variant="elevated" padding="md">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    onClick={() => { setFilterStatus(status); setPage(1) }}
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
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input form-select w-40"
                  aria-label="Filter by venue type"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <Input
                  placeholder="Search venues..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="max-w-xs"
                />
              </div>
            </div>
          </Card>

          {/* Venues Grid */}
          {filteredVenues.length === 0 ? (
            <EmptyVenuesState onAdd={() => setShowCreateModal(true)} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{filteredVenues.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> venues
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredVenues.map((venue, index) => (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  >
                    <VenueCard
                      venue={venue}
                      onView={() => { setSelectedVenue(venue); setShowDetailModal(true); }}
                      onDeactivate={() => setVenueToDeactivate(venue)}
                    />
                  </motion.div>
                ))}
              </motion.div>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {/* Create Venue Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Venue"
        size="lg"
      >
        <CreateVenueForm
          onSubmit={async (payload) => {
            const body = await api.post<any>('/admin/venues', payload)
            if (!body.success) throw new Error(body.message || 'Failed to create venue')
            toast.success(body.message || 'Venue created')
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: ['admin-venues'] })
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Venue Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedVenue(null); }}
        title={selectedVenue?.name || 'Venue Details'}
        size="xl"
      >
        {selectedVenue && <VenueDetailModal venue={selectedVenue} />}
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={!!venueToDeactivate}
        onClose={() => setVenueToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Venue"
        message={`Deactivate ${venueToDeactivate?.name || 'this venue'}? It will no longer be bookable.`}
        confirmText="Deactivate"
        variant="danger"
        loading={isDeactivating}
      />
    </div>
  )
}

function PageHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Venues</h1>
        <p className="text-eventra-slate-600 mt-1">Manage event venues and halls</p>
      </div>
      <Button onClick={onAdd} leftIcon={<Plus className="w-5 h-5" />}>
        Add Venue
      </Button>
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

function VenueCard({ venue, onView, onDeactivate }: { venue: AdminVenue; onView: () => void; onDeactivate: () => void }) {
  const venueTypes = Array.isArray(venue.venue_types) ? venue.venue_types : []
  const imageUrl = Array.isArray(venue.images) && venue.images.length > 0 ? venue.images[0] : null
  const rating = venue.rating != null ? Number(venue.rating).toFixed(1) : null

  return (
    <Card variant="interactive" onClick={onView} className="h-full flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-eventra-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={venue.name || 'Venue'}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-eventra-slate-100 to-eventra-slate-200">
            <Building2 className="w-14 h-14 text-eventra-slate-300" />
          </div>
        )}
        <div className="absolute top-3 left-3 right-3 flex justify-between gap-1">
          <span className={cn('badge', venue.is_active ? 'badge-success' : 'badge-neutral')}>
            {venue.is_active ? 'Active' : 'Inactive'}
          </span>
          <div className="flex gap-1">
            {venue.is_featured && <span className="badge badge-warning">Featured</span>}
            {venue.is_demo && <span className="badge badge-neutral">Demo</span>}
          </div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 line-clamp-1">{venue.name || '—'}</h3>
        <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1 line-clamp-1">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          {venue.city?.name || 'Unknown city'}{venue.city?.country?.name ? `, ${venue.city.country.name}` : ''}
        </p>
        {venueTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {venueTypes.slice(0, 3).map((type) => (
              <span key={type} className="tag text-body-xs px-2 py-0.5 capitalize">{type.replace(/_/g, ' ')}</span>
            ))}
            {venueTypes.length > 3 && (
              <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{venueTypes.length - 3} more</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-4 border-t border-eventra-slate-200 mt-auto">
          <div>
            <p className="text-body-xs text-eventra-slate-500">Capacity</p>
            <p className="font-semibold text-eventra-navy-900">{(venue.total_capacity || 0).toLocaleString()} guests</p>
          </div>
          <div className="text-right">
            {rating && <p className="text-body-sm font-medium text-eventra-navy-900">★ {rating} <span className="text-body-xs text-eventra-slate-500">({venue.review_count ?? 0})</span></p>}
            <Button variant="ghost" size="xs" className="text-eventra-red-600 hover:bg-eventra-red-50" onClick={(e) => { e.stopPropagation(); onDeactivate() }}>
              Deactivate
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyVenuesState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Building2 className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No venues yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Add your first venue to start managing event spaces.
      </p>
      <Button onClick={onAdd} leftIcon={<Plus className="w-5 h-5" />}>
        Add Your First Venue
      </Button>
    </motion.div>
  )
}

function VenueDetailModal({ venue }: { venue: AdminVenue }) {
  const venueTypes = Array.isArray(venue.venue_types) ? venue.venue_types : []
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-eventra-red-100 text-eventra-red-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
          {getInitials(venue.name || '?')}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{venue.name || '—'}</h3>
          <p className="text-eventra-slate-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {venue.city?.name || 'Unknown city'}{venue.city?.country?.name ? `, ${venue.city.country.name}` : ''}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className={cn('badge', venue.is_active ? 'badge-success' : 'badge-neutral')}>
              {venue.is_active ? 'Active' : 'Inactive'}
            </span>
            {venue.is_featured && <span className="badge badge-warning">Featured</span>}
            {venue.is_demo && <span className="badge badge-neutral">Demo</span>}
          </div>
        </div>
      </div>

      {venue.description && (
        <div>
          <h4 className="font-semibold text-eventra-navy-900 mb-2">Description</h4>
          <p className="text-body-sm text-eventra-slate-600 line-clamp-4">{venue.description}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <DetailRow label="Address" value={venue.address || '—'} />
        <DetailRow label="Total Capacity" value={`${(venue.total_capacity || 0).toLocaleString()} guests`} />
        <DetailRow label="Rating" value={venue.rating != null ? `${Number(venue.rating).toFixed(1)} (${venue.review_count ?? 0} reviews)` : '—'} />
        <DetailRow label="Indoor / Outdoor" value={`${venue.has_indoor ? 'Indoor' : 'No indoor'} • ${venue.has_outdoor ? 'Outdoor' : 'No outdoor'}`} />
      </div>

      {venueTypes.length > 0 && (
        <div>
          <h4 className="font-semibold text-eventra-navy-900 mb-2">Venue Types</h4>
          <div className="flex flex-wrap gap-2">
            {venueTypes.map((type) => (
              <span key={type} className="tag capitalize">{type.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-eventra-slate-50 p-3">
      <p className="text-body-xs text-eventra-slate-500">{label}</p>
      <p className="font-medium text-eventra-navy-900 break-words">{value}</p>
    </div>
  )
}

function CreateVenueForm({ onSubmit, onCancel }: { onSubmit: (payload: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    city_id: '',
    address: '',
    description: '',
    total_capacity: '',
    venue_types: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: formData.name,
        city_id: parseInt(formData.city_id) || 0,
        address: formData.address,
        description: formData.description || undefined,
        total_capacity: parseInt(formData.total_capacity) || 1,
        venue_types: formData.venue_types
          ? formData.venue_types.split(',').map(t => t.trim()).filter(Boolean)
          : undefined,
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create venue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Venue Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Grand Ballroom" required />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="City ID" type="number" value={formData.city_id} onChange={(e) => setFormData({ ...formData, city_id: e.target.value })} placeholder="1" required min="1" />
        <Input label="Total Capacity" type="number" value={formData.total_capacity} onChange={(e) => setFormData({ ...formData, total_capacity: e.target.value })} placeholder="500" required min="1" />
      </div>
      <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main Street" required />
      <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the venue..." />
      <Input label="Venue Types (comma separated)" value={formData.venue_types} onChange={(e) => setFormData({ ...formData, venue_types: e.target.value })} placeholder="wedding, conference" />
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Create Venue</Button>
      </div>
    </form>
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
