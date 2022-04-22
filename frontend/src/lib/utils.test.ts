import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  generateBookingReference,
  generateId,
  slugify,
  truncate,
  getInitials,
  maskEmail,
  maskPhone,
  maskCardNumber,
  debounce,
  throttle,
  sleep,
  parseQueryString,
  buildQueryString,
  calculateNights,
  isPastDate,
  isFutureDate,
  addDays,
  addMonths,
  differenceInDays,
  getTimezoneOffset,
  getRelativeTime,
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('formats INR correctly', () => {
      expect(formatCurrency(1000, 'INR')).toBe('₹1,000')
    })

    it('formats USD correctly', () => {
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00')
    })

    it('handles zero', () => {
      expect(formatCurrency(0, 'INR')).toBe('₹0')
    })

    it('handles decimals', () => {
      expect(formatCurrency(1234.56, 'INR')).toBe('₹1,234.56')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('Jan 15, 2024')
    })

    it('handles string input', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
    })

    it('uses custom options', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' })).toBe('January 15, 2024')
    })
  })

  describe('formatDateTime', () => {
    it('formats date and time', () => {
      const date = new Date('2024-01-15T14:30:00')
      expect(formatDateTime(date)).toContain('Jan 15, 2024')
      expect(formatDateTime(date)).toContain('2:30 PM')
    })
  })

  describe('formatTime', () => {
    it('formats time correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      expect(formatTime(date)).toBe('2:30 PM')
    })
  })

  describe('generateBookingReference', () => {
    it('generates correct format', () => {
      const ref = generateBookingReference('hotel')
      expect(ref).toMatch(/^EVR-HTL-[A-Z0-9]{6}$/)
    })

    it('generates different references', () => {
      const ref1 = generateBookingReference('flight')
      const ref2 = generateBookingReference('flight')
      expect(ref1).not.toBe(ref2)
    })
  })

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^[a-z0-9]+$/)
    })

    it('includes prefix', () => {
      const id = generateId('booking')
      expect(id).toMatch(/^booking-/)
    })
  })

  describe('slugify', () => {
    it('converts to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('removes special characters', () => {
      expect(slugify('Hello@World!')).toBe('hello-world')
    })

    it('handles multiple spaces', () => {
      expect(slugify('Hello    World')).toBe('hello-world')
    })
  })

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
    })

    it('returns original if shorter', () => {
      expect(truncate('Hi', 10)).toBe('Hi')
    })
  })

  describe('getInitials', () => {
    it('gets initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('handles single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('handles multiple names', () => {
      expect(getInitials('John Michael Doe')).toBe('JM')
    })
  })

  describe('maskEmail', () => {
    it('masks email correctly', () => {
      expect(maskEmail('john@example.com')).toBe('j***n@example.com')
    })

    it('handles short local part', () => {
      expect(maskEmail('a@example.com')).toBe('a@example.com')
    })
  })

  describe('maskPhone', () => {
    it('masks phone number', () => {
      expect(maskPhone('9876543210')).toBe('98****3210')
    })

    it('handles short numbers', () => {
      expect(maskPhone('1234')).toBe('1234')
    })
  })

  describe('maskCardNumber', () => {
    it('masks card number', () => {
      expect(maskCardNumber('4111111111111111')).toBe('**** **** **** 1111')
    })
  })

  describe('debounce', () => {
    it('delays function execution', async () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)
      debounced()
      debounced()
      debounced()
      expect(fn).not.toHaveBeenCalled()
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('limits function execution', async () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)
      throttled()
      throttled()
      throttled()
      expect(fn).toHaveBeenCalledTimes(1)
      await new Promise(resolve => setTimeout(resolve, 150))
      throttled()
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('sleep', () => {
    it('delays execution', async () => {
      const start = Date.now()
      await sleep(100)
      expect(Date.now() - start).toBeGreaterThanOrEqual(90)
    })
  })

  describe('parseQueryString', () => {
    it('parses query string', () => {
      expect(parseQueryString('a=1&b=2')).toEqual({ a: '1', b: '2' })
    })

    it('handles empty string', () => {
      expect(parseQueryString('')).toEqual({})
    })
  })

  describe('buildQueryString', () => {
    it('builds query string', () => {
      expect(buildQueryString({ a: '1', b: '2' })).toBe('a=1&b=2')
    })

    it('skips null/undefined/empty', () => {
      expect(buildQueryString({ a: '1', b: null, c: undefined, d: '' })).toBe('a=1')
    })

    it('handles arrays', () => {
      expect(buildQueryString({ a: ['1', '2'] })).toBe('a=1&a=2')
    })
  })

  describe('calculateNights', () => {
    it('calculates nights correctly', () => {
      expect(calculateNights('2024-01-15', '2024-01-18')).toBe(3)
    })

    it('handles same day', () => {
      expect(calculateNights('2024-01-15', '2024-01-15')).toBe(0)
    })
  })

  describe('isPastDate', () => {
    it('returns true for past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isPastDate(yesterday)).toBe(true)
    })

    it('returns false for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isPastDate(tomorrow)).toBe(false)
    })
  })

  describe('isFutureDate', () => {
    it('returns true for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isFutureDate(tomorrow)).toBe(true)
    })

    it('returns false for past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isFutureDate(yesterday)).toBe(false)
    })
  })

  describe('addDays', () => {
    it('adds days correctly', () => {
      const date = new Date('2024-01-15')
      const result = addDays(date, 5)
      expect(result.getDate()).toBe(20)
    })
  })

  describe('addMonths', () => {
    it('adds months correctly', () => {
      const date = new Date('2024-01-15')
      const result = addMonths(date, 2)
      expect(result.getMonth()).toBe(2) // March (0-indexed)
    })
  })

  describe('differenceInDays', () => {
    it('calculates difference', () => {
      expect(differenceInDays('2024-01-15', '2024-01-18')).toBe(3)
    })
  })

  describe('getTimezoneOffset', () => {
    it('returns valid offset string', () => {
      const offset = getTimezoneOffset()
      expect(offset).toMatch(/^UTC[+-]\d{2}:\d{2}$/)
    })
  })

  describe('getRelativeTime', () => {
    it('returns past time', () => {
      const date = new Date(Date.now() - 3600000) // 1 hour ago
      expect(getRelativeTime(date)).toContain('ago')
    })

    it('returns future time', () => {
      const date = new Date(Date.now() + 3600000) // 1 hour from now
      expect(getRelativeTime(date)).toContain('In')
    })

    it('returns just now for recent', () => {
      const date = new Date()
      expect(getRelativeTime(date)).toBe('Just now')
    })
  })
})