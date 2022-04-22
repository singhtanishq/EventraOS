import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCartStore } from '@/store/cart'

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useCartStore.setState({
      items: [],
      appliedPromoCode: null,
      promoDiscount: 0,
      currency: 'INR',
    })
    vi.clearAllMocks()
  })

  describe('addItem', () => {
    it('adds item to cart', () => {
      const itemId = useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        providerId: 'demo_hotel',
        providerName: 'Demo Hotel',
        name: 'Grand Hotel',
        description: 'Luxury hotel in Dubai',
        image: 'hotel.jpg',
        location: { city: 'Dubai', country: 'UAE' },
        dates: { start: '2024-02-15', end: '2024-02-18' },
        guests: { adults: 2, children: 0 },
        options: [],
        pricing: {
          basePrice: 10000,
          taxes: 1800,
          fees: 200,
          serviceFee: 200,
          discount: 0,
          currency: 'INR',
        },
        availability: { available: true, quantity: 5 },
        cancellationPolicy: 'Free cancellation until 24h before',
      })

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0].id).toBe(itemId)
      expect(state.items[0].name).toBe('Grand Hotel')
      expect(state.items[0].type).toBe('hotel')
    })

    it('generates unique IDs', () => {
      const id1 = useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR' },
        availability: { available: true },
      })

      const id2 = useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '2',
        name: 'Hotel 2',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 6000, taxes: 1080, fees: 120, serviceFee: 120, discount: 0, currency: 'INR' },
        availability: { available: true },
      })

      const state = useCartStore.getState()
      expect(state.items[0].id).not.toBe(state.items[1].id)
    })
  })

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const itemId = useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR' },
        availability: { available: true },
      })

      useCartStore.getState().removeItem(useCartStore.getState().items[0].id)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })

    it('does nothing for non-existent item', () => {
      useCartStore.getState().removeItem('non-existent-id')
      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
    })
  })

  describe('updateItem', () => {
    it('updates item properties', () => {
      const itemId = useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR' },
        availability: { available: true },
      })

      useCartStore.getState().updateItem(useCartStore.getState().items[0].id, {
        name: 'Updated Hotel',
        guests: { adults: 2, children: 1 },
      })

      const state = useCartStore.getState()
      expect(state.items[0].name).toBe('Updated Hotel')
      expect(state.items[0].guests).toEqual({ adults: 2, children: 1 })
    })
  })

  describe('updateItemOption', () => {
    it('updates option', () => {
      const itemId = useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 2, children: 0 },
        options: [
          { id: 'opt1', name: 'Breakfast', type: 'addon', price: 500, currency: 'INR', quantity: 1 },
        ],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR' },
        availability: { available: true },
      })

      useCartStore.getState().updateItemOption(
        useCartStore.getState().items[0].id,
        'opt1',
        { quantity: 2 }
      )

      const state = useCartStore.getState()
      const item = state.items[0]
      const option = item.options.find(o => o.id === 'opt1')
      expect(option?.quantity).toBe(2)
    })
  })

  describe('removeItemOption', () => {
    it('removes option from item', () => {
      const itemId = useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 2, children: 0 },
        options: [
          { id: 'opt1', name: 'Breakfast', type: 'addon', price: 500, currency: 'INR', quantity: 1 },
          { id: 'opt2', name: 'Airport Transfer', type: 'addon', price: 1000, currency: 'INR', quantity: 1 },
        ],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR' },
        availability: { available: true },
      })

      useCartStore.getState().removeItemOption(
        useCartStore.getState().items[0].id,
        'opt1'
      )

      const state = useCartStore.getState()
      const item = state.items[0]
      expect(item.options).toHaveLength(1)
      expect(item.options[0].id).toBe('opt2')
    })
  })

  describe('clearCart', () => {
    it('clears all items', () => {
      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR' },
        availability: { available: true },
      })

      useCartStore.getState().clearCart()

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.appliedPromoCode).toBeNull()
      expect(state.promoDiscount).toBe(0)
    })
  })

  describe('getItemCount', () => {
    it('returns correct count', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0)

      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR' },
        availability: { available: true },
      })

      expect(useCartStore.getState().getItemCount()).toBe(1)
    })
  })

  describe('getSubtotal', () => {
    it('calculates subtotal correctly', () => {
      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [{ id: 'opt1', name: 'Breakfast', type: 'addon', price: 500, currency: 'INR', quantity: 1 }],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR', optionsTotal: 500, total: 6600, currency: 'INR', breakdown: [] },
        availability: { available: true },
      })

      expect(useCartStore.getState().getSubtotal()).toBe(5500) // 5000 + 500
    })
  })

  describe('getTotal', () => {
    it('calculates total with promo discount', () => {
      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR', optionsTotal: 0, total: 6100, currency: 'INR', breakdown: [] },
        availability: { available: true },
      })

      useCartStore.getState().setPromoCode('SAVE10', 500)

      expect(useCartStore.getState().getTotal()).toBe(5600) // 6100 - 500
    })

    it('does not go below zero', () => {
      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 1000, taxes: 0, fees: 0, serviceFee: 0, discount: 0, currency: 'INR', optionsTotal: 0, total: 1000, currency: 'INR', breakdown: [] },
        availability: { available: true },
      })

      useCartStore.getState().setPromoCode('SAVE100', 2000)

      expect(useCartStore.getState().getTotal()).toBe(0)
    })
  })

  describe('getTotalByType', () => {
    it('calculates total by type', () => {
      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR', optionsTotal: 0, total: 6100, currency: 'INR', breakdown: [] },
        availability: { available: true },
      })

      useCartStore.getState().addItem({
        type: 'flight',
        serviceId: '2',
        name: 'Flight 1',
        dates: { start: '2024-02-15' },
        passengers: 1,
        options: [],
        pricing: { basePrice: 10000, taxes: 1800, fees: 200, serviceFee: 200, discount: 0, currency: 'INR', optionsTotal: 0, total: 12200, currency: 'INR', breakdown: [] },
        availability: { available: true },
      })

      expect(useCartStore.getState().getTotalByType('hotel')).toBe(6100)
      expect(useCartStore.getState().getTotalByType('flight')).toBe(12200)
    })
  })

  describe('promo code', () => {
    it('sets promo code', () => {
      useCartStore.getState().setPromoCode('SAVE10', 500)
      const state = useCartStore.getState()
      expect(state.appliedPromoCode).toBe('SAVE10')
      expect(state.promoDiscount).toBe(500)
    })

    it('removes promo code', () => {
      useCartStore.getState().setPromoCode('SAVE10', 500)
      useCartStore.getState().removePromoCode()
      const state = useCartStore.getState()
      expect(state.appliedPromoCode).toBeNull()
      expect(state.promoDiscount).toBe(0)
    })
  })

  describe('setCurrency', () => {
    it('sets currency', () => {
      useCartStore.getState().setCurrency('USD')
      const state = useCartStore.getState()
      expect(state.currency).toBe('USD')
    })
  })

  describe('validateCart', () => {
    it('returns valid for valid cart', () => {
      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15', end: '2024-02-18' },
        guests: { adults: 2, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR', optionsTotal: 0, total: 6100, currency: 'INR', breakdown: [] },
        availability: { available: true },
      })

      const result = useCartStore.getState().validateCart()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns invalid for empty cart', () => {
      const result = useCartStore.getState().validateCart()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Cart is empty')
    })

    it('returns invalid for unavailable item', () => {
      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR', optionsTotal: 0, total: 6100, currency: 'INR', breakdown: [] },
        availability: { available: false },
      )

      const result = useCartStore.getState().validateCart()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Hotel 1 is no longer available')
    })

    it('returns invalid for expired hold', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString() // yesterday
      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 1, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR', optionsTotal: 0, total: 6100, currency: 'INR', breakdown: [] },
        availability: { available: true, holdExpiresAt: pastDate },
      })

      const result = useCartStore.getState().validateCart()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Hold for Hotel 1 has expired')
    })

    it('returns invalid for hotel without adults', () => {
      useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 0, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR', optionsTotal: 0, total: 6100, currency: 'INR', breakdown: [] },
        availability: { available: true },
      })

      const result = useCartStore.getState().validateCart()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one adult required for hotel booking')
    })
  })

  describe('revalidatePricing', () => {
    it('recalculates pricing for all items', () => {
      const itemId = useCartStore.getState().addItem({
        type: 'hotel',
        serviceId: '1',
        name: 'Hotel 1',
        dates: { start: '2024-02-15' },
        guests: { adults: 2, children: 0 },
        options: [],
        pricing: { basePrice: 5000, taxes: 900, fees: 100, serviceFee: 100, discount: 0, currency: 'INR', optionsTotal: 0, total: 6100, currency: 'INR', breakdown: [] },
        availability: { available: true },
      })

      const stateBefore = useCartStore.getState()
      const totalBefore = stateBefore.items[0].pricing.total

      // Change base price by updating the item
      useCartStore.getState().updateItem(stateBefore.items[0].id, {
        pricing: { ...stateBefore.items[0].pricing, basePrice: 6000 },
      })

      const stateAfter = useCartStore.getState()
      expect(stateAfter.items[0].pricing.basePrice).toBe(6000)
    })
  })
})