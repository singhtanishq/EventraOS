import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Building2,
  Plane,
  Train,
  Bus,
  MapPin,
  Car,
  Ship,
  MapPinCheck,
  Briefcase,
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Users,
  Globe,
  Clock,
  CreditCard,
  Headphones,
  Zap,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const services = [
  { id: 'hotels', name: 'Hotels', icon: Building2, description: '10,000+ properties worldwide', href: '/hotels', color: 'blue' },
  { id: 'flights', name: 'Flights', icon: Plane, description: '500+ airlines, best fares', href: '/flights', color: 'cyan' },
  { id: 'trains', name: 'Trains', icon: Train, description: 'Extensive rail network', href: '/trains', color: 'teal' },
  { id: 'buses', name: 'Buses', icon: Bus, description: 'Comfortable intercity travel', href: '/buses', color: 'amber' },
  { id: 'venues', name: 'Venues', icon: MapPin, description: 'Weddings, conferences, events', href: '/venues', color: 'red' },
  { id: 'cars', name: 'Car Rentals', icon: Car, description: 'Self-drive & chauffeur', href: '/cars', color: 'green' },
  { id: 'activities', name: 'Activities', icon: Ship, description: 'Tours, experiences, tickets', href: '/activities', color: 'blue' },
  { id: 'transfers', name: 'Transfers', icon: MapPinCheck, description: 'Airport & city transfers', href: '/transfers', color: 'cyan' },
  { id: 'packages', name: 'Packages', icon: Briefcase, description: 'Curated travel bundles', href: '/packages', color: 'teal' },
]

const features = [
  { icon: CheckCircle, title: 'Unified Search', description: 'Search across all travel services in one place with smart filters and real-time availability.' },
  { icon: Shield, title: 'Secure Payments', description: 'Multiple payment options with encrypted transactions and buyer protection.' },
  { icon: Star, title: 'Loyalty Rewards', description: 'Earn Eventra Points on every booking and redeem for discounts and upgrades.' },
  { icon: Users, title: 'Agent Support', description: 'Expert travel agents available to help plan complex itineraries.' },
  { icon: Globe, title: 'Global Coverage', description: 'Book travel to 190+ countries with local inventory and support.' },
  { icon: Clock, title: '24/7 Support', description: 'Round-the-clock customer service via chat, email, and phone.' },
]

const colorText = {
  blue: 'text-eventra-blue-400',
  cyan: 'text-eventra-cyan-400',
  teal: 'text-eventra-teal-400',
  amber: 'text-eventra-amber-400',
  red: 'text-eventra-red-400',
  green: 'text-eventra-green-400',
}

const colorBgLight = {
  blue: 'bg-eventra-blue-100',
  cyan: 'bg-eventra-cyan-100',
  teal: 'bg-eventra-teal-100',
  amber: 'bg-eventra-amber-100',
  red: 'bg-eventra-red-100',
  green: 'bg-eventra-green-100',
}

const colorTextDark = {
  blue: 'text-eventra-blue-600',
  cyan: 'text-eventra-cyan-600',
  teal: 'text-eventra-teal-600',
  amber: 'text-eventra-amber-600',
  red: 'text-eventra-red-600',
  green: 'text-eventra-green-600',
}

const stats = [
  { value: '2M+', label: 'Happy Travelers' },
  { value: '10K+', label: 'Hotels Worldwide' },
  { value: '500+', label: 'Airlines' },
  { value: '190+', label: 'Countries' },
]

