import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AdminLogin } from '../pages/admin/Login'
import { AdminDashboard } from '../pages/admin/AdminDashboard'
import { useAuth } from '../contexts/AuthContext'

function AdminGuard({ children }) {
  const location = useLocation()
  const { user, profile, loading, signOut } = useAuth()
  const [profileError, setProfileError] = useState(false)

  useEffect(() => {
    if (!loading && user && !profile) {
      setProfileError(true)
      signOut()
    }
  }, [loading, user, profile, signOut])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-teal-300/70" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (profileError) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route
        path="*"
        element={
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        }
      />
    </Routes>
  )
}
