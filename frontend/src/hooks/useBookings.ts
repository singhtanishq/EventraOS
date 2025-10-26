import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'

export interface Booking {
  id: string
  booking_reference: string
  service_type: string
  service_name: string
  status: string
  status_label: string
  dates: { start: string; end?: string }
  guests?: number
  passengers?: number
  total_amount: number
  currency: string
  created_at: string
  service_details: any
  provider_name?: string
  cancellation_policy?: string
  can_cancel?: boolean
  can_reschedule?: boolean
  payment_status?: string
}

interface UseBookingsOptions {
  status?: string
  page?: number
  per_page?: number
  autoFetch?: boolean
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { status, page = 1, per_page = 10, autoFetch = true } = options
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    current_page: page,
    last_page: 1,
    total: 0,
    per_page,
  })

  const fetchBookings = useCallback(async (pageNum = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      params.set('page', pageNum.toString())
      params.set('per_page', per_page.toString())

      const { data } = await api.get(`/bookings?${params.toString()}`)
      setBookings(data.data || data.bookings || [])
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load bookings'
      return { success: false, message }
    }
  }, [status, per_page])

  const cancelBooking = useCallback(async (bookingId: string, reason: string, requestRefund = false) => {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/cancel`, { reason, request_refund: requestRefund })
      return { success: true, message: data.message || 'Booking cancelled successfully' }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to cancel booking'
      return { success: false, message }
    }
  }, [])

  const rescheduleBooking = useCallback(async (bookingId: string, newStartDate: string, newEndDate?: string) => {
    try {
      const { data } = await api.post(`/bookings/${bookingId}/reschedule`, { new_start_date: newStartDate, new_end_date: newEndDate })
      return { success: true, message: data.message || 'Booking rescheduled successfully' }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reschedule booking'
      return { success: false, message }
    }
  }, [])

  const getBooking = useCallback(async (bookingId: string) => {
    try {
      const { data } = await api.get(`/bookings/${bookingId}`)
      return data.data || data
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load booking'
      throw new Error(message)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchBookings(page)
    }
  }, [page, status, autoFetch])

  return {
    bookings,
    isLoading,
    error,
    pagination,
    fetchBookings,
    cancelBooking,
    rescheduleBooking,
    getBooking,
    setBookings,
  }
}

export function useBooking(bookingId: string) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get(`/bookings/${bookingId}`)
      setBooking(data.data || data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load booking')
    } finally {
      setIsLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  return { booking, isLoading, error, refetch: fetchBooking }
}

export function useUpcomingBookings(limit = 5) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchUpcoming = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get('/bookings/upcoming', { params: { limit } })
      setBookings(data.data || data.bookings || [])
    } catch {
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchUpcoming()
  }, [fetchUpcoming])

  return { bookings, isLoading, refetch: fetchUpcoming }
}