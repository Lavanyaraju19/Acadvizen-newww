import { useState } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { CoursesAdmin } from './CoursesAdmin'
import { ToolsAdmin } from './ToolsAdmin'
import { ResourcesAdmin } from './ResourcesAdmin'
import { CourseDetailsAdmin } from './CourseDetailsAdmin'
import { StudentsAdmin } from './StudentsAdmin'
import { CustomCursor } from '../../components/ui/CustomCursor'
import { Surface } from '../../components/ui/Surface'
import { useAuth } from '../../contexts/AuthContext'

const adminNav = [
  { path: '/admin', label: 'Courses', component: CoursesAdmin },
  { path: '/admin/tools', label: 'Tools', component: ToolsAdmin },
  { path: '/admin/resources', label: 'Resources', component: ResourcesAdmin },
  { path: '/admin/course-details', label: 'Course Details', component: CourseDetailsAdmin },
  { path: '/admin/students', label: 'Students', component: StudentsAdmin },
]

export function AdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleLogout = async () => {
    setShowConfirm(false)
    try {
      await signOut('global')
    } catch (err) {
      console.error('Logout failed', err)
    }
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen acadvizen-noise">
      <CustomCursor />

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 advz-animated-bg">
        <div className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute top-16 right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-[-240px] left-[30%] h-[620px] w-[620px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Surface className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-slate-50 tracking-tight">Admin Dashboard</h1>
                <p className="text-xs text-slate-400">Manage courses, tools, resources and students</p>
              </div>
              <div className="flex items-center gap-4">
                {user?.email && (
                  <span className="text-xs text-slate-400">
                    {profile?.role === 'admin' ? `Admin: ${user.email}` : user.email}
                  </span>
                )}
                <Link
                  to="/"
                  data-cursor="hover"
                  className="text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
                >
                  &lt;- Back to Site
                </Link>
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  data-cursor="hover"
                  className="text-sm font-semibold text-rose-200 hover:text-rose-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <nav className="mt-3 flex flex-wrap gap-2">
              {adminNav.map((nav) => {
                const active =
                  location.pathname === nav.path || (nav.path === '/admin' && location.pathname === '/admin')

                return (
                  <Link
                    key={nav.path}
                    to={nav.path}
                    data-cursor="hover"
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-teal-300 text-slate-950'
                        : 'border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]'
                    }`}
                  >
                    {nav.label}
                  </Link>
                )
              })}
            </nav>
          </Surface>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="" element={<CoursesAdmin />} />
          <Route path="dashboard" element={<CoursesAdmin />} />
          <Route path="tools" element={<ToolsAdmin />} />
          <Route path="resources" element={<ResourcesAdmin />} />
          <Route path="course-details" element={<CourseDetailsAdmin />} />
          <Route path="students" element={<StudentsAdmin />} />
        </Routes>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">Sign Out</h3>
            <p className="mt-2 text-sm text-slate-300">Are you sure you want to sign out?</p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-200 border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 bg-teal-300 hover:bg-teal-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
