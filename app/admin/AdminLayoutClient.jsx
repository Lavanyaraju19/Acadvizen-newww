'use client'

import { useEffect } from 'react'
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
import { ProtectedRoute } from '../../src/components/ProtectedRoute'
import { supabase } from '../../lib/supabaseClient'

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
  const { user, profile, signOut } = useAuth()

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
      if (!isCmsRequest || !supabase?.auth) {
        return originalFetch(input, init)
      }

      try {
        const { data } = await supabase.auth.getSession()
        const token = data?.session?.access_token
        if (!token) return originalFetch(input, init)

        const headers = new Headers(input instanceof Request ? input.headers : init?.headers)
        headers.set('Authorization', `Bearer ${token}`)

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
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const root = document.querySelector('[data-admin-root]')
    if (!root) return undefined

    const scan = () => ensureFormFieldAttributes(root)
    scan()

    const observer = new MutationObserver(() => {
      scan()
    })

    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname])

  if (pathname === '/admin/login') {
    return children
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
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
                        await fetch('/api/admin/session', { method: 'DELETE' })
                      } catch {
                        // noop
                      }
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
    </ProtectedRoute>
  )
}
