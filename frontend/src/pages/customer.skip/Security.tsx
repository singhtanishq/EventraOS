import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Users, X, Loader2, Building2, Plane, MapPin as MapPinIcon, Train, Bus, Car, Sparkles, Truck, Package, ChevronDown, ChevronUp, Wallet, CreditCard, Plus, Minus, Trash2, Edit2, User, Shield, AlertCircle, CheckCircle2, Star, MessageSquare, Heart, PenTool, Flag, Trash2 as TrashIcon, Mail, Phone, Headphones, Send, Paperclip, MoreVertical, Bell, BellOff, Check, X as XIcon, Lock, Unlock, Eye, EyeOff, Fingerprint, Smartphone, Monitor, Globe, Key, RotateCcw, LogOut, AlertTriangle, LockOpen, HardDrive, Database, Server, ShieldCheck, ShieldAlert, UserCheck, UserX, Activity } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime, cn, getRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectOption } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'

interface SecurityData {
  sessions: Session[]
  security_events: SecurityEvent[]
  two_factor_enabled: boolean
  password_last_changed: string
  login_history: LoginHistory[]
}

interface Session {
  id: string
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
  id: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  ip: string
  location: string
  created_at: string
  is_resolved: boolean
}

interface LoginHistory {
  id: string
  ip: string
  device: string
  browser: string
  location: string
  success: boolean
  created_at: string
}

