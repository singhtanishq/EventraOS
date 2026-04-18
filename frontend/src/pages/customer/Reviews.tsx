import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Star, Building2, Plane, MapPin, Train, Bus, Car, Sparkles, Truck, Package, CheckCircle2, Clock, Heart, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'react-hot-toast'

interface Review {
  id: number
  uuid: string
  booking_id: number
  service_type: string
  overall_rating: number
  ratings: Record<string, number> | null
  title?: string | null
  comment?: string | null
  photos?: string[] | null
  status: 'pending' | 'published' | 'hidden' | 'flagged' | 'rejected'
  is_verified?: boolean
  response?: { text: string; responded_at?: string; responder_name?: string } | null
  helpful_count?: number
  unhelpful_count?: number
  created_at: string
}

type ReviewTab = 'all' | 'published' | 'pending'

export function Reviews() {
  const [activeTab, setActiveTab] = useState<ReviewTab>('all')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer-reviews'],
    queryFn: async () => {
      const body = await api.get<any>('/customer/reviews')
      return body
    },
  })

  const reviews: Review[] = data?.data?.reviews ?? []

  const { pendingReviews, publishedReviews, avgRating } = useMemo(() => {
    const pending = reviews.filter(r => r.status === 'pending').length
    const published = reviews.filter(r => r.status === 'published').length
    const avg = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (Number(r.overall_rating) || 0), 0) / reviews.length).toFixed(1)
      : '0'
    return { pendingReviews: pending, publishedReviews: published, avgRating: avg }
  }, [reviews])

  const visibleReviews = useMemo(() => {
    if (activeTab === 'published') return reviews.filter(r => r.status === 'published')
    if (activeTab === 'pending') return reviews.filter(r => r.status === 'pending')
    return reviews
  }, [reviews, activeTab])

  if (isLoading) return <ReviewsSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load reviews</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

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
        <StatCard icon={<Star className="w-6 h-6" />} label="Total Reviews" value={reviews.length} iconClass="bg-eventra-amber-100 text-eventra-amber-600" />
        <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Published" value={publishedReviews} iconClass="bg-eventra-green-100 text-eventra-green-600" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Pending" value={pendingReviews} iconClass="bg-eventra-blue-100 text-eventra-blue-600" />
        <StatCard icon={<Heart className="w-6 h-6" />} label="Avg Rating" value={avgRating} iconClass="bg-eventra-red-100 text-eventra-red-600" />
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {(['all', 'published', 'pending'] as ReviewTab[]).map((tab) => (
          <button
            key={tab}
            className={cn('tab capitalize', activeTab === tab && 'tab-active')}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? 'All Reviews' : tab}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {visibleReviews.length > 0 ? (
          visibleReviews.map((review, index) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <ReviewCard review={review} />
            </motion.div>
          ))
        ) : (
          <EmptyReviewsState filtered={activeTab !== 'all'} />
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
      default: return <Package className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge variant="success">Published</Badge>
      case 'pending': return <Badge variant="warning">Pending Review</Badge>
      case 'hidden': return <Badge variant="neutral">Hidden</Badge>
      case 'flagged': return <Badge variant="warning">Flagged</Badge>
      case 'rejected': return <Badge variant="danger">Rejected</Badge>
      default: return <Badge variant="neutral">{status}</Badge>
    }
  }

  const detailedRatings = review.ratings && typeof review.ratings === 'object'
    ? Object.entries(review.ratings)
    : []

  const helpfulCount = review.helpful_count ?? 0
  const unhelpfulCount = review.unhelpful_count ?? 0

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
            {getServiceIcon(review.service_type)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-eventra-navy-900 capitalize">{review.service_type}</h3>
              {getStatusBadge(review.status)}
              {review.is_verified && <Badge variant="primary">Verified</Badge>}
            </div>
            <p className="text-body-sm text-eventra-slate-600">Reviewed on {formatDate(review.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={cn('w-6 h-6', i < (Number(review.overall_rating) || 0) ? 'fill-eventra-amber-400 text-eventra-amber-400' : 'text-eventra-slate-300')} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {review.title && (
          <h4 className="font-semibold text-eventra-navy-900">{review.title}</h4>
        )}
        {review.comment && <p className="text-eventra-slate-600">{review.comment}</p>}

        {detailedRatings.length > 0 && (
          <div className="pt-4 border-t border-eventra-slate-200">
            <p className="text-body-sm font-medium text-eventra-navy-900 mb-3">Detailed Ratings</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {detailedRatings.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-body-sm">
                  <span className="text-eventra-slate-600 capitalize">{key}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn('w-4 h-4', i < (Number(value) || 0) ? 'fill-eventra-amber-400 text-eventra-amber-400' : 'text-eventra-slate-300')} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {review.response?.text && (
          <div className="pt-4 border-t border-eventra-green-200 bg-eventra-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-eventra-green-600" />
              <span className="font-medium text-eventra-green-800">Provider Response</span>
              {review.response.responded_at && (
                <span className="text-body-xs text-eventra-green-600">{formatDate(review.response.responded_at)}</span>
              )}
            </div>
            <p className="text-eventra-green-700">{review.response.text}</p>
            {review.response.responder_name && (
              <p className="text-body-xs text-eventra-green-600 mt-1">— {review.response.responder_name}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-eventra-slate-200">
          <div className="flex items-center gap-4 text-body-sm text-eventra-slate-600">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{helpfulCount} Helpful</span>
            </span>
            <span className="flex items-center gap-1">
              <X className="w-4 h-4" />
              <span>{unhelpfulCount} Not Helpful</span>
            </span>
          </div>
          <button
            onClick={() => toast('Editing reviews is coming soon')}
            className="text-body-sm text-eventra-slate-500 hover:text-eventra-navy-900 transition-colors"
          >
            Need help with this review?
          </button>
        </div>
      </div>
    </Card>
  )
}

function EmptyReviewsState({ filtered }: { filtered?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <Star className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">{filtered ? 'No reviews in this view' : 'No reviews yet'}</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        {filtered
          ? 'Try another tab to see your other reviews.'
          : 'After completing a trip, share your experience to help other travelers make better decisions.'}
      </p>
    </motion.div>
  )
}

function StatCard({ icon, label, value, iconClass }: { icon: React.ReactNode; label: string; value: number | string; iconClass: string }) {
  return (
    <Card variant="elevated" padding="lg" className="text-center">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', iconClass)}>
        {icon}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-md font-display font-bold text-eventra-navy-900 mt-1">{value}</p>
    </Card>
  )
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-8 w-40 rounded-lg skeleton" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse h-32 text-center" />
        ))}
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse h-56" />
    </div>
  )
}
