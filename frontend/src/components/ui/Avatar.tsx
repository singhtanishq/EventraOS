import { forwardRef, ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square'
  fallback?: ReactNode
  status?: 'online' | 'offline' | 'busy' | 'away'
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-body-xs',
  md: 'w-10 h-10 text-body-sm',
  lg: 'w-12 h-12 text-body-md',
  xl: 'w-16 h-16 text-body-lg',
  '2xl': 'w-24 h-24 text-heading-sm',
}

const shapeClasses = {
  circle: 'rounded-full',
  square: 'rounded-xl',
}

const statusSizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
}

const statusPositionClasses = {
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
}

const statusColorClasses = {
  online: 'bg-eventra-green-500',
  offline: 'bg-eventra-slate-400',
  busy: 'bg-eventra-red-500',
  away: 'bg-eventra-amber-500',
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      shape = 'circle',
      fallback,
      status,
      statusPosition = 'bottom-right',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false)

    const showFallback = !src || imageError
    const fallbackContent = fallback || (name ? getInitials(name) : (
      <svg className="w-1/2 h-1/2 text-eventra-slate-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.67-5.33-4-8-4z" />
      </svg>
    ))

    const statusIndicator = status && (
      <span
        className={cn(
          'absolute border-2 border-white rounded-full',
          statusSizeClasses[size],
          statusPositionClasses[statusPosition],
          statusColorClasses[status]
        )}
        aria-label={status}
      />
    )

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden bg-eventra-slate-100 text-eventra-slate-600 font-medium',
          'flex-shrink-0',
          shapeClasses[shape],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {statusIndicator}
        {showFallback ? (
          <span className="flex items-center justify-center w-full h-full">
            {fallbackContent}
          </span>
        ) : (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        {children}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

// Avatar Group component
interface AvatarGroupProps {
  children: React.ReactNode
  max?: number
  overlap?: number
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function AvatarGroup({
  children,
  max = 5,
  overlap = 8,
  className,
  size = 'md',
}: AvatarGroupProps) {
  const childArray = React.Children.toArray(children)
  const visibleChildren = childArray.slice(0, max)
  const remainingCount = childArray.length - max

  return (
    <div className={cn('flex', className)}>
      {visibleChildren.map((child, index) => (
        <span
          key={index}
          className="relative z-10"
          style={{
            marginLeft: index === 0 ? 0 : -overlap,
            zIndex: max - index,
          }}
        >
          {React.cloneElement(child as React.ReactElement<any>, { size })}
        </span>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center font-medium text-eventra-slate-600 border-2 border-white',
            shapeClasses.circle,
            sizeClasses[size],
            'ml-[-8px]'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

// Status indicator dot
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

export function StatusIndicator({
  status,
  size = 'md',
  className,
  label,
}: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        className
      )}
      aria-label={label || status}
    >
      <span
        className={cn(
          'rounded-full',
          statusSizeClasses[size],
          statusColorClasses[status]
        )}
      />
      {label && <span className="text-body-sm text-eventra-slate-600 capitalize">{label}</span>}
    </span>
  )
}

// Avatar with status badge
export function AvatarWithStatus({
  src,
  name,
  status,
  size = 'md',
  ...props
}: AvatarProps & { status: 'online' | 'offline' | 'busy' | 'away' }) {
  return (
    <Avatar
      {...props}
      src={src}
      name={name}
      size={size}
      status={status}
      statusPosition="bottom-right"
    />
  )
}

// Stacked avatar group for compact display
interface StackedAvatarGroupProps {
  avatars: Array<{
    src?: string
    name?: string
    alt?: string
    status?: 'online' | 'offline' | 'busy' | 'away'
  }>
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export function StackedAvatarGroup({
  avatars,
  max = 4,
  size = 'sm',
  className,
}: StackedAvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
          status={avatar.status}
          className={cn('ring-2 ring-white', index > 0 && '-ml-2')}
        />
      ))}
      {avatars.length > max && (
        <div
          className={cn(
            'flex items-center justify-center font-medium text-eventra-slate-600 border-2 border-white',
            shapeClasses.circle,
            sizeClasses[size],
            '-ml-2'
          )}
        >
          +{avatars.length - max}
        </div>
      )}
    </div>
  )
}