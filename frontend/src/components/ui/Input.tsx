import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { X, Search, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, clearable, id, value, onChange, onBlur, ...props }, ref) => {
    const [showClear, setShowClear] = useState(false)
    const [focused, setFocused] = useState(false)
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    useEffect(() => {
      setShowClear(clearable && !!value && focused)
    }, [value, focused, clearable])

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>)
      if (props.onChange) {
        // We can't easily clear controlled input from here, parent should handle
      }
    }

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-eventra-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              clearable && 'pr-12',
              error && 'input-error',
              className
            )}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); props.onBlur?.(e) }}
            onChange={(e) => { onChange?.(e); props.onChange?.(e) }}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-eventra-slate-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
          {clearable && showClear && (
            <button
              type="button"
              onMouseDown={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-eventra-slate-400 hover:text-eventra-navy-900 transition-colors"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id={`${inputId}-error`}
            className="form-error"
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-body-xs text-eventra-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={textareaId} className="label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn('input min-h-[100px] resize-y', error && 'input-error', className)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id={`${textareaId}-error`}
            className="form-error"
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1.5 text-body-xs text-eventra-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={selectId} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn('input form-select appearance-none', error && 'input-error', className)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-eventra-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id={`${selectId}-error`}
            className="form-error"
            role="alert"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-body-xs text-eventra-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className="form-checkbox mt-0.5"
          {...props}
        />
        <div className="flex-1">
          <label htmlFor={checkboxId} className="cursor-pointer">
            <span className="text-body-sm font-medium text-eventra-navy-900">{label}</span>
            {description && (
              <p className="text-body-xs text-eventra-slate-500 mt-0.5">{description}</p>
            )}
          </label>
        </div>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export const Radio = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }>(
  ({ className, label, description, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className="form-radio mt-0.5"
          {...props}
        />
        <div className="flex-1">
          <label htmlFor={radioId} className="cursor-pointer">
            <span className="text-body-sm font-medium text-eventra-navy-900">{label}</span>
            {description && (
              <p className="text-body-xs text-eventra-slate-500 mt-0.5">{description}</p>
            )}
          </label>
        </div>
      </div>
    )
  }
)

Radio.displayName = 'Radio'

interface ToggleProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <label htmlFor={toggleId} className="cursor-pointer flex items-center gap-3">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              id={toggleId}
              className="sr-only peer"
              {...props}
            />
            <div className="w-11 h-6 bg-eventra-slate-300 peer-focus:ring-2 peer-focus:ring-eventra-blue-500/20 peer-focus:ring-offset-2 rounded-full peer peer-checked:bg-eventra-navy-900 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-eventra-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:border-transparent" />
          </div>
          <div>
            {label && <span className="text-body-sm font-medium text-eventra-navy-900">{label}</span>}
            {description && <p className="text-body-xs text-eventra-slate-500">{description}</p>}
          </div>
        </label>
      </div>
    )
  }
)

Toggle.displayName = 'Toggle'