import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, setAuth, logout, setLoading, setUser } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('eventraos-auth')
      if (storedToken) {
        try {
          const { data } = await api.get('/auth/me')
          if (data.success && data.data) {
            setAuth(data.data.user, data.data.token, data.data.refresh_token)
          } else {
            logout()
          }
        } catch {
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string, remember = false) => {
    const { data } = await api.post('/auth/login', { email, password, remember })
    
    if (data.success && data.data) {
      setAuth(data.data.user, data.data.token, data.data.refresh_token)
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
      return { success: true }
    }
    
    return { success: false, message: data.message }
  }

  const register = async (userData: {
    name: string
    email: string
    password: string
    password_confirmation: string
    phone?: string
  }) => {
    const { data } = await api.post('/auth/register', userData)
    
    if (data.success && data.data) {
      setAuth(data.data.user, data.data.token, data.data.refresh_token)
      navigate('/customer/dashboard', { replace: true })
      return { success: true }
    }
    
    return { success: false, message: data.message, errors: data.errors }
  }

  const forgotPassword = async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return { success: data.success, message: data.message }
  }

  const resetPassword = async (token: string, password: string, password_confirmation: string) => {
    const { data } = await api.post('/auth/reset-password', { token, password, password_confirmation })
    return { success: data.success, message: data.message }
  }

  const verifyEmail = async (token: string) => {
    const { data } = await api.post('/auth/verify-email', { token })
    return { success: data.success, message: data.message }
  }

  const updateProfile = async (userData: Partial<typeof user>) => {
    const { data } = await api.put('/auth/profile', userData)
    
    if (data.success && data.data) {
      setUser(data.data.user)
      return { success: true }
    }
    
    return { success: false, message: data.message }
  }

  const changePassword = async (current_password: string, password: string, password_confirmation: string) => {
    const { data } = await api.post('/auth/change-password', { current_password, password, password_confirmation })
    return { success: data.success, message: data.message }
  }

  const enable2FA = async () => {
    const { data } = await api.post('/auth/2fa/enable')
    return { success: data.success, data: data.data }
  }

  const verify2FA = async (code: string) => {
    const { data } = await api.post('/auth/2fa/verify', { code })
    return { success: data.success, message: data.message }
  }

  const disable2FA = async (password: string) => {
    const { data } = await api.post('/auth/2fa/disable', { password })
    return { success: data.success, message: data.message }
  }

  const getSessions = async () => {
    const { data } = await api.get('/auth/sessions')
    return data.success ? data.data : []
  }

  const revokeSession = async (sessionId: string) => {
    const { data } = await api.delete(`/auth/sessions/${sessionId}`)
    return { success: data.success, message: data.message }
  }

  const revokeAllSessions = async () => {
    const { data } = await api.delete('/auth/sessions')
    if (data.success) {
      logout()
      navigate('/login')
    }
    return { success: data.success, message: data.message }
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile,
    changePassword,
    enable2FA,
    verify2FA,
    disable2FA,
    getSessions,
    revokeSession,
    revokeAllSessions,
  }
}

export function useRequireAuth(allowedRoles?: string[]) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true, state: { from: location } })
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        navigate('/', { replace: true })
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, navigate, location])

  return { isAuthenticated, isLoading, user }
}

export function useGuest() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  return { isAuthenticated, isLoading }
}