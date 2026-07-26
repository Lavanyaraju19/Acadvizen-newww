'use client'

import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from '../src/contexts/AuthContext'

export default function Providers({ children }) {
  return (
    <HelmetProvider>
      <AuthProvider>{children}</AuthProvider>
    </HelmetProvider>
  )
}
