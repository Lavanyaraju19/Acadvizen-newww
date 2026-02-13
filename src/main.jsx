import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { initSupabase, hasSupabaseEnv } from './lib/supabaseClient'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

initSupabase().catch(() => {})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason
  const message = reason?.message || ''
  if (reason?.name === 'AbortError' || message.includes('signal is aborted')) {
    console.warn('[app] Ignoring aborted request')
    event.preventDefault()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {hasSupabaseEnv() ? (
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <HelmetProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </HelmetProvider>
      </BrowserRouter>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold">Supabase Config Missing</h1>
          <p className="mt-3 text-sm text-slate-300">
            Add <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
            <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> to <span className="font-mono">.env</span>, then
            restart the dev server.
          </p>
        </div>
      </div>
    )}
  </React.StrictMode>,
)
