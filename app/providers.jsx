'use client'

import { useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from '../src/contexts/AuthContext'
import { initSupabase } from '../src/lib/supabaseClient'

export default function Providers({ children }) {
  useEffect(() => {
    initSupabase().catch(() => {})
  }, [])

  return (
    <HelmetProvider>
      <AuthProvider>{children}</AuthProvider>
    </HelmetProvider>
  )
}
