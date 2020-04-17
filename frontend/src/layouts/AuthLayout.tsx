import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Link from 'react-router-dom'
import { Building2 } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Brand Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-eventra-navy-900 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-eventra-blue-600/20 via-transparent to-eventra-cyan-600/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-xl text-center"
        >
          <Link to="/" className="inline-flex items-center gap-3 mb-8" aria-label="EventraOS Home">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <span className="font-display font-bold text-3xl">EventraOS</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-display font-bold mb-6 text-balance">
            Everything you need to{' '}
            <span className="text-eventra-cyan-400">travel, stay, move & celebrate</span>
          </h1>

          <p className="text-xl text-eventra-slate-300 mb-10 max-w-lg mx-auto leading-relaxed">
            Search, compare, and book hotels, flights, trains, buses, venues, cars, activities, and transfers — all in one seamless platform.
          </p>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-display font-bold text-eventra-cyan-400">10K+</div>
              <div className="text-sm text-eventra-slate-400">Hotels Worldwide</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-display font-bold text-eventra-cyan-400">500+</div>
              <div className="text-sm text-eventra-slate-400">Airlines</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-3xl font-display font-bold text-eventra-cyan-400">2M+</div>
              <div className="text-sm text-eventra-slate-400">Happy Travelers</div>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-eventra-slate-500 text-sm">
          Trusted by travelers worldwide
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 mb-8 justify-center" aria-label="EventraOS Home">
              <div className="w-12 h-12 rounded-xl bg-eventra-navy-900 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-2xl text-eventra-navy-900">EventraOS</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-eventra-slate-200 shadow-card p-8">
            <Outlet />
          </div>

          <p className="text-center text-body-sm text-eventra-slate-500 mt-6">
            © {new Date().getFullYear()} EventraOS. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}