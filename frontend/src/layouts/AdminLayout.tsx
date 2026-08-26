import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  Building2,
  MapPin,
  Plane,
  TicketPercent,
  CreditCard,
  RotateCcw,
  Target,
  BarChart3,
  Activity,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Bell,
  Search,
  Building,
  UserCog,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import Link from 'react-router-dom'

const adminNav = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Agents', href: '/admin/agents', icon: UserCheck },
  { name: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { name: 'Suppliers', href: '/admin/suppliers', icon: Building },
  { name: 'Venues', href: '/admin/venues', icon: MapPin },
  { name: 'Hotels', href: '/admin/hotels', icon: Building2 },
  { name: 'Transport', href: '/admin/transports', icon: Plane },
  { name: 'Promotions', href: '/admin/promotions', icon: TicketPercent },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Refunds', href: '/admin/refunds', icon: RotateCcw },
  { name: 'Commissions', href: '/admin/commissions', icon: Target },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'System Health', href: '/admin/system-health', icon: Activity },
]

export default function AdminLayout() {
  const location = useLocation()
  const { user, logout, hasRole } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (href: string) => location.pathname === href || (href !== '/admin/dashboard' && location.pathname.startsWith(href))

  if (!hasRole('admin')) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-eventra-slate-50">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="fixed lg:relative z-50 w-72 bg-white border-r border-eventra-slate-200 h-screen flex flex-col transition-transform duration-300 ease-out lg:translate-x-0"
        role="navigation"
        aria-label="Admin navigation"
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-eventra-slate-200">
          <Link to="/admin/dashboard" className="flex items-center gap-2" aria-label="EventraOS Admin">
            <div className="w-10 h-10 rounded-xl bg-eventra-red-600 flex items-center justify-center">
              <span className="text-white font-display font-bold text-xl">E</span>
            </div>
            <span className="font-display font-bold text-heading-md text-eventra-navy-900">EventraOS Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl text-eventra-slate-500 hover:bg-eventra-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Admin menu">
          {adminNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-eventra-navy-900 text-white shadow-card'
                    : 'text-eventra-slate-600 hover:bg-eventra-slate-100 hover:text-eventra-navy-900'
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-eventra-slate-200">
          <div className="flex items-center gap-3 px-3 py-2">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-eventra-navy-100 flex items-center justify-center">
                <span className="text-eventra-navy-700 font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-eventra-navy-900 truncate">{user?.name}</p>
              <p className="text-body-xs text-eventra-slate-500 truncate">{user?.email}</p>
            </div>
            <span className="badge badge-danger text-body-xs">Admin</span>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-eventra-slate-200">
          <div className="flex h-16 items-center justify-between px-6 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100 transition-colors"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-xl">
              <h1 className="text-heading-lg font-display font-semibold text-eventra-navy-900 truncate">
                {adminNav.find((item) => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button className="relative p-2 rounded-xl text-eventra-slate-600 hover:bg-eventra-slate-100 transition-colors" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-eventra-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
              </button>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-eventra-slate-100 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="avatar-md">
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  <span className="hidden sm:block font-medium text-body-sm text-eventra-navy-900">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-eventra-slate-500" aria-hidden="true" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="dropdown-menu"
                      role="menu"
                    >
                      <div className="px-4 py-3 border-b border-eventra-slate-200">
                        <p className="font-medium text-eventra-navy-900">{user?.name}</p>
                        <p className="text-body-sm text-eventra-slate-500 truncate">{user?.email}</p>
                        <span className="badge badge-danger mt-1.5">Administrator</span>
                      </div>

                      <Link to="/admin/settings" className="dropdown-item" role="menuitem">
                        <Settings className="w-4 h-4" aria-hidden="true" />
                        Settings
                      </Link>
                      <Link to="/customer/security" className="dropdown-item" role="menuitem">
                        <Shield className="w-4 h-4" aria-hidden="true" />
                        Security
                      </Link>
                      <div className="dropdown-divider" role="separator" />
                      <button onClick={logout} className="dropdown-item w-full text-left text-eventra-red-600 hover:bg-eventra-red-50" role="menuitem">
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}