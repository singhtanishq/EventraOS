import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { Toaster } from 'react-hot-toast'
import LoadingScreen from '@/components/ui/LoadingScreen'

// Layouts
import Layout from '@/layouts/Layout'
import AuthLayout from '@/layouts/AuthLayout'
import AdminLayout from '@/layouts/AdminLayout'
import AgentLayout from '@/layouts/AgentLayout'

// Public Pages
const Home = lazy(() => import('@/pages/public/Home').then((m) => ({ default: m.Home })))
const SearchPage = lazy(() => import('@/pages/public/SearchPage').then((m) => ({ default: m.SearchPage })))

// Service Results Pages
const HotelResults = lazy(() => import('@/pages/hotels/HotelResults').then((m) => ({ default: m.HotelResults })))
const HotelDetail = lazy(() => import('@/pages/hotels/HotelDetail').then((m) => ({ default: m.HotelDetail })))
const FlightResults = lazy(() => import('@/pages/flights/FlightResults').then((m) => ({ default: m.FlightResults })))
const FlightDetail = lazy(() => import('@/pages/flights/FlightDetail').then((m) => ({ default: m.FlightDetail })))
const TrainResults = lazy(() => import('@/pages/trains/TrainResults').then((m) => ({ default: m.TrainResults })))
const BusResults = lazy(() => import('@/pages/buses/BusResults').then((m) => ({ default: m.BusResults })))
const VenueResults = lazy(() => import('@/pages/venues/VenueResults').then((m) => ({ default: m.VenueResults })))
const VenueDetail = lazy(() => import('@/pages/venues/VenueDetail').then((m) => ({ default: m.VenueDetail })))
const CarResults = lazy(() => import('@/pages/cars/CarResults').then((m) => ({ default: m.CarResults })))
const ActivityResults = lazy(() => import('@/pages/activities/ActivityResults').then((m) => ({ default: m.ActivityResults })))
const TransferResults = lazy(() => import('@/pages/transfers/TransferResults').then((m) => ({ default: m.TransferResults })))
const PackageResults = lazy(() => import('@/pages/packages/PackageResults').then((m) => ({ default: m.PackageResults })))

// Checkout Flow
const Checkout = lazy(() => import('@/pages/checkout/Checkout').then((m) => ({ default: m.Checkout })))
const PaymentProcessing = lazy(() => import('@/pages/checkout/PaymentProcessing').then((m) => ({ default: m.PaymentProcessing })))
const BookingConfirmation = lazy(() => import('@/pages/checkout/BookingConfirmation').then((m) => ({ default: m.BookingConfirmation })))

// Auth Pages
const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/auth/Register').then((m) => ({ default: m.Register })))

// Customer Pages
const CustomerDashboard = lazy(() => import('@/pages/customer/Dashboard').then((m) => ({ default: m.CustomerDashboard })))
const MyTrips = lazy(() => import('@/pages/customer/MyTrips').then((m) => ({ default: m.MyTrips })))
const BookingDetail = lazy(() => import('@/pages/customer/BookingDetail').then((m) => ({ default: m.BookingDetail })))
const Wallet = lazy(() => import('@/pages/customer/Wallet').then((m) => ({ default: m.Wallet })))
const Loyalty = lazy(() => import('@/pages/customer/Loyalty').then((m) => ({ default: m.Loyalty })))
const Coupons = lazy(() => import('@/pages/customer/Coupons').then((m) => ({ default: m.Coupons })))
const Favorites = lazy(() => import('@/pages/customer/Favorites').then((m) => ({ default: m.Favorites })))
const Reviews = lazy(() => import('@/pages/customer/Reviews').then((m) => ({ default: m.Reviews })))
const Notifications = lazy(() => import('@/pages/customer/Notifications').then((m) => ({ default: m.Notifications })))
const Security = lazy(() => import('@/pages/customer/Security').then((m) => ({ default: m.Security })))
const SavedTravelers = lazy(() => import('@/pages/customer/SavedTravelers').then((m) => ({ default: m.SavedTravelers })))
const CustomerSupport = lazy(() => import('@/pages/customer/Support').then((m) => ({ default: m.Support })))

// Agent Pages
const AgentDashboard = lazy(() => import('@/pages/agent/Dashboard').then((m) => ({ default: m.AgentDashboard })))
const AgentCustomers = lazy(() => import('@/pages/agent/Customers').then((m) => ({ default: m.AgentCustomers })))
const AgentBookingWorkspace = lazy(() => import('@/pages/agent/BookingWorkspace').then((m) => ({ default: m.AgentBookingWorkspace })))
const AgentQuotes = lazy(() => import('@/pages/agent/Quotes').then((m) => ({ default: m.AgentQuotes })))
const AgentBookings = lazy(() => import('@/pages/agent/Bookings').then((m) => ({ default: m.AgentBookings })))
const AgentCommissions = lazy(() => import('@/pages/agent/Commissions').then((m) => ({ default: m.AgentCommissions })))
const AgentTasks = lazy(() => import('@/pages/agent/Tasks').then((m) => ({ default: m.AgentTasks })))
const AgentSupport = lazy(() => import('@/pages/agent/Support').then((m) => ({ default: m.AgentSupport })))

