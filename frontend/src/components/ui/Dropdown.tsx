import { useState, useRef, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DropdownOption {
  value: string
  label: ReactNode
  disabled?: boolean
  icon?: ReactNode
}

interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  className?: string
  menuClassName?: string
  label?: string
  error?: string
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchable = false,
  disabled = false,
  className,
  menuClassName,
  label,
  error,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = searchable
    ? options.filter((o) => String(o.label).toLowerCase().includes(query.toLowerCase()))
    : options

  const selected = options.find((o) => o.value === value)

  return (
    <div className={cn('w-full', className)} ref={ref}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            'input flex items-center justify-between text-left',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'input-error'
          )}
        >
          <span className={cn('truncate', !selected && 'text-eventra-slate-400')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute z-50 mt-1 w-full bg-white rounded-xl border border-eventra-slate-200 shadow-lg overflow-hidden',
                menuClassName
              )}
              role="listbox"
            >
              {searchable && (
                <div className="p-2 border-b border-eventra-slate-100">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="input"
                  />
                </div>
              )}
              <div className="max-h-60 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <div className="px-3 py-4 text-center text-body-sm text-eventra-slate-500">
                    No options found
                  </div>
                ) : (
                  filtered.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={value === option.value}
                      disabled={option.disabled}
                      onClick={() => {
                        onChange?.(option.value)
                        setIsOpen(false)
                        setQuery('')
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 text-left text-body-sm rounded-lg flex items-center gap-2 transition-colors',
                        option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-eventra-slate-50',
                        value === option.value && 'bg-eventra-blue-50 text-eventra-blue-700'
                      )}
                    >
                      {option.icon}
                      <span className="flex-1 truncate">{option.label}</span>
                      {value === option.value && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="form-error mt-1">{error}</p>}
    </div>
  )
}

Dropdown.displayName = 'Dropdown'
