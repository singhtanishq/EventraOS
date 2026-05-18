import { forwardRef, ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: ReactNode
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  offset?: number
  className?: string
  contentClassName?: string
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, position = 'top', delay = 200, offset = 8, className, contentClassName }, ref) => {
    const [isVisible, setIsVisible] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
    const tooltipRef = useRef<HTMLDivElement>(null)
    const childRef = useRef<HTMLElement>(null)

    const showTooltip = () => {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true)
      }, delay)
    }

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsVisible(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideTooltip()
      }
    }

    const child = React.Children.only(children)
    const childWithProps = React.cloneElement(child, {
      ref: (node: HTMLElement | null) => {
        childRef.current = node
        if (typeof child.ref === 'function') {
          child.ref(node)
        } else if (child.ref && typeof child.ref === 'object') {
          ;(child.ref as React.MutableRefObject<HTMLElement | null>).current = node
        }
        if (ref && typeof ref === 'function') {
          ref(node)
        } else if (ref && typeof ref === 'object') {
          ;(ref as React.MutableRefObject<HTMLElement | null>).current = node
        }
      },
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
      onFocus: showTooltip,
      onBlur: hideTooltip,
      onKeyDown: handleKeyDown,
      'aria-describedby': isVisible ? 'tooltip-content' : undefined,
    })

    const getPositionStyles = () => {
      const baseStyles = {
        position: 'absolute' as const,
        zIndex: 50,
        pointerEvents: 'none' as const,
      }

      const positions = {
        top: {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-8px)',
          marginBottom: `${offset}px`,
        },
        bottom: {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(8px)',
          marginTop: `${offset}px`,
        },
        left: {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(-8px)',
          marginRight: `${offset}px`,
        },
        right: {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(8px)',
          marginLeft: `${offset}px`,
        },
      }

      return { ...baseStyles, ...positions[position] }
    }

    if (!isVisible) return childWithProps

    const tooltipContent = (
      <motion.div
        ref={tooltipRef}
        style={getPositionStyles()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={cn(
          'px-3 py-1.5 text-body-xs font-medium text-white bg-eventra-navy-900 rounded-lg shadow-lg whitespace-nowrap',
          contentClassName
        )}
        id="tooltip-content"
        role="tooltip"
      >
        {content}
        <div
          className={cn(
            'absolute w-0 h-0 border-4 border-transparent',
            {
              'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-eventra-navy-900': position === 'top',
              'top-[-4px] left-1/2 -translate-x-1/2 border-b-eventra-navy-900': position === 'bottom',
              'left-[-4px] top-1/2 -translate-y-1/2 border-r-eventra-navy-900': position === 'left',
              'right-[-4px] top-1/2 -translate-y-1/2 border-l-eventra-navy-900': position === 'right',
            }
          )}
        />
      </motion.div>
    )

    if (typeof window === 'undefined') return childWithProps

    return (
      <>
        {childWithProps}
        {createPortal(tooltipContent, document.body)}
      </>
    )
  }
)

Tooltip.displayName = 'Tooltip'

// Tooltip trigger wrapper
export function TooltipTrigger({
  children,
  tooltip,
  position = 'top',
  delay = 200,
}: {
  children: React.ReactElement
  tooltip: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}) {
  return (
    <Tooltip content={tooltip} position={position} delay={delay}>
      {children}
    </Tooltip>
  )
}

// Tooltip with arrow indicator
export function TooltipWithArrow({
  content,
  children,
  position = 'top',
  delay = 200,
  offset = 8,
}: {
  content: React.ReactNode
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  offset?: number
}) {
  return <Tooltip content={content} position={position} delay={delay} offset={offset}>{children}</Tooltip>
}

// Hover card - richer tooltip with custom content
interface HoverCardProps {
  trigger: React.ReactElement
  content: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  closeOnClick?: boolean
  contentClassName?: string
}

export function HoverCard({
  trigger,
  content,
  position = 'top',
  delay = 200,
  closeOnClick = true,
  contentClassName,
}: HoverCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const tooltipRef = useRef<HTMLDivElement>(null)

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(true), delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(false)
  }

  const triggerWithProps = React.cloneElement(trigger, {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    onClick: closeOnClick ? hide : undefined,
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') hide()
  }

  if (!isOpen) return triggerWithProps

  return (
    <>
      {triggerWithProps}
      {createPortal(
        <motion.div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            zIndex: 50,
            ...getPositionStyles(position),
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={cn('bg-white rounded-xl shadow-lg border border-eventra-slate-200 p-4 max-w-xs', contentClassName)}
          onMouseEnter={show}
          onMouseLeave={hide}
          onKeyDown={handleKeyDown}
          role="dialog"
        >
          {content}
        </motion.div>,
        document.body
      )}
    </>
  )

  function getPositionStyles(pos: string) {
    const baseStyles = { position: 'absolute' as const, zIndex: 50 }
    const positions = {
      top: { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)', marginBottom: '8px' },
      bottom: { top: '100%', left: '50%', transform: 'translateX(-50%) translateY(8px)', marginTop: '8px' },
      left: { right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-8px)', marginRight: '8px' },
      right: { left: '100%', top: '50%', transform: 'translateY(-50%) translateX(8px)', marginLeft: '8px' },
    }
    return { ...baseStyles, ...positions[position] }
  }
}

// Import missing hooks
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'