// Admin Pages
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard').then((m) => ({ default: m.AdminDashboard })))
const AdminCustomers = lazy(() => import('@/pages/admin/Customers').then((m) => ({ default: m.AdminCustomers })))
const AdminAgents = lazy(() => import('@/pages/admin/Agents').then((m) => ({ default: m.AdminAgents })))
const AdminBookings = lazy(() => import('@/pages/admin/Bookings').then((m) => ({ default: m.AdminBookings })))
const AdminSuppliers = lazy(() => import('@/pages/admin/Suppliers').then((m) => ({ default: m.AdminSuppliers })))
const AdminVenues = lazy(() => import('@/pages/admin/Venues').then((m) => ({ default: m.AdminVenues })))
const AdminHotels = lazy(() => import('@/pages/admin/Hotels').then((m) => ({ default: m.AdminHotels })))
const AdminTransports = lazy(() => import('@/pages/admin/Transports').then((m) => ({ default: m.AdminTransports })))
const AdminPromotions = lazy(() => import('@/pages/admin/Promotions').then((m) => ({ default: m.AdminPromotions })))
const AdminPayments = lazy(() => import('@/pages/admin/Payments').then((m) => ({ default: m.AdminPayments })))
const AdminRefunds = lazy(() => import('@/pages/admin/Refunds').then((m) => ({ default: m.AdminRefunds })))
const AdminCommissions = lazy(() => import('@/pages/admin/Commissions').then((m) => ({ default: m.AdminCommissions })))
const AdminReports = lazy(() => import('@/pages/admin/Reports').then((m) => ({ default: m.AdminReports })))
const AdminAuditLogs = lazy(() => import('@/pages/admin/AuditLogs').then((m) => ({ default: m.AdminAuditLogs })))

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen message="Checking your session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  // Restore session once on boot: verify persisted token against the API
  useEffect(() => {
    const initAuth = async () => {
      const { token, isAuthenticated, logout, setLoading } = useAuthStore.getState()
      if (!isAuthenticated || !token) {
        setLoading(false)
        return
      }
      try {
        await api.get('/auth/me')
        // Token still valid — keep persisted session
      } catch {
        logout()
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <ScrollToTop />
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Auth Routes (split-screen layout) */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Public Routes inside main layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="search" element={<SearchPage />} />

            {/* Service Results */}
            <Route path="hotels" element={<HotelResults />} />
            <Route path="hotels/:id" element={<HotelDetail />} />
            <Route path="flights" element={<FlightResults />} />
            <Route path="flights/:id" element={<FlightDetail />} />
            <Route path="trains" element={<TrainResults />} />
            <Route path="buses" element={<BusResults />} />
            <Route path="venues" element={<VenueResults />} />
            <Route path="venues/:id" element={<VenueDetail />} />
            <Route path="cars" element={<CarResults />} />
            <Route path="activities" element={<ActivityResults />} />
            <Route path="transfers" element={<TransferResults />} />
            <Route path="packages" element={<PackageResults />} />

            {/* Checkout Flow */}
            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<Checkout />} />
              <Route path="booking/payment/:id" element={<PaymentProcessing />} />
              <Route path="booking/confirmation/:reference" element={<BookingConfirmation />} />
            </Route>

            {/* Customer Area */}
            <Route element={<ProtectedRoute />}>
              <Route path="customer/dashboard" element={<CustomerDashboard />} />
              <Route path="customer/trips" element={<MyTrips />} />
              <Route path="customer/bookings/:id" element={<BookingDetail />} />
              <Route path="customer/wallet" element={<Wallet />} />
              <Route path="customer/loyalty" element={<Loyalty />} />
              <Route path="customer/coupons" element={<Coupons />} />
              <Route path="customer/favorites" element={<Favorites />} />
              <Route path="customer/reviews" element={<Reviews />} />
              <Route path="customer/notifications" element={<Notifications />} />
              <Route path="customer/security" element={<Security />} />
              <Route path="customer/travelers" element={<SavedTravelers />} />
              <Route path="customer/support" element={<CustomerSupport />} />
            </Route>

            {/* Agent Area */}
            <Route element={<ProtectedRoute />}>
              <Route path="agent" element={<AgentLayout />}>
                <Route index element={<AgentDashboard />} />
                <Route path="dashboard" element={<AgentDashboard />} />
                <Route path="customers" element={<AgentCustomers />} />
                <Route path="booking-workspace" element={<AgentBookingWorkspace />} />
                <Route path="quotes" element={<AgentQuotes />} />
                <Route path="bookings" element={<AgentBookings />} />
                <Route path="commissions" element={<AgentCommissions />} />
                <Route path="tasks" element={<AgentTasks />} />
                <Route path="support" element={<AgentSupport />} />
              </Route>
            </Route>

            {/* Admin Area */}
            <Route element={<ProtectedRoute />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="agents" element={<AdminAgents />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="suppliers" element={<AdminSuppliers />} />
                <Route path="venues" element={<AdminVenues />} />
                <Route path="hotels" element={<AdminHotels />} />
                <Route path="transports" element={<AdminTransports />} />
                <Route path="promotions" element={<AdminPromotions />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="refunds" element={<AdminRefunds />} />
                <Route path="commissions" element={<AdminCommissions />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App