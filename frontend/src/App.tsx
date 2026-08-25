import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { Toaster } from 'react-hot-toast'
import LoadingScreen from '@/components/ui/LoadingScreen'

// Layouts
import Layout from '@/layouts/Layout'
import AuthLayout from '@/layouts/AuthLayout'

// Public Pages
const Home = lazy(() => import('@/pages/public/Home').then((m) => ({ default: m.Home })))
const SearchPage = lazy(() => import('@/pages/public/SearchPage').then((m) => ({ default: m.SearchPage })))
const BusResults = lazy(() => import('@/pages/buses/BusResults').then((m) => ({ default: m.BusResults })))
const CarResults = lazy(() => import('@/pages/cars/CarResults').then((m) => ({ default: m.CarResults })))
const ActivityResults = lazy(() => import('@/pages/activities/ActivityResults').then((m) => ({ default: m.ActivityResults })))

// Auth Pages
const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/auth/Register').then((m) => ({ default: m.Register })))

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
            <Route path="buses" element={<BusResults />} />
            <Route path="cars" element={<CarResults />} />
            <Route path="activities" element={<ActivityResults />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<PlaceholderPage title="Checkout" />} />
              <Route path="customer/dashboard" element={<PlaceholderPage title="Customer Dashboard" />} />
              <Route path="customer/trips" element={<PlaceholderPage title="My Trips" />} />
              <Route path="agent/dashboard" element={<PlaceholderPage title="Agent Dashboard" />} />
              <Route path="admin/dashboard" element={<PlaceholderPage title="Admin Dashboard" />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="section-container py-16 text-center">
      <h1 className="text-display-sm font-display font-bold text-eventra-navy-900 mb-4">{title}</h1>
      <p className="text-body-lg text-eventra-slate-600 mb-8">
        This section is under construction. Core booking flows are fully functional.
      </p>
      <a href="/search" className="btn-primary">
        Explore Travel Services
      </a>
    </div>
  )
}

export default App