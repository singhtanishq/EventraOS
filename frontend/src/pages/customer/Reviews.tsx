import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface Review {
  id: string
  uuid: string
  booking_id: string
  booking_item_id: string
  provider_id: string
  service_type: string
  service_id: number
  overall_rating: number
  ratings: {
    cleanliness?: number
    location?: number
    service?: number
    value?: number
    experience?: number
    guide?: number
    facilities?: number
    staff?: number
  }
  title: string
  comment: string
  photos: string[]
  status: 'pending' | 'published' | 'hidden' | 'flagged' | 'rejected'
  is_verified: boolean
  is_anonymous: boolean
  response?: {
    text: string
    responded_at: string
    responder_name: string
  }
  helpful_count: number
  unhelpful_count: number
  created_at: string
}

export function Reviews() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-reviews'],
    queryFn: async () => {
      const response = await api.get('/customer/reviews')
      return response.data
    },
  })

  const reviews = data?.data?.reviews || []

  if (isLoading) return <ReviewsSkeleton />

  const pendingReviews = reviews.filter(r => r.status === 'pending')
  const publishedReviews = reviews.filter(r => r.status === 'published')
  const hiddenReviews = reviews.filter(r => r.status === 'hidden')

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">My Reviews</h1>
          <p className="text-eventra-slate-600 mt-1">Share your experiences and help other travelers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Star className="w-6 h-6" />} label="Total Reviews" value={reviews.length} color="eventra-amber" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Published" value={publishedReviews.length} color="eventra-green" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={pendingReviews.length} color="eventra-blue" />
        <StatCard icon={<Heart className="w-6 h-6" />} label="Avg Rating" value={reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length).toFixed(1) : '0'} color="eventra-red" />
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <button className="tab tab-active">All Reviews</button>
        <button className="tab">Published</button>
        <button className="tab">Pending</button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <ReviewCard review={review} />
            </motion.div>
          ))
        ) : (
          <EmptyReviewsState />
        )}
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Building2 className="w-5 h-5" />
      case 'flight': return <Plane className="w-5 h-5" />
      case 'venue': return <MapPin className="w-5 h-5" />
      case 'train': return <Train className="w-5 h-5" />
      case 'bus': return <Bus className="w-5 h-5" />
      case 'car': return <Car className="w-5 h-5" />
      case 'activity': return <Sparkles className="w-5 h-5" />
      case 'transfer': return <Truck className="w-5 h-5" />
      case 'package': return <Package className="w-5 h-5" />
      default: return <Package className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="badge-success">Published</Badge>
      case 'pending': return <Badge className="badge-warning">Pending Review</Badge>
      case 'hidden': return <Badge className="badge-neutral">Hidden</Badge>
      case 'flagged': return <Badge className="badge-warning">Flagged</Badge>
      case 'rejected': return <Badge className="badge-danger">Rejected</Badge>
      default: return <Badge className="badge-neutral">{status}</Badge>
    }
  }

  const getDetailedRatings = (ratings: any) => {
    return Object.entries(ratings).map(([key, value]) => (
      <div key={key} className="flex items-center gap-2 text-body-sm">
        <span className="text-eventra-slate-600 capitalize">{key}</span>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={cn('w-4 h-4', i < value ? 'fill-eventra-amber-400 text-eventra-amber-400' : 'text-eventra-slate-300')} />
          ))}
        </div>
      </div>
    ))
  }

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center">
            {getServiceIcon(review.service_type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-eventra-navy-900">{review.service_type}</h3>
              {getStatusBadge(review.status)}
              {review.is_verified && <Badge className="badge-primary">Verified</Badge>}
            </div>
            <p className="text-body-sm text-eventra-slate-600">Reviewed on {formatDate(review.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={cn('w-6 h-6', i < review.overall_rating ? 'fill-eventra-amber-400 text-eventra-amber-400' : 'text-eventra-slate-300')} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {review.title && (
          <h4 className="font-semibold text-eventra-navy-900">{review.title}</h4>
        )}
        <p className="text-eventra-slate-600">{review.comment}</p>

        <div className="pt-4 border-t border-eventra-slate-200">
          <p className="text-body-sm font-medium text-eventra-navy-900 mb-3">Detailed Ratings</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {getDetailedRatings(review.ratings)}
          </div>
        </div>

        {review.photos && review.photos.length > 0 && (
          <div className="pt-4 border-t border-eventra-slate-200">
            <p className="text-body-sm font-medium text-eventra-navy-900 mb-3">Photos</p>
            <div className="flex gap-2 overflow-x-auto">
              {review.photos.map((photo, i) => (
                <img key={i} src={photo} alt={`Review photo ${i + 1}`} className="w-20 h-20 rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}

        {review.response && (
          <div className="pt-4 border-t border-eventra-green-200 bg-eventra-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
              <span className="font-medium text-eventra-green-800">Provider Response</span>
              <span className="text-body-xs text-eventra-green-600">{formatDate(review.response.responded_at)}</span>
            </div>
            <p className="text-eventra-green-700">{review.response.text}</p>
            <p className="text-body-xs text-eventra-green-600 mt-1">— {review.response.responder_name}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-eventra-slate-200">
          <div className="flex items-center gap-4 text-body-sm text-eventra-slate-600">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{review.helpful_count} Helpful</span>
            </span>
            <span className="flex items-center gap-1">
              <X className="w-4 h-4" />
              <span>{review.unhelpful_count} Not Helpful</span>
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" leftIcon={<PenTool className="w-4 h-4" />}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-eventra-red-600 hover:bg-eventra-red-50" leftIcon={<TrashIcon className="w-4 h-4" />}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function EmptyReviewsState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Star className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No reviews yet</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        After completing a trip, share your experience to help other travelers make better decisions.
      </p>
    </motion.div>
  )
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse text-center" />
        ))}
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <Card variant="elevated" padding="lg" className="animate-pulse" />
    </div>
  )
}