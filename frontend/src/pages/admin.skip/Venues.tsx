import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, LayoutDashboard, Suitcase, TrendingUp, BarChart3, PieChart, Award, Trophy, Crown, Medal, Settings, Building, UserCog, TicketPercent, RotateCcw as RotateCcwIcon, CreditCard as CreditCardIcon, BarChart3 as BarChart3Icon, Activity as ActivityIcon, FileText as FileTextIcon, ArrowRight, ArrowLeft, RefreshCw, UserCog, Building, RotateCcw as RotateCcwIcon2, Cog, ShieldCheck, BookOpen, Scale, Gavel, Archive, Globe, Wifi, Utensils, Car as CarIcon, Hotel, Music, MapPin as MapPinIcon2, Plane as PlaneIcon2, Layers, Palette, Megaphone, Tag, Gift, Calendar as CalendarIcon, Clock as ClockIcon2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AdminVenue {
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
  total_capacity: number
  capacity_breakdown: any
  venue_types: string[]
  has_indoor: boolean
  has_outdoor: boolean
  has_parking: boolean
  parking_capacity: number
  has_catering: boolean
  has_av: boolean
  has_stage: boolean
  has_green_room: boolean
  has_bride_groom_room: boolean
  amenities: string[]
  facilities: string[]
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

export function AdminVenues() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'featured' | 'demo'>('all')
  const [filterType, setFilterType] = useState<'all' | 'hotel' | 'conference' | 'wedding' | 'party' | 'concert' | 'exhibition' | 'workshop' | 'meeting' | 'corporate' | 'seminar' | 'birthday' | 'other'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name' | 'capacity' | 'rating'>('created_desc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<AdminVenue | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-venues', search, filterStatus, filterType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      params.set('sort', sortBy)
      const response = await api.get('/admin/venues', { params })
      return response.data
    },
  })

  const venues = data?.data?.venues || []

  const filteredVenues = venues.filter(v => {
    if (filterStatus === 'active' && !v.is_active) return false
    if (filterStatus === 'inactive' && v.is_active) return false
    if (filterStatus === 'featured' && !v.is_featured) return false
    if (filterStatus === 'demo' && !v.is_demo) return false
    if (filterType !== 'all' && !v.venue_types.includes(filterType)) return false
    return true
  })

  if (isLoading) return <AdminVenuesSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Venues</h1>
          <p className="text-eventra-slate-600 mt-1">Manage event venues and halls</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Add Venue
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={<MapPin className="w-6 h-6" />} label="Total Venues" value={venues.length} color="eventra-blue" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Active" value={venues.filter(v => v.is_active).length} color="eventra-green" />
        <StatCard icon={<Star className="w-6 h-6" />} label="Featured" value={venues.filter(v => v.is_featured).length} color="eventra-amber" />
        <StatCard icon={<Building2 className="w-6 h-6" />} label="Indoor" value={venues.filter(v => v.has_indoor).length} color="eventra-blue" />
        <StatCard icon={<Trophy className="w-6 h-6" />} label="Wedding" value={venues.filter(v => v.venue_types.includes('wedding')).length} color="eventra-pink" />
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Capacity" value={venues.reduce((sum, v) => sum + (v.total_capacity || 0), 0).toLocaleString()} color="eventra-green" />
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
              value={filterType}
              onValueChange={setFilterType}
              options={[
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
                { value: 'birthday', label: 'Birthday' },
                { value: 'other', label: 'Other' },
              ]}
              className="w-40"
              placeholder="Filter by type"
            />
            <Input
              placeholder="Search venues..."
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
                { value: 'capacity', label: 'Capacity' },
                { value: 'rating', label: 'Rating' },
              ]}
              className="w-40"
              placeholder="Sort by"
            />
          </div>
        </div>
      </Card>

      {/* Venues Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <AdminVenuesSkeleton />
        ) : filteredVenues.length === 0 ? (
          <EmptyVenuesState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-body-md text-eventra-slate-600">
                Showing <strong>{filteredVenues.length}</strong> of <strong>{venues.length}</strong> venues
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div
                key="venues"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredVenues.map((venue, index) => (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <AdminVenueCard
                      venue={venue}
                      onView={() => { setSelectedVenue(venue); setShowDetailModal(true); }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {venues.length > 20 && (
              <Pagination currentPage={1} totalPages={Math.ceil(venues.length / 20)} />
            )}
          </>
        )}
      </div>

      {/* Create Venue Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Venue"
        size="lg"
      >
        <CreateVenueForm onSubmit={() => { setShowCreateModal(false); toast.success('Venue created') }} />
      </Modal>

      {/* Venue Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedVenue(null); }}
        title={selectedVenue ? selectedVenue.name : 'Venue Details'}
        size="xl"
      >
        {selectedVenue && <VenueDetailModal venue={selectedVenue} />}
      </Modal>
    </div>
  )
}

function AdminVenueCard({ venue, onView }: { venue: AdminVenue; onView: () => void }) {
  return (
    <Card variant="interactive" onClick={onView} className="h-full">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={venue.images[0] || '/placeholder-venue.jpg'} 
          alt={venue.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <div className="flex gap-1">
            <Badge className={cn('badge', venue.is_active ? 'badge-success' : 'badge-neutral')}>
              {venue.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {venue.is_featured && <Badge className="badge-amber">Featured</Badge>}
            {venue.is_demo && <Badge className="badge-neutral">Demo</Badge>}
          </div>
          <div className="flex gap-1">
            <Badge className={cn('badge px-2 py-1', 
              venue.venue_types.includes('wedding') ? 'badge-pink' :
              venue.venue_types.includes('conference') ? 'badge-blue' :
              'badge-purple'
            )}>
              {venue.venue_types[0] || 'Venue'}
            </Badge>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="badge badge-primary">★ {venue.rating?.toFixed(1) || '4.5'}</span>
          <span className="badge badge-neutral">{venue.review_count || 0} reviews</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 line-clamp-1">{venue.name}</h3>
        <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {venue.city_name}, {venue.country_name}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {venue.venue_types.slice(0, 3).map((type) => (
            <span key={type} className="tag text-body-xs px-2 py-0.5 capitalize">{type}</span>
          ))}
          {venue.venue_types.length > 3 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{venue.venue_types.length - 3} more</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-eventra-slate-200">
          <div>
            <p className="text-body-sm text-eventra-slate-500">Capacity</p>
            <p className="font-semibold text-eventra-navy-900">{venue.total_capacity?.toLocaleString() || 0} guests</p>
          </div>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onView() }}>
            View Details
          </Button>
        </div>
      </div>
    </Card>
  )
}

function EmptyVenuesState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full text-center py-16">
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

function AdminVenuesSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="outlined" padding="lg" className="animate-pulse" />
        ))}
      </div>
    </div>
  )
}

function VenueDetailModal({ venue }: { venue: AdminVenue }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold text-2xl">
          {venue.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-heading-lg font-semibold text-eventra-navy-900">{venue.name}</h3>
          <p className="text-eventra-slate-600">{venue.city_name}, {venue.country_name}</p>
          {venue.is_featured && <Badge className="badge-amber mt-1">Featured</Badge>}
          {venue.is_demo && <Badge className="badge-neutral mt-1">Demo</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Basic Information</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <MapPin className="w-4 h-4" />
              <span>{venue.address}, {venue.city_name}, {venue.country_name}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Globe className="w-4 h-4" />
              <span>Lat: {venue.latitude}, Lng: {venue.longitude}</span>
            </div>
            {venue.landmark && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <MapPin className="w-4 h-4" />
                <span>Landmark: {venue.landmark}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Phone className="w-4 h-4" />
              <span>{venue.contact_phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span>{venue.contact_email || 'Not provided'}</span>
            </div>
            {venue.website && (
              <div className="flex items-center gap-2 text-eventra-slate-600">
                <Globe className="w-4 h-4" />
                <span>{venue.website}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-eventra-navy-900">Capacity & Types</h4>
          <div className="space-y-3 text-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-eventra-slate-600">Total Capacity</span>
              <span className="font-semibold text-eventra-navy-900">{venue.total_capacity?.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn('badge capitalize',
                venue.venue_types.includes('wedding') ? 'badge-pink' :
                venue.venue_types.includes('conference') ? 'badge-blue' :
                venue.venue_types.includes('party') ? 'badge-purple' :
                'badge-green'
              )}>
                {venue.venue_types.join(', ')}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {venue.capacity_breakdown && Object.entries(venue.capacity_breakdown).map(([layout, cap]) => (
                <div key={layout} className="flex justify-between text-body-sm">
                  <span className="text-eventra-slate-600 capitalize">{layout}</span>
                  <span className="font-medium text-eventra-navy-900">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <h4 className="font-semibold text-eventra-navy-900">Facilities & Amenities</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FacilityBadge icon={Wifi} label="WiFi" available={venue.facilities?.includes('wifi')} />
            <FacilityBadge icon={Utensils} label="Catering" available={venue.has_catering} />
            <FacilityBadge icon={Music} label="AV Equipment" available={venue.has_av} />
            <FacilityBadge icon={Building2} label="Stage" available={venue.has_stage} />
            <FacilityBadge icon={User} label="Green Room" available={venue.has_green_room} />
            <FacilityBadge icon={Crown} label="Bridal Suite" available={venue.has_bride_groom_room} />
            <FacilityBadge icon={CarIcon} label="Parking" available={venue.has_parking} />
            <FacilityBadge icon={Building2} label="Indoor" available={venue.has_indoor} />
            <FacilityBadge icon={TreePine} label="Outdoor" available={venue.has_outdoor} />
          </div>

          <div className="mt-4 pt-4 border-t border-eventra-slate-200">
            <h4 className="font-semibold text-eventra-navy-900 mb-3">Amenities</h4>
            <div className="flex flex-wrap gap-2">
              {venue.amenities?.map((amenity) => (
                <span key={amenity} className="tag text-body-xs px-2 py-0.5">{amenity}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-eventra-slate-200">
            <h4 className="font-semibold text-eventra-navy-900 mb-3">Policies</h4>
            <div className="space-y-2 text-body-sm text-eventra-slate-600">
              <div><span className="font-medium text-eventra-navy-900">Decoration: </span>{venue.policies?.decoration || 'Standard'}</div>
              <div><span className="font-medium text-eventra-navy-900">External Vendors: </span>{venue.policies?.vendor || 'Standard'}</div>
              <div><span className="font-medium text-eventra-navy-900">Noise: </span>{venue.policies?.noise || 'Standard'}</div>
              <div><span className="font-medium text-eventra-navy-900">Alcohol: </span>{venue.policies?.alcohol || 'Standard'}</div>
              <div><span className="font-medium text-eventra-navy-900">Catering: </span>{venue.policies?.catering || 'Standard'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <h4 className="font-semibold text-eventra-navy-900">Images</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {venue.images?.map((image, i) => (
              <img key={i} src={image} alt={`${venue.name} ${i + 1}`} className="w-full h-32 object-cover rounded-xl" />
            ))}
            {(!venue.images || venue.images.length === 0) && (
              <div className="col-span-3 h-32 bg-eventra-slate-100 rounded-xl flex items-center justify-center text-eventra-slate-400">
                No images available
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-eventra-slate-200">
          <h4 className="font-semibold text-eventra-navy-900 mb-4">Venue Rooms</h4>
          <p className="text-eventra-slate-600 text-center py-8">Room management would be loaded here</p>
        </div>

        <div className="pt-4 border-t border-eventra-slate-200">
          <h4 className="font-semibold text-eventra-navy-900 mb-4">Packages</h4>
          <p className="text-eventra-slate-600 text-center py-8">Package management would be loaded here</p>
        </div>

        <div className="pt-4 border-t border-eventra-slate-200">
          <h4 className="font-semibold text-eventra-navy-900 mb-4">Add-ons</h4>
          <p className="text-eventra-slate-600 text-center py-8">Add-on management would be loaded here</p>
        </div>

        <div className="pt-4 border-t border-eventra-slate-200">
          <h4 className="font-semibold text-eventra-navy-900 mb-4">Availability</h4>
          <p className="text-eventra-slate-600 text-center py-8">Availability calendar would be loaded here</p>
        </div>
      </div>
    </div>
  )
}

function FacilityBadge({ icon: Icon, label, available }: { icon: React.ComponentType<{ className?: string }>; label: string; available: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 p-3 rounded-xl', available ? 'bg-eventra-green-50 text-eventra-green-700' : 'bg-eventra-slate-50 text-eventra-slate-600')}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {available ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
    </div>
  )
}

function CreateVenueForm({ onSubmit }: { onSubmit: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    city_id: '',
    address: '',
    description: '',
    total_capacity: 100,
    venue_types: [],
    has_indoor: true,
    has_outdoor: false,
    has_parking: false,
    parking_capacity: 0,
    has_catering: false,
    has_av: false,
    has_stage: false,
    allows_external_catering: false,
    allows_external_decor: false,
    allows_alcohol: false,
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Venue Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Grand Ballroom" required />
        <Select label="City" value={formData.city_id} onValueChange={(v) => setFormData({ ...formData, city_id: v })} options={[]} placeholder="Select city" required />
      </div>
      <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main Street" required />
      <Input label="Description" as="textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the venue..." rows={3} />
      <Input label="Total Capacity" type="number" value={formData.total_capacity} onChange={(e) => setFormData({ ...formData, total_capacity: parseInt(e.target.value) })} required />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Venue Types" value={formData.venue_types.join(',')} onValueChange={(v) => setFormData({ ...formData, venue_types: v.split(',') })} options={[
          { value: 'wedding', label: 'Wedding' },
          { value: 'conference', label: 'Conference' },
          { value: 'party', label: 'Party' },
          { value: 'concert', label: 'Concert' },
          { value: 'corporate', label: 'Corporate' },
          { value: 'exhibition', label: 'Exhibition' },
          { value: 'workshop', label: 'Workshop' },
          { value: 'meeting', label: 'Meeting' },
          { value: 'seminar', label: 'Seminar' },
          { value: 'birthday', label: 'Birthday' },
        ]} placeholder="Select types" multiple />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.has_indoor} onChange={(e) => setFormData({ ...formData, has_indoor: e.target.checked })} className="form-checkbox" />
          <span className="text-body-sm">Indoor</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.has_outdoor} onChange={(e) => setFormData({ ...formData, has_outdoor: e.target.checked })} className="form-checkbox" />
          <span className="text-body-sm">Outdoor</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.has_parking} onChange={(e) => setFormData({ ...formData, has_parking: e.target.checked })} className="form-checkbox" />
          <span className="text-body-sm">Parking</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.has_catering} onChange={(e) => setFormData({ ...formData, has_catering: e.target.checked })} className="form-checkbox" />
          <span className="text-body-sm">Catering</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.has_av} onChange={(e) => setFormData({ ...formData, has_av: e.target.checked })} className="form-checkbox" />
          <span className="text-body-sm">AV Equipment</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.has_stage} onChange={(e) => setFormData({ ...formData, has_stage: e.target.checked })} className="form-checkbox" />
          <span className="text-body-sm">Stage</span>
        </label>
      </div>
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
        <Button type="submit">Create Venue</Button>
      </div>
    </form>
  )
}