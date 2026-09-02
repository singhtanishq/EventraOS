import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  User, Calendar, Shield, AlertCircle, Mail, Phone, Plus, Edit2, Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface SavedTraveler {
  id: number
  uuid: string
  title?: string | null
  first_name: string
  middle_name?: string | null
  last_name: string
  date_of_birth?: string | null
  gender?: string | null
  nationality?: string | null
  passport_number?: string | null
  passport_expiry?: string | null
  passport_issuing_country?: string | null
  email?: string | null
  phone?: string | null
  relationship: string
  is_default: boolean
  is_active: boolean
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

const EMPTY_FORM: TravelerFormData = {
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
}

export function SavedTravelers() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingTraveler, setEditingTraveler] = useState<SavedTraveler | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<TravelerFormData>(EMPTY_FORM)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['saved-travelers'],
    queryFn: async () => {
      const body = await api.get<any>('/customer/travelers')
      return body
    },
  })

  const travelers: SavedTraveler[] = data?.data?.travelers ?? []

  const refreshTravelers = () => {
    queryClient.invalidateQueries({ queryKey: ['saved-travelers'] })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        passport_expiry: formData.passport_expiry || null,
      }
      if (editingTraveler) {
        const body = await api.put<any>(`/customer/travelers/${editingTraveler.id}`, payload)
        if (body.success) {
          toast.success('Traveler updated successfully')
          setShowModal(false)
          setEditingTraveler(null)
          refreshTravelers()
        } else {
          toast.error(body.message || 'Failed to update traveler')
        }
      } else {
        const body = await api.post<any>('/customer/travelers', payload)
        if (body.success) {
          toast.success('Traveler added successfully')
          setShowModal(false)
          refreshTravelers()
        } else {
          toast.error(body.message || 'Failed to add traveler')
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save traveler'
      const errors = err?.response?.data?.errors
      toast.error(typeof errors === 'object' && errors ? Object.values(errors)[0]?.[0] || message : message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (traveler: SavedTraveler) => {
    setEditingTraveler(traveler)
    setFormData({
      title: traveler.title || 'Mr',
      first_name: traveler.first_name || '',
      middle_name: traveler.middle_name || '',
      last_name: traveler.last_name || '',
      date_of_birth: traveler.date_of_birth || '',
      gender: traveler.gender || 'male',
      nationality: traveler.nationality || 'IN',
      passport_number: traveler.passport_number || '',
      passport_expiry: traveler.passport_expiry || '',
      passport_issuing_country: traveler.passport_issuing_country || '',
      email: traveler.email || '',
      phone: traveler.phone || '',
      relationship: traveler.relationship || 'self',
      is_default: !!traveler.is_default,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this traveler?')) return
    setDeletingId(id)
    try {
      const body = await api.delete<any>(`/customer/travelers/${id}`)
      if (body.success) {
        toast.success('Traveler deleted successfully')
        refreshTravelers()
      } else {
        toast.error(body.message || 'Failed to delete traveler')
      }
    } catch {
      toast.error('Failed to delete traveler')
    } finally {
      setDeletingId(null)
    }
  }

  const handleNew = () => {
    setEditingTraveler(null)
    setFormData(EMPTY_FORM)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTraveler(null)
  }

  if (isLoading) return <TravelersSkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load saved travelers</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

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
            <TravelerCard
              key={traveler.id}
              traveler={traveler}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={deletingId === traveler.id}
            />
          ))
        ) : (
          <div className="col-span-full">
            <EmptyTravelersState onAdd={handleNew} />
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTraveler ? 'Edit Traveler' : 'Add Traveler'}
        size="lg"
      >
        <TravelerForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={closeModal}
          isSubmitting={isSubmitting}
          editing={!!editingTraveler}
        />
      </Modal>
    </div>
  )
}

function TravelerCard({ traveler, onEdit, onDelete, isDeleting }: { traveler: SavedTraveler; onEdit: (t: SavedTraveler) => void; onDelete: (id: number) => void; isDeleting: boolean }) {
  const initials = `${traveler.first_name?.[0] || ''}${traveler.last_name?.[0] || ''}`.toUpperCase()
  const age = traveler.date_of_birth
    ? Math.floor((Date.now() - new Date(traveler.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <Card variant="interactive" padding="none" className="h-full">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center font-medium text-lg flex-shrink-0">
              {initials || <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-eventra-navy-900 truncate">
                {[traveler.title, traveler.first_name, traveler.last_name].filter(Boolean).join(' ')}
              </h3>
              <p className="text-body-sm text-eventra-slate-600 capitalize">{traveler.relationship}</p>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="xs" onClick={() => onEdit(traveler)} aria-label="Edit traveler">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDelete(traveler.id)}
              disabled={isDeleting}
              className="text-eventra-red-600 hover:bg-eventra-red-50"
              aria-label="Delete traveler"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3 text-body-sm">
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <User className="w-4 h-4 flex-shrink-0" />
            <span>{traveler.first_name} {traveler.last_name}</span>
          </div>
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{traveler.date_of_birth ? formatDate(traveler.date_of_birth) : 'N/A'}</span>
            {age !== null && age >= 0 && <span className="text-eventra-slate-400 ml-2">({age} yrs)</span>}
          </div>
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{traveler.passport_number || 'No passport'}</span>
          </div>
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Expires: {traveler.passport_expiry ? formatDate(traveler.passport_expiry) : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{traveler.email || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-eventra-slate-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{traveler.phone || '—'}</span>
          </div>
          {traveler.is_default && (
            <Badge variant="primary" className="mt-2">Default Traveler</Badge>
          )}
        </div>
      </div>
    </Card>
  )
}

function EmptyTravelersState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
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
    <div className="space-y-6 animate-in">
      <div className="h-8 w-52 rounded-lg skeleton" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="outlined" padding="lg" className="animate-pulse h-72" />
        ))}
      </div>
    </div>
  )
}

function TravelerForm({ formData, setFormData, onSubmit, onClose, isSubmitting, editing }: {
  formData: TravelerFormData
  setFormData: (d: TravelerFormData) => void
  onSubmit: () => void
  onClose: () => void
  isSubmitting: boolean
  editing: boolean
}) {
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
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
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
        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
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

      <div className={cn('flex gap-3 pt-4 border-t border-eventra-slate-200')}>
        <Button variant="outline" className="flex-1" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {editing ? 'Update' : 'Add'} Traveler
        </Button>
      </div>
    </form>
  )
}