export function Security() {
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['customer-security'],
    queryFn: async () => {
      const response = await api.get('/customer/security')
      return response.data
    },
  })

  const security = data?.data
  const sessions = security?.sessions || []
  const securityEvents = security?.security_events || []
  const loginHistory = security?.login_history || []

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session? You will be logged out from that device.')) return
    try {
      const response = await api.delete(`/customer/security/sessions/${sessionId}`)
      if (response.data.success) {
        toast.success('Session revoked successfully')
      }
    } catch {
      toast.error('Failed to revoke session')
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!confirm('This will log you out from ALL devices including this one. Are you sure?')) return
    try {
      const response = await api.delete('/customer/security/sessions')
      if (response.data.success) {
        toast.success('All sessions revoked. You will be logged out.')
        setTimeout(() => window.location.href = '/login', 2000)
      }
    } catch {
      toast.error('Failed to revoke all sessions')
    }
  }

  const handleEnable2FA = async () => {
    setShow2FAModal(true)
  }

  const handleDisable2FA = async () => {
    setShowPasswordModal(true)
  }

  const handleChangePassword = async (passwordData: any) => {
    setIsProcessing(true)
    try {
      const response = await api.post('/auth/change-password', passwordData)
      if (response.data.success) {
        toast.success('Password changed successfully. Please log in again.')
        setShowPasswordModal(false)
        setTimeout(() => window.location.href = '/login', 2000)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsProcessing(false)
    }
  }

  const handle2FASetup = async (code: string) => {
    try {
      const response = await api.post('/auth/2fa/verify', { code })
      if (response.data.success) {
        toast.success('Two-factor authentication enabled')
        setShow2FAModal(false)
      }
    } catch {
      toast.error('Invalid code')
    }
  }

  if (isLoading) return <SecuritySkeleton />

  const securityData = data?.data
  const sessions = securityData?.sessions || []
  const securityEvents = securityData?.security_events || []
  const loginHistory = securityData?.login_history || []
  const twoFactorEnabled = securityData?.two_factor_enabled || false

  const currentSession = sessions.find(s => s.is_current)

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', twoFactorEnabled ? 'bg-eventra-green-100 text-eventra-green-600' : 'bg-eventra-amber-100 text-eventra-amber-600')}>
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
            onClick={twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
            leftIcon={twoFactorEnabled ? <LockOpen className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          >
            {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
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
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn('border border-eventra-slate-200 rounded-xl p-4 flex items-center justify-between', session.is_current && 'ring-2 ring-eventra-blue-200 bg-eventra-blue-50')}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', session.device.includes('Mobile') ? 'bg-eventra-blue-100 text-eventra-blue-600' : 'bg-eventra-slate-100 text-eventra-slate-600')}>
                      {session.device.includes('Mobile') ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-eventra-navy-900">{session.device}</h4>
                        {session.is_current && <Badge className="badge-primary text-xs">Current</Badge>}
                      </div>
                      <p className="text-body-sm text-eventra-slate-600">{session.browser} on {session.os}</p>
                      <p className="text-body-xs text-eventra-slate-500">{session.location} • {session.ip}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-sm text-eventra-slate-600">Last active</p>
                      <p className="text-body-sm font-medium text-eventra-navy-900">{getRelativeTime(session.last_active)}</p>
                    </div>
                  </div>
                  {!session.is_current && (
                    <Button variant="ghost" size="sm" className="text-eventra-red-600 hover:bg-eventra-red-50" onClick={() => setShowRevokeModal(session.id)} leftIcon={<UserX className="w-4 h-4" />}>
                      Revoke
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-eventra-slate-200">
              <Button variant="outline" className="w-full text-eventra-red-600 border-eventra-red-300 hover:bg-eventra-red-50" onClick={handleRevokeAllSessions} leftIcon={<LogOut className="w-5 h-5" />}>
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
                        <div className="flex items-center gap-3 mb-2">
                          <span className={cn('badge px-3 py-1 text-body-xs', 
                            event.severity === 'critical' ? 'bg-eventra-red-100 text-eventra-red-700' :
                            event.severity === 'high' ? 'bg-eventra-amber-100 text-eventra-amber-700' :
                            event.severity === 'medium' ? 'bg-eventra-blue-100 text-eventra-blue-700' :
                            'bg-eventra-slate-100 text-eventra-slate-700')}>
                            {event.severity.toUpperCase()}
                          </span>
                          {!event.is_resolved && <Badge className="badge-warning text-xs">Unresolved</Badge>}
                        </div>
                        <h4 className="font-semibold text-eventra-navy-900 mb-1">{event.event_type.replace('_', ' ')}</h4>
                        <p className="text-body-sm text-eventra-slate-600 mb-2">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-body-xs text-eventra-slate-500">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {event.ip}
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
            {loginHistory.map((login, index) => (
              <motion.div
                key={login.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border border-eventra-slate-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', login.success ? 'bg-eventra-green-100 text-eventra-green-600' : 'bg-eventra-red-100 text-eventra-red-600')}>
                      {login.success ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-eventra-navy-900">{login.success ? 'Successful Login' : 'Failed Login Attempt'}</h4>
                      <p className="text-body-sm text-eventra-slate-600">{login.device} • {login.browser}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm text-eventra-slate-600">{login.location}</p>
                    <p className="text-body-xs text-eventra-slate-500">{login.ip}</p>
                    <p className="text-body-xs text-eventra-slate-500 mt-1">{getRelativeTime(login.created_at)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Change Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => { setShowPasswordModal(false); }}
          title="Change Password"
          size="md"
        >
          <ChangePasswordForm onSubmit={handleChangePassword} isProcessing={isProcessing} />
        </Modal>

        {/* 2FA Setup Modal */}
        <Modal
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          title="Enable Two-Factor Authentication"
          size="lg"
        >
          <TwoFASetupForm onSubmit={handle2FASetup} />
        </Modal>

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
                className="flex-1 bg-eventra-red-600 hover:bg-eventra-red-700 text-white"
                onClick={() => { handleRevokeSession(showRevokeModal!); setShowRevokeModal(null); }}
              >
                Revoke Session
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

function ChangePasswordForm({ onSubmit, isProcessing }: { onSubmit: (data: any) => void; isProcessing: boolean }) {
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
        <Button variant="outline" className="flex-1" onClick={() => setShowPasswordModal(false)}>
          Cancel
        </Button>
        <Button type="submit" loading={isProcessing}>
          Change Password
        </Button>
      </div>
    </form>
  )
}

function TwoFASetupForm({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState('')
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [step, setStep] = useState<'setup' | 'verify'>('setup')

  useEffect(() => {
    // In production, fetch 2FA setup data from API
    setSecret('JBSWY3DPEHPK3PXP')
    setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...')
  }, [])

  const handleVerify = () => {
    if (code.length === 6) {
      onSubmit(code)
    } else {
      toast.error('Please enter a 6-digit code')
    }
  }

  if (step === 'setup') {
    return (
      <div className="space-y-6 text-center">
        <p className="text-eventra-slate-600">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
        <div className="flex justify-center">
          <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-xl bg-white p-4" />
        </div>
        <div className="p-4 bg-eventra-slate-50 rounded-xl">
          <p className="font-medium text-eventra-navy-900 mb-2">Or enter this setup key manually:</p>
          <code className="text-lg font-mono text-eventra-navy-900 bg-white px-4 py-2 rounded-lg inline-block">{secret}</code>
        </div>
        <Button onClick={() => setStep('verify')} className="w-full">Next</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-center">
      <p className="text-eventra-slate-600">Enter the 6-digit code from your authenticator app</p>
      <div className="flex justify-center gap-3">
        {[...Array(6)].map((_, i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={code[i] || ''}
            onChange={(e) => {
              const newCode = code.split('')
              newCode[i] = e.target.value
              setCode(newCode.join(''))
              if (e.target.value && i < 5) {
                document.querySelector(`input[data-index="${i + 1}"]`)?.focus()
              }
            }}
            data-index={i}
            className="w-12 h-16 text-center text-2xl font-bold border-2 border-eventra-slate-300 rounded-xl focus:border-eventra-blue-500 focus:outline-none"
            autoComplete="one-time-code"
          />
        ))}
      </div>
      <Button onClick={handleVerify} className="w-full" disabled={code.length !== 6}>
        Verify & Enable 2FA
      </Button>
    </div>
  )
}

function SecuritySkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <ActionCard key={i} icon={<Shield className="w-6 h-6" />} title="Action" description="Description" onClick={() => {}} />
        ))}
      </div>
      <Card variant="elevated" padding="lg" className="animate-pulse" />
      <Card variant="elevated" padding="lg" className="animate-pulse" />
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