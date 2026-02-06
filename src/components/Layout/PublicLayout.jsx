import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { AnimatedOutlet } from '../ui/AnimatedOutlet'
import { CustomCursor } from '../ui/CustomCursor'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/tools', label: 'Tools' },
  { to: '/courses', label: 'Courses' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function PublicLayout() {
  const { user, profile, signOut, isAdmin, isSales } = useAuth()

  return (
    <div className="min-h-screen flex flex-col acadvizen-noise">
      <CustomCursor />

      {/* Ambient background layers */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 advz-animated-bg">
        <div className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute top-16 right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-[-240px] left-[30%] h-[620px] w-[620px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group" data-cursor="hover">
              <div className="relative">
                <div className="absolute -inset-2 rounded-xl bg-teal-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src="/logo.png" alt="Acadvizen" className="relative h-9 w-auto" />
              </div>
              <span className="font-semibold text-slate-100 hidden sm:inline tracking-tight">
                Acadvizen
              </span>
            </Link>

            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  data-cursor="hover"
                  className="text-slate-300 hover:text-white text-sm font-medium transition-colors hidden md:block"
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      data-cursor="hover"
                      className="text-sm font-medium text-teal-300 hover:text-teal-200"
                    >
                      Admin
                    </Link>
                  )}
                  {isSales && !isAdmin && (
                    <Link
                      to="/sales"
                      data-cursor="hover"
                      className="text-sm font-medium text-teal-300 hover:text-teal-200"
                    >
                      Sales
                    </Link>
                  )}
                  {(profile?.role === 'student' && profile?.approval_status === 'approved') && (
                    <Link
                      to="/dashboard"
                      data-cursor="hover"
                      className="text-sm font-medium text-teal-300 hover:text-teal-200"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    data-cursor="hover"
                    className="text-sm text-slate-300 hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    data-cursor="hover"
                    className="text-sm font-medium text-slate-300 hover:text-white"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    data-cursor="button"
                    className="text-sm font-medium text-slate-950 bg-teal-300 hover:bg-teal-200 px-4 py-2 rounded-lg transition-colors shadow-[0_12px_30px_rgba(0,191,255,0.12)]"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Glass bar */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </nav>
      </header>

      <main className="flex-1 relative z-10">
        <AnimatedOutlet />
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-white/[0.02] backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Acadvizen" className="h-8 w-auto" />
              <span className="font-semibold text-slate-100">Acadvizen</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-400">
              <Link to="/" data-cursor="hover" className="hover:text-white transition-colors">Home</Link>
              <Link to="/tools" data-cursor="hover" className="hover:text-white transition-colors">Tools</Link>
              <Link to="/courses" data-cursor="hover" className="hover:text-white transition-colors">Courses</Link>
              <Link to="/about" data-cursor="hover" className="hover:text-white transition-colors">About</Link>
              <Link to="/contact" data-cursor="hover" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Acadvizen Digital Marketing. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
