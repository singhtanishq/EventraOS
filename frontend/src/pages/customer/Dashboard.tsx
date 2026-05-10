import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Luggage, Plane, Building2, Wallet, Award, TicketPercent, Heart, Star, MessageSquare, Calendar, MapPin, Users, CreditCard, Clock, TrendingUp, Shield, AlertCircle, Package, Train, Bus, Car, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ListSkeleton } from '@/components/ui/LoadingScreen'

interface DashboardData {
  stats: {
    upcoming_trips: number
    total_bookings: number
    total_spent: number
    loyalty_points: number
    wallet_balance: number
    pending_reviews: number
  }
  upcoming_trips: UpcomingTrip[]
  recent_bookings: RecentBooking[]
  notifications: Notification[]
  favorites: Favorite[]
}

interface UpcomingTrip {
  id: string
  booking_reference: string
  type: string
  name: string
  start_date: string
  end_date?: string
  status: string
  image?: string
  location: { city: string; country: string }
  travelers: number
}

interface RecentBooking {
  id: string
  booking_reference: string
  type: string
  name: string
  date: string
  amount: number
  currency: string
  status: string
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  is_read: boolean
  action_url?: string
}

interface Favorite {
  id: string
  type: string
  name: string
  image?: string
  location: { city: string; country: string }
  price: number
  currency: string
}

const typeIcons: Record<string, React.ReactNode> = {
  hotel: <Building2 className="w-5 h-5" />,
  flight: <Plane className="w-5 h-5" />,
  venue: <MapPin className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  bus: <Bus className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  activity: <Sparkles className="w-5 h-5" />,
  transfer: <MapPin className="w-5 h-5" />,
  package: <Package className="w-5 h-5" />,
}


