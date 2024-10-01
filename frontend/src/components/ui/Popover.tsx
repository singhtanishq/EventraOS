import { forwardRef, ReactNode, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PopoverProps {
  trigger: React.ReactElement
  content: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  offset?: number
  triggerType?: 'click' | 'hover' | 'focus'
  closeOnClickOutside?: boolean
  closeOnEscape?: boolean
  className?: string
  contentClassName?: string
  matchTriggerWidth?: boolean
}

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      trigger,
      content,
      position = 'bottom',
      align = 'center',
      offset = 8,
      triggerType = 'click',
      closeOnClickOutside = true,
      closeOnEscape = true,
      className,
      contentClassName,
      matchTriggerWidth = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open)
    }

    const handleTriggerClick = (e: React.MouseEvent) => {
      if (triggerType === 'click') {
        e.stopPropagation()
        setIsOpen(!isOpen)
      }
    }

    const handleTriggerHover = () => {
      if (triggerType === 'hover') {
        setIsOpen(true)
      }
    }

    const handleTriggerLeave = () => {
      if (triggerType === 'hover') {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        setIsOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        closeOnClickOutside &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    useEffect(() => {
      if (closeOnClickOutside) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [closeOnClickOutside])

    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(!isOpen)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const triggerWithProps = React.cloneElement(trigger, {
      ref: triggerRef,
      onClick: handleTriggerClick,
      onMouseEnter: triggerType === 'hover' ? handleTriggerHover : undefined,
      onMouseLeave: triggerType === 'hover' ? handleTriggerLeave : undefined,
      onKeyDown: handleTriggerKeyDown,
      'aria-haspopup': 'dialog',
      'aria-expanded': isOpen,
      'aria-controls': isOpen ? 'popover-content' : undefined,
    })

    const positionStyles = {
      top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', mb: `${offset}px` },
      bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', mt: `${offset}px` },
      left: { right: '100%', top: '50%', transform: 'translateY(-50%)', mr: `${offset}px` },
      right: { left: '100%', top: '50%', transform: 'translateY(-50%)', ml: `${offset}px` },
    }

    const alignStyles = {
      start: { left: '0', transform: undefined },
      center: { left: '50%', transform: 'translateX(-50%)' },
      end: { right: '0', left: 'auto', transform: undefined },
    }

    const combinedStyles = {
      ...positionStyles[position],
      ...alignStyles[align],
    }

    return (
      <div
        ref={dropdownRef}
        className={cn('relative inline-block', className)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false)
        }}
      >
        <div ref={triggerRef}>{triggerWithProps}</div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={contentRef}
              style={{
                ...combinedStyles,
                position: 'absolute',
                zIndex: 50,
                minWidth: matchTriggerWidth ? 'var(--radix-popper-content-width)' : 'auto',
                maxWidth: 'var(--radix-popper-content-width)',
              }}
              initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 8 : -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 8 : -8 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'bg-white rounded-xl border border-eventra-slate-200 shadow-lg p-2',
                contentClassName
              )}
              id="popover-content"
              role="dialog"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false)
              }}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Popover.displayName = 'Popover'

// Simple Popover Trigger
export function PopoverTrigger({
  children,
  content,
  position = 'bottom',
  triggerType = 'click',
  ...props
}: Omit<PopoverProps, 'trigger'> & { children: React.ReactNode }) {
  return (
    <Popover
      trigger={children}
      content={content}
      position={position}
      triggerType={triggerType}
      {...props}
    />
  )
}

// Popover with arrow
export function PopoverWithArrow({
  trigger,
  content,
  position = 'bottom',
  ...props
}: PopoverProps) {
  return (
    <Popover
      trigger={trigger}
      content={
        <>
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-4 border-transparent',
              position === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2 border-b-eventra-navy-900',
              position === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-eventra-navy-900',
              position === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2 border-r-eventra-navy-900',
              position === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2 border-l-eventra-navy-900',
            )}
          />
        </>
      }
      position={position}
      {...props}
    />
  )
}

// Context menu (right-click menu)
interface ContextMenuProps {
  children: React.ReactElement
  items: ContextMenuItem[]
  onClose?: () => void
}

interface ContextMenuItem {
  label: React.ReactNode
  onClick: () => void
  icon?: React.ReactNode
  disabled?: boolean
  danger?: boolean
  divider?: boolean
}

export function ContextMenu({
  children,
  items,
  onClose,
}: ContextMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.ContextMenuEvent) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
  }

  const handleClose = () => {
    onClose?.()
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('scroll', handleClose, { capture: true })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handleClose()
    }, { capture: true })

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleClose, { capture: true })
      document.removeEventListener('keydown', handleClose, { capture: true })
    }
  }, [])

  if (!position) return children

  const triggerWithContext = React.cloneElement(children, {
    onContextMenu: handleContextMenu,
  })

  return (
    <>
      {triggerWithContext}
      <AnimatePresence>
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.1 }}
          className="fixed z-50 min-w-[180px] bg-white rounded-xl border border-eventra-slate-200 shadow-lg py-1"
          style={{
            left: position!.x,
            top: position!.y,
            zIndex: 50,
          }}
          role="menu"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleClose()
          }}
        >
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className="h-px bg-eventra-slate-200 my-1" role="separator" />
            ) : (
              <button
                key={index}
                type="button"
                onClick={() => {
                  item.onClick()
                  handleClose()
                }}
                disabled={item.disabled}
                className={cn(
                  'w-full px-3 py-2 text-left text-body-sm rounded-lg transition-colors flex items-center gap-3',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  item.danger ? 'text-eventra-red-600 hover:bg-eventra-red-50' : 'text-eventra-navy-900 hover:bg-eventra-slate-100'
                )}
                role="menuitem"
              >
                {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
                <span className="flex-1 text-body-sm">{item.label}</span>
              </button>
            ))
          ))}
        </motion.div>
      </AnimatePresence>
    </>
  )
}