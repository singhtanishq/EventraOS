import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  id: string
  uuid: string
  name: string
  email: string
  phone?: string
  role: 'customer' | 'agent' | 'admin'
  avatar?: string
  email_verified_at?: string
  created_at: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  currency: string
  language: string
  timezone: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    marketing: boolean
  }
  travel: {
    default_cabin_class: string
    seat_preference: string
    meal_preference: string
    special_assistance: boolean
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string, refreshToken?: string) => void
  setUser: (user: Partial<User>) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: 'customer' | 'agent' | 'admin') => boolean
}

const rolePermissions: Record<string, string[]> = {
  customer: [
    'bookings.view',
    'bookings.create',
    'bookings.cancel',
    'profile.view',
    'profile.edit',
    'payments.view',
    'payments.make',
    'reviews.create',
    'support.create',
    'wallet.view',
    'loyalty.view',
  ],
  agent: [
    'bookings.view',
    'bookings.create',
    'bookings.edit',
    'bookings.cancel',
    'customers.view',
    'customers.create',
    'customers.edit',
    'quotes.create',
    'quotes.view',
    'commissions.view',
    'tasks.view',
    'tasks.create',
    'tasks.complete',
    'support.view',
    'support.respond',
    'reports.view',
  ],
  admin: [
    '*',
  ],
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken: refreshToken || get().refreshToken,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      setUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      hasPermission: (permission) => {
        const { user } = get()
        if (!user) return false
        if (user.role === 'admin') return true
        const permissions = rolePermissions[user.role] || []
        return permissions.includes('*') || permissions.includes(permission)
      },

      hasRole: (role) => {
        const { user } = get()
        return user?.role === role
      },
    }),
    {
      name: 'eventraos-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export const getAuthToken = (): string | null => {
  return useAuthStore.getState().token
}

export const clearAuth = (): void => {
  useAuthStore.getState().logout()
}