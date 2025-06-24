import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface SavedTraveler {
  id: string
  uuid: string
  title: string
  first_name: string
  middle_name: string
  last_name: string
  date_of_birth: string
  gender: string
  nationality: string
  passport_number: string
  passport_expiry: string
  passport_issuing_country: string
  email: string
  phone: string
  preferences: any
  relationship: string
  is_default: boolean
  is_active: boolean
}

export function SavedTravelers() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [editingTraveler, setEditingTraveler] = useState<SavedTraveler | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<TravelerFormData>({
    title: 'Mr',
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    nationality: 'IN',
    passport_number: '',
    passport_expiry: '',
    passport_issuing_country: '',
    email: '',
    phone: '',
    relationship: 'self',
    is_default: false,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['saved-travelers'],
    queryFn: async () => {
      const response = await api.get('/customer/travelers')
      return response.data
    },
  })

  const travelers = data?.data?.travelers || []

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (editingTraveler) {
        const response = await api.put(`/customer/travelers/${editingTraveler.id}`, formData)
        if (response.data.success) {
          toast.success('Traveler updated successfully')
          setShowModal(false)
          setEditingTraveler(null)
        }
      } else {
        const response = await api.post('/customer/travelers', formData)
        if (response.data.success) {
          toast.success('Traveler added successfully')
          setShowModal(false)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save traveler')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (traveler: SavedTraveler) => {
    setEditingTraveler(traveler)
    setFormData({
      title: traveler.title,
      first_name: traveler.first_name,
      middle_name: traveler.middle_name,
      last_name: traveler.last_name,
      date_of_birth: traveler.date_of_birth,
      gender: traveler.gender,
      nationality: traveler.nationality,
      passport_number: traveler.passport_number,
      passport_expiry: traveler.passport_expiry,
      passport_issuing_country: traveler.passport_issuing_country,
      email: traveler.email,
      phone: traveler.phone,
      relationship: traveler.relationship,
      is_default: traveler.is_default,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this traveler?')) return
    try {
      const response = await api.delete(`/customer/travelers/${id}`)
      if (response.data.success) {
        toast.success('Traveler deleted successfully')
      }
    } catch {
      toast.error('Failed to delete traveler')
    }
  }

  const handleNew = () => {
    setEditingTraveler(null)
    setFormData({
      title: 'Mr',
      first_name: '',
      middle_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'male',
      nationality: 'IN',
      passport_number: '',
      passport_expiry: '',
      passport_issuing_country: '',
      email: '',
      phone: '',
      relationship: 'self',
      is_default: false,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: 'Mr',
      first_name: '',
      middle_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'male',
      nationality: 'IN',
      passport_number: '',
      passport_expiry: '',
      passport_issuing_country: '',
      email: '',
      phone: '',
      relationship: 'self',
      is_default: false,
    })
  }

  if (isLoading) return <TravelersSkeleton />

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Saved Travelers</h1>
          <p className="text-eventra-slate-600 mt-1">Manage traveler profiles for faster bookings</p>
        </div>
        <Button onClick={handleNew} leftIcon={<Plus className="w-5 h-5" />}>
          Add Traveler
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {travelers.length > 0 ? (
          travelers.map((traveler) => (
            <TravelerCard key={traveler.id} traveler={traveler} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full"
          >
            <EmptyTravelersState onAdd={handleNew} />
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); setEditingTraveler(null); }}
        title={editingTraveler ? 'Edit Traveler' : 'Add Traveler'}
        size="lg"
      >
        <TravelerForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  )
}

function TravelerCard({ traveler, onEdit, onDelete }: { traveler: any; onEdit: (t: any) => void; onDelete: (id: string) => void }) {
  const age = traveler.date_of_birth ? Math.floor((Date.now() - new Date(traveler.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

  return (
    <Card variant="interactive" className="h-full">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-medium text-lg">
              {traveler.first_name[0]}{traveler.last_name[0]}
            </div>
            <div>
              <h3 className="font-semibold text-eventra-navy-900">
                {traveler.title} {traveler.first_name} {traveler.last_name}
              </h3>
              <p className="text-body-sm text-eventra-slate-600 capitalize">{traveler.relationship}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="xs" onClick={() => onEdit(traveler)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="xs" onClick={() => onDelete(traveler.id)} className="text-eventra-red-600 hover:bg-eventra-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3 text-body-sm">
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <User className="w-4 h-4" />
              <span>{traveler.first_name} {traveler.last_name}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{traveler.date_of_birth ? formatDate(traveler.date_of_birth) : 'N/A'}</span>
              {age && <span className="text-eventra-slate-400 ml-2">({age} yrs)</span>}
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Shield className="w-4 h-4" />
              <span>{traveler.passport_number || 'No passport'}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <AlertCircle className="w-4 h-4" />
              <span>Expires: {traveler.passport_expiry ? formatDate(traveler.passport_expiry) : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{traveler.email}</span>
            </div>
            <div className="flex items-center gap-2 text-eventra-slate-600">
              <Phone className="w-4 h-4" />
              <span>{traveler.phone}</span>
            </div>
            {traveler.is_default && (
              <Badge className="badge-primary mt-2">Default Traveler</Badge>
            )}
          </div>
        </div>
      </Card>
    )
  )
}

function EmptyTravelersState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full text-center py-16"
    >
      <div className="w-24 h-24 rounded-full bg-eventra-slate-100 flex items-center justify-center mx-auto mb-6">
        <User className="w-12 h-12 text-eventra-slate-400" />
      </div>
      <h2 className="text-heading-lg font-bold text-eventra-navy-900 mb-2">No saved travelers</h2>
      <p className="text-eventra-slate-600 mb-6 max-w-md mx-auto">
        Save traveler profiles to book faster. Add family members, colleagues, or frequent travelers.
      </p>
      <Button onClick={onAdd} leftIcon={<Plus className="w-5 h-5" />}>
        Add Your First Traveler
      </Button>
    </motion.div>
  )
}

function TravelersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} variant="outlined" padding="lg" className="animate-pulse" />
      ))}
    </div>
  )
}

