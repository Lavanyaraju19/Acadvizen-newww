import { motion } from 'framer-motion'
import { Surface } from './Surface'

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Surface className="p-8">
            <div className="text-center mb-8">
              <div className="relative mx-auto mb-4 h-12 w-12">
                <div className="absolute -inset-3 rounded-2xl bg-teal-400/10 blur-xl" />
                <img src="/logo.png" alt="Acadvizen" className="relative h-12 w-12 object-contain" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-slate-300">{subtitle}</p>}
            </div>
            {children}
          </Surface>
        </motion.div>
      </div>
    </div>
  )
}
