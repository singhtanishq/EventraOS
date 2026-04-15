import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { generateId } from '@/lib/utils'

export interface CartItem {
  id: string
  type: 'hotel' | 'flight' | 'train' | 'bus' | 'venue' | 'car' | 'activity' | 'transfer' | 'package'
  serviceId: string
  providerId?: string
  providerName?: string
  name: string
  description?: string
  image?: string
  location?: {
    city: string
    country: string
    address?: string
  }
  dates: {
    start: string
    end?: string
  }
  guests?: {
    adults: number
    children: number
    infants?: number
  }
  passengers?: number
  options: CartItemOption[]
  pricing: CartItemPricing
  availability: {
    available: boolean
    quantity?: number
    holdExpiresAt?: string
  }
  cancellationPolicy?: string
  metadata?: Record<string, unknown>
}

export interface CartItemOption {
  id: string
  name: string
  type: 'addon' | 'upgrade' | 'seat' | 'baggage' | 'meal' | 'insurance' | 'transfer' | 'other'
  price: number
  currency: string
  quantity: number
  metadata?: Record<string, unknown>
}

export interface CartItemPricing {
  basePrice: number
  taxes: number
  fees: number
  serviceFee: number
  discount: number
  optionsTotal: number
  total: number
  currency: string
  breakdown: PricingBreakdownItem[]
}

export interface PricingBreakdownItem {
  label: string
  amount: number
  currency: string
  type: 'base' | 'tax' | 'fee' | 'service_fee' | 'discount' | 'option'
  metadata?: Record<string, unknown>
}

export interface CartState {
  items: CartItem[]
  appliedPromoCode: string | null
  promoDiscount: number
  currency: string
  addItem: (item: Omit<CartItem, 'id'>) => string
  removeItem: (id: string) => void
  updateItem: (id: string, updates: Partial<CartItem>) => void
  updateItemOption: (itemId: string, optionId: string, updates: Partial<CartItemOption>) => void
  removeItemOption: (itemId: string, optionId: string) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
  getTotal: () => number
  getTotalByType: (type: CartItem['type']) => number
  setPromoCode: (code: string, discount: number) => void
  removePromoCode: () => void
  setCurrency: (currency: string) => void
  validateCart: () => { valid: boolean; errors: string[] }
  revalidatePricing: () => void
}

const calculateItemPricing = (item: Omit<CartItem, 'id'>): CartItemPricing => {
  const basePrice = item.pricing.basePrice
  const optionsTotal = item.options.reduce((sum, opt) => sum + opt.price * opt.quantity, 0)
  const subtotal = basePrice + optionsTotal
  const taxes = item.pricing.taxes || Math.round(subtotal * 0.18)
  const fees = item.pricing.fees || 0
  const serviceFee = item.pricing.serviceFee || Math.round(subtotal * 0.02)
  const discount = item.pricing.discount || 0
  const total = subtotal + taxes + fees + serviceFee - discount

  const breakdown: PricingBreakdownItem[] = [
    { label: 'Base Price', amount: basePrice, currency: item.pricing.currency, type: 'base' },
    ...item.options.map((opt) => ({
      label: opt.name,
      amount: opt.price * opt.quantity,
      currency: opt.currency,
      type: 'option' as const,
    })),
    { label: 'Taxes', amount: taxes, currency: item.pricing.currency, type: 'tax' },
    { label: 'Fees', amount: fees, currency: item.pricing.currency, type: 'fee' },
    { label: 'Service Fee', amount: serviceFee, currency: item.pricing.currency, type: 'service_fee' },
  ]

  if (discount > 0) {
    breakdown.push({ label: 'Discount', amount: -discount, currency: item.pricing.currency, type: 'discount' })
  }

  return {
    basePrice,
    taxes,
    fees,
    serviceFee,
    discount,
    optionsTotal,
    total,
    currency: item.pricing.currency,
    breakdown,
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedPromoCode: null,
      promoDiscount: 0,
      currency: 'INR',

      addItem: (item) => {
        const id = generateId('cart')
        const pricing = calculateItemPricing(item)
        const newItem: CartItem = { ...item, id, pricing }
        set((state) => ({ items: [...state.items, newItem] }))
        return id
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...updates,
                  pricing: updates.pricing || calculateItemPricing({ ...item, ...updates }),
                }
              : item
          ),
        }))
      },

      updateItemOption: (itemId, optionId, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  options: item.options.map((opt) =>
                    opt.id === optionId ? { ...opt, ...updates } : opt
                  ),
                  pricing: calculateItemPricing({
                    ...item,
                    options: item.options.map((opt) =>
                      opt.id === optionId ? { ...opt, ...updates } : opt
                    ),
                  }),
                }
              : item
          ),
        }))
      },

      removeItemOption: (itemId, optionId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  options: item.options.filter((opt) => opt.id !== optionId),
                  pricing: calculateItemPricing({
                    ...item,
                    options: item.options.filter((opt) => opt.id !== optionId),
                  }),
                }
              : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [], appliedPromoCode: null, promoDiscount: 0 })
      },

      getItemCount: () => {
        return get().items.length
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.pricing.basePrice + item.pricing.optionsTotal, 0)
      },

      getTotal: () => {
        const { items, promoDiscount } = get()
        const total = items.reduce((sum, item) => sum + item.pricing.total, 0)
        return Math.max(0, total - promoDiscount)
      },

      getTotalByType: (type) => {
        return get()
          .items.filter((item) => item.type === type)
          .reduce((sum, item) => sum + item.pricing.total, 0)
      },

      setPromoCode: (code, discount) => {
        set({ appliedPromoCode: code, promoDiscount: discount })
      },

      removePromoCode: () => {
        set({ appliedPromoCode: null, promoDiscount: 0 })
      },

      setCurrency: (currency) => {
        set({ currency })
      },

      validateCart: () => {
        const { items } = get()
        const errors: string[] = []

        if (items.length === 0) {
          errors.push('Cart is empty')
        }

        items.forEach((item) => {
          if (!item.availability.available) {
            errors.push(`${item.name} is no longer available`)
          }
          if (item.availability.holdExpiresAt && new Date(item.availability.holdExpiresAt) < new Date()) {
            errors.push(`Hold for ${item.name} has expired`)
          }
          if (item.type === 'hotel' && item.guests) {
            if (item.guests.adults < 1) {
              errors.push('At least one adult required for hotel booking')
            }
          }
          if (item.type === 'flight' && item.passengers) {
            if (item.passengers < 1) {
              errors.push('At least one passenger required for flight booking')
            }
          }
        })

        return { valid: errors.length === 0, errors }
      },

      revalidatePricing: () => {
        set((state) => ({
          items: state.items.map((item) => ({
            ...item,
            pricing: calculateItemPricing(item),
          })),
        }))
      },
    }),
    {
      name: 'eventraos-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)