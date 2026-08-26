import { forwardRef, ReactNode, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  offset?: number
  className?: string
  contentClassName?: string
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-eventra-navy-900',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-eventra-navy-900',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-eventra-navy-900',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-eventra-navy-900',
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, position = 'top', delay = 200, className, contentClassName }, ref) => {
    const [isVisible, setIsVisible] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

    const showTooltip = () => {
      timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
    }

    const hideTooltip = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setIsVisible(false)
    }

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') hideTooltip()
    }

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex', className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={handleKeyDown}
      >
        {children}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(
                'absolute z-50 px-3 py-1.5 text-body-xs font-medium text-white bg-eventra-navy-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none',
                positionClasses[position],
                contentClassName
              )}
              role="tooltip"
            >
              {content}
              <div
                className={cn(
                  'absolute w-0 h-0 border-4 border-transparent',
                  arrowClasses[position]
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
  children: ReactNode
  tooltip: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}) {
  return (
    <Tooltip content={tooltip} position={position} delay={delay}>
      {children}
    </Tooltip>
  )
}

// Hover card - richer tooltip with custom content
interface HoverCardProps {
  trigger: ReactNode
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
  contentClassName?: string
}

const hoverPositionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export function HoverCard({
  trigger,
  content,
  position = 'bottom',
  delay = 200,
  className,
  contentClassName,
}: HoverCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(true), delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onKeyDown={(e) => {
        if (e.key === 'Escape') hide()
      }}
    >
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 bg-white rounded-xl shadow-lg border border-eventra-slate-200 p-4 w-72',
              hoverPositionClasses[position],
              contentClassName
            )}
            role="dialog"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}