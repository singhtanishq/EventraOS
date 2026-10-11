import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import {
  Home, Search, Building2, Plane, Train, Bus, MapPin, Car, Ship, Briefcase,
  LayoutDashboard, Luggage, Wallet, Award, Heart, Star, MessageSquare, Bell,
  Shield, LogOut, User, Menu, X, ChevronDown, Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Hotels', href: '/hotels', icon: Building2 },
  { name: 'Flights', href: '/flights', icon: Plane },
  { name: 'Trains', href: '/trains', icon: Train },
  { name: 'Buses', href: '/buses', icon: Bus },
  { name: 'Venues', href: '/venues', icon: MapPin },
  { name: 'Cars', href: '/cars', icon: Car },
  { name: 'Activities', href: '/activities', icon: Ship },
  { name: 'Packages', href: '/packages', icon: Briefcase },
]

export default function Layout() {
  const location = useLocation()
  const { user, isAuthenticated, logout, hasRole } = useAuthStore()
  const { items } = useCartStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const cartCount = items.length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-eventra-slate-200">
        <div className="section-container">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="EventraOS Home">
              <div className="w-10 h-10 rounded-xl bg-eventra-navy-900 flex items-center justify-center">
                <span className="text-white font-display font-bold text-xl">E</span>
              </div>
              <span className="font-display font-bold text-heading-md text-eventra-navy-900 hidden sm:block">
                EventraOS
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center" aria-label="Main">
              {navigation.slice(0, 7).map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-colors',
                      isActive
                        ? 'bg-eventra-navy-900 text-white'
                        : 'text-eventra-slate-600 hover:text-eventra-navy-900 hover:bg-eventra-slate-100'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {cartCount > 0 && (
                <Link
                  to="/checkout"
                  className="relative p-2 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100"
                  aria-label={`Cart with ${cartCount} items`}
                >
                  <Luggage className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-eventra-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                </Link>
              )}

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-eventra-slate-100"
                    aria-expanded={userMenuOpen}
                  >
                    <Avatar name={user?.name} src={user?.avatar} size="sm" />
                    <span className="hidden sm:block text-body-sm font-medium text-eventra-navy-900">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4 text-eventra-slate-500" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-eventra-slate-200 shadow-lg py-1 z-50"
                        role="menu"
                      >
                        <div className="px-4 py-3 border-b border-eventra-slate-100">
                          <p className="font-medium text-eventra-navy-900 text-body-sm">{user?.name}</p>
                          <p className="text-body-xs text-eventra-slate-500 truncate">{user?.email}</p>
                          <span className={cn(
                            'badge mt-1.5',
                            user?.role === 'admin' ? 'badge-danger' : user?.role === 'agent' ? 'badge-primary' : 'badge-success'
                          )}>
                            {user?.role}
                          </span>
                        </div>

                        {hasRole('customer') && (
                          <>
                            <Link to="/dashboard" className="dropdown-item" role="menuitem">
                              <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                            <Link to="/trips" className="dropdown-item" role="menuitem">
                              <Luggage className="w-4 h-4" /> My Trips
                            </Link>
                            <Link to="/wallet" className="dropdown-item" role="menuitem">
                              <Wallet className="w-4 h-4" /> Wallet
                            </Link>
                            <Link to="/favorites" className="dropdown-item" role="menuitem">
                              <Heart className="w-4 h-4" /> Favorites
                            </Link>
                            <Link to="/support" className="dropdown-item" role="menuitem">
                              <MessageSquare className="w-4 h-4" /> Support
                            </Link>
                            <div className="dropdown-divider" />
                          </>
                        )}

                        {hasRole('agent') && (
                          <Link to="/agent" className="dropdown-item" role="menuitem">
                            <Briefcase className="w-4 h-4" /> Agent Dashboard
                          </Link>
                        )}
                        {hasRole('admin') && (
                          <Link to="/admin" className="dropdown-item" role="menuitem">
                            <Settings className="w-4 h-4" /> Admin Dashboard
                          </Link>
                        )}

                        <Link to="/profile" className="dropdown-item" role="menuitem">
                          <User className="w-4 h-4" /> Profile
                        </Link>
                        <Link to="/security" className="dropdown-item" role="menuitem">
                          <Shield className="w-4 h-4" /> Security
                        </Link>
                        <div className="dropdown-divider" />
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false) }}
                          className="dropdown-item w-full text-left text-eventra-red-600 hover:bg-eventra-red-50"
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="btn-ghost">Sign In</Link>
                  <Link to="/register" className="btn-primary">Sign Up</Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-eventra-slate-200 bg-white overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium',
                        isActive ? 'bg-eventra-navy-900 text-white' : 'text-eventra-slate-600 hover:bg-eventra-slate-100'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </NavLink>
                ))}
                {!isAuthenticated && (
                  <div className="pt-3 border-t border-eventra-slate-200 flex gap-3">
                    <Link to="/login" className="btn-secondary flex-1 text-center">Sign In</Link>
                    <Link to="/register" className="btn-primary flex-1">Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-eventra-navy-950 text-eventra-slate-300 border-t border-eventra-navy-800">
        <div className="section-container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="text-white font-display font-bold text-xl">E</span>
                </div>
                <span className="font-display font-bold text-heading-md text-white">EventraOS</span>
              </Link>
              <p className="text-body-sm text-eventra-slate-400">
                One platform for travel, stays, events, transportation and experiences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-body-sm">Services</h4>
              <ul className="space-y-2 text-body-sm">
                {navigation.slice(1).map((item) => (
                  <li key={item.name}>
                    <Link to={item.href} className="hover:text-white transition-colors">{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-body-sm">Support</h4>
              <ul className="space-y-2 text-body-sm">
                <li><Link to="/support" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/support" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-white">Cancellation Policy</Link></li>
                <li><Link to="#" className="hover:text-white">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-body-sm">Company</h4>
              <ul className="space-y-2 text-body-sm">
                <li><Link to="#" className="hover:text-white">About Us</Link></li>
                <li><Link to="#" className="hover:text-white">Careers</Link></li>
                <li><Link to="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-eventra-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-body-sm text-eventra-slate-500">
              © {new Date().getFullYear()} EventraOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
