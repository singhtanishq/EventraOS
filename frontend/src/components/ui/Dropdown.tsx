import { forwardRef, ReactNode, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Check, X, Search, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'

interface DropdownOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
  icon?: React.ReactNode
  danger?: boolean
}

interface DropdownProps {
  trigger: React.ReactElement
  options: DropdownOption[]
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  multiple?: boolean
  searchable?: boolean
  disabled?: boolean
  position?: 'bottom' | 'top' | 'left' | 'right'
  className?: string
  menuClassName?: string
  onOpenChange?: (open: boolean) => void
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      trigger,
      options,
      placeholder = 'Select...',
      value,
      onChange,
      multiple = false,
      searchable = false,
      disabled = false,
      position = 'bottom',
      className,
      menuClassName,
      onOpenChange,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    }

    const handleTriggerClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (disabled) return
      handleOpenChange(!isOpen)
    }

    const handleOptionClick = (option: DropdownOption) => {
      if (option.disabled) return
      if (multiple) {
        const currentValues = (value || '').split(',').filter(Boolean)
        const newValues = currentValues.includes(option.value)
          ? currentValues.filter((v) => v !== option.value)
          : [...currentValues, option.value]
        onChange?.(newValues.join(','))
      } else {
        onChange?.(option.value)
        setIsOpen(false)
      }
    }

    const handleSearch = (query: string) => {
      setSearchQuery(query)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          break
        case 'ArrowDown':
          e.preventDefault()
          // Focus next option
          break
        case 'ArrowUp':
          e.preventDefault()
          // Focus previous option
          break
        case 'Enter':
          e.preventDefault()
          // Select focused option
          break
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredOptions = options.filter((option) =>
      option.label.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )

    const isSelected = (optionValue: string) => {
      if (multiple) {
        return (value || '').split(',').filter(Boolean).includes(optionValue)
      }
      return value === optionValue
    }

    const getSelectedLabels = () => {
      if (multiple) {
        return (value || '').split(',').filter(Boolean).map((v) => {
          const option = options.find((o) => o.value === v)
          return option?.label
        }).filter(Boolean)
      }
      const option = options.find((o) => o.value === value)
      return option ? [option.label.toString()] : []
    }

    const triggerWithProps = React.cloneElement(trigger, {
      ref: triggerRef,
      onClick: handleTriggerClick,
      'aria-haspopup': 'listbox',
      'aria-expanded': isOpen,
      disabled,
    })

    const dropdownContent = (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 8 : -8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'dropdown-menu',
              position === 'top' && 'bottom-full mb-2',
              position === 'bottom' && 'top-full mt-2',
              position === 'left' && 'right-full mr-2',
              position === 'right' && 'left-full ml-2',
              menuClassName
            )}
            role="listbox"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false)
            }}
          >
            {searchable && (
              <div className="p-2 border-b border-eventra-slate-200">
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  leftIcon={<Search className="w-4 h-4" />}
                  className="w-full"
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-eventra-slate-500 text-body-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-3 py-2.5 text-left rounded-lg transition-colors flex items-center gap-3',
                      option.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-eventra-slate-50',
                      isSelected(option.value) && 'bg-eventra-blue-50 text-eventra-blue-700'
                    )}
                    role="option"
                    aria-selected={isSelected(option.value)}
                    aria-disabled={option.disabled}
                  >
                    {option.icon && (
                      <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                        {option.icon}
                      </span>
                    )}
                    <span className="flex-1 text-body-sm font-medium text-eventra-navy-900">
                      {option.label}
                    </span>
                    {isSelected(option.value) && (
                      <CheckCircle2 className="w-5 h-5 text-eventra-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )

    return (
      <div
        ref={dropdownRef}
        className={cn('relative inline-block', className)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false)
        }}
      >
        {triggerWithProps}
        {isOpen && createPortal(dropdownContent, document.body)}
      </div>
    )
  }
)

Dropdown.displayName = 'Dropdown'

// Simple Select Dropdown
interface SelectProps {
  options: DropdownOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
  label?: string
  required?: boolean
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className,
  error,
  label,
  required = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((o) => o.value === value)

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="label">{label} {required && <span className="text-eventra-red-500">*</span>}</label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors',
            'bg-white text-eventra-navy-900',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-eventra-red-500 focus:border-eventra-red-500',
            !error && 'border-eventra-slate-300 focus:border-eventra-blue-500 focus:ring-2 focus:ring-eventra-blue-500/20'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={cn('flex-1 text-left', value ? 'text-eventra-navy-900' : 'text-eventra-slate-500')}>
            {value ? selectedOption?.label : placeholder}
          </span>
          <ChevronDown className={cn('w-5 h-5 text-eventra-slate-500 transition-transform', isOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-eventra-slate-200 shadow-lg overflow-hidden"
            >
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                leftIcon={<Search className="w-5 h-5" />}
                className="p-2 border-b border-eventra-slate-200"
              />
              <div className="max-h-60 overflow-y-auto">
                {options
                  .filter((opt) =>
                    opt.label.toString().toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange?.(option.value)
                        setIsOpen(false)
                      }}
                      disabled={option.disabled}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-body-sm transition-colors',
                        option.disabled
                          ? 'text-eventra-slate-400 cursor-not-allowed'
                          : 'text-eventra-navy-900 hover:bg-eventra-slate-50',
                        value === option.value && 'bg-eventra-blue-50 text-eventra-blue-700'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                {options.length === 0 && (
                  <div className="px-4 py-4 text-center text-eventra-slate-500 text-body-sm">
                    No options available
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && <p className="form-error mt-1">{error}</p>}
      </div>
    </div>
  )
}

Select.displayName = 'Select'