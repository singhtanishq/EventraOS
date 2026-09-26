import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Shield, ShieldCheck, ShieldAlert, LockOpen, Key, LogOut, Activity, AlertTriangle,
  Smartphone, Monitor, Globe, HardDrive, Calendar, UserCheck, UserX, CheckCircle2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getRelativeTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { clearAuth } from '@/store/auth'
import { toast } from 'react-hot-toast'

interface SecuritySession {
  id: number
  device: string
  browser: string
  os: string
  ip: string
  location: string
  is_current: boolean
  last_active: string
  created_at: string
}

interface SecurityEvent {
  id: number
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  ip: string
  location: string
  created_at: string
  is_resolved?: boolean
}

export function Security() {
  const queryClient = useQueryClient()
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState<SecuritySession | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customer-security'],
    queryFn: async () => {
      const body = await api.get<any>('/customer/security')
      return body
    },
  })

  const security = data?.data
  const sessions: SecuritySession[] = security?.sessions ?? []
  const securityEvents: SecurityEvent[] = security?.security_events ?? []
  const loginHistory: SecurityEvent[] = security?.login_history ?? []
  const twoFactorEnabled = !!security?.two_factor_enabled

  const refreshSecurity = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-security'] })
  }

  const handleRevokeSession = async (session: SecuritySession) => {
    setIsProcessing(true)
    try {
      const body = await api.delete<any>(`/auth/sessions/${session.id}`)
      if (body.success) {
        toast.success('Session revoked successfully')
        refreshSecurity()
      } else {
        toast.error(body.message || 'Failed to revoke session')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to revoke session')
    } finally {
      setIsProcessing(false)
      setShowRevokeModal(null)
    }
  }

  const handleRevokeAllSessions = async () => {
    setIsProcessing(true)
    try {
      const body = await api.delete<any>('/auth/sessions')
      if (body.success) {
        toast.success('All sessions revoked. Redirecting to login…')
        clearAuth()
        setTimeout(() => { window.location.href = '/login' }, 1500)
      } else {
        toast.error(body.message || 'Failed to revoke all sessions')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to revoke all sessions')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleChangePassword = async (passwordData: { current_password: string; password: string; password_confirmation: string }) => {
    setIsProcessing(true)
    try {
      const body = await api.post<any>('/auth/change-password', passwordData)
      if (body.success) {
        toast.success('Password changed successfully. Please log in again.')
        setShowPasswordModal(false)
        clearAuth()
        setTimeout(() => { window.location.href = '/login' }, 1500)
      } else {
        toast.error(body.message || 'Failed to change password')
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to change password'
      const errors = err?.response?.data?.errors
      toast.error(typeof errors === 'object' && errors ? Object.values(errors)[0]?.[0] || message : message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) return <SecuritySkeleton />

  if (isError) {
    return (
      <div className="alert alert-danger text-center py-12">
        <p className="font-medium">Failed to load security settings</p>
        <p className="text-body-sm mt-1">{(error as Error)?.message || 'Please try again'}</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-display font-bold text-eventra-navy-900">Security Center</h1>
          <p className="text-eventra-slate-600 mt-1">Manage your account security and privacy settings</p>
        </div>
      </div>

      {/* 2FA Status */}
      <Card variant="elevated" padding="lg" className={twoFactorEnabled ? 'bg-eventra-green-50 border-eventra-green-200' : 'bg-eventra-amber-50 border-eventra-amber-200'}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', twoFactorEnabled ? 'bg-eventra-green-100 text-eventra-green-600' : 'bg-eventra-amber-100 text-eventra-amber-600')}>
              {twoFactorEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-semibold text-eventra-navy-900">Two-Factor Authentication</h3>
              <p className="text-eventra-slate-600 text-body-sm">
                {twoFactorEnabled
                  ? 'Your account is protected with 2FA. Only you can access your account.'
                  : 'Add an extra layer of security to your account. Requires a code from your authenticator app.'}
              </p>
            </div>
          </div>
          <Button
            variant={twoFactorEnabled ? 'outline' : 'primary'}
            onClick={twoFactorEnabled ? () => setShowDisable2FAModal(true) : () => setShow2FAModal(true)}
            leftIcon={twoFactorEnabled ? <LockOpen className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          >
            {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ActionCard
          icon={<Key className="w-6 h-6" />}
          title="Change Password"
          description="Update your password"
          onClick={() => setShowPasswordModal(true)}
        />
        <ActionCard
          icon={<LogOut className="w-6 h-6" />}
          title="Active Sessions"
          description={`${sessions.length} active session${sessions.length !== 1 ? 's' : ''}`}
          onClick={() => {}}
        />
        <ActionCard
          icon={<Activity className="w-6 h-6" />}
          title="Login History"
          description="Recent login activity"
          onClick={() => {}}
        />
        <ActionCard
          icon={<AlertTriangle className="w-6 h-6" />}
          title="Security Alerts"
          description={`${securityEvents.filter(e => !e.is_resolved).length} unresolved`}
          onClick={() => {}}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading-lg font-semibold text-eventra-navy-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Active Sessions ({sessions.length})
            </h2>
          </div>

          <div className="space-y-3">
            {sessions.length > 0 ? (
              sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn('border border-eventra-slate-200 rounded-xl p-4 flex items-center justify-between gap-4', session.is_current && 'ring-2 ring-eventra-blue-200 bg-eventra-blue-50')}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', session.device?.includes('Mobile') ? 'bg-eventra-blue-100 text-eventra-blue-600' : 'bg-eventra-slate-100 text-eventra-slate-600')}>
                      {session.device?.includes('Mobile') ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-semibold text-eventra-navy-900">{session.device || 'Web Browser'}</h4>
                        {session.is_current && <Badge variant="primary" size="sm">Current</Badge>}
                      </div>
                      <p className="text-body-sm text-eventra-slate-600">{session.browser || 'Unknown browser'} on {session.os || 'Unknown OS'}</p>
                      <p className="text-body-xs text-eventra-slate-500">{session.location || '—'} • {session.ip || '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-body-xs text-eventra-slate-500">Last active</p>
                      <p className="text-body-sm font-medium text-eventra-navy-900">{getRelativeTime(session.last_active || session.created_at)}</p>
                    </div>
                    {!session.is_current && (
                      <Button variant="ghost" size="sm" className="text-eventra-red-600 hover:bg-eventra-red-50" onClick={() => setShowRevokeModal(session)} leftIcon={<UserX className="w-4 h-4" />}>
                        Revoke
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <ShieldCheck className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
                <p className="text-eventra-slate-600">No active sessions found</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-eventra-slate-200">
            <Button variant="outline" className="w-full text-eventra-red-600 border-eventra-red-300 hover:bg-eventra-red-50" onClick={handleRevokeAllSessions} loading={isProcessing} leftIcon={<LogOut className="w-5 h-5" />}>
              Revoke All Sessions
            </Button>
          </div>
        </Card>

        {/* Security Events */}
        <Card variant="elevated" padding="lg">
          <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Security Events ({securityEvents.filter(e => !e.is_resolved).length} unresolved)
          </h2>

          <div className="space-y-3">
            {securityEvents.length > 0 ? (
              securityEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn('border border-eventra-slate-200 rounded-xl p-4', !event.is_resolved && 'bg-eventra-red-50 border-eventra-red-200')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={cn('badge px-3 py-1 text-body-xs',
                          event.severity === 'critical' ? 'bg-eventra-red-100 text-eventra-red-700' :
                          event.severity === 'high' ? 'bg-eventra-amber-100 text-eventra-amber-700' :
                          event.severity === 'medium' ? 'bg-eventra-blue-100 text-eventra-blue-700' :
                          'bg-eventra-slate-100 text-eventra-slate-700')}>
                          {event.severity?.toUpperCase() || 'LOW'}
                        </span>
                        {!event.is_resolved && <Badge variant="warning" size="sm">Unresolved</Badge>}
                      </div>
                      <h4 className="font-semibold text-eventra-navy-900 mb-1 capitalize">{String(event.event_type || 'Event').replace(/_/g, ' ')}</h4>
                      <p className="text-body-sm text-eventra-slate-600 mb-2">{event.description}</p>
                      <div className="flex flex-wrap gap-4 text-body-xs text-eventra-slate-500">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {event.location || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {event.ip || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {getRelativeTime(event.created_at)}
                        </span>
                      </div>
                    </div>
                    {!event.is_resolved && (
                      <Button variant="ghost" size="sm" className="text-eventra-green-600 hover:bg-eventra-green-50" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <ShieldCheck className="w-12 h-12 text-eventra-green-600 mx-auto mb-4" />
                <h3 className="text-heading-md font-semibold text-eventra-navy-900 mb-2">No security events</h3>
                <p className="text-eventra-slate-600">Your account has been secure with no suspicious activity detected.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Login History */}
      <Card variant="elevated" padding="lg">
        <h2 className="text-heading-lg font-semibold text-eventra-navy-900 mb-6">Recent Login History</h2>
        <div className="space-y-3">
          {loginHistory.length > 0 ? (
            loginHistory.map((login, index) => (
              <motion.div
                key={login.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border border-eventra-slate-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', login.is_resolved !== false ? 'bg-eventra-green-100 text-eventra-green-600' : 'bg-eventra-red-100 text-eventra-red-600')}>
                      {login.is_resolved !== false ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-eventra-navy-900">{login.is_resolved !== false ? 'Successful Login' : 'Failed Login Attempt'}</h4>
                      <p className="text-body-sm text-eventra-slate-600">{login.description || login.event_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm text-eventra-slate-600">{login.location || '—'}</p>
                    <p className="text-body-xs text-eventra-slate-500">{login.ip || '—'}</p>
                    <p className="text-body-xs text-eventra-slate-500 mt-1">{getRelativeTime(login.created_at)}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-eventra-slate-300 mx-auto mb-4" />
              <p className="text-eventra-slate-600">Login history will appear here as you use your account</p>
            </div>
          )}
        </div>
      </Card>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
      >
        <ChangePasswordForm onSubmit={handleChangePassword} onClose={() => setShowPasswordModal(false)} isProcessing={isProcessing} />
      </Modal>

      {/* 2FA Setup Modal */}
      <TwoFASetupModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={() => { setShow2FAModal(false); refreshSecurity() }}
      />

      {/* Disable 2FA Modal */}
      <Disable2FAModal
        isOpen={showDisable2FAModal}
        onClose={() => setShowDisable2FAModal(false)}
        onSuccess={() => { setShowDisable2FAModal(false); refreshSecurity() }}
      />

      {/* Revoke Session Modal */}
      <Modal
        isOpen={!!showRevokeModal}
        onClose={() => setShowRevokeModal(null)}
        title="Revoke Session"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-eventra-amber-50 border border-eventra-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-eventra-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-eventra-amber-800">This will log you out from that device</p>
                <p className="text-body-sm text-eventra-amber-700 mt-1">
                  The session will be terminated immediately. You'll need to log in again from that device.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowRevokeModal(null)}>
              Keep Session
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={isProcessing}
              onClick={() => showRevokeModal && handleRevokeSession(showRevokeModal)}
            >
              Revoke Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ChangePasswordForm({ onSubmit, onClose, isProcessing }: { onSubmit: (data: { current_password: string; password: string; password_confirmation: string }) => void; onClose: () => void; isProcessing: boolean }) {
  const [formData, setFormData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Current Password"
        type="password"
        value={formData.current_password}
        onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
        required
      />
      <Input
        label="New Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        minLength={8}
        required
      />
      <Input
        label="Confirm New Password"
        type="password"
        value={formData.password_confirmation}
        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
        required
      />
      <div className="flex gap-3 pt-4 border-t border-eventra-slate-200">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isProcessing}>
          Change Password
        </Button>
      </div>
    </form>
  )
}

function TwoFASetupModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [setup, setSetup] = useState<{ secret: string; qr_code_url: string; recovery_codes: string[] } | null>(null)
  const [code, setCode] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [step, setStep] = useState<'setup' | 'verify'>('setup')

  useEffect(() => {
    if (!isOpen) {
      setSetup(null)
      setCode('')
      setStep('setup')
      return
    }
    let cancelled = false
    const startSetup = async () => {
      setIsSettingUp(true)
      try {
        const body = await api.post<any>('/auth/2fa/enable')
        if (!cancelled && body.success && body.data) {
          setSetup({
            secret: body.data.secret,
            qr_code_url: body.data.qr_code_url,
            recovery_codes: body.data.recovery_codes || [],
          })
        } else if (!cancelled) {
          toast.error(body.message || 'Could not start 2FA setup')
          onClose()
        }
      } catch (err: any) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || 'Could not start 2FA setup')
          onClose()
        }
      } finally {
        if (!cancelled) setIsSettingUp(false)
      }
    }
    startSetup()
    return () => { cancelled = true }
  }, [isOpen, onClose])

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }
    setIsVerifying(true)
    try {
      const body = await api.post<any>('/auth/2fa/verify', { code })
      if (body.success) {
        toast.success('Two-factor authentication enabled')
        onSuccess()
      } else {
        toast.error(body.message || 'Invalid code')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid code')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enable Two-Factor Authentication" size="lg">
      {isSettingUp && (
        <div className="py-12 text-center">
          <p className="text-eventra-slate-600">Setting up 2FA…</p>
        </div>
      )}

      {!isSettingUp && setup && step === 'setup' && (
        <div className="space-y-6 text-center">
          <p className="text-eventra-slate-600">Add this setup key to your authenticator app (Google Authenticator, Authy, etc.)</p>
          <div className="p-4 bg-eventra-slate-50 rounded-xl">
            <p className="font-medium text-eventra-navy-900 mb-2">Or enter this setup key manually:</p>
            <code className="text-body-sm font-mono text-eventra-navy-900 bg-white px-4 py-2 rounded-lg inline-block break-all">{setup.secret}</code>
          </div>
          <div className="p-4 bg-eventra-slate-50 rounded-xl text-left">
            <p className="font-medium text-eventra-navy-900 mb-2 text-center">Authenticator URI</p>
            <code className="text-body-xs font-mono text-eventra-slate-600 break-all block">{setup.qr_code_url}</code>
          </div>
          {setup.recovery_codes.length > 0 && (
            <div className="p-4 bg-eventra-amber-50 border border-eventra-amber-200 rounded-xl text-left">
              <p className="font-medium text-eventra-amber-800 mb-2">Save your recovery codes somewhere safe:</p>
              <div className="grid grid-cols-2 gap-1">
                {setup.recovery_codes.map((rc) => (
                  <code key={rc} className="text-body-xs font-mono text-eventra-amber-800">{rc}</code>
                ))}
              </div>
            </div>
          )}
          <Button onClick={() => setStep('verify')} className="w-full">Next</Button>
        </div>
      )}

      {!isSettingUp && setup && step === 'verify' && (
        <div className="space-y-6 text-center">
          <p className="text-eventra-slate-600">Enter the 6-digit code from your authenticator app</p>
          <div className="flex justify-center gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-48 h-16 text-center text-2xl font-bold tracking-widest border-2 border-eventra-slate-300 rounded-xl focus:border-eventra-blue-500 focus:outline-none"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>
          <Button onClick={handleVerify} className="w-full" loading={isVerifying} disabled={code.length !== 6}>
            Verify & Enable 2FA
          </Button>
        </div>
      )}
    </Modal>
  )
}

function Disable2FAModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!isOpen) setPassword('')
  }, [isOpen])

  const handleDisable = async () => {
    if (!password) {
      toast.error('Enter your password to disable 2FA')
      return
    }
    setIsProcessing(true)
    try {
      const body = await api.post<any>('/auth/2fa/disable', { password })
      if (body.success) {
        toast.success('Two-factor authentication disabled')
        onSuccess()
      } else {
        toast.error(body.message || 'Invalid password')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid password')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Disable Two-Factor Authentication" size="md">
      <div className="space-y-4">
        <div className="p-4 bg-eventra-amber-50 border border-eventra-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-eventra-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-body-sm text-eventra-amber-800">
              Disabling 2FA will make your account less secure. You can re-enable it at any time.
            </p>
          </div>
        </div>
        <Input
          label="Confirm your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={handleDisable} loading={isProcessing}>Disable 2FA</Button>
        </div>
      </div>
    </Modal>
  )
}

function SecuritySkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="h-8 w-52 rounded-lg skeleton" />
      <Card variant="elevated" padding="lg" className="animate-pulse h-28" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="elevated" padding="lg" className="animate-pulse h-28" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card variant="elevated" padding="lg" className="animate-pulse h-72" />
        <Card variant="elevated" padding="lg" className="animate-pulse h-72" />
      </div>
    </div>
  )
}

function ActionCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-4 text-left hover:shadow-card-hover transition-shadow group">
      <div className="w-10 h-10 rounded-xl bg-eventra-blue-100 text-eventra-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="font-semibold text-eventra-navy-900 mb-1">{title}</h4>
      <p className="text-body-sm text-eventra-slate-600">{description}</p>
    </button>
  )
}
