'use client'

export default function AdminError({ error, reset }) {
  return (
    <div className="min-h-screen acadvizen-noise flex items-center justify-center px-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-slate-50 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-300 mb-4">{error?.message || 'An unexpected error occurred in the admin panel.'}</p>
        <button
          onClick={reset}
          className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

