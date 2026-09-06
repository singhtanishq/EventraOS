import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, Briefcase, ClipboardList, CreditCard, PlusCircle, FileText, DollarSign, Shield, CheckCircle2, UserPlus, RefreshCw, Target, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'react-hot-toast'

interface AgentCustomer {
  id: number
  customer_number: string
  user: {
    name?: string
    email?: string
    phone?: string | null
  }
  total_bookings: number
  total_spent: number
  is_vip: boolean
  status: 'active' | 'inactive'
}

const SERVICE_TYPES = [
  { value: 'hotel', label: 'Hotels' },
  { value: 'flight', label: 'Flights' },
  { value: 'train', label: 'Trains' },
  { value: 'bus', label: 'Buses' },
  { value: 'venue', label: 'Venues' },
  { value: 'car', label: 'Car Rentals' },
  { value: 'activity', label: 'Activities' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'package', label: 'Packages' },
]

export function AgentBookingWorkspace() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [serviceType, setServiceType] = useState('hotel')
  const [destination, setDestination] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [guests, setGuests] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<AgentCustomer | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['agent-workspace-customers'],
    queryFn: async () => {
      const body = await api.get<any>('/agent/customers', { per_page: 100 })
      return body
    },
  })

  const customers: AgentCustomer[] = useMemo(
    () => data?.data?.customers ?? [],
    [data]
  )

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => {
      const name = (c.user?.name || '').toLowerCase()
      const email = (c.user?.email || '').toLowerCase()
      return name.includes(q) || email.includes(q) || String(c.customer_number || '').toLowerCase().includes(q)
    })
  }, [customers, searchTerm])

  const handleSearch = async () => {
    if (!destination.trim()) {
      toast.error('Please enter a destination')
      return
    }
    setIsSearching(true)
    // Provider inventory search is not wired yet — degrade gracefully.
    setTimeout(() => {
      setIsSearching(false)
      toast(`Provider search is coming soon — ${serviceType} in ${destination.trim()} couldn't be searched`, { icon: 'ℹ️' })
    }, 600)
  }

  const handleSelectCustomer = (customer: AgentCustomer) => {
    setSelectedCustomer(customer)
  }

  if (isLoading) return <WorkspaceSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load booking workspace</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4" leftIcon={<RefreshCw className="w-5 h-5" />}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Booking Workspace</h1>
          <p className="text-eventra-slate-600 mt-1">Search services and build bookings for your customers</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={selectedCustomer ? 'success' : 'neutral'} size="md">
            {selectedCustomer ? `Customer: ${selectedCustomer.user.name || '—'}` : 'No customer selected'}
          </Badge>
        </div>
      </div>

      {/* Progress Steps */}
      <Card variant="elevated" padding="md">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 1, label: 'Search', icon: Search, active: true },
            { id: 2, label: 'Select Customer', icon: Users, active: !!selectedCustomer },
            { id: 3, label: 'Select Service', icon: Briefcase, active: false },
            { id: 4, label: 'Review & Pay', icon: CreditCard, active: false },
          ].map((step, index, arr) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-body-sm font-medium transition-all flex-shrink-0',
                    step.active ? 'bg-eventra-blue-600 text-white' : 'bg-eventra-slate-200 text-eventra-slate-500'
                  )}
                >
                  {step.active ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                </div>
                <span className={cn('text-body-sm whitespace-nowrap', step.active ? 'font-semibold text-eventra-navy-900' : 'text-eventra-slate-500')}>
                  {step.label}
                </span>
              </div>
              {index < arr.length - 1 && <div className="w-8 h-1 bg-eventra-slate-200 mx-2 rounded-full" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Service Search */}
        <div className="space-y-6">
          <Card variant="elevated" padding="lg">
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Services
            </h3>
            <div className="space-y-4">
              <Select
                label="Service Type"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                options={SERVICE_TYPES}
              />
              <Input
                label="Destination"
                placeholder="City, hotel, airport..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Check-in / Departure"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
                <Input
                  label="Check-out / Return"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
              <Input
                label="Guests / Passengers"
                placeholder="e.g. 2 Adults, 1 Child"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              />
              <Button className="w-full" loading={isSearching} onClick={handleSearch}>
                <Search className="w-5 h-5" />
                Search
              </Button>
            </div>
          </Card>

          {/* Selected Customer */}
          {selectedCustomer && (
            <Card padding="lg" className="bg-eventra-blue-50 border-eventra-blue-200">
              <h4 className="font-semibold text-eventra-blue-900 mb-3">Selected Customer</h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                  {(selectedCustomer.user?.name || '??').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-eventra-navy-900 truncate">{selectedCustomer.user?.name || '—'}</p>
                  <p className="text-body-sm text-eventra-slate-600 truncate">{selectedCustomer.user?.email || '—'}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-3" onClick={() => setSelectedCustomer(null)}>
                Change Customer
              </Button>
            </Card>
          )}
        </div>

        {/* Center Panel - Customer Selection */}
        <div className="space-y-4">
          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-heading-lg font-semibold text-eventra-navy-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Customer
              </h3>
              <Button variant="ghost" size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => navigate('/agent/customers')}>
                Add
              </Button>
            </div>
            <div className="mb-4">
              <Input
                placeholder="Search by name, email or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>

            {filteredCustomers.length > 0 ? (
              <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {filteredCustomers.map((customer, index) => (
                  <motion.button
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index, 10) * 0.03 }}
                    onClick={() => handleSelectCustomer(customer)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                      selectedCustomer?.id === customer.id
                        ? 'border-eventra-blue-500 bg-eventra-blue-50'
                        : 'border-eventra-slate-200 hover:bg-eventra-slate-50'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-eventra-slate-100 text-eventra-slate-600 flex items-center justify-center font-medium text-body-sm flex-shrink-0">
                      {(customer.user?.name || '??').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-eventra-navy-900 truncate">{customer.user?.name || '—'}</h4>
                        {customer.is_vip && <Badge variant="primary" size="sm">VIP</Badge>}
                      </div>
                      <p className="text-body-xs text-eventra-slate-500 truncate">{customer.user?.email || customer.customer_number}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-body-sm font-medium text-eventra-navy-900">{customer.total_bookings ?? 0} bookings</p>
                      <p className="text-body-xs text-eventra-slate-500">{formatCurrency(customer.total_spent || 0)}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                <p className="text-eventra-slate-600">{searchTerm ? 'No customers match your search' : 'No customers assigned yet'}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/agent/customers')}>
                  Manage Customers
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel - Booking Builder */}
        <div className="space-y-6">
          <Card variant="elevated" padding="lg" className="h-fit">
            <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Booking Summary
            </h3>

            {selectedCustomer ? (
              <div className="space-y-4">
                <div className="p-4 bg-eventra-slate-50 rounded-xl space-y-2 text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-eventra-slate-600">Customer</span>
                    <span className="font-medium text-eventra-navy-900">{selectedCustomer.user?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-eventra-slate-600">Service Type</span>
                    <span className="font-medium text-eventra-navy-900 capitalize">{serviceType}</span>
                  </div>
                  {destination.trim() && (
                    <div className="flex justify-between">
                      <span className="text-eventra-slate-600">Destination</span>
                      <span className="font-medium text-eventra-navy-900">{destination.trim()}</span>
                    </div>
                  )}
                  {departureDate && (
                    <div className="flex justify-between">
                      <span className="text-eventra-slate-600">Departure</span>
                      <span className="font-medium text-eventra-navy-900">{departureDate}</span>
                    </div>
                  )}
                </div>
                <div className="alert alert-info">
                  <p className="text-body-sm">
                    Provider inventory search isn't available yet. Create a quote or record the booking once the service is confirmed.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => navigate('/agent/quotes')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Create Quote
                  </Button>
                  <Button onClick={() => navigate('/agent/bookings')}>
                    View Bookings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-14 h-14 text-eventra-slate-300 mx-auto mb-4" />
                <h4 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">No Customer Selected</h4>
                <p className="text-eventra-slate-600 text-body-sm">Select a customer from the list to start building the booking</p>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card variant="elevated" padding="lg">
            <h4 className="font-semibold text-eventra-navy-900 mb-4">Quick Actions</h4>
            <div className="space-y-2">
              <QuickAction icon={<PlusCircle className="w-5 h-5 text-eventra-blue-600" />} label="Add Another Service" onClick={() => toast('Multi-service bookings are coming soon', { icon: 'ℹ️' })} />
              <QuickAction icon={<FileText className="w-5 h-5 text-eventra-green-600" />} label="Create Quote" onClick={() => navigate('/agent/quotes')} />
              <QuickAction icon={<DollarSign className="w-5 h-5 text-eventra-amber-600" />} label="View Commissions" onClick={() => navigate('/agent/commissions')} />
              <QuickAction icon={<Target className="w-5 h-5 text-eventra-teal-600" />} label="Commission Summary" onClick={() => navigate('/agent/commissions')} />
              <QuickAction icon={<Shield className="w-5 h-5 text-eventra-red-600" />} label="Support Center" onClick={() => navigate('/agent/support')} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-eventra-slate-50 hover:bg-eventra-slate-100 transition-colors text-left"
    >
      {icon}
      <span className="font-medium text-eventra-navy-900 text-body-sm">{label}</span>
    </button>
  )
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-8 w-72 rounded-lg skeleton" />
      <Card variant="elevated" padding="md" className="animate-pulse h-16" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card variant="elevated" padding="lg" className="animate-pulse h-96" />
        <Card variant="elevated" padding="lg" className="animate-pulse h-96" />
        <Card variant="elevated" padding="lg" className="animate-pulse h-96" />
      </div>
      <div className="flex items-center gap-2 text-body-sm text-eventra-slate-400">
        <RefreshCw className="w-4 h-4" />
        Loading workspace…
      </div>
    </div>
  )
}
