import { motion } from 'framer-motion'

export default function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-eventra-navy-900 flex items-center justify-center">
            <span className="text-white font-display font-bold text-2xl">E</span>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-3 border-3 border-eventra-blue-500/20 border-t-eventra-blue-500 rounded-3xl"
          />
        </div>
        <div className="text-center">
          <p className="text-body-lg font-medium text-eventra-navy-900">{message}</p>
          <motion.div
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-32 h-1 bg-eventra-slate-200 rounded-full mt-3 overflow-hidden mx-auto"
          >
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-32 h-full bg-eventra-navy-900 rounded-full"
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export function PageSkeleton({ columns = 1 }: { columns?: number }) {
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns * 3 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
          className="skeleton-card"
        />
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="flex gap-4 p-4 skeleton"
        >
          <div className="w-16 h-16 rounded-xl skeleton" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-3/4 skeleton-title" />
            <div className="h-4 w-1/2 skeleton-text" />
            <div className="h-4 w-1/3 skeleton-text" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="skeleton skeleton-text h-6" />
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col} className="skeleton skeleton-text h-5" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card">
      <div className="aspect-video skeleton-card" />
      <div className="p-5 space-y-3">
        <div className="h-6 w-3/4 skeleton-title" />
        <div className="h-4 w-full skeleton-text" />
        <div className="h-4 w-1/2 skeleton-text" />
        <div className="h-10 w-full skeleton rounded-xl mt-2" />
      </div>
    </div>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="space-y-1.5"
        >
          <div className="h-4 w-1/4 skeleton-text" />
          <div className="h-10 w-full skeleton rounded-xl" />
        </motion.div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="card p-6"
          >
            <div className="h-4 w-1/3 skeleton-text mb-2" />
            <div className="h-10 w-1/2 skeleton-title" />
          </motion.div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
            className="card"
          >
            <div className="p-6 border-b border-eventra-slate-200">
              <div className="h-6 w-1/4 skeleton-title" />
            </div>
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 skeleton-title" />
                    <div className="h-3 w-1/2 skeleton-text" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}