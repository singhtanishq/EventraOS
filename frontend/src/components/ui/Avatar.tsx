import { cn } from '@/lib/utils'

interface AvatarProps {
  name?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
}

export function Avatar({ name, src, size = 'md', className, alt }: AvatarProps) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center overflow-hidden bg-eventra-navy-900 text-white font-medium select-none shrink-0',
        sizes[size],
        className
      )}
      title={name}
    >
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}

Avatar.displayName = 'Avatar'
