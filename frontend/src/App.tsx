import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { Toaster } from 'react-hot-toast'
import Layout from '@/layouts/Layout'
import AuthLayout from '@/layouts/AuthLayout'
import AdminLayout from '@/layouts/AdminLayout'
import AgentLayout from '@/layouts/AgentLayout'
import LoadingScreen from '@/components/ui/LoadingScreen'

// Public Pages
const Home = lazy(() => import('@/pages/public/Home').then((m) => ({ default: m.Home })))
const SearchPage = lazy(() => import('@/pages/public/SearchPage').then((m) => ({ default: m.SearchPage })))
const HotelResults = lazy(() => import('@/pages/hotels/HotelResults').then((m) => ({ default: m.HotelResults })))
const HotelDetail = lazy(() => import('@/pages/hotels/HotelDetail').then((m) => ({ default: m.HotelDetail })))
const FlightResults = lazy(() => import('@/pages/flights/FlightResults').then((m) => ({ default: m.FlightResults })))
const FlightDetail = lazy(() => import('@/pages/flights/FlightDetail').then((m) => ({ default: m.FlightDetail })))
const VenueResults = lazy(() => import('@/pages/venues/VenueResults').then((m) => ({ default: m.VenueResults })))
const VenueDetail = lazy(() => import('@/pages/venues/VenueDetail').then((m) => ({ default: m.VenueDetail })))
const TrainResults = lazy(() => import('@/pages/trains/TrainResults').then((m) => ({ default: m.TrainResults })))
const BusResults = lazy(() => import('@/pages/buses/BusResults').then((m) => ({ default: m.BusResults })))
const CarResults = lazy(() => import('@/pages/cars/CarResults').then((m) => ({ default: m.CarResults })))
const ActivityResults = lazy(() => import('@/pages/activities/ActivityResults').then((m) => ({ default: m.ActivityResults })))
const TransferResults = lazy(() => import('@/pages/transfers/TransferResults').then((m) => ({ default: m.TransferResults })))
const PackageResults = lazy(() => import('@/pages/packages/PackageResults').then((m) => ({ default: m.PackageResults })))

// Auth Pages
const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/auth/Register').then((m) => ({ default: m.Register })))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail').then((m) => ({ default: m.VerifyEmail })))

// Checkout
const Checkout = lazy(() => import('@/pages/checkout/Checkout').then((m) => ({ default: m.Checkout })))
const PaymentProcessing = lazy(() => import('@/pages/checkout/PaymentProcessing').then((m) => ({ default: m.PaymentProcessing })))
const BookingConfirmation = lazy(() => import('@/pages/checkout/BookingConfirmation').then((m) => ({ default: m.BookingConfirmation })))

// Customer Dashboard
const CustomerDashboard = lazy(() => import('@/pages/customer/Dashboard').then((m) => ({ default: m.CustomerDashboard })))
const MyTrips = lazy(() => import('@/pages/customer/MyTrips').then((m) => ({ default: m.MyTrips })))
const BookingDetail = lazy(() => import('@/pages/customer/BookingDetail').then((m) => ({ default: m.BookingDetail })))
const CustomerProfile = lazy(() => import('@/pages/customer/Profile').then((m) => ({ default: m.CustomerProfile })))
const SavedTravelers = lazy(() => import('@/pages/customer/SavedTravelers').then((m) => ({ default: m.SavedTravelers })))
const Wallet = lazy(() => import('@/pages/customer/Wallet').then((m) => ({ default: m.Wallet })))
const Loyalty = lazy(() => import('@/pages/customer/Loyalty').then((m) => ({ default: m.Loyalty })))
const Coupons = lazy(() => import('@/pages/customer/Coupons').then((m) => ({ default: m.Coupons })))
const Reviews = lazy(() => import('@/pages/customer/Reviews').then((m) => ({ default: m.Reviews })))
const Support = lazy(() => import('@/pages/customer/Support').then((m) => ({ default: m.Support })))
const Favorites = lazy(() => import('@/pages/customer/Favorites').then((m) => ({ default: m.Favorites })))
const Notifications = lazy(() => import('@/pages/customer/Notifications').then((m) => ({ default: m.Notifications })))
const Security = lazy(() => import('@/pages/customer/Security').then((m) => ({ default: m.Security })))

