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
  Users,
  MapPin,
  Home,
  Layout,
  LayoutList,
  Menu as MenuIcon,
  ArrowRight,
  FileCode,
  Download,
  Layers,
  LayoutTemplate,
  FolderOpen,
  Sparkles,
} from 'lucide-react'
import { Surface } from '../../src/components/ui/Surface'
import { CustomCursor } from '../../src/components/ui/CustomCursor'
import { useAuth } from '../../src/contexts/AuthContext'
import { fetchAdminSession, getAdminAccessToken } from '../../lib/adminApiClient'
import { sessionManager } from '../../lib/sessionManager'
import GlobalSearch from '../../components/admin/GlobalSearch'
import { canAccessAdminProfile, hasProfilePermission } from '../../lib/adminPermissions'

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/homepage', label: 'Homepage', icon: Home },
  { path: '/admin/header', label: 'Header', icon: Layout },
  { path: '/admin/footer', label: 'Footer', icon: LayoutList },
  { path: '/admin/menus', label: 'Menus', icon: MenuIcon },
  { path: '/admin/redirects', label: 'Redirects', icon: ArrowRight },
  { path: '/admin/sitemap', label: 'Sitemap', icon: FileCode },
  { path: '/admin/robots', label: 'Robots.txt', icon: FileText },
  { path: '/admin/import-export', label: 'Import/Export', icon: Download },
  { path: '/admin/sections', label: 'Reusable Sections', icon: Layers },
  { path: '/admin/templates', label: 'Page Templates', icon: LayoutTemplate },
  { path: '/admin/pages', label: 'Pages', icon: FileText },
  { path: '/admin/blogs', label: 'Blogs', icon: BookOpen },
  { path: '/admin/blog-taxonomy', label: 'Blog Taxonomy', icon: Tags },
  { path: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { path: '/admin/tools', label: 'Tools', icon: Wrench },
  { path: '/admin/companies', label: 'Companies', icon: Building2 },
  { path: '/admin/internships', label: 'Internships', icon: School },
  { path: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { path: '/admin/forms', label: 'Forms', icon: FileText },
  { path: '/admin/popups', label: 'Popups', icon: Search },
  { path: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { path: '/admin/cities', label: 'Cities', icon: MapPin },
  { path: '/admin/locations', label: 'Locations', icon: MapPin },
  { path: '/admin/service-pages', label: 'Service Pages', icon: Sparkles },
  { path: '/admin/resources', label: 'Resources', icon: FolderOpen },
  { path: '/admin/media', label: 'Media', icon: ImageIcon },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/trust', label: 'Trust & Conversion', icon: Handshake },
  { path: '/admin/landing-seo', label: 'Landing SEO', icon: MapPinned },
  { path: '/admin/leads', label: 'Leads', icon: Inbox },
  { path: '/admin/lms', label: 'LMS', icon: BookOpen },
  { path: '/admin/seo', label: 'SEO', icon: Search },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

function getErrorMessage(error) {
  return String(error?.message || '').toLowerCase()
}

function isTransientAdminError(error) {
  const message = getErrorMessage(error)
  return (
    error?.transient === true ||
    error?.status === 503 ||
    error?.name === 'AbortError' ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('abort') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('enotfound') ||
    message.includes('temporarily unavailable')
  )
}

function isSessionAuthFailure(error) {
  const message = getErrorMessage(error)
  return (
    error?.status === 401 &&
    (
      message.includes('session expired') ||
      message.includes('session is invalid') ||
      message.includes('access token') ||
      message.includes('sign in again')
    )
  )
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
    reconnecting: false,
  })
  const isLoginLikePath = pathname === '/admin/login' || pathname === '/admin-login'
  const user = adminState.user
  const profile = adminState.profile
  const visibleAdminNav = useMemo(() => adminNav.filter((nav) => {
    if (!profile) return false
    if (nav.path.startsWith('/admin/users')) return hasProfilePermission(profile, 'users', 'read')
    if (nav.path.startsWith('/admin/settings') || nav.path.startsWith('/admin/header') || nav.path.startsWith('/admin/footer') || nav.path.startsWith('/admin/menus') || nav.path.startsWith('/admin/redirects') || nav.path.startsWith('/admin/sitemap') || nav.path.startsWith('/admin/robots') || nav.path.startsWith('/admin/import-export')) {
      return hasProfilePermission(profile, 'settings', 'read')
    }
    if (nav.path.startsWith('/admin/seo')) return hasProfilePermission(profile, 'seo', 'read')
    if (nav.path.startsWith('/admin/media')) return hasProfilePermission(profile, 'media', 'read')
    if (nav.path.startsWith('/admin/forms') || nav.path.startsWith('/admin/leads')) return hasProfilePermission(profile, 'forms', 'read')
    if (nav.path.startsWith('/admin/popups')) return hasProfilePermission(profile, 'popups', 'read')
    if (nav.path.startsWith('/admin/banners')) return hasProfilePermission(profile, 'banners', 'read')
    if (nav.path.startsWith('/admin/blog')) return hasProfilePermission(profile, 'blogs', 'read')
    if (nav.path.startsWith('/admin/courses')) return hasProfilePermission(profile, 'courses', 'read')
    return hasProfilePermission(profile, 'pages', 'read') || canAccessAdminProfile(profile)
  }), [profile])
  const guardMessage = useMemo(() => {
    if (adminState.reconnecting) return 'Reconnecting to your admin session...'
    if (adminState.error) return adminState.error
    if (guardTimedOut) return 'Admin authentication is taking longer than expected.'
    if (user && !profile) return 'Loading your admin profile...'
    return 'Checking admin access...'
  }, [adminState.error, adminState.reconnecting, guardTimedOut, profile, user])

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

  const handleConfirmedAuthFailure = useCallback(async (message) => {
    await clearAdminSession()
    setVerifiedOnce(false)
    setAdminState({
      loading: false,
      error: message,
      user: null,
      profile: null,
      accessToken: '',
      reconnecting: false,
    })
    router.replace('/admin-login')
  }, [clearAdminSession, router])

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
      let payload = null
      let accessToken = ''

      try {
        payload = await fetchAdminSession()
        accessToken = await getAdminAccessToken()
      } catch (error) {
        const message = error?.message || 'Unable to open the admin dashboard.'

        if (isTransientAdminError(error)) {
          setAdminState((prev) => ({
            ...prev,
            loading: false,
            error: verifiedOnce ? '' : message,
            reconnecting: true,
          }))
          return
        }

        if (isSessionAuthFailure(error)) {
          const recovered = await sessionManager.refreshIfNeeded(true)
          if (recovered) {
            setRetryNonce((value) => value + 1)
            return
          }

          const fallbackPayload = await fetch('/api/admin/session', {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin',
          }).catch(() => null)

          if (fallbackPayload?.ok) {
            const fallbackJson = await fallbackPayload.json().catch(() => null)
            if (fallbackJson?.success) {
              setAdminState({
                loading: false,
                error: '',
                user: fallbackJson?.data?.user || null,
                profile: fallbackJson?.data?.profile || null,
                accessToken: '',
                reconnecting: false,
              })
              setVerifiedOnce(true)
              setGuardTimedOut(false)
              return
            }
          }

          await handleConfirmedAuthFailure(message)
          return
        }

        await clearAdminSession()
        setVerifiedOnce(false)
        setAdminState({
          loading: false,
          error: message,
          user: null,
          profile: null,
          accessToken: '',
          reconnecting: false,
        })
        return
      }

      setAdminState({
        loading: false,
        error: '',
        user: payload?.data?.user || null,
        profile: payload?.data?.profile || null,
        accessToken,
        reconnecting: false,
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
        reconnecting: false,
      })
    }
  }, [
    adminState.profile,
    adminState.user,
    clearAdminSession,
    handleConfirmedAuthFailure,
    isLoginLikePath,
    verifiedOnce,
  ])

  // window.fetch override removed. Use adminApiFetch from lib/adminApiClient.js
  // which properly injects auth headers via Authorization Bearer token.
  // AdminLayoutClient should not monkey-patch global fetch.

  // MutationObserver for form field labels removed.
  // All form fields should use proper htmlFor/id patterns in their components.

  useEffect(() => {
    if (isLoginLikePath) return undefined

    return sessionManager.subscribe((event) => {
      if (event === 'reconnecting' || event === 'expiring') {
        setAdminState((prev) => ({
          ...prev,
          loading: false,
          reconnecting: true,
        }))
      }

      if (event === 'refreshed' || event === 'recovered') {
        setAdminState((prev) => ({
          ...prev,
          error: '',
          reconnecting: false,
        }))
        setRetryNonce((value) => value + 1)
      }

      if (event === 'expired') {
        void handleConfirmedAuthFailure('Admin session expired. Please sign in again.')
      }
    })
  }, [handleConfirmedAuthFailure, isLoginLikePath])

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

  if (!user || !profile || !canAccessAdminProfile(profile)) {
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
                <GlobalSearch />
                {adminState.reconnecting ? (
                  <span className="text-xs font-semibold text-amber-200">Reconnecting...</span>
                ) : null}
                {user?.email && (
                  <span className="text-xs text-slate-400">
                    {profile?.is_full_admin ? `Admin: ${user.email}` : user.email}
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
              {visibleAdminNav.map((nav) => {
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
