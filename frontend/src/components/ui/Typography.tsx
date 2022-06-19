import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: 'display-xl' | 'display-lg' | 'display-md' | 'display-sm' | 'heading-xl' | 'heading-lg' | 'heading-md' | 'heading-sm' | 'body-lg' | 'body-md' | 'body-sm' | 'body-xs' | 'caption' | 'overline'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'danger' | 'inherit'
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'small' | 'blockquote'
}

const variantClasses = {
  'display-xl': 'text-display-xl font-display font-bold',
  'display-lg': 'text-display-lg font-display font-bold',
  'display-md': 'text-display-md font-display font-bold',
  'display-sm': 'text-display-sm font-display font-bold',
  'heading-xl': 'text-heading-xl font-semibold',
  'heading-lg': 'text-heading-lg font-semibold',
  'heading-md': 'text-heading-md font-semibold',
  'heading-sm': 'text-heading-sm font-medium',
  'body-lg': 'text-body-lg',
  'body-md': 'text-body-md',
  'body-sm': 'text-body-sm',
  'body-xs': 'text-body-xs',
  'caption': 'text-body-xs text-eventra-slate-500',
  'overline': 'text-body-xs uppercase tracking-wider font-medium',
}

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const colorClasses = {
  primary: 'text-eventra-navy-900',
  secondary: 'text-eventra-slate-600',
  muted: 'text-eventra-slate-400',
  success: 'text-eventra-green-600',
  warning: 'text-eventra-amber-600',
  danger: 'text-eventra-red-600',
  inherit: 'text-inherit',
}

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body-md', weight = 'normal', color = 'primary', as: Component = 'p', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          variantClasses[variant],
          weightClasses[weight],
          colorClasses[color],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Typography.displayName = 'Typography'

// Specialized typography components
export const Display = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography ref={ref} variant="display-lg" className={className} {...props} />
  )
)
Display.displayName = 'Display'

export const Heading = forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  ({ className, level = 2, ...props }, ref) => {
    const variants = {
      1: 'display-sm',
      2: 'heading-xl',
      3: 'heading-lg',
      4: 'heading-md',
      5: 'heading-sm',
      6: 'heading-sm',
    }
    return (
      <Typography ref={ref} variant={variants[level as keyof typeof variants]} as={`h${level}`} className={className} {...props} />
    )
  }
)
Heading.displayName = 'Heading'

export const Body = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  ({ className, size = 'md', ...props }, ref) => (
    <Typography ref={ref} variant={`body-${size}`} as="p" className={className} {...props} />
  )
)
Body.displayName = 'Body'

export const Caption = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography ref={ref} variant="caption" className={className} {...props} />
  )
)
Caption.displayName = 'Caption'

export const Overline = forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography ref={ref} variant="overline" className={className} {...props} />
  )
)
Overline.displayName = 'Overline'

export const Blockquote = forwardRef<HTMLQuoteElement, TypographyProps>(
  ({ className, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn('border-l-4 border-eventra-blue-500 pl-4 italic text-eventra-slate-600', className)}
      {...props}
    />
  )
)
Blockquote.displayName = 'Blockquote'

export const Code = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, children, inline = false, ...props }, ref) => {
    const Component = inline ? 'code' : 'pre'
    return (
      <Component
        ref={ref}
        className={cn(
          'font-mono text-eventra-navy-900 bg-eventra-slate-100 rounded-lg',
          inline ? 'px-1.5 py-0.5 text-body-sm' : 'p-4 overflow-x-auto text-body-sm',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Code.displayName = 'Code'

export const Link = forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'text-eventra-blue-600 hover:text-eventra-blue-700 underline-offset-2 hover:underline',
      muted: 'text-eventra-slate-500 hover:text-eventra-slate-700 underline-offset-2 hover:underline',
      danger: 'text-eventra-red-600 hover:text-eventra-red-700 underline-offset-2 hover:underline',
      button: 'inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white bg-eventra-blue-600 hover:bg-eventra-blue-700 transition-colors',
    }

    return (
      <a
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    )
  }
)
Link.displayName = 'Link'

export const List = forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ordered = false, spaced = true, ...props }, ref) => (
    <(ordered ? 'ol' : 'ul')
      ref={ref}
      className={cn(
        'list-disc list-inside space-y-2',
        ordered && 'list-decimal',
        spaced && 'space-y-3',
        className
      )}
      {...props}
    />
  )
)
List.displayName = 'List'

export const ListItem = forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('flex items-start gap-2', className)} {...props} />
  )
)
ListItem.displayName = 'ListItem'

export const Divider = forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <hr
      ref={ref}
      className={cn(
        'border-eventra-slate-200',
        orientation === 'horizontal' ? 'w-full' : 'h-8',
        className
      )}
      {...props}
    />
  )
)
Divider.displayName = 'Divider'