// Agent Dashboard
const AgentDashboard = lazy(() => import('@/pages/agent/Dashboard').then((m) => ({ default: m.AgentDashboard })))
const AgentCustomers = lazy(() => import('@/pages/agent/Customers').then((m) => ({ default: m.AgentCustomers })))
const AgentBookingWorkspace = lazy(() => import('@/pages/agent/BookingWorkspace').then((m) => ({ default: m.AgentBookingWorkspace })))
const AgentQuotes = lazy(() => import('@/pages/agent/Quotes').then((m) => ({ default: m.AgentQuotes })))
const AgentBookings = lazy(() => import('@/pages/agent/Bookings').then((m) => ({ default: m.AgentBookings })))
const AgentCommissions = lazy(() => import('@/pages/agent/Commissions').then((m) => ({ default: m.AgentCommissions })))
const AgentTasks = lazy(() => import('@/pages/agent/Tasks').then((m) => ({ default: m.AgentTasks })))
const AgentSupport = lazy(() => import('@/pages/agent/Support').then((m) => ({ default: m.AgentSupport })))

// Admin Dashboard
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
const AdminSettings = lazy(() => import('@/pages/admin/Settings').then((m) => ({ default: m.AdminSettings })))
const AdminSystemHealth = lazy(() => import('@/pages/admin/SystemHealth').then((m) => ({ default: m.AdminSystemHealth })))

// Common
const NotFound = lazy(() => import('@/pages/common/NotFound').then((m) => ({ default: m.NotFound })))
const Maintenance = lazy(() => import('@/pages/common/Maintenance').then((m) => ({ default: m.Maintenance })))

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  const { isLoading: authLoading } = useAuthStore()
  const { revalidatePricing } = useCartStore()

  // Revalidate cart pricing on app load
  // revalidatePricing()

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="hotels" element={<HotelResults />} />
          <Route path="hotels/:id" element={<HotelDetail />} />
          <Route path="flights" element={<FlightResults />} />
          <Route path="flights/:id" element={<FlightDetail />} />
          <Route path="venues" element={<VenueResults />} />
          <Route path="venues/:id" element={<VenueDetail />} />
          <Route path="trains" element={<TrainResults />} />
          <Route path="buses" element={<BusResults />} />
          <Route path="cars" element={<CarResults />} />
          <Route path="activities" element={<ActivityResults />} />
          <Route path="transfers" element={<TransferResults />} />
          <Route path="packages" element={<PackageResults />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
          <Route path="reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
          <Route path="verify-email" element={<PublicOnlyRoute><VerifyEmail /></PublicOnlyRoute>} />
        </Route>

        {/* Checkout Routes */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="checkout" element={<Checkout />} />
          <Route path="checkout/payment" element={<PaymentProcessing />} />
          <Route path="booking/confirmed/:reference" element={<BookingConfirmation />} />
        </Route>

        {/* Customer Dashboard */}
        <Route path="/customer" element={<PrivateRoute allowedRoles={['customer']}><Layout /></PrivateRoute>}>
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="trips" element={<MyTrips />} />
          <Route path="bookings/:reference" element={<BookingDetail />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="travelers" element={<SavedTravelers />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="loyalty" element={<Loyalty />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="support" element={<Support />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="security" element={<Security />} />
        </Route>

        {/* Agent Dashboard */}
        <Route path="/agent" element={<PrivateRoute allowedRoles={['agent']}><AgentLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<AgentDashboard />} />
          <Route path="customers" element={<AgentCustomers />} />
          <Route path="booking-workspace" element={<AgentBookingWorkspace />} />
          <Route path="quotes" element={<AgentQuotes />} />
          <Route path="bookings" element={<AgentBookings />} />
          <Route path="commissions" element={<AgentCommissions />} />
          <Route path="tasks" element={<AgentTasks />} />
          <Route path="support" element={<AgentSupport />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminLayout /></PrivateRoute>}>
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
          <Route path="settings" element={<AdminSettings />} />
          <Route path="system-health" element={<AdminSystemHealth />} />
        </Route>

        {/* Common */}
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App