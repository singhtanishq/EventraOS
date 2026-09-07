import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Calendar,
  Users,
  Search,
  ChevronRight,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
  Star,
  Globe,
  Clock,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const serviceTypes = [
  { id: 'all', name: 'All Services', icon: Search, description: 'Search across all service types', color: 'blue', href: '/search' },
  { id: 'hotels', name: 'Hotels', icon: Building2, description: 'Hotels, resorts, apartments', color: 'blue', href: '/hotels' },
  { id: 'flights', name: 'Flights', icon: Plane, description: 'Domestic & international flights', color: 'cyan', href: '/flights' },
  { id: 'trains', name: 'Trains', icon: Train, description: 'Rail journeys & passes', color: 'teal', href: '/trains' },
  { id: 'buses', name: 'Buses', icon: Bus, description: 'Intercity & local buses', color: 'amber', href: '/buses' },
  { id: 'venues', name: 'Venues', icon: MapPin, description: 'Event venues & halls', color: 'red', href: '/venues' },
  { id: 'cars', name: 'Car Rentals', icon: Car, description: 'Self-drive & chauffeur cars', color: 'green', href: '/cars' },
  { id: 'activities', name: 'Activities', icon: Ship, description: 'Tours, experiences & tickets', color: 'blue', href: '/activities' },
  { id: 'transfers', name: 'Transfers', icon: MapPinCheck, description: 'Airport & city transfers', color: 'cyan', href: '/transfers' },
  { id: 'packages', name: 'Packages', icon: Briefcase, description: 'Complete travel packages', color: 'teal', href: '/packages' },
]

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedService, setSelectedService] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  const [startDate, setStartDate] = useState(searchParams.get('start_date') || '')
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || '')
  const [guests, setGuests] = useState(searchParams.get('guests') || '2')
  const [rooms, setRooms] = useState(searchParams.get('rooms') || '1')
  const [destination, setDestination] = useState(searchParams.get('destination') || '')
  const [origin, setOrigin] = useState(searchParams.get('origin') || '')

  useEffect(() => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    if (guests && guests !== '2') params.set('guests', guests)
    if (rooms && rooms !== '1') params.set('rooms', rooms)
    if (destination) params.set('destination', destination)
    if (origin) params.set('origin', origin)
    if (selectedService !== 'all') params.set('service_type', selectedService)
    setSearchParams(params)
  }, [startDate, endDate, guests, rooms, destination, origin, selectedService, setSearchParams])

  const handleSearch = () => {
    setIsLoading(true)
    const service = serviceTypes.find((s) => s.id === selectedService)
    navigate(service?.href || '/search')
    setTimeout(() => setIsLoading(false), 300)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-eventra-navy-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-eventra-navy-900 via-eventra-blue-900/50 to-eventra-navy-900" />
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zm30 30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        </div>
        <div className="relative section-container py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 mb-6">
              <span className="text-body-sm font-medium">Search across all travel services</span>
            </div>
            <h1 className="text-heading-2xl lg:text-heading-3xl font-display font-bold mb-6">
              Find Your Perfect{' '}
              <span className="text-eventra-cyan-400">Travel Experience</span>
            </h1>
            <p className="text-lg lg:text-xl text-eventra-slate-300 mb-8 max-w-2xl mx-auto">
              Search hotels, flights, trains, buses, cars, activities, venues, transfers, and packages — all in one place.
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <Card variant="elevated" padding="lg" className="bg-white/95 backdrop-blur-sm">
              {/* Service Type Selector */}
              <div className="mb-6">
                <label className="label text-eventra-navy-900 mb-3">What are you looking for?</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {serviceTypes.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-left',
                        selectedService === service.id
                          ? 'border-eventra-navy-900 bg-eventra-navy-50 shadow-lg'
                          : 'border-eventra-slate-200 hover:border-eventra-slate-300 hover:bg-eventra-slate-50'
                      )}
                    >
                      <service.icon className={cn('w-6 h-6', selectedService === service.id ? 'text-eventra-navy-900' : 'text-eventra-slate-500')} />
                      <span className={cn('font-medium text-sm', selectedService === service.id ? 'text-eventra-navy-900' : 'text-eventra-slate-700')}>
                        {service.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="lg:col-span-2">
                  <label className="label text-eventra-navy-900 mb-2">Destination</label>
                  <Input
                    placeholder="Where are you going?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    leftIcon={<MapPin className="w-5 h-5" />}
                  />
                </div>
                <div>
                  <label className="label text-eventra-navy-900 mb-2">Check-in</label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    leftIcon={<Calendar className="w-5 h-5" />}
                  />
                </div>
                <div>
                  <label className="label text-eventra-navy-900 mb-2">Check-out</label>
                  <Input
                    type="date"
                    min={startDate || new Date().toISOString().split('T')[0]}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    leftIcon={<Calendar className="w-5 h-5" />}
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="label text-eventra-navy-900 mb-2">Guests & Rooms</label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="label text-eventra-navy-900 mb-2 block">Guests</label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-eventra-slate-300 focus:border-eventra-blue-500 focus:ring-2 focus:ring-eventra-blue-500/20 bg-white text-eventra-navy-900"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="label text-eventra-navy-900 mb-2 block">Rooms</label>
                      <select
                        value={rooms}
                        onChange={(e) => setRooms(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-eventra-slate-300 focus:border-eventra-blue-500 focus:ring-2 focus:ring-eventra-blue-500/20 bg-white text-eventra-navy-900"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n} room{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="flex-1 btn-lg"
                  onClick={handleSearch}
                  disabled={isLoading}
                  leftIcon={isLoading ? undefined : <Search className="w-5 h-5" />}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
                <Button variant="outline" size="lg" className="px-6">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-heading-xl font-display font-bold text-eventra-navy-900 mb-4">
              Explore All Travel Services
            </h2>
            <p className="text-eventra-slate-600 text-lg">
              From luxury hotels to budget flights, we have everything you need for your journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {serviceTypes.slice(1).map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="group cursor-pointer"
                onClick={() => navigate(service.href)}
              >
                <Card variant="outlined" padding="lg" className="h-full text-center transition-all hover:shadow-xl hover:border-eventra-blue-500">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors group-hover:scale-110', `bg-${service.color}-100`)}>
                    <service.icon className={cn('w-7 h-7', `text-${service.color}-600`)} />
                  </div>
                  <h3 className="text-heading-sm font-semibold text-eventra-navy-900 mb-2">{service.name}</h3>
                  <p className="text-body-sm text-eventra-slate-600">{service.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-eventra-slate-50">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-heading-xl font-display font-bold text-eventra-navy-900 mb-4">
              Why Choose EventraOS?
            </h2>
            <p className="text-eventra-slate-600 text-lg">
              Built for modern travelers who want simplicity, value, and reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Unified Search', description: 'Search across 9 service types in one place with smart filters and real-time availability.' },
              { icon: Shield, title: 'Secure Payments', description: 'Multiple payment options with encrypted transactions, UPI, cards, wallets, and EMI.' },
              { icon: Star, title: 'Loyalty Rewards', description: 'Earn Eventra Points on every booking, redeem for discounts, upgrades, and perks.' },
              { icon: Globe, title: 'Global Coverage', description: 'Book travel to 190+ countries with local inventory, currencies, and support.' },
              { icon: Clock, title: '24/7 Support', description: 'Round-the-clock customer service via chat, email, phone, and dedicated agents.' },
              { icon: Zap, title: 'Instant Confirmation', description: 'Real-time booking confirmations with e-tickets, vouchers, and digital passes.' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Card variant="outlined" padding="lg" className="h-full">
                  <div className="w-12 h-12 rounded-xl bg-eventra-blue-100 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-eventra-blue-600" />
                  </div>
                  <h3 className="text-heading-sm font-semibold text-eventra-navy-900 mb-2">{feature.title}</h3>
                  <p className="text-body-sm text-eventra-slate-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-eventra-navy-900 text-white">
        <div className="section-container text-center">
          <h2 className="text-heading-xl lg:text-heading-2xl font-display font-bold mb-6">
            Ready to start your journey?
          </h2>
          <p className="text-eventra-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Join millions of travelers who trust EventraOS for their travel needs. Search, compare, and book with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-lg bg-eventra-cyan-500 hover:bg-eventra-cyan-600 text-eventra-navy-900 w-full sm:w-auto" onClick={() => navigate('/search')}>
              <Search className="w-5 h-5 mr-2" />
              Start Searching
            </Button>
            <Button variant="outline" size="lg" className="btn-lg border-white text-white hover:bg-white/10 w-full sm:w-auto" onClick={() => navigate('/register')}>
              <Users className="w-5 h-5 mr-2" />
              Become an Agent
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}