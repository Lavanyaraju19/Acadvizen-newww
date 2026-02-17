import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [courses, setCourses] = useState([])

  const handleSignOut = async () => {
    setShowConfirm(false)
    try {
      await signOut('global')
    } catch (err) {
      console.error('Sign out failed', err)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .limit(6)
    if (data) setCourses(data)
  }

  const goToSection = (id) => (event) => {
    if (event) event.preventDefault()
    setShowPanel(false)
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
      return
    }
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header className="sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group" data-cursor="hover">
              <div className="relative">
                <div className="absolute -inset-2 rounded-xl bg-teal-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src="/logo.png" alt="Acadvizen" className="relative h-9 w-auto" />
              </div>
              <span className="font-semibold text-slate-100 hidden sm:inline tracking-tight">Acadvizen</span>
            </Link>

            <div className="hidden md:block relative group">
              <button
                type="button"
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                Courses
              </button>
              <div className="absolute left-0 top-full mt-3 w-64 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-4 space-y-3">
                  {courses.length === 0 ? (
                    <div className="text-xs text-slate-400">Courses loading...</div>
                  ) : (
                    courses.map((course) => (
                      <Link
                        key={course.id}
                        to={`/courses/${course.slug}`}
                        className="block text-sm text-slate-200 hover:text-white"
                      >
                        {course.title}
                      </Link>
                    ))
                  )}
                  <Link to="/courses" className="block text-xs font-semibold text-teal-300 hover:text-teal-200">
                    View all courses
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/about" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
              About Us
            </Link>
            <Link to="/placement" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
              Placement
            </Link>
            <Link to="/contact" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
              Contact
            </Link>
            <a
              href="/#blog"
              onClick={goToSection('blog')}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Blogs
            </a>
            <a
              href="/#testimonials"
              onClick={goToSection('testimonials')}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Testimonials
            </a>
          </div>

          <div className="flex items-center gap-3">
            {!loading && user?.email && (
              <span className="hidden sm:inline text-xs text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full">
                {profile?.role === 'admin' ? `Admin: ${user.email}` : `Signed in: ${user.email}`}
              </span>
            )}
            {!loading && !user && (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg bg-teal-300 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-200"
                >
                  Student Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-teal-300 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-200"
                >
                  Register
                </Link>
              </div>
            )}
            {!loading && user && (
              <div className="flex items-center gap-2">
                <Link
                  to={profile?.role === 'admin' ? '/admin-dashboard' : '/dashboard'}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.05]"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.05]"
                >
                  Sign Out
                </button>
              </div>
            )}
            <button
              onClick={() => setShowPanel(true)}
              data-cursor="hover"
              className="inline-flex md:hidden items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-200 hover:bg-white/[0.08]"
            >
              <span className="sr-only">Menu</span>
              <div className="space-y-1">
                <span className="block h-0.5 w-5 bg-slate-200" />
                <span className="block h-0.5 w-5 bg-slate-200" />
                <span className="block h-0.5 w-5 bg-slate-200" />
              </div>
            </button>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </nav>

      {showPanel && (
        <div className="fixed inset-0 z-[60]">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPanel(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-slate-950 border-l border-white/10 shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200">Menu</div>
              <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-slate-200">
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-200">
              <Link
                to="/courses"
                onClick={() => setShowPanel(false)}
                className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]"
              >
                Courses
              </Link>
              <Link
                to="/about"
                onClick={() => setShowPanel(false)}
                className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]"
              >
                About Us
              </Link>
              <Link
                to="/placement"
                onClick={() => setShowPanel(false)}
                className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]"
              >
                Placement
              </Link>
              <Link
                to="/contact"
                onClick={() => setShowPanel(false)}
                className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]"
              >
                Contact
              </Link>
              <Link
                to="/login"
                onClick={() => setShowPanel(false)}
                className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]"
              >
                Student Login
              </Link>
              <a
                href="/#blog"
                onClick={goToSection('blog')}
                className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]"
              >
                Blogs
              </a>
              <a
                href="/#testimonials"
                onClick={goToSection('testimonials')}
                className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]"
              >
                Testimonials
              </a>
            </div>

            <div className="mt-auto space-y-2">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setShowPanel(false)}
                    className="block w-full text-center rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setShowPanel(false)}
                    className="block w-full text-center rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowPanel(false)
                    setShowConfirm(true)
                  }}
                  className="w-full rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
                >
                  Sign Out
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

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
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 bg-teal-300 hover:bg-teal-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
