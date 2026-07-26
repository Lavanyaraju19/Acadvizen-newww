'use client'

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0d1d36' }}>
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-semibold text-slate-50">Something went wrong</h1>
            <p className="mt-2 text-slate-300 text-sm">
              An unexpected error occurred. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && error && (
              <p className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200 text-xs text-left font-mono overflow-auto max-h-40">
                {error.message || String(error)}
              </p>
            )}
            <button
              onClick={reset}
              className="mt-6 inline-flex px-5 py-2.5 rounded-xl bg-teal-300 text-slate-950 font-semibold text-sm hover:bg-teal-200 transition"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

