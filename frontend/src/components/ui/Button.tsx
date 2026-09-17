import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'lg' | 'md' | 'sm' | 'xs'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, leftIcon, rightIcon, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-eventra-navy-900 text-white hover:bg-eventra-navy-800 focus-visible:ring-eventra-navy-500',
      secondary: 'bg-eventra-slate-100 text-eventra-navy-900 hover:bg-eventra-slate-200 focus-visible:ring-eventra-slate-400',
      outline: 'border-2 border-eventra-navy-900 text-eventra-navy-900 hover:bg-eventra-navy-900 hover:text-white focus-visible:ring-eventra-navy-500',
      ghost: 'text-eventra-navy-700 hover:bg-eventra-slate-100 focus-visible:ring-eventra-slate-400',
      danger: 'bg-eventra-red-600 text-white hover:bg-eventra-red-700 focus-visible:ring-eventra-red-500',
      success: 'bg-eventra-green-600 text-white hover:bg-eventra-green-700 focus-visible:ring-eventra-green-500',
    }

    const sizes = {
      lg: 'px-8 py-4 text-body-lg',
      md: 'px-6 py-3 text-body-md',
      sm: 'px-4 py-2 text-body-sm',
      xs: 'px-3 py-1.5 text-body-xs',
    }

    const width = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], width, className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4"
            aria-hidden="true"
          >
            <Loader2 className="w-4 h-4" />
          </motion.span>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'danger'; size?: 'lg' | 'md' | 'sm' }>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-eventra-slate-100 text-eventra-navy-700 hover:bg-eventra-slate-200 hover:text-eventra-navy-900',
      ghost: 'text-eventra-slate-600 hover:bg-eventra-slate-100 hover:text-eventra-navy-900',
      danger: 'bg-eventra-red-50 text-eventra-red-600 hover:bg-eventra-red-100 hover:text-eventra-red-700',
    }

    const sizes = {
      lg: 'p-3',
      md: 'p-2',
      sm: 'p-1.5',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

export const ButtonGroup = ({ children, className, vertical = false }: { children: React.ReactNode; className?: string; vertical?: boolean }) => {
  return (
    <div
      className={cn(
        'inline-flex rounded-xl border border-eventra-slate-200 overflow-hidden',
        vertical ? 'flex-col' : 'flex-row',
        className
      )}
      role="group"
    >
      {children}
    </div>
  )
}