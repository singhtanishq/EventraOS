import { createElement, forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

const headingClasses: Record<HeadingLevel, string> = {
  h1: 'text-heading-2xl font-display font-bold text-eventra-navy-900',
  h2: 'text-heading-xl font-display font-bold text-eventra-navy-900',
  h3: 'text-heading-lg font-semibold text-eventra-navy-900',
  h4: 'text-heading-md font-semibold text-eventra-navy-900',
  h5: 'text-heading-sm font-semibold text-eventra-navy-900',
  h6: 'text-body-lg font-semibold text-eventra-navy-900',
}

export const Heading = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement> & { level?: HeadingLevel }>(
  ({ level = 'h2', className, children, ...props }, ref) =>
    createElement(level, { ref, className: cn(headingClasses[level], className), ...props }, children)
)
Heading.displayName = 'Heading'

export const Text = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement> & { muted?: boolean }>(
  ({ className, muted, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-body-md', muted && 'text-eventra-slate-600', className)} {...props}>
      {children}
    </p>
  )
)
Text.displayName = 'Text'

export const Label = forwardRef<HTMLLabelElement, HTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={cn('label', className)} {...props}>
      {children}
    </label>
  )
)
Label.displayName = 'Label'

export const Divider = forwardRef<HTMLHRElement, HTMLAttributes<HTMLHRElement>>(
  ({ className, ...props }, ref) => (
    <hr ref={ref} className={cn('border-t border-eventra-slate-200', className)} {...props} />
  )
)
Divider.displayName = 'Divider'
