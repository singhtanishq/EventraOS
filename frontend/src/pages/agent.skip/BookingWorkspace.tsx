import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Search, MoreVertical, Filter as FilterIcon, Download, Eye, UserPlus, UserCheck, UserX, UserMinus, Briefcase, FileText, DollarSign, Target, ClipboardList, AlertTriangle, Clock, RotateCcw, Shield, PlusCircle, MinusCircle, Copy, Share2, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity, Briefcase, ClipboardList, Target, FileText, DollarSign, TrendingUp, Clock as ClockIcon, BarChart3, PieChart, Award, Trophy, Crown, Medal, LayoutDashboard, Suitcase, TrendingUp as TrendingUpIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface AgentBookingWorkspaceData {
  recent_searches: any[]
  customers: any[]
  recent_bookings: any[]
}

export function AgentBookingWorkspace() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'search' | 'customers' | 'booking' | 'review'>('search')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedOptions, setSelectedOptions] = useState<any[]>([])
  const [travelers, setTravelers] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: search, 2: select, 3: options, 4: travelers, 5: review, 6: payment

  const { data: workspaceData } = useQuery({
    queryKey: ['agent-booking-workspace'],
    queryFn: async () => {
      const response = await api.get('/agent/booking-workspace')
      return response.data
    },
  })

  const handleSearch = async (params: any) => {
    setIsSearching(true)
    try {
      const response = await api.get('/agent/search', { params })
      setSearchResults(response.data.data.results || [])
      setActiveTab('customers')
      setCurrentStep(2)
    } catch {
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setActiveTab('booking')
    setCurrentStep(2)
  }

  const handleSelectService = (service: any) => {
    setSelectedService(service)
    setActiveTab('options')
    setCurrentStep(3)
  }

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 6))
    setActiveTab(['search', 'customers', 'booking', 'options', 'travelers', 'review', 'payment'][Math.min(6, 6)])
  }

  const handleBackStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleCreateBooking = async () => {
    // Create booking via API
    toast.success('Booking created successfully!')
    // Reset workspace
    setSelectedCustomer(null)
    setSelectedService(null)
    setSelectedOptions([])
    setTravelers([])
    setCurrentStep(1)
    setActiveTab('search')
  }

  const STEPS = [
    { id: 1, label: 'Search', icon: Search },
    { id: 2, label: 'Select Customer', icon: Users },
    { id: 3, label: 'Select Service', icon: Briefcase },
    { id: 4, label: 'Options', icon: PlusCircle },
    { id: 5, label: 'Travelers', icon: Users },
    { id: 6, label: 'Review', icon: ClipboardList },
    { id: 7, label: 'Payment', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-eventra-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-eventra-slate-200 shadow-sm">
        <div className="section-container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/agent/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-eventra-blue-600 flex items-center justify-center">
                  <span className="text-white font-display font-bold text-xl">E</span>
                </div>
                <span className="font-display font-bold text-heading-md text-eventra-navy-900">Booking Workspace</span>
              </Link>
            </div>

            {/* Progress Steps */}
            <div className="hidden lg:flex items-center gap-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-body-sm font-medium transition-all',
                    index < 7 ? 'bg-eventra-blue-600 text-white' : 'bg-eventra-slate-200 text-eventra-slate-500'
                  )}>
                    {index < 7 ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  {index < STEPS.length - 1 && <div className="w-16 h-1 bg-eventra-slate-200 mx-2" />}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-body-sm text-eventra-slate-600">Step {currentStep} of 7</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="section-container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Search & Customers */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Panel */}
            <Card variant="elevated" padding="lg" className="sticky top-24">
              <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Services
              </h3>

              <div className="space-y-4">
                <Select
                  label="Service Type"
                  value="hotels"
                  onValueChange={() => {}}
                  options={[
                    { value: 'hotels', label: 'Hotels' },
                    { value: 'flights', label: 'Flights' },
                    { value: 'trains', label: 'Trains' },
                    { value: 'buses', label: 'Buses' },
                    { value: 'venues', label: 'Venues' },
                    { value: 'cars', label: 'Car Rentals' },
                    { value: 'activities', label: 'Activities' },
                    { value: 'transfers', label: 'Transfers' },
                    { value: 'packages', label: 'Packages' },
                  ]}
                  placeholder="Select service type"
                />

                <Input
                  label="Destination"
                  placeholder="City, hotel, airport..."
                  value=""
                  onChange={() => {}}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Check-in / Departure"
                    type="date"
                    value=""
                    onChange={() => {}}
                  />
                  <Input
                    label="Check-out / Return"
                    type="date"
                    value=""
                    onChange={() => {}}
                  </Input>
                </div>

                <Input
                  label="Guests / Passengers"
                  placeholder="2 Adults, 1 Child"
                  value=""
                  onChange={() => {}}
                />

                <Button className="w-full" loading={false} onClick={() => handleSearch({})}>
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </Card>

            {/* Selected Customer */}
            {false && (
              <Card variant="elevated" padding="lg" className="bg-eventra-blue-50 border-eventra-blue-200">
                <h4 className="font-semibold text-eventra-blue-900 mb-3">Selected Customer</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-bold">
                    JD
                  </div>
                  <div>
                    <p className="font-semibold text-eventra-navy-900">John Doe</p>
                    <p className="text-body-sm text-eventra-slate-600">john@example.com</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-3" onClick={() => {}}>
                  Change Customer
                </Button>
              </Card>
            )}
          </div>

          {/* Center Panel - Search Results / Service Selection */}
          <div className="lg:col-span-1 space-y-6">
            {false ? (
              <Card variant="elevated" padding="lg">
                <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-4">Search Results</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-eventra-slate-200 rounded-xl p-4 cursor-pointer hover:bg-eventra-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-eventra-slate-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-eventra-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-eventra-navy-900">Grand Hotel Dubai</h4>
                          <p className="text-body-sm text-eventra-slate-600">Dubai, UAE • 4.5★</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="price-md text-eventra-navy-900">₹12,500/night</span>
                        <Button size="sm">Select</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card variant="elevated" padding="lg" className="text-center h-full flex flex-col justify-center">
                <Search className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-2">Search for Services</h3>
                <p className="text-eventra-slate-600 mb-6">Select a service type, enter your search criteria, and click Search to find available options for your customer.</p>
                <div className="grid grid-cols-3 gap-3">
                  {['Hotels', 'Flights', 'Venues', 'Trains', 'Cars', 'Activities', 'Transfers', 'Packages', 'Buses'].map((type, i) => (
                    <button key={i} className="p-3 rounded-xl bg-eventra-slate-100 hover:bg-eventra-blue-50 transition-colors text-body-sm font-medium text-eventra-slate-700">
                      {type}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Selected Service Details */}
            {false && (
              <Card variant="elevated" padding="lg" className="bg-eventra-blue-50 border-eventra-blue-200">
                <h4 className="font-semibold text-eventra-blue-900 mb-3">Selected Service</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-eventra-navy-900">Grand Hotel Dubai</h4>
                      <p className="text-body-sm text-eventra-slate-600">Deluxe Room • 2 Adults • 3 Nights</p>
                    </div>
                    <span className="price-lg text-eventra-navy-900">₹37,500</span>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => {}}>
                    Change Selection
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Right Panel - Booking Builder */}
          <div className="lg:col-span-1 space-y-6">
            {/* Booking Summary */}
            <Card variant="elevated" padding="lg" className="sticky top-24 h-fit">
              <h3 className="text-heading-lg font-semibold text-eventra-navy-900 mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Booking Summary
              </h3>

              {false ? (
                <>
                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-eventra-slate-50 rounded-xl">
                      <div className="flex justify-between text-body-sm">
                        <span className="text-eventra-slate-600">Base Price (3 nights)</span>
                        <span className="text-eventra-navy-900">₹37,500</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-body-sm">
                        <span className="text-eventra-slate-600">Breakfast (2 adults × 3 days)</span>
                        <span className="text-eventra-navy-900">₹4,500</span>
                      </div>
                      <div className="flex justify-between text-body-sm">
                        <span className="text-eventra-slate-600">Airport Transfer</span>
                        <span className="text-eventra-navy-900">₹2,500</span>
                      </div>
                    </div>
                    <div className="border-t border-eventra-slate-200 pt-3 flex justify-between font-semibold text-lg">
                      <span className="text-eventra-navy-900">Total</span>
                      <span className="price-lg text-eventra-navy-900">₹44,500</span>
                    </div>
                  </div>

                  <Button className="w-full btn-lg" onClick={() => setCurrentStep(5)}>
                    Continue to Travelers <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-eventra-slate-300 mx-auto mb-4" />
                  <h4 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">No Service Selected</h4>
                  <p className="text-eventra-slate-600 mb-6">Search for services and select one to build the booking</p>
                  <div className="grid grid-cols-3 gap-3">
                    {['Hotels', 'Flights', 'Venues', 'Trains', 'Cars', 'Activities', 'Transfers', 'Packages', 'Buses'].map((type, i) => (
                      <button key={i} className="p-3 rounded-xl bg-eventra-slate-100 hover:bg-eventra-blue-50 transition-colors text-body-sm font-medium text-eventra-slate-700">
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card variant="elevated" padding="lg">
              <h4 className="font-semibold text-eventra-navy-900 mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-eventra-slate-50 hover:bg-eventra-slate-100 transition-colors text-left">
                  <PlusCircle className="w-5 h-5 text-eventra-blue-600" />
                  <span className="font-medium text-eventra-navy-900">Add Another Service</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-eventra-slate-50 hover:bg-eventra-slate-100 transition-colors text-left">
                  <FileText className="w-5 h-5 text-eventra-green-600" />
                  <span className="font-medium text-eventra-navy-900">Create Quote</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-eventra-slate-50 hover:bg-eventra-slate-100 transition-colors text-left">
                  <DollarSign className="w-5 h-5 text-eventra-amber-600" />
                  <span className="font-medium text-eventra-navy-900">Calculate Commission</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-eventra-slate-50 hover:bg-eventra-slate-100 transition-colors text-left">
                  <Shield className="w-5 h-5 text-eventra-red-600" />
                  <span className="font-medium text-eventra-navy-900">View Policies</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentBookingWorkspaceSkeleton() {
  return (
    <div className="min-h-screen bg-eventra-slate-50">
      <div className="sticky top-0 bg-white border-b border-eventra-slate-200 animate-pulse h-16" />
      <div className="section-container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <CardSkeleton />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}