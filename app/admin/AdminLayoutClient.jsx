'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Wrench,
  Building2,
  GraduationCap,
  MessageSquare,
  Image as ImageIcon,
  School,
  Search,
  Settings,
  MapPinned,
  Handshake,
  Inbox,
  Tags,
} from 'lucide-react'
import { Surface } from '../../src/components/ui/Surface'
import { CustomCursor } from '../../src/components/ui/CustomCursor'
import { useAuth } from '../../src/contexts/AuthContext'
import { fetchAdminSession, getAdminAccessToken } from '../../lib/adminApiClient'

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/pages', label: 'Pages', icon: FileText },
  { path: '/admin/blogs', label: 'Blogs', icon: BookOpen },
  { path: '/admin/blog-taxonomy', label: 'Blog Taxonomy', icon: Tags },
  { path: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { path: '/admin/tools', label: 'Tools', icon: Wrench },
  { path: '/admin/companies', label: 'Companies', icon: Building2 },
  { path: '/admin/internships', label: 'Internships', icon: School },
  { path: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { path: '/admin/media', label: 'Media', icon: ImageIcon },
  { path: '/admin/trust', label: 'Trust & Conversion', icon: Handshake },
  { path: '/admin/landing-seo', label: 'Landing SEO', icon: MapPinned },
  { path: '/admin/leads', label: 'Leads', icon: Inbox },
  { path: '/admin/lms', label: 'LMS', icon: BookOpen },
  { path: '/admin/seo', label: 'SEO', icon: Search },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

function slugifyFieldLabel(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function ensureFormFieldAttributes(root) {
  if (!root) return

  const fields = root.querySelectorAll('input, textarea, select')
  let counter = 0

  fields.forEach((field) => {
    if (!(field instanceof HTMLElement)) return

    const existingId = field.getAttribute('id')
    const existingName = field.getAttribute('name')
    if (existingId && existingName) {
      counter += 1
      return
    }

    const labelEl = field.closest('label')
    const labelText = slugifyFieldLabel(
      labelEl?.firstChild?.textContent ||
        labelEl?.textContent ||
        field.getAttribute('placeholder') ||
        field.getAttribute('aria-label') ||
        field.getAttribute('type') ||
        'field'
    )

    const fallbackId = `admin-${labelText || 'field'}-${counter + 1}`

    field.setAttribute('id', existingId || fallbackId)
    field.setAttribute('name', existingName || labelText || `field_${counter + 1}`)

    if (labelEl && !labelEl.getAttribute('for')) {
      labelEl.setAttribute('for', field.getAttribute('id') || fallbackId)
    }

    counter += 1
  })
}

export default function AdminLayoutClient({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const [guardTimedOut, setGuardTimedOut] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const [verifiedOnce, setVerifiedOnce] = useState(false)
  const [adminState, setAdminState] = useState({
    loading: true,
    error: '',
    user: null,
    profile: null,
    accessToken: '',
  })
  const isLoginLikePath = pathname === '/admin/login' || pathname === '/admin-login'
  const user = adminState.user
  const profile = adminState.profile
  const guardMessage = useMemo(() => {
    if (adminState.error) return adminState.error
    if (guardTimedOut) return 'Admin authentication is taking longer than expected.'
    if (user && !profile) return 'Loading your admin profile...'
    return 'Checking admin access...'
  }, [adminState.error, guardTimedOut, profile, user])

  const clearAdminSession = useCallback(async () => {
    try {
      await signOut('local')
    } catch {
      // noop
    }

    try {
      await fetch('/api/admin/session', { method: 'DELETE' })
    } catch {
      // noop
    }
  }, [signOut])

  const verifyAdminAccess = useCallback(async () => {
    if (isLoginLikePath) return

    const shouldBlockRender = !verifiedOnce || !adminState.user || !adminState.profile

    if (shouldBlockRender) {
      setAdminState((prev) => ({
        ...prev,
        loading: true,
        error: '',
      }))
    } else {
      setAdminState((prev) => ({
        ...prev,
        error: '',
      }))
    }

    try {
      const payload = await fetchAdminSession()
      const accessToken = await getAdminAccessToken()

      setAdminState({
        loading: false,
        error: '',
        user: payload?.data?.user || null,
        profile: payload?.data?.profile || null,
        accessToken,
      })
      setVerifiedOnce(true)
      setGuardTimedOut(false)
    } catch (error) {
      const message = error?.message || 'Unable to open the admin dashboard.'
      await clearAdminSession()
      setVerifiedOnce(false)
      setAdminState({
        loading: false,
        error: message,
        user: null,
        profile: null,
        accessToken: '',
      })
    }
  }, [adminState.profile, adminState.user, clearAdminSession, isLoginLikePath, verifiedOnce])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input instanceof Request
              ? input.url
              : String(input)

      const isCmsRequest = url.startsWith('/api/cms/') || url.includes('/api/cms/')
      if (!isCmsRequest || !adminState.accessToken) {
        return originalFetch(input, init)
      }

      try {
        const headers = new Headers(input instanceof Request ? input.headers : init?.headers)
        headers.set('Authorization', `Bearer ${adminState.accessToken}`)

        if (input instanceof Request) {
          return originalFetch(new Request(input, { headers }))
        }

        return originalFetch(input, { ...init, headers })
      } catch {
        return originalFetch(input, init)
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [adminState.accessToken])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (isLoginLikePath) return undefined

    const root = document.querySelector('[data-admin-root]')
    if (!root) return undefined

    const scan = () => ensureFormFieldAttributes(root)
    scan()

    const observer = new MutationObserver(() => {
      scan()
    })

    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [isLoginLikePath, pathname])

  useEffect(() => {
    if (isLoginLikePath) return undefined

    const timer = setTimeout(() => {
      setGuardTimedOut(true)
    }, 12000)

    if (!adminState.loading) {
      clearTimeout(timer)
      setGuardTimedOut(false)
    }

    return () => clearTimeout(timer)
  }, [adminState.loading, isLoginLikePath])

  useEffect(() => {
    if (isLoginLikePath) return
    void verifyAdminAccess()
  }, [isLoginLikePath, retryNonce, verifyAdminAccess])

  const openLogin = useCallback(async () => {
    await clearAdminSession()
    router.replace('/admin-login')
  }, [clearAdminSession, router])

  if (isLoginLikePath) {
    return children
  }

  if (adminState.loading) {
    return (
      <div className="min-h-screen acadvizen-noise">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
          <Surface className="w-full p-8 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-teal-300/70" />
            <h2 className="mt-5 text-xl font-semibold text-slate-50">Opening admin dashboard</h2>
            <p className="mt-2 text-sm text-slate-300">{guardMessage}</p>
            {guardTimedOut ? (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setRetryNonce((value) => value + 1)}
                  className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={openLogin}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
                >
                  Back to Login
                </button>
              </div>
            ) : null}
          </Surface>
        </div>
      </div>
    )
  }

  if (!user || !profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen acadvizen-noise">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
          <Surface className="w-full p-8 text-center">
            <div className="mx-auto rounded-full border border-rose-300/30 bg-rose-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
              Admin Access Error
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-50">Unable to open the admin dashboard</h2>
            <p className="mt-2 text-sm text-slate-300">
              {adminState.error || 'This account could not be verified as an admin user.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setRetryNonce((value) => value + 1)}
                className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={openLogin}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.05]"
              >
                Back to Login
              </button>
            </div>
          </Surface>
        </div>
      </div>
    )
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
                <Link href="/" className="text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors">
                  {'<-'} Back to Site
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signOut('global')
                    } catch {
                      // noop
                    }
                    await clearAdminSession()
                    router.replace('/admin-login')
                  }}
                  className="text-sm font-semibold text-rose-200 hover:text-rose-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <nav className="mt-3 flex flex-wrap gap-2">
              {adminNav.map((nav) => {
                const active = pathname === nav.path
                const Icon = nav.icon

                return (
                  <Link
                    key={nav.path}
                    href={nav.path}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-teal-300 text-slate-950'
                        : 'border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {nav.label}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </Surface>
        </div>
      </div>

      <div data-admin-root className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
}