export function CustomerDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => {
      return api.get<any>('/customer/dashboard')
    },
  })

  const dashboard = data?.data
  const stats = dashboard?.stats
  const upcomingTrips = dashboard?.upcoming_trips || []
  const recentBookings = dashboard?.recent_bookings || []
  const notifications = dashboard?.notifications || []
  const favorites = dashboard?.favorites || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-eventra-green-100 text-eventra-green-700'
      case 'pending': return 'bg-eventra-amber-100 text-eventra-amber-700'
      case 'cancelled': return 'bg-eventra-red-100 text-eventra-red-700'
      case 'completed': return 'bg-eventra-blue-100 text-eventra-blue-700'
      default: return 'bg-eventra-slate-100 text-eventra-slate-700'
    }
  }

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6 animate-in">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 bg-gradient-to-r from-eventra-navy-900 to-eventra-blue-800 rounded-2xl text-white"
      >
        <div>
          <h1 className="text-display-sm font-display font-bold mb-2">Welcome back!</h1>
          <p className="text-eventra-slate-200">Here's what's happening with your trips</p>
        </div>
        <div className="flex gap-3 lg:ml-auto">
          <Link to="/search" className="btn-secondary bg-white/20 border-white/30 text-white hover:bg-white/30">
            <Sparkles className="w-5 h-5 mr-2" />
            Plan a Trip
          </Link>
          <Link to="/customer/trips" className="btn-primary bg-white text-eventra-navy-900 hover:bg-eventra-slate-100">
            View All Trips
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-6 gap-4"
      >
        <StatCard
          icon={<Luggage className="w-6 h-6" />}
          label="Upcoming Trips"
          value={stats?.upcoming_trips || 0}
          color="eventra-blue"
          link="/customer/trips?filter=upcoming"
        />
        <StatCard
          icon={<Building2 className="w-6 h-6" />}
          label="Total Bookings"
          value={stats?.total_bookings || 0}
          color="eventra-cyan"
          link="/customer/trips"
        />
        <StatCard
          icon={<CreditCard className="w-6 h-6" />}
          label="Total Spent"
          value={formatCurrency(stats?.total_spent || 0, 'INR')}
          color="eventra-teal"
          link="/customer/trips"
        />
        <StatCard
          icon={<Wallet className="w-6 h-6" />}
          label="Wallet Balance"
          value={formatCurrency(stats?.wallet_balance || 0, 'INR')}
          color="eventra-green"
          link="/customer/wallet"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          label="Loyalty Points"
          value={stats?.loyalty_points?.toLocaleString() || '0'}
          color="eventra-amber"
          link="/customer/loyalty"
        />
        <StatCard
          icon={<Star className="w-6 h-6" />}
          label="Pending Reviews"
          value={stats?.pending_reviews || 0}
          color="eventra-red"
          link="/customer/reviews"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Upcoming Trips & Recent Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Trips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Upcoming Trips</h2>
              <Link to="/customer/trips?filter=upcoming" className="link text-body-sm">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingTrips.length > 0 ? (
                upcomingTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                      {trip.image ? (
                        <img src={trip.image} alt={trip.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {typeIcons[trip.type] || <Package className="w-8 h-8 text-eventra-slate-400" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-eventra-navy-900 truncate">{trip.name}</h3>
                        <Badge className={getStatusColor(trip.status)}>{trip.status}</Badge>
                      </div>
                      <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {trip.location.city}, {trip.location.country}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-body-sm text-eventra-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date || trip.start_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/customer/bookings/${trip.booking_reference}`)}>
                      View Details
                    </Button>
                  </motion.div>
                ))
              ) : (
                <Card variant="outlined" padding="lg" className="text-center">
                  <Luggage className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">No upcoming trips</h3>
                  <p className="text-eventra-slate-600 mb-4">Your next adventure is waiting to be planned!</p>
                  <Link to="/search" className="btn-primary inline-flex">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Exploring
                  </Link>
                </Card>
              )}
            </div>
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Recent Bookings</h2>
              <Link to="/customer/trips" className="link text-body-sm">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                      {typeIcons[booking.type] || <Package className="w-6 h-6 text-eventra-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-eventra-navy-900 truncate">{booking.name}</h3>
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                      </div>
                      <p className="text-body-sm text-eventra-slate-600 mt-1">{formatDate(booking.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-eventra-navy-900">{formatCurrency(booking.amount, booking.currency)}</p>
                      <p className="text-body-xs text-eventra-slate-500">{booking.booking_reference}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/customer/bookings/${booking.booking_reference}`)}>
                      View
                    </Button>
                  </motion.div>
                ))
              ) : (
                <Card variant="outlined" padding="lg" className="text-center">
                  <Building2 className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">No recent bookings</h3>
                  <p className="text-eventra-slate-600 mb-4">Start your journey with EventraOS!</p>
                  <Link to="/search" className="btn-primary inline-flex">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Browse Destinations
                  </Link>
                </Card>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Notifications & Favorites */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <ActionCard
                icon={<Sparkles className="w-6 h-6" />}
                title="Search Trips"
                description="Find hotels, flights & more"
                onClick={() => navigate('/search')}
              />
              <ActionCard
                icon={<Wallet className="w-6 h-6" />}
                title="Wallet"
                description="Manage balance & transactions"
                onClick={() => navigate('/customer/wallet')}
              />
              <ActionCard
                icon={<Award className="w-6 h-6" />}
                title="Rewards"
                description="View & redeem points"
                onClick={() => navigate('/customer/loyalty')}
              />
              <ActionCard
                icon={<TicketPercent className="w-6 h-6" />}
                title="Coupons"
                description="Available discounts"
                onClick={() => navigate('/customer/coupons')}
              />
              <ActionCard
                icon={<Heart className="w-6 h-6" />}
                title="Favorites"
                description="Saved hotels & venues"
                onClick={() => navigate('/customer/favorites')}
              />
              <ActionCard
                icon={<MessageSquare className="w-6 h-6" />}
                title="Support"
                description="Get help with bookings"
                onClick={() => navigate('/customer/support')}
              />
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Notifications</h2>
              <Link to="/customer/notifications" className="link text-body-sm">
                View all
              </Link>
            </div>
            <Card variant="elevated" padding="lg">
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className={cn('flex items-start gap-3 p-3 rounded-xl', !notification.is_read ? 'bg-eventra-blue-50' : 'bg-eventra-slate-50')}
                    >
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', !notification.is_read ? 'bg-eventra-blue-100 text-eventra-blue-600' : 'bg-eventra-slate-200 text-eventra-slate-400')}>
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={cn('font-medium text-eventra-navy-900', !notification.is_read ? '' : 'text-eventra-slate-600')}>{notification.title}</h4>
                        <p className="text-body-sm text-eventra-slate-600 mt-1">{notification.message}</p>
                        <p className="text-body-xs text-eventra-slate-400 mt-1">{getRelativeTime(notification.created_at)}</p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-eventra-blue-600 mt-2 flex-shrink-0" />
                      )}
                    </motion.div>
                  ))}
                  {notifications.length > 5 && (
                    <Link to="/customer/notifications" className="block text-center text-body-sm text-eventra-blue-600 hover:text-eventra-blue-700 mt-3">
                      View all {notifications.length} notifications
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <p className="text-eventra-slate-600">No notifications yet</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Favorites */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-semibold text-eventra-navy-900">Favorites</h2>
              <Link to="/customer/favorites" className="link text-body-sm">
                View all
              </Link>
            </div>
            <Card variant="elevated" padding="lg">
              {favorites.length > 0 ? (
                <div className="space-y-3">
                  {favorites.slice(0, 4).map((fav, index) => (
                    <motion.div
                      key={fav.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-eventra-slate-50 hover:bg-eventra-slate-100 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
                        {fav.image ? (
                          <img src={fav.image} alt={fav.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Building2 className="w-6 h-6 text-eventra-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-eventra-navy-900 truncate">{fav.name}</h4>
                        <p className="text-body-sm text-eventra-slate-600">{fav.location.city}, {fav.location.country}</p>
                      </div>
                      <span className="font-semibold text-eventra-navy-900">{formatCurrency(fav.price, fav.currency)}</span>
                    </motion.div>
                  ))}
                  {favorites.length > 4 && (
                    <Link to="/customer/favorites" className="block text-center text-body-sm text-eventra-blue-600 hover:text-eventra-blue-700 mt-3">
                      View all {favorites.length} favorites
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                  <p className="text-eventra-slate-600">No favorites yet</p>
                  <p className="text-body-sm text-eventra-slate-500 mt-1">Save hotels, venues & experiences you love</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, link }: { icon: React.ReactNode; label: string; value: string | number; color: string; link?: string }) {
  return (
    <Link to={link || '#'} className={cn('card p-5 hover:shadow-card-hover transition-shadow', link ? 'cursor-pointer' : '')}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', `bg-${color}-100 text-${color}-600`)}>
          {icon}
        </div>
        {link && <ChevronRight className="w-5 h-5 text-eventra-slate-400" />}
      </div>
      <p className="text-body-sm text-eventra-slate-600">{label}</p>
      <p className="text-heading-lg font-display font-bold text-eventra-navy-900 mt-1">{value}</p>
    </Link>
  )
}

function ActionCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card p-4 text-left hover:shadow-card-hover transition-shadow group"
    >
      <div className="w-10 h-10 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-semibold text-eventra-navy-900 mb-1">{title}</h4>
      <p className="text-body-sm text-eventra-slate-600">{description}</p>
    </button>
  )
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'booking_confirmed': return <CheckCircle2 className="w-5 h-5" />
    case 'payment_confirmed': return <CreditCard className="w-5 h-5" />
    case 'travel_reminder': return <Calendar className="w-5 h-5" />
    case 'event_reminder': return <Calendar className="w-5 h-5" />
    case 'promo': return <TicketPercent className="w-5 h-5" />
    default: return <Bell className="w-5 h-5" />
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-32 bg-eventra-slate-100 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-eventra-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ListSkeleton count={4} />
          <ListSkeleton count={4} />
        </div>
        <div className="space-y-6">
          <div className="h-8 bg-eventra-slate-100 rounded-xl animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-eventra-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-8 bg-eventra-slate-100 rounded-xl animate-pulse mt-6 mb-4" />
          <ListSkeleton count={3} />
        </div>
      </div>
    </div>
  )
}