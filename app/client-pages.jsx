'use client'

import HomePage from '../src/legacy/pages/HomePage'
import { AboutPage } from '../src/legacy/pages/AboutPage'
import { ContactPage } from '../src/legacy/pages/ContactPage'
import { CoursesPage } from '../src/legacy/pages/CoursesPage'
import { CourseDetailPage } from '../src/legacy/pages/CourseDetailPage'
import { ToolsPage } from '../src/legacy/pages/ToolsPage'
import ToolDetails from '../src/legacy/pages/ToolDetails'
import { BlogPage } from '../src/legacy/pages/BlogPage'
import { BlogPostPage } from '../src/legacy/pages/BlogPostPage'
import { PlacementPage } from '../src/legacy/pages/PlacementPage'
import { PlacementDetailPage } from '../src/legacy/pages/PlacementDetailPage'
import { HireFromUsPage } from '../src/legacy/pages/HireFromUsPage'
import { LoginPage } from '../src/legacy/pages/LoginPage'
import { RegisterPage } from '../src/legacy/pages/RegisterPage'
import { ForgotPasswordPage } from '../src/legacy/pages/ForgotPasswordPage'
import { PrivacyPolicy } from '../src/legacy/pages/PrivacyPolicy'
import { TermsOfService } from '../src/legacy/pages/TermsOfService'
import { StudentDashboard } from '../src/legacy/pages/dashboard/StudentDashboard'
import { SalesView } from '../src/legacy/pages/sales/SalesView'
import { AdminCmsDashboard } from '../src/legacy/pages/admin/AdminCmsDashboard'
import { AdminLogin } from '../src/legacy/pages/admin/Login'
import { CoursesAdmin } from '../src/legacy/pages/admin/CoursesAdmin'
import { ToolsAdmin } from '../src/legacy/pages/admin/ToolsAdmin'
import { ResourcesAdmin } from '../src/legacy/pages/admin/ResourcesAdmin'
import { CourseDetailsAdmin } from '../src/legacy/pages/admin/CourseDetailsAdmin'
import { StudentsAdmin } from '../src/legacy/pages/admin/StudentsAdmin'
import { ProtectedRoute } from '../src/components/ProtectedRoute'

export function HomeClientPage() {
  return <HomePage />
}

export function AboutClientPage() {
  return <AboutPage />
}

export function ContactClientPage() {
  return <ContactPage />
}

export function CoursesClientPage() {
  return <CoursesPage />
}

export function CourseDetailClientPage() {
  return <CourseDetailPage />
}

export function ToolsClientPage() {
  return <ToolsPage />
}

export function ToolDetailClientPage() {
  return <ToolDetails />
}

export function BlogClientPage() {
  return <BlogPage />
}

export function BlogPostClientPage() {
  return <BlogPostPage />
}

export function PlacementClientPage() {
  return <PlacementPage />
}

export function PlacementDetailClientPage() {
  return <PlacementDetailPage />
}

export function HireFromUsClientPage() {
  return <HireFromUsPage />
}

export function LoginClientPage() {
  return <LoginPage />
}

export function RegisterClientPage() {
  return <RegisterPage />
}

export function ForgotPasswordClientPage() {
  return <ForgotPasswordPage />
}

export function PrivacyPolicyClientPage() {
  return <PrivacyPolicy />
}

export function TermsOfServiceClientPage() {
  return <TermsOfService />
}

export function DashboardClientPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboard />
    </ProtectedRoute>
  )
}

export function SalesClientPage() {
  return (
    <ProtectedRoute allowedRoles={['sales', 'admin']}>
      <SalesView />
    </ProtectedRoute>
  )
}

export function AdminCmsClientPage() {
  return <AdminCmsDashboard />
}

export function AdminLoginClientPage() {
  return <AdminLogin />
}

export function CoursesAdminClientPage() {
  return <CoursesAdmin />
}

export function ToolsAdminClientPage() {
  return <ToolsAdmin />
}

export function ResourcesAdminClientPage() {
  return <ResourcesAdmin />
}

export function CourseDetailsAdminClientPage() {
  return <CourseDetailsAdmin />
}

export function StudentsAdminClientPage() {
  return <StudentsAdmin />
}

