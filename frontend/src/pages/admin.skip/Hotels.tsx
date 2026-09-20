import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2, Bed, Utensils as UtensilsIcon, Wind, Flame, Droplet, Coffee, Wifi, Tv, ParkingCircle, Bath, Baby, Smoking, HelpCircle, MinusCircle as MinusCircleIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminHotel {
  id: number
  uuid: string
  name: string
  slug: string
  description: string
  city_id: number
  city_name: string
  country_name: string
  address: string
  latitude: number
  longitude: number
  star_rating: number
  property_type: string
  amenities: string[]
  room_amenities: string[]
  property_amenities: string[]
  policies: any
  check_in_out: any
  images: string[]
  rating: number
  review_count: number
  is_active: boolean
  is_featured: boolean
  is_demo: boolean
  provider_id?: number
  provider_name?: string
  created_at: string
  updated_at: string
}

export function AdminHotels() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'featured' | 'demo'>('all')
  const [filterStar, setFilterStar] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name' | 'star_rating' | 'rating'>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState<AdminHotel | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-hotels', search, filterStatus, filterStar, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterStar !== 'all') params.set('star', filterStar)
      params.set('sort', sortBy)
      const response = await api.get('/admin/hotels', { params })
      return response.data
    },
  )

  const hotels = data?.data?.hotels || []

  const filteredHotels = hotels.filter(h => {
    if (filterStatus === 'active' && !h.is_active) return false
    if (filterStatus === 'inactive' && h.is_active) return false
    if (filterStatus === 'featured' && !h.is_featured) return false
    if (filterStatus === 'demo' && !h.is_demo) return false
    if (filterStar !== 'all' && h.star_rating !== parseInt(filterStar)) return false
    return true
  })

  if (isLoading) return <AdminHotelsSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Hotels</h1>
          <p className="text-eventra-slate-600 mt-1">Manage hotel inventory</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Add Hotel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<Hotel className="w-6 h-6" />} label="Total Hotels" value={hotels.length} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Active" value={hotels.filter(h => h.is_active).length} color="eventra-green" />
        <StatCard icon={<Star className="w-6 h-6" />} label="Featured" value={hotels.filter(h => h.is_featured).length} color="eventra-amber" />
        <StatCard icon={<Star className="w-6 h-6" />} label="5 Star" value={hotels.filter(h => h.star_rating === 5).length} color="eventra-amber" />
        <StatCard icon={<Building2 className="w-6 h-6" />} label="Resorts" value={hotels.filter(h => h.property_type === 'resort').length} color="eventra-teal" />
        <StatCard icon={<Globe className="w-6 h-6" />} label="Countries" value={new Set(hotels.map(h => h.country_name)).size} color="eventra-blue" />
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'inactive', 'featured', 'demo'] as const).map((status) => (
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
              value={filterStar}
              onValueChange={setFilterStar}
              options={[
                { value: 'all', label: 'All Stars' },
                { value: '5', label: '5 Star' },
                { value: '4', label: '4 Star' },
                { value: '3', label: '3 Star' },
                { value: '2', label: '2 Star' },
                { value: '1', label: '1 Star' },
              ]}
              className="w-36"
              placeholder="Filter by star"
            />
            <Input
              placeholder="Search hotels..."
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
                { value: 'star_rating', label: 'Star Rating' },
                { value: 'rating', label: 'Guest Rating' },
              ]}
              className="w-40"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Hotels Table */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminHotelsSkeleton />
        ) : filteredHotels.length === 0 ? (
          <EmptyHotelsState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredHotels.length}</strong> of <strong>{hotels.length}</strong> hotels
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-eventra-slate-200">
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Hotel</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Stars</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Rating</th>
                    <th className="px-4 py-3 text-left text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Provider</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-center text-body-xs font-semibold text-eventra-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHotels.map((hotel, index) => (
                    <tr key={hotel.id} className="border-b border-eventra-slate-100 hover:bg-eventra-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-eventra-slate-100 flex items-center justify-center">
                            <Hotel className="w-5 h-5 text-eventra-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-eventra-navy-900">{hotel.name}</p>
                            <p className="text-body-xs text-eventra-slate-500 font-mono">ID: {hotel.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-body-sm text-eventra-navy-900">{hotel.city_name}</p>
                        <p className="text-body-xs text-eventra-slate-500">{hotel.country_name}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={cn('w-4 h-4', i < hotel.star_rating ? 'fill-eventra-amber-400 text-eventra-amber-400' : 'text-eventra-slate-300')} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 fill-eventra-amber-400 text-eventra-amber-400" />
                          <span className="font-medium text-eventra-navy-900">{hotel.rating?.toFixed(1) || 'N/A'}</span>
                          <span className="text-body-xs text-eventra-slate-500">({hotel.review_count})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="badge-neutral capitalize">{hotel.property_type || 'Hotel'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn('badge',
                          hotel.is_active ? 'badge-success' : 'badge-neutral'
                        )}>
                          {hotel.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {hotel.is_featured && <Badge className="badge-amber mt-1">Featured</Badge>}
                        {hotel.is_demo && <Badge className="badge-neutral mt-1">Demo</Badge>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-body-sm text-eventra-slate-600">{hotel.provider_name || 'Internal'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="text-body-sm text-eventra-slate-600">{formatDate(hotel.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { setSelectedHotel(hotel); setShowDetailModal(true); }} leftIcon={<Eye className="w-4 h-4" />}>
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
            {hotels.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(hotels.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Create Hotel Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Hotel"
        size="lg"
      >
        <CreateHotelForm onSubmit={() => { setShowCreateModal(false); toast.success('Hotel created') }} />
      </Modal>

      {/* Hotel Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedHotel(null); }}
        title={selectedHotel ? selectedHotel.name : 'Hotel Details'}
        size="xl"
      >
        {selectedHotel && <HotelDetailModal hotel={selectedHotel} />}
      </Modal>
    </div>
  )
}

function AdminHotelsSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-eventra-slate-200">
              <th className="px-4 py-3">Hotel</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Stars</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
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
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyHotelsState({ onAdd }: { onAdd: () => void }) {
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

function AdminHotelsSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-eventra-slate-200">
              <th className="px-4 py-3">Hotel</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Stars</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
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
                <td className="px-4 py-3"><div className="h-4 w-24 bg-eventra-slate-200 animate-pulse rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}