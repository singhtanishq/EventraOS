import { useState, useEffect, useCallback } from 'react'
import { useAuthStore, type User } from '@/store/auth'
import { api } from '@/lib/api'

interface AuthPayload {
  user: User
  token: string
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, logout: storeLogout, setUser, setLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('eventraos-auth')
      if (token) {
        try {
          const { data } = await api.get<{ data: AuthPayload }>('/auth/me')
          if (data.user) {
            setAuth(data.user, data.token)
          } else {
            storeLogout()
          }
        } catch {
          storeLogout()
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [setAuth, storeLogout, setLoading])

  const login = useCallback(async (email: string, password: string, remember = false) => {
    setError(null)
    try {
      const { data } = await api.post<{ data: AuthPayload }>('/auth/login', { email, password, remember })
      if (data.user && data.token) {
        setAuth(data.user, data.token)
        return { success: true, message: 'Welcome back!' }
      }
      return { success: false, message: 'Login failed' }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.'
      setError(message)
      return { success: false, message }
    }
  }, [setAuth])

  const register = useCallback(async (data: {
    name: string
    email: string
    phone: string
    password: string
    password_confirmation: string
  }) => {
    setError(null)
    try {
      const response = await api.post<{ data: AuthPayload }>('/auth/register', data)
      if (response.data.user && response.data.token) {
        setAuth(response.data.user, response.data.token)
        return { success: true, message: 'Account created successfully!' }
      }
      return { success: false, message: 'Registration failed' }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.'
      setError(message)
      return { success: false, message }
    }
  }, [setAuth])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore logout errors
    }
    storeLogout()
  }, [storeLogout])

  const forgotPassword = useCallback(async (email: string) => {
    setError(null)
    try {
      await api.post('/auth/forgot-password', { email })
      return { success: true, message: 'Password reset link sent to your email' }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send reset link'
      setError(message)
      return { success: false, message }
    }
  }, [])

  const resetPassword = useCallback(async (token: string, password: string, password_confirmation: string) => {
    setError(null)
    try {
      await api.post('/auth/reset-password', { token, password, password_confirmation })
      return { success: true, message: 'Password reset successful' }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reset password'
      setError(message)
      return { success: false, message }
    }
  }, [])

  const verifyEmail = useCallback(async (token: string) => {
    setError(null)
    try {
      await api.post('/auth/verify-email', { token })
      return { success: true, message: 'Email verified successfully' }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to verify email'
      setError(message)
      return { success: false, message }
    }
  }, [])

  const updateProfile = useCallback(async (data: Partial<{
    name: string
    phone: string
    avatar: string
    preferences: any
  }>) => {
    try {
      const { data } = await api.put('/auth/profile', data)
      if (data.user) {
        setUser(data.user)
      }
      return { success: true, message: 'Profile updated successfully' }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile'
      return { success: false, message }
    }
  }, [setUser])

  const changePassword = useCallback(async (current_password: string, password: string, password_confirmation: string) => {
    setError(null)
    try {
      await api.put('/auth/password', { current_password, password, password_confirmation })
      return { success: true, message: 'Password changed successfully' }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to change password'
      setError(message)
      return { success: false, message }
    }
  }, [])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile,
    changePassword,
    setError,
  }
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  
  return {
    isAuthenticated,
    isLoading,
    requireAuth: !isLoading && !isAuthenticated,
  }
}