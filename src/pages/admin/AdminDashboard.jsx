import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { CoursesAdmin } from './CoursesAdmin'
import { ToolsAdmin } from './ToolsAdmin'
import { ResourcesAdmin } from './ResourcesAdmin'
import { CourseDetailsAdmin } from './CourseDetailsAdmin'
import { StudentsAdmin } from './StudentsAdmin'
import { CustomCursor } from '../../components/ui/CustomCursor'
import { Surface } from '../../components/ui/Surface'

const adminNav = [
  { path: '/admin', label: 'Courses', component: CoursesAdmin },
  { path: '/admin/tools', label: 'Tools', component: ToolsAdmin },
  { path: '/admin/resources', label: 'Resources', component: ResourcesAdmin },
  { path: '/admin/course-details', label: 'Course Details', component: CourseDetailsAdmin },
  { path: '/admin/students', label: 'Students', component: StudentsAdmin },
]

export function AdminDashboard() {
  const location = useLocation()

  return (
    <div className="min-h-screen acadvizen-noise">
      <CustomCursor />

      {/* Ambient background layers (admin route isn't wrapped by PublicLayout) */}
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
              <Link
                to="/"
                data-cursor="hover"
                className="text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors"
              >
                ← Back to Site
              </Link>
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
          <Route path="/" element={<CoursesAdmin />} />
          <Route path="/tools" element={<ToolsAdmin />} />
          <Route path="/resources" element={<ResourcesAdmin />} />
          <Route path="/course-details" element={<CourseDetailsAdmin />} />
          <Route path="/students" element={<StudentsAdmin />} />
        </Routes>
      </div>
    </div>
  )
}
