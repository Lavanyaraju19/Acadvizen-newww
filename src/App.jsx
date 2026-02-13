import { Routes, Route, Navigate } from 'react-router-dom'
import { PublicLayout } from './components/Layout/PublicLayout'
import { ProtectedRoute } from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import { ToolsPage } from './pages/ToolsPage'
import ToolDetails from './pages/ToolDetails'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'
import { CoursesPage } from './pages/CoursesPage'
import { CourseDetailPage } from './pages/CourseDetailPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { PlacementPage } from './pages/PlacementPage'
import { PlacementDetailPage } from './pages/PlacementDetailPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { AdminLogin } from './pages/admin/Login'

import { StudentDashboard } from './pages/dashboard/StudentDashboard'
import { AdminRoutes } from './routes/AdminRoutes'
import { SalesView } from './pages/sales/SalesView'
import { AdminCmsDashboard } from './pages/admin/AdminCmsDashboard'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/:slug" element={<ToolDetails />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/placement" element={<PlacementPage />} />
        <Route path="/placement/:id" element={<PlacementDetailPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute allowedRoles={['sales', 'admin']}>
            <SalesView />
          </ProtectedRoute>
        }
      />
      <Route path="/admin-dashboard" element={<AdminCmsDashboard />} />
      <Route path="/admin/*" element={<AdminRoutes />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
