import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  onClick,
  disabled = false,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors'
  
  const variants = {
    default: 'bg-eventra-slate-100 text-eventra-slate-700',
    success: 'bg-eventra-green-100 text-eventra-green-700',
    warning: 'bg-eventra-amber-100 text-eventra-amber-700',
    danger: 'bg-eventra-red-100 text-eventra-red-700',
    primary: 'bg-eventra-blue-100 text-eventra-blue-700',
    neutral: 'bg-eventra-slate-200 text-eventra-slate-700',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className, onClick && 'cursor-pointer hover:opacity-80', disabled && 'opacity-50 cursor-not-allowed')}
    >
      {children}
    </Component>
  )
}

Badge.displayName = 'Badge'