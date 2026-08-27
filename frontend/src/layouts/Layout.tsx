import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Luggage,
  Plane,
  TrainFront,
  Bus,
  Building2,
  Car,
  MapPin,
  Ship,
  Briefcase,
  CreditCard,
  Wallet,
  Award,
  TicketPercent,
  Star,
  MessageSquare,
  Heart,
  Bell,
  Shield,
  LogOut,
  User,
  Menu,
  X,
  Search,
  ChevronDown,
  Users,
  FileText,
  ClipboardList,
  Target,
  BarChart3,
  Settings,
  Activity,
  Home as HomeIcon,
  UserCheck,
  CheckSquare,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Buses', href: '/buses', icon: Bus },
  { name: 'Cars', href: '/cars', icon: Car },
  { name: 'Activities', href: '/activities', icon: Ship },
]

const moreNavigation = [
  { name: 'Hotels', href: '/hotels', icon: Building2 },
  { name: 'Flights', href: '/flights', icon: Plane },
  { name: 'Trains', href: '/trains', icon: TrainFront },
  { name: 'Venues', href: '/venues', icon: MapPin },
  { name: 'Transfers', href: '/transfers', icon: MapPin },
  { name: 'Packages', href: '/packages', icon: Briefcase },
]

const customerNav = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
  { name: 'My Trips', href: '/customer/trips', icon: Luggage },
  { name: 'Wallet', href: '/customer/wallet', icon: Wallet },
  { name: 'Rewards', href: '/customer/loyalty', icon: Award },
  { name: 'Coupons', href: '/customer/coupons', icon: TicketPercent },
  { name: 'Favorites', href: '/customer/favorites', icon: Heart },
  { name: 'Reviews', href: '/customer/reviews', icon: Star },
  { name: 'Support', href: '/customer/support', icon: MessageSquare },
  { name: 'Profile', href: '/customer/profile', icon: User },
  { name: 'Security', href: '/customer/security', icon: Shield },
  { name: 'Notifications', href: '/customer/notifications', icon: Bell },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { getItemCount } = useCartStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const cartCount = getItemCount()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
    setMoreMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-eventra-slate-200">
        <nav className="section-container" aria-label="Main navigation">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="EventraOS Home">
              <div className="w-10 h-10 rounded-xl bg-eventra-navy-900 flex items-center justify-center">
                <span className="text-white font-display font-bold text-xl">E</span>
              </div>
              <span className="font-display font-bold text-heading-md text-eventra-navy-900 hidden sm:block">
                EventraOS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 flex-1 max-w-3xl mx-4">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-all duration-200 whitespace-nowrap',
                      isActive
                        ? 'bg-eventra-navy-900 text-white shadow-card'
                        : 'text-eventra-slate-600 hover:text-eventra-navy-900 hover:bg-eventra-slate-100'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}

              {/* More dropdown for remaining services */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-all duration-200',
                    moreNavigation.some((item) => location.pathname.startsWith(item.href))
                      ? 'bg-eventra-navy-900 text-white shadow-card'
                      : 'text-eventra-slate-600 hover:text-eventra-navy-900 hover:bg-eventra-slate-100'
                  )}
                  aria-expanded={moreMenuOpen}
                  aria-haspopup="true"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  Services
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', moreMenuOpen && 'rotate-180')} aria-hidden="true" />
                </button>

                <AnimatePresence>
                  {moreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="dropdown-menu left-0 right-auto w-52"
                      role="menu"
                    >
                      {moreNavigation.map((item) => (
                        <Link key={item.name} to={item.href} className="dropdown-item" role="menuitem">
                          <item.icon className="w-4 h-4" aria-hidden="true" />
                          {item.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-eventra-slate-100 rounded-xl text-body-sm font-medium text-eventra-navy-700 hover:bg-eventra-slate-200 transition-colors"
                aria-label="Open search"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                <span>Search</span>
              </button>

              {/* Cart */}
              {cartCount > 0 && (
                <Link
                  to="/checkout"
                  className="relative p-2 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100 hover:text-eventra-navy-900 transition-colors"
                  aria-label={`Cart with ${cartCount} items`}
                >
                  <Luggage className="w-5 h-5" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-eventra-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                </Link>
              )}

              {/* Auth / User Menu */}
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-eventra-slate-100 transition-colors"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="avatar-md">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="hidden sm:block font-medium text-body-sm text-eventra-navy-900">
                      {user.name}
                    </span>
                    <ChevronDown className={cn('w-4 h-4 text-eventra-slate-500 transition-transform', userMenuOpen && 'rotate-180')} aria-hidden="true" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="dropdown-menu"
                        role="menu"
                      >
                        <div className="px-4 py-3 border-b border-eventra-slate-200">
                          <p className="font-medium text-eventra-navy-900">{user.name}</p>
                          <p className="text-body-sm text-eventra-slate-500 truncate">{user.email}</p>
                          <span className={cn(
                            'badge mt-1.5',
                            user.role === 'admin' ? 'badge-danger' : user.role === 'agent' ? 'badge-primary' : 'badge-success'
                          )}>
                            {user.role}
                          </span>
                        </div>

                        <Link to="/customer/dashboard" className="dropdown-item" role="menuitem">
                          <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                          Dashboard
                        </Link>
                        <Link to="/customer/trips" className="dropdown-item" role="menuitem">
                          <Luggage className="w-4 h-4" aria-hidden="true" />
                          My Trips
                        </Link>
                        <Link to="/customer/wallet" className="dropdown-item" role="menuitem">
                          <Wallet className="w-4 h-4" aria-hidden="true" />
                          Wallet
                        </Link>
                        <Link to="/customer/favorites" className="dropdown-item" role="menuitem">
                          <Heart className="w-4 h-4" aria-hidden="true" />
                          Favorites
                        </Link>
                        <div className="dropdown-divider" role="separator" />
                        <Link to="/customer/profile" className="dropdown-item" role="menuitem">
                          <User className="w-4 h-4" aria-hidden="true" />
                          Profile
                        </Link>
                        <Link to="/customer/security" className="dropdown-item" role="menuitem">
                          <Shield className="w-4 h-4" aria-hidden="true" />
                          Security
                        </Link>
                        <div className="dropdown-divider" role="separator" />
                        <button
                          onClick={handleLogout}
                          className="dropdown-item w-full text-left text-eventra-red-600 hover:bg-eventra-red-50"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4" aria-hidden="true" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="btn-ghost">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100 transition-colors"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-eventra-slate-200 bg-white overflow-hidden"
            >
              <div className="p-4 space-y-2">
                {[...navigation, ...moreNavigation].map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-colors',
                        isActive
                          ? 'bg-eventra-navy-900 text-white'
                          : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                ))}

                <button
                  onClick={() => { setMobileMenuOpen(false); setSearchOpen(true) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-eventra-slate-100 text-eventra-navy-900 font-medium"
                >
                  <Search className="w-5 h-5" aria-hidden="true" />
                  Search
                </button>

                {isAuthenticated ? (
                  <div className="pt-4 border-t border-eventra-slate-200 space-y-2">
                    {customerNav.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium text-eventra-slate-600 hover:bg-eventra-slate-100 transition-colors"
                      >
                        <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                        {item.name}
                      </NavLink>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium text-eventra-red-600 hover:bg-eventra-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-eventra-slate-200 flex gap-3">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary flex-1 text-center">
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary flex-1">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-eventra-navy-950 text-eventra-slate-300 border-t border-eventra-navy-800">
        <div className="section-container py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4" aria-label="EventraOS Home">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="text-white font-display font-bold text-xl">E</span>
                </div>
                <span className="font-display font-bold text-heading-md text-white">EventraOS</span>
              </Link>
              <p className="text-body-sm text-eventra-slate-400 mb-4">
                One platform for travel, stays, events, transportation and experiences.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-eventra-slate-400 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                </a>
                <a href="#" className="text-eventra-slate-400 hover:text-white transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="#" className="text-eventra-slate-400 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Products</h4>
              <ul className="space-y-2 text-body-sm">
                <li><Link to="/hotels" className="hover:text-white transition-colors">Hotels</Link></li>
                <li><Link to="/flights" className="hover:text-white transition-colors">Flights</Link></li>
                <li><Link to="/trains" className="hover:text-white transition-colors">Trains</Link></li>
                <li><Link to="/buses" className="hover:text-white transition-colors">Buses</Link></li>
                <li><Link to="/venues" className="hover:text-white transition-colors">Venues</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">More</h4>
              <ul className="space-y-2 text-body-sm">
                <li><Link to="/cars" className="hover:text-white transition-colors">Car Rentals</Link></li>
                <li><Link to="/activities" className="hover:text-white transition-colors">Activities</Link></li>
                <li><Link to="/transfers" className="hover:text-white transition-colors">Transfers</Link></li>
                <li><Link to="/packages" className="hover:text-white transition-colors">Packages</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Account</h4>
              <ul className="space-y-2 text-body-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link to="/customer/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/customer/trips" className="hover:text-white transition-colors">My Trips</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-body-sm">
                <li><Link to="/search" className="hover:text-white transition-colors">Search</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-eventra-navy-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-body-sm text-eventra-slate-500">
              © {new Date().getFullYear()} EventraOS. All rights reserved.
            </p>
            <div className="flex gap-6 text-body-sm">
              <Link to="#" className="text-eventra-slate-500 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="#" className="text-eventra-slate-500 hover:text-white transition-colors">Terms of Service</Link>
              <Link to="#" className="text-eventra-slate-500 hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Search Modal Component
function SearchModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'hotels' | 'flights' | 'venues'>('hotels')
  const tabs = [
    { id: 'hotels', label: 'Hotels', icon: Building2 },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'venues', label: 'Venues', icon: MapPin },
  ] as const

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pb-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
    >
      <div className="modal-overlay" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-elevated overflow-hidden"
      >
        <div className="p-4 border-b border-eventra-slate-200 flex items-center justify-between">
          <h2 id="search-modal-title" className="text-heading-md font-semibold text-eventra-navy-900">
            Quick Search
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-eventra-slate-500 hover:bg-eventra-slate-100 hover:text-eventra-navy-900 transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-eventra-slate-200">
          <div className="tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={cn(
                  'tab',
                  activeTab === tab.id && 'tab-active'
                )}
              >
                <tab.icon className="w-4 h-4" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'hotels' && <HotelSearchForm onClose={onClose} />}
          {activeTab === 'flights' && <FlightSearchForm onClose={onClose} />}
          {activeTab === 'venues' && <VenueSearchForm onClose={onClose} />}
        </div>
      </motion.div>
    </motion.div>
  )
}

function HotelSearchForm({ onClose }: { onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onClose(); window.location.href = '/buses'; }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="hotel-destination" className="label">Destination</label>
          <input type="text" id="hotel-destination" className="input" placeholder="City, hotel, landmark..." required />
        </div>
        <div>
          <label htmlFor="hotel-checkin" className="label">Check-in</label>
          <input type="date" id="hotel-checkin" className="input" required />
        </div>
        <div>
          <label htmlFor="hotel-checkout" className="label">Check-out</label>
          <input type="date" id="hotel-checkout" className="input" required />
        </div>
        <div>
          <label htmlFor="hotel-rooms" className="label">Rooms &amp; Guests</label>
          <select id="hotel-rooms" className="input form-select">
            <option>1 Room, 2 Adults</option>
            <option>2 Rooms, 4 Adults</option>
            <option>3 Rooms, 6 Adults</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full btn-lg">
        Search Hotels
      </button>
    </form>
  )
}

function FlightSearchForm({ onClose }: { onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onClose(); window.location.href = '/buses'; }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="flight-origin" className="label">From</label>
          <input type="text" id="flight-origin" className="input" placeholder="City or airport" required />
        </div>
        <div>
          <label htmlFor="flight-destination" className="label">To</label>
          <input type="text" id="flight-destination" className="input" placeholder="City or airport" required />
        </div>
        <div>
          <label htmlFor="flight-departure" className="label">Departure</label>
          <input type="date" id="flight-departure" className="input" required />
        </div>
        <div>
          <label htmlFor="flight-return" className="label">Return (Optional)</label>
          <input type="date" id="flight-return" className="input" />
        </div>
        <div>
          <label htmlFor="flight-passengers" className="label">Passengers</label>
          <select id="flight-passengers" className="input form-select">
            <option>1 Adult, Economy</option>
            <option>2 Adults, Economy</option>
            <option>1 Adult, Business</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full btn-lg">
        Search Flights
      </button>
    </form>
  )
}

function VenueSearchForm({ onClose }: { onClose: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onClose(); window.location.href = '/buses'; }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="venue-city" className="label">City</label>
          <input type="text" id="venue-city" className="input" placeholder="City" required />
        </div>
        <div>
          <label htmlFor="venue-type" className="label">Event Type</label>
          <select id="venue-type" className="input form-select">
            <option>Wedding</option>
            <option>Conference</option>
            <option>Corporate Event</option>
            <option>Party</option>
            <option>Concert</option>
          </select>
        </div>
        <div>
          <label htmlFor="venue-date" className="label">Event Date</label>
          <input type="date" id="venue-date" className="input" required />
        </div>
        <div>
          <label htmlFor="venue-guests" className="label">Guest Count</label>
          <input type="number" id="venue-guests" className="input" placeholder="Number of guests" min="1" required />
        </div>
      </div>
      <button type="submit" className="btn-primary w-full btn-lg">
        Search Venues
      </button>
    </form>
  )
}