import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, Heart, Tag, Grid, List, MapPin as MapPinIcon2, Clock, Share2, Download, Tag as TagIcon, Search, MoreVertical } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface Favorite {
  id: string
  uuid: string
  favoritable_type: 'hotel' | 'venue' | 'activity' | 'package'
  favoritable_id: number
  name: string
  description: string
  image?: string
  location: { city: string; country: string }
  price: number
  currency: string
  metadata: any
  created_at: string
}

export function Favorites() {
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState<'all' | 'hotel' | 'venue' | 'activity' | 'package'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showShare, setShowShare] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customer-favorites', filterType],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('type', filterType)
      const response = await api.get('/customer/favorites', { params })
      return response.data
    },
  })

  const favorites = data?.data?.favorites || []

  if (isLoading) return <FavoritesSkeleton />

  const filteredFavorites = favorites.filter(f => filterType === 'all' || f.favoritable_type === filterType)

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">My Favorites</h1>
          <p className="text-eventra-slate-600 mt-1">Saved hotels, venues, activities & packages</p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="lg" className="sticky top-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'hotel', 'venue', 'activity', 'package'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-4 py-2 rounded-xl text-body-sm font-medium transition-all',
                  filterType === type
                    ? 'bg-eventra-navy-900 text-white shadow-card'
                    : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 lg:ml-auto">
            <div className="flex border border-eventra-slate-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('px-4 py-2 transition-colors', viewMode === 'grid' ? 'bg-eventra-navy-900 text-white' : 'text-eventra-slate-600')}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('px-4 py-2 transition-colors', viewMode === 'list' ? 'bg-eventra-navy-900 text-white' : 'text-eventra-slate-600')}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Favorites Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <FavoritesSkeleton />
        ) : filteredFavorites.length === 0 ? (
          <EmptyFavoritesState onBrowse={() => navigate('/search')} />
        ) : (
          <>
            <p className="text-body-md text-eventra-slate-600">
              Showing <strong>{filteredFavorites.length}</strong> favorite{filteredFavorites.length !== 1 ? 's' : ''}
            </p>

            <AnimatePresence mode="popLayout">
              {viewMode === 'grid' && (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {filteredFavorites.map((fav, index) => (
                    <motion.div key={fav.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                      <FavoriteGridCard favorite={fav} onShare={() => setShowShare(fav.uuid)} onRemove={() => removeFavorite(fav.id)} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
              {viewMode === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {filteredFavorites.map((fav, index) => (
                    <motion.div key={fav.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                      <FavoriteListCard favorite={fav} onShare={() => setShowShare(fav.uuid)} onRemove={() => removeFavorite(fav.id)} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Share Modal */}
            <Modal
              isOpen={!!showShare}
              onClose={() => setShowShare(null)}
              title="Share Favorite"
              size="md"
            >
              <ShareModal favoriteUuid={showShare} onClose={() => setShowShare(null)} />
            </Modal>
          </>
        )}
      </div>
    </div>
  )
}

function FavoriteGridCard({ favorite, onShare, onRemove }: { favorite: Favorite; onShare: () => void; onRemove: () => void }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Building2 className="w-5 h-5" />
      case 'venue': return <MapPinIcon2 className="w-5 h-5" />
      case 'activity': return <Sparkles className="w-5 h-5" />
      case 'package': return <Package className="w-5 h-5" />
      default: return <Heart className="w-5 h-5" />
    }
  }

  return (
    <Card variant="interactive" className="h-full relative overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={favorite.image || '/placeholder-favorite.jpg'} 
          alt={favorite.name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <span className={`badge px-3 py-1 capitalize ${favorite.favoritable_type === 'hotel' ? 'badge-blue' : favorite.favoritable_type === 'venue' ? 'badge-red' : favorite.favoritable_type === 'activity' ? 'badge-purple' : 'badge-green'}`}>
            {favorite.favoritable_type}
          </span>
          <div className="flex gap-1">
            <button onClick={onShare} className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-eventra-slate-600 hover:bg-white hover:text-eventra-navy-900 transition-colors" aria-label="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={onRemove} className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-eventra-red-600 hover:bg-white hover:text-eventra-red-700 transition-colors" aria-label="Remove from favorites">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="badge badge-primary">★ {favorite.metadata?.rating || '4.5'}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 line-clamp-1">{favorite.name}</h3>
        <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
          <MapPinIcon2 className="w-4 h-4" />
          {favorite.location.city}, {favorite.location.country}
        </p>
        <div className="mt-auto pt-4 border-t border-eventra-slate-200 flex items-center justify-between">
          <div>
            <p className="price-lg text-eventra-navy-900">{formatCurrency(favorite.price, favorite.currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">starting</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/favorites/${favorite.uuid}`)}>
            View Details
          </Button>
        </div>
      </div>
    </Card>
  )
}

function FavoriteListCard({ favorite, onShare, onRemove }: { favorite: Favorite; onShare: () => void; onRemove: () => void }) {
  return (
    <Card variant="interactive" className="flex flex-col sm:flex-row overflow-hidden">
      <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0">
        <img 
          src={favorite.image || '/placeholder-favorite.jpg'} 
          alt={favorite.name} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`badge px-3 py-1 capitalize ${favorite.favoritable_type === 'hotel' ? 'badge-blue' : favorite.favoritable_type === 'venue' ? 'badge-red' : favorite.favoritable_type === 'activity' ? 'badge-purple' : 'badge-green'}`}>
              {favorite.favoritable_type}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={onShare} className="p-2 rounded-full bg-eventra-slate-100 text-eventra-slate-600 hover:bg-eventra-slate-200 transition-colors" aria-label="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={onRemove} className="p-2 rounded-full bg-eventra-slate-100 text-eventra-red-600 hover:bg-eventra-slate-200 hover:text-eventra-red-700 transition-colors" aria-label="Remove from favorites">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 mb-2">{favorite.name}</h3>
        <p className="text-body-sm text-eventra-slate-600 mb-3 flex items-center gap-1">
          <MapPinIcon2 className="w-4 h-4" />
          {favorite.location.city}, {favorite.location.country}
        </p>
        <div className="flex items-center gap-3">
          <p className="price-lg text-eventra-navy-900">{formatCurrency(favorite.price, favorite.currency)}</p>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(`/favorites/${favorite.uuid}`)}>
            View Details
          </Button>
        </div>
      </div>
    </Card>
  )
}

function EmptyFavoritesState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Heart className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No favorites yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Start saving hotels, venues, activities, and packages you love to find them easily later.
      </p>
      <Button onClick={onBrowse} leftIcon={<Sparkles className="w-5 h-5" />}>
        Start Exploring
      </Button>
    </motion.div>
  )
}

function FavoritesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} variant="outlined" padding="lg" className="animate-pulse" />
      ))}
    </div>
  )
}

