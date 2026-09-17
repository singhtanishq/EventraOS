import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-eventra-slate-200 shadow-card',
      elevated: 'bg-white shadow-elevated border border-eventra-slate-100',
      outlined: 'bg-white border-2 border-eventra-slate-200',
      interactive: 'bg-white border border-eventra-slate-200 shadow-card cursor-pointer transition-all duration-300',
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    const hoverStyles = hover ? 'hover:shadow-card-hover hover:-translate-y-1' : ''

    return (
      <motion.div
        ref={ref}
        className={cn('rounded-2xl overflow-hidden', variants[variant], paddings[padding], hoverStyles, className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-heading-md font-semibold text-eventra-navy-900', className)} {...props}>
      {children}
    </h3>
  )
)

CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('text-body-sm text-eventra-slate-600 mt-1', className)} {...props}>
      {children}
    </p>
  )
)

CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  )
)

CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-eventra-slate-200 flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'

// Hotel Card
interface HotelCardProps {
  image: string
  name: string
  rating: number
  reviewCount: number
  location: string
  distance?: string
  price: number
  currency: string
  originalPrice?: number
  amenities: string[]
  cancellation: 'free' | 'partial' | 'none'
  onSelect: () => void
  favorite?: boolean
  onFavorite?: () => void
}

export function HotelCard({ image, name, rating, reviewCount, location, distance, price, currency, originalPrice, amenities, cancellation, onSelect, favorite, onFavorite }: HotelCardProps) {
  return (
    <Card variant="interactive" onClick={onSelect} className="h-full flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite?.() }}
            className={cn('p-2 rounded-full bg-white/90 backdrop-blur-sm transition-all', favorite && 'text-eventra-red-500')}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className={cn('w-5 h-5', favorite && 'fill-current')} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <span className={cn('badge px-3 py-1', cancellation === 'free' ? 'badge-success' : cancellation === 'partial' ? 'badge-warning' : 'badge-danger')}>
            {cancellation === 'free' ? 'Free cancellation' : cancellation === 'partial' ? 'Partial refund' : 'Non-refundable'}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="badge badge-primary">★ {rating.toFixed(1)}</span>
          <span className="badge badge-neutral">({reviewCount} reviews)</span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 line-clamp-1">{name}</h3>
        <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {location}
          {distance && <span className="text-eventra-slate-400">• {distance}</span>}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {amenities.slice(0, 4).map((amenity) => (
            <span key={amenity} className="tag text-body-xs px-2 py-0.5">{amenity}</span>
          ))}
          {amenities.length > 4 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{amenities.length - 4} more</span>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-eventra-slate-200 flex items-center justify-between">
          <div>
            {originalPrice && (
              <p className="text-body-sm text-eventra-slate-500 line-through">
                {formatCurrency(originalPrice, currency)}
              </p>
            )}
            <p className="price-lg text-eventra-navy-900">{formatCurrency(price, currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">per night</p>
          </div>
          <button className="btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onSelect() }}>
            Select
          </button>
        </div>
      </div>
    </Card>
  )
}

import { formatCurrency } from '@/lib/utils'

// Flight Card
interface FlightCardProps {
  airline: { name: string; logo: string; code: string }
  flightNumber: string
  departure: { time: string; airport: string; city: string; terminal?: string }
  arrival: { time: string; airport: string; city: string; terminal?: string }
  duration: string
  stops: number
  aircraft?: string
  cabin: string
  baggage: string
  price: number
  currency: string
  originalPrice?: number
  refundable: boolean
  onSelect: () => void
}

export function FlightCard({ airline, flightNumber, departure, arrival, duration, stops, aircraft, cabin, baggage, price, currency, originalPrice, refundable, onSelect }: FlightCardProps) {
  return (
    <Card variant="interactive" onClick={onSelect} className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-eventra-slate-100 flex items-center justify-center flex-shrink-0">
          {airline.logo ? (
            <img src={airline.logo} alt={airline.name} className="w-10 h-10 object-contain" />
          ) : (
            <span className="font-bold text-eventra-navy-900 text-lg">{airline.code}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-eventra-navy-900">{airline.name}</span>
            <span className="badge badge-neutral">{flightNumber}</span>
            {refundable && <span className="badge badge-success">Refundable</span>}
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{departure.time}</p>
              <p className="text-body-sm text-eventra-slate-600">{departure.airport} ({departure.city})</p>
              {departure.terminal && <p className="text-body-xs text-eventra-slate-500">Terminal {departure.terminal}</p>}
            </div>
            <div className="col-span-2 flex flex-col items-center">
              <div className="relative w-full h-px bg-eventra-slate-300">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-eventra-navy-900 flex items-center justify-center">
                  <svg className="w-3 h-3 text-eventra-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
              </div>
              <p className="text-body-xs text-eventra-slate-500 text-center mt-1">{duration}</p>
              {stops === 0 ? (
                <span className="badge badge-success text-body-xs mt-1">Direct</span>
              ) : (
                <span className="badge badge-warning text-body-xs mt-1">{stops} stop{stops > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="col-span-5 text-right">
              <p className="text-heading-lg font-display font-bold text-eventra-navy-900">{arrival.time}</p>
              <p className="text-body-sm text-eventra-slate-600">{arrival.airport} ({arrival.city})</p>
              {arrival.terminal && <p className="text-body-xs text-eventra-slate-500">Terminal {arrival.terminal}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-body-sm text-eventra-slate-600">
            {aircraft && <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>{aircraft}</span>}
            <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>{cabin}</span>
            <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.2A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>{baggage}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 w-36">
          <div>
            {originalPrice && (
              <p className="text-body-sm text-eventra-slate-500 line-through text-right">
                {formatCurrency(originalPrice, currency)}
              </p>
            )}
            <p className="price-lg text-eventra-navy-900 text-right">{formatCurrency(price, currency)}</p>
            <p className="text-body-xs text-eventra-slate-500 text-right">Total</p>
          </div>
          <button className="btn-primary btn-sm w-full">Select</button>
        </div>
      </div>
    </Card>
  )
}

// Venue Card
interface VenueCardProps {
  image: string
  name: string
  location: string
  capacity: number
  eventTypes: string[]
  price: number
  currency: string
  rating?: number
  available: boolean
  onSelect: () => void
}

export function VenueCard({ image, name, location, capacity, eventTypes, price, currency, rating, available, onSelect }: VenueCardProps) {
  return (
    <Card variant="interactive" onClick={onSelect} className="h-full flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <span className={cn('badge px-3 py-1', available ? 'badge-success' : 'badge-danger')}>
            {available ? 'Available' : 'Booked'}
          </span>
          {rating && (
            <span className="badge badge-primary">★ {rating.toFixed(1)}</span>
          )}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-heading-sm font-semibold text-eventra-navy-900 line-clamp-1">{name}</h3>
        <p className="text-body-sm text-eventra-slate-600 mt-1 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          {location}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {eventTypes.slice(0, 3).map((type) => (
            <span key={type} className="tag text-body-xs px-2 py-0.5">{type}</span>
          ))}
          {eventTypes.length > 3 && (
            <span className="tag text-body-xs px-2 py-0.5 text-eventra-slate-500">+{eventTypes.length - 3} more</span>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-eventra-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4 text-body-sm text-eventra-slate-600">
            <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>{capacity} guests</span>
          </div>
          <div className="text-right">
            <p className="price-md text-eventra-navy-900">{formatCurrency(price, currency)}</p>
            <p className="text-body-xs text-eventra-slate-500">starting</p>
          </div>
        </div>
      </div>
    </Card>
  )
}