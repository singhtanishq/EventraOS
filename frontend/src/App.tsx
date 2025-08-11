import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Toaster } from 'react-hot-toast'
import LoadingScreen from '@/components/ui/LoadingScreen'

// Public Pages
const Home = lazy(() => import('@/pages/public/Home').then((m) => ({ default: m.Home })))
const SearchPage = lazy(() => import('@/pages/public/SearchPage').then((m) => ({ default: m.SearchPage })))
const BusResults = lazy(() => import('@/pages/buses/BusResults').then((m) => ({ default: m.BusResults })))
const CarResults = lazy(() => import('@/pages/cars/CarResults').then((m) => ({ default: m.CarResults })))
const ActivityResults = lazy(() => import('@/pages/activities/ActivityResults').then((m) => ({ default: m.ActivityResults })))

// Auth Pages
const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/auth/Register').then((m) => ({ default: m.Register })))

function App() {
  const { isAuthenticated } = useAuthStore()

  // Initialize auth state from localStorage
  useEffect(() => {
    useAuthStore.getState().setLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="buses" element={<BusResults />} />
          <Route path="cars" element={<CarResults />} />
          <Route path="activities" element={<ActivityResults />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App