function ShareModal({ favoriteUuid, onClose }: { favoriteUuid: string | null; onClose: () => void }) {
  if (!favoriteUuid) return null

  const shareUrl = `${window.location.origin}/favorites/${favoriteUuid}`

  return (
    <div className="space-y-4">
      <p className="text-eventra-slate-600">Share this favorite with friends or family</p>
      <div className="flex gap-3">
        <Input
          value={shareUrl}
          readOnly
          className="flex-1 bg-eventra-slate-50"
        />
        <Button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); onClose() }}>
          Copy Link
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => { window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`); onClose() }}>
          <Twitter className="w-5 h-5 mr-2" />
          Twitter
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`); onClose() }}>
          <Facebook className="w-5 h-5 mr-2" />
          Facebook
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`); onClose() }}>
          <LinkedIn className="w-5 h-5 mr-2" />
          LinkedIn
        </Button>
      </div>
    </div>
  )
}

function EmptyFavoritesState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Heart className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No favorites yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Start saving hotels, venues, activities, and packages you love to find them easily later.
      </p>
      <Button onClick={onBrowse} leftIcon={<Sparkles className="w-5 h-5" />}>
        Start Exploring
      </Button>
    </motion.div>
  )
}

function FavoritesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} variant="outlined" padding="lg" className="animate-pulse" />
      ))}
    </div>
  )
}

async function removeFavorite(id: string) {
  try {
    const response = await api.delete(`/customer/favorites/${id}`)
    if (response.data.success) {
      toast.success('Removed from favorites')
    }
  } catch {
    toast.error('Failed to remove favorite')
  }
}

function Twitter({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
}

function Facebook({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.046V9.43c0-3.007 1.792-4.667 4.533-4.667 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
}

function LinkedIn({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 21.571V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
}