const testimonials = [
  { name: 'Priya Sharma', role: 'Frequent Traveler', avatar: 'PS', content: 'EventraOS made planning our family vacation to Dubai seamless. The unified cart let us book flights, hotel, and transfers in one go!', rating: 5 },
  { name: 'Rajesh Kumar', role: 'Corporate Travel Manager', avatar: 'RK', content: 'As a travel agent, the booking workspace is a game-changer. I can manage multiple clients, create quotes, and track commissions effortlessly.', rating: 5 },
  { name: 'Anita Desai', role: 'Event Planner', avatar: 'AD', content: 'The venue booking with custom configurator saved us weeks of work. We built our entire wedding package - catering, decor, AV - in one place.', rating: 5 },
]

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-eventra-navy-950 via-eventra-navy-900 to-eventra-navy-800 text-white pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="absolute inset-0 bg-gradient-radial from-eventra-blue-600/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-eventra-cyan-500/10 rounded-full blur-3xl" />

        <div className="section-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-body-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-eventra-cyan-400 animate-pulse" />
              Now in Public Beta — Join 2M+ travelers
            </span>
            <h1 className="text-display-xl lg:text-display-lg font-display font-bold text-balance leading-tight mb-6">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-eventra-cyan-400 to-eventra-blue-400 bg-clip-text text-transparent">
                travel, stay, move & celebrate
              </span>
            </h1>
            <p className="text-body-lg lg:text-xl text-eventra-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
              Search, compare, and book hotels, flights, trains, buses, venues, cars, activities, and transfers — all in one seamless platform. No more juggling multiple apps.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/search" className="btn-primary btn-lg w-full sm:w-auto group">
                Start Your Journey
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/venues" className="btn-outline border-white text-white hover:bg-white/10 w-full sm:w-auto">
                Plan an Event
              </Link>
            </div>
          </motion.div>

          {/* Search Widget */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-2 sm:p-4 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4">
                {/* Search Tabs */}
                <div className="lg:col-span-3">
                  <div className="tabs h-full min-h-[56px]">
                    {services.slice(0, 4).map((service) => (
                      <Link
                        key={service.id}
                        to={service.href}
                        className={cn(
                          'tab flex flex-col items-center justify-center gap-1.5 py-3 px-2',
                          'text-eventra-slate-400 hover:text-white'
                        )}
                      >
                        <service.icon className={cn('w-5 h-5', colorText[service.color as keyof typeof colorText])} />
                        <span className="text-body-xs font-medium hidden sm:block">{service.name}</span>
                      </Link>
                    ))}
                    <div className="tab flex flex-col items-center justify-center gap-1.5 py-3 px-2 text-eventra-slate-400 hover:text-white" onClick={() => {}}>
                      <MoreServicesDropdown services={services.slice(4)} />
                    </div>
                  </div>
                </div>

                {/* Search Form */}
                <div className="lg:col-span-9 space-y-4 sm:space-y-0 sm:flex sm:items-end sm:gap-4">
                  <div className="space-y-2">
                    <label htmlFor="global-destination" className="label text-white">Where to?</label>
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-eventra-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      <input
                        type="text"
                        id="global-destination"
                        className="input bg-white/10 border-white/20 text-white placeholder-eventra-slate-400 pl-12 pr-4 py-4"
                        placeholder="City, hotel, airport, venue..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <div className="space-y-2">
                      <label htmlFor="checkin" className="label text-white">Check-in / Departure</label>
                      <input type="date" id="checkin" className="input bg-white/10 border-white/20 text-white" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="checkout" className="label text-white">Check-out / Return</label>
                      <input type="date" id="checkout" className="input bg-white/10 border-white/20 text-white" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="guests" className="label text-white">Guests / Passengers</label>
                      <select id="guests" className="input form-select bg-white/10 border-white/20 text-white">
                        <option>1 Adult</option>
                        <option>2 Adults</option>
                        <option>2 Adults, 1 Child</option>
                        <option>4 Adults</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="label text-white">&nbsp;</label>
                      <Link to="/search" className="btn-primary w-full btn-lg inline-flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5" />
                        Search
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 bg-eventra-navy-900 border-b border-eventra-navy-800">
        <div className="section-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-display font-bold text-eventra-cyan-400 mb-2">{stat.value}</div>
                <div className="text-body-md text-eventra-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-display-sm font-display font-bold text-eventra-navy-900 mb-4">All Ways to Travel</h2>
            <p className="text-body-lg text-eventra-slate-600">One platform for every journey. Search, compare, and book with confidence.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={service.href} className="card h-full group">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', colorBgLight[service.color as keyof typeof colorBgLight], colorTextDark[service.color as keyof typeof colorTextDark], 'group-hover:bg-eventra-navy-900', 'group-hover:text-white', 'transition-colors')}>
                    <service.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2 group-hover:text-eventra-blue-600 transition-colors">{service.name}</h3>
                  <p className="text-body-sm text-eventra-slate-600 mb-4">{service.description}</p>
                  <span className="inline-flex items-center gap-1 text-body-sm font-medium text-eventra-blue-600 group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 bg-eventra-slate-50">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-display-sm font-display font-bold text-eventra-navy-900 mb-4">Why Choose EventraOS?</h2>
            <p className="text-body-lg text-eventra-slate-600">Built for modern travelers who value simplicity, transparency, and great experiences.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card variant="elevated" padding="lg" className="h-full">
                  <div className="w-12 h-12 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">{feature.title}</h3>
                  <p className="text-body-md text-eventra-slate-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-display-sm font-display font-bold text-eventra-navy-900 mb-4">Book in 4 Simple Steps</h2>
            <p className="text-body-lg text-eventra-slate-600">From search to confirmation, we make travel booking effortless.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Search', description: 'Enter your destination, dates, and preferences. Our smart search finds the best options across all providers.', icon: Sparkles },
              { step: 2, title: 'Compare', description: 'Filter by price, rating, amenities, and more. See real-time availability and transparent pricing.', icon: CheckCircle },
              { step: 3, title: 'Book', description: 'Enter traveler details, add extras, and pay securely. Multiple payment methods supported.', icon: CreditCard },
              { step: 4, title: 'Travel', description: 'Receive instant confirmation, vouchers, and 24/7 support. Manage everything from your dashboard.', icon: Headphones },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="relative">
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-1 h-full bg-eventra-slate-200 lg:hidden" />
                  <div className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-eventra-navy-900 text-white flex items-center justify-center font-display font-bold text-2xl mb-6">
                      {step.step}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">{step.title}</h3>
                    <p className="text-body-md text-eventra-slate-600">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-eventra-navy-900">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-display-sm font-display font-bold text-white mb-4">Loved by Travelers</h2>
            <p className="text-body-lg text-eventra-slate-400">See what our customers have to say about their EventraOS experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card variant="elevated" padding="lg" className="bg-eventra-navy-800 border-eventra-navy-700 h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-eventra-amber-400 text-eventra-amber-400" />
                    ))}
                  </div>
                  <p className="text-body-md text-eventra-slate-300 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-eventra-blue-600 flex items-center justify-center text-white font-medium">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-white">{testimonial.name}</p>
                      <p className="text-body-sm text-eventra-slate-400">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-eventra-navy-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-eventra-blue-600/10 via-transparent to-transparent" />
        <div className="section-container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-display-sm font-display font-bold text-white mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-body-lg text-eventra-slate-300 mb-10">
                Join millions of travelers who trust EventraOS for their travel, stays, events, and transportation needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn-primary btn-lg w-full sm:w-auto group">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/search" className="btn-outline border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  Explore Destinations
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

function MoreServicesDropdown({ services }: { services: typeof services }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col items-center gap-1.5 py-3 px-2 w-full"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        <span className="text-body-xs font-medium">More</span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-xl border border-eventra-slate-200 shadow-elevated py-2 z-50"
        >
          {services.map((service) => (
            <Link
              key={service.id}
              to={service.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-eventra-slate-700 hover:bg-eventra-slate-50 transition-colors"
            >
              <service.icon className={cn('w-5 h-5', colorTextDark[service.color as keyof typeof colorTextDark])} />
              {service.name}
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'