import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale: string = 'en-IN'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, options).format(d)
}

export function formatDateTime(
  date: Date | string,
  locale: string = 'en-IN'
): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }, locale)
}

export function formatTime(
  date: Date | string,
  locale: string = 'en-IN'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function generateBookingReference(type: string): string {
  const prefix = type.toUpperCase().slice(0, 3)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `EVR-${prefix}-${result}`
}

export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}${prefix ? '-' : ''}${timestamp}${random}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return email
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length <= 4) return phone
  return `${cleaned.slice(0, 2)}****${cleaned.slice(-2)}`
}

export function maskCardNumber(number: string): string {
  const cleaned = number.replace(/\D/g, '')
  if (cleaned.length <= 4) return number
  return `**** **** **** ${cleaned.slice(-4)}`
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function parseQueryString(query: string): Record<string, string> {
  const params = new URLSearchParams(query)
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)))
      } else {
        searchParams.set(key, String(value))
      }
    }
  })
  return searchParams.toString()
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function isPastDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

export function isFutureDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d > today
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function differenceInDays(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getTimezoneOffset(date: Date = new Date()): string {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0')
  return `UTC${sign}${hours}:${minutes}`
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMs < 0) {
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`
    if (diffDays === -1) return 'Yesterday'
    if (diffHours < -1) return `${Math.abs(diffHours)} hours ago`
    if (diffHours === -1) return 'An hour ago'
    if (diffMins < -1) return `${Math.abs(diffMins)} minutes ago`
    return 'Just now'
  } else {
    if (diffDays > 1) return `In ${diffDays} days`
    if (diffDays === 1) return 'Tomorrow'
    if (diffHours > 1) return `In ${diffHours} hours`
    if (diffHours === 1) return 'In an hour'
    if (diffMins > 1) return `In ${diffMins} minutes`
    return 'Just now'
  }
}