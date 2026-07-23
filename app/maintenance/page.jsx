import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050b12]">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-teal-400 mb-4">🔧</h1>
          <h2 className="text-3xl font-semibold text-slate-100 mb-2">Under Maintenance</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            We're currently performing scheduled maintenance. Please check back soon.
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
            <p className="text-sm text-slate-300 mb-4">
              Site is under maintenance. We'll be back shortly.
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-sm">We're working on it</span>
            </div>
          </div>
          
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-colors"
          >
            Refresh Page
          </Link>
        </div>
        
        <p className="mt-8 text-xs text-slate-500">
          © 2024 Acadvizen. All rights reserved.
        </p>
      </div>
    </div>
  )
}