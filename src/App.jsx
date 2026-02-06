import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from './components/Layout/PublicLayout'
import { ProtectedRoute } from './components/ProtectedRoute'

// Public pages
import { HomePage } from './pages/HomePage'
import { ToolsPage } from './pages/ToolsPage'
import { ToolDetailPage } from './pages/ToolDetailPage'
import { CoursesPage } from './pages/CoursesPage'
import { CourseDetailPage } from './pages/CourseDetailPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
// Protected
import { StudentDashboard } from './pages/dashboard/StudentDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { SalesView } from './pages/sales/SalesView'
export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/:slug" element={<ToolDetailPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
          path="/sales"
            <ProtectedRoute allowedRoles={['sales', 'admin']}>
              <SalesView />
      </Route>
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
