import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Hotel,
  CheckCircle2,
  Star,
  Globe,
  Search,
  Eye,
  Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/LoadingScreen'
import { toast } from 'react-hot-toast'

interface AdminHotel {
  id: number
  name?: string
  slug?: string
  star_rating?: number | null
  property_type?: string | null
  is_active?: boolean
  is_featured?: boolean
  is_demo?: boolean
  rating?: number | string | null
  review_count?: number
  city?: { name?: string; country?: { name?: string } } | null
  created_at?: string
}

const STATUS_FILTERS = ['all', 'active', 'inactive', 'featured', 'demo'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const STAR_OPTIONS = [
  { value: 'all', label: 'All Stars' },
  { value: '5', label: '5 Star' },
  { value: '4', label: '4 Star' },
  { value: '3', label: '3 Star' },
  { value: '2', label: '2 Star' },
  { value: '1', label: '1 Star' },
]

const PAGE_SIZE = 20

export function AdminHotels() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [filterStar, setFilterStar] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedHotel, setSelectedHotel] = useState<AdminHotel | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [hotelToDeactivate, setHotelToDeactivate] = useState<AdminHotel | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-hotels', search, filterStatus, filterStar, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: PAGE_SIZE }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterStar !== 'all') params.star = filterStar
      const body = await api.get<any>('/admin/hotels', params)
      return body
    },
    placeholderData: (previous) => previous,
  })

  const hotels: AdminHotel[] = data?.data?.hotels ?? []
  const totalCount: number = data?.data?.total_count ?? 0
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  const handleDeactivate = async () => {
    if (!hotelToDeactivate) return
    setIsDeactivating(true)
    try {
      const body = await api.delete<any>(`/admin/hotels/${hotelToDeactivate.id}`)
      if (body.success) {
        toast.success(body.message || 'Hotel deactivated')
        queryClient.invalidateQueries({ queryKey: ['admin-hotels'] })
      } else {
        toast.error(body.message || 'Failed to deactivate hotel')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate hotel')
    } finally {
      setIsDeactivating(false)
      setHotelToDeactivate(null)
    }
  }

  if (isLoading && hotels.length === 0) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader />
        <TableSkeleton rows={8} columns={7} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader />

      {isError ? (
        <div className="alert alert-danger text-center py-12">
          <p className="font-medium">Failed to load hotels</p>
          <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<Hotel className="w-5 h-5" />} label="Total Hotels" value={totalCount.toLocaleString()} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Active" value={hotels.filter(h => h.is_active).length} iconClass="bg-eventra-green-100 text-eventra-green-600" />
            <StatCard icon={<Star className="w-5 h-5" />} label="Featured" value={hotels.filter(h => h.is_featured).length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<Star className="w-5 h-5" />} label="5 Star" value={hotels.filter(h => h.star_rating === 5).length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
            <StatCard icon={<Globe className="w-5 h-5" />} label="Countries (page)" value={new Set(hotels.map(h => h.city?.country?.name).filter(Boolean)).size} iconClass="bg-eventra-cyan-100 text-eventra-cyan-600" />
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
                <Select
                  value={filterStar}
                  onChange={(e) => { setFilterStar(e.target.value); setPage(1) }}
                  options={STAR_OPTIONS}
                  aria-label="Filter by star"
                  className="w-36"
                />
                <Input
                  placeholder="Search hotels..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="max-w-xs"
                />
              </div>
            </div>
          </Card>

          {/* Hotels Table */}
          {hotels.length === 0 ? (
            <EmptyHotelsState />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-body-md text-eventra-slate-600">
                  Showing <strong>{hotels.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> hotels
                </p>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Hotel</th>
                      <th>Location</th>
                      <th className="text-center">Stars</th>
                      <th className="text-center">Rating</th>
                      <th>Type</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Created</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotels.map((hotel) => (
                      <tr key={hotel.id} className="hover:bg-eventra-slate-50">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                              <Hotel className="w-5 h-5 text-eventra-slate-400" />
                            </div>
                            <div>
                              <p className="font-medium text-eventra-navy-900">{hotel.name || '—'}</p>
                              <p className="text-body-xs text-eventra-slate-500 font-mono">ID: {hotel.id}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="text-body-sm text-eventra-navy-900">{hotel.city?.name || '—'}</p>
                          <p className="text-body-xs text-eventra-slate-500">{hotel.city?.country?.name || ''}</p>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={cn('w-3.5 h-3.5', i < (hotel.star_rating || 0) ? 'fill-eventra-amber-400 text-eventra-amber-400' : 'text-eventra-slate-300')} />
                            ))}
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-eventra-amber-400 text-eventra-amber-400" />
                            <span className="font-medium text-eventra-navy-900">{hotel.rating != null ? Number(hotel.rating).toFixed(1) : 'N/A'}</span>
                            <span className="text-body-xs text-eventra-slate-500">({hotel.review_count ?? 0})</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral capitalize">{hotel.property_type || 'Hotel'}</span>
                        </td>
                        <td className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn('badge', hotel.is_active ? 'badge-success' : 'badge-neutral')}>
                              {hotel.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {hotel.is_featured && <span className="badge badge-warning">Featured</span>}
                            {hotel.is_demo && <span className="badge badge-neutral">Demo</span>}
                          </div>
                        </td>
                        <td className="text-center">
                          <p className="text-body-sm text-eventra-slate-600">{hotel.created_at ? formatDate(hotel.created_at) : '—'}</p>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="xs" onClick={() => { setSelectedHotel(hotel); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
                              View
                            </Button>
                            <Button variant="ghost" size="xs" className="text-eventra-red-600 hover:bg-eventra-red-50" onClick={() => setHotelToDeactivate(hotel)} aria-label="Deactivate hotel">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Hotel Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedHotel(null); }}
        title={selectedHotel?.name || 'Hotel Details'}
        size="lg"
      >
        {selectedHotel && <HotelDetailModal hotel={selectedHotel} />}
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={!!hotelToDeactivate}
        onClose={() => setHotelToDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Hotel"
        message={`Deactivate ${hotelToDeactivate?.name || 'this hotel'}? It will no longer be bookable.`}
        confirmText="Deactivate"
        variant="danger"
        loading={isDeactivating}
      />
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Hotels</h1>
        <p className="text-eventra-slate-600 mt-1">Manage hotel inventory</p>
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

function EmptyHotelsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Hotel className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No hotels found</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        No hotels match your current filters. Try adjusting your search criteria.
      </p>
    </motion.div>
  )
}

function HotelDetailModal({ hotel }: { hotel: AdminHotel }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center flex-shrink-0">
          <Hotel className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{hotel.name || '—'}</h3>
          <p className="text-eventra-slate-600">
            {hotel.city?.name || 'Unknown city'}{hotel.city?.country?.name ? `, ${hotel.city.country.name}` : ''}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn('w-4 h-4', i < (hotel.star_rating || 0) ? 'fill-eventra-amber-400 text-eventra-amber-400' : 'text-eventra-slate-300')} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <DetailRow label="Property Type" value={hotel.property_type || 'Hotel'} />
        <DetailRow label="Rating" value={hotel.rating != null ? `${Number(hotel.rating).toFixed(1)} (${hotel.review_count ?? 0} reviews)` : '—'} />
        <DetailRow label="Status" value={hotel.is_active ? 'Active' : 'Inactive'} />
        <DetailRow label="Created" value={hotel.created_at ? formatDate(hotel.created_at) : '—'} />
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-eventra-slate-50 p-3">
      <p className="text-body-xs text-eventra-slate-500">{label}</p>
      <p className="font-medium text-eventra-navy-900">{value}</p>
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