interface TravelerFormData {
  title: string
  first_name: string
  middle_name: string
  last_name: string
  date_of_birth: string
  gender: string
  nationality: string
  passport_number: string
  passport_expiry: string
  passport_issuing_country: string
  email: string
  phone: string
  relationship: string
  is_default: boolean
}

function TravelerForm({ formData, setFormData, onSubmit, isSubmitting }: { formData: TravelerFormData; setFormData: (d: TravelerFormData) => void; onSubmit: () => void; isSubmitting: boolean }) {
  const nationalities = [
    { value: 'IN', label: 'Indian' },
    { value: 'US', label: 'American' },
    { value: 'GB', label: 'British' },
    { value: 'AE', label: 'Emirati' },
    { value: 'SG', label: 'Singaporean' },
    { value: 'AU', label: 'Australian' },
    { value: 'CA', label: 'Canadian' },
    { value: 'DE', label: 'German' },
    { value: 'FR', label: 'French' },
    { value: 'JP', label: 'Japanese' },
  ]

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Title"
          value={formData.title}
          onValueChange={(v) => setFormData({ ...formData, title: v })}
          options={[
            { value: 'Mr', label: 'Mr' },
            { value: 'Mrs', label: 'Mrs' },
            { value: 'Ms', label: 'Ms' },
            { value: 'Dr', label: 'Dr' },
            { value: 'Prof', label: 'Prof' },
          ]}
        />
        <Select
          label="Gender"
          value={formData.gender}
          onValueChange={(v) => setFormData({ ...formData, gender: v })}
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          placeholder="John"
          required
        />
        <Input
          label="Last Name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          placeholder="Doe"
          required
        />
      </div>

      <Input
        label="Middle Name"
        value={formData.middle_name}
        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
        placeholder="Middle"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          required
        />
        <Select
          label="Nationality"
          value={formData.nationality}
          onValueChange={(v) => setFormData({ ...formData, nationality: v })}
          options={nationalities}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Passport Number"
          value={formData.passport_number}
          onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
          placeholder="A1234567"
        />
        <Input
          label="Passport Expiry"
          type="date"
          value={formData.passport_expiry}
          onChange={(e) => setFormData({ ...formData, passport_expiry: e.target.value })}
        />
      </div>

      <Input
        label="Passport Issuing Country"
        value={formData.passport_issuing_country}
        onChange={(e) => setFormData({ ...formData, passport_issuing_country: e.target.value })}
        placeholder="India"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@example.com"
        />
        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+91 98765 43210"
        />
      </div>

      <Select
        label="Relationship"
        value={formData.relationship}
        onValueChange={(v) => setFormData({ ...formData, relationship: v })}
        options={[
          { value: 'self', label: 'Self' },
          { value: 'spouse', label: 'Spouse' },
          { value: 'child', label: 'Child' },
          { value: 'parent', label: 'Parent' },
          { value: 'sibling', label: 'Sibling' },
          { value: 'friend', label: 'Friend' },
          { value: 'colleague', label: 'Colleague' },
          { value: 'other', label: 'Other' },
        ]}
      />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          className="form-checkbox"
        />
        <label htmlFor="is_default" className="text-body-sm text-eventra-slate-600 cursor-pointer">
          Set as default traveler
        </label>
      </div>

      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); }}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {editingTraveler ? 'Update' : 'Add'} Traveler
        </Button>
      </div>
    </form>
  )
}

import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { Mail, Phone } from 'lucide-react'