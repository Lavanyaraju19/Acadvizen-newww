import { useState } from 'react'
import { Link } from 'react-router-dom'
import Image from 'next/image'
import { useAuth } from '../contexts/AuthContext'
import { useSiteCms } from '../hooks/useSiteCms'

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth()
  const { menus, settings } = useSiteCms()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const uiCopy = settings?.ui_copy && typeof settings.ui_copy === 'object' ? settings.ui_copy : {}

  const uiFallbackLinks = Array.isArray(uiCopy.header_fallback_links)
    ? uiCopy.header_fallback_links
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          title: String(item.title || '').trim(),
          url: String(item.url || '').trim(),
          target: item.target || '_self',
        }))
        .filter((item) => item.title && item.url)
    : []

  const fallbackHeaderLinks = [
    { title: 'Courses', url: '/courses', target: '_self' },
    { title: 'Placement', url: '/placement', target: '_self' },
    { title: 'Blog', url: '/blog', target: '_self' },
    { title: 'Contact', url: '/contact', target: '_self' },
  ]
  const headerLinks = Array.isArray(menus?.header) && menus.header.length
    ? menus.header.filter((item) => !item.parent_id)
    : (uiFallbackLinks.length ? uiFallbackLinks : fallbackHeaderLinks)
  const logoSrc = '/logo-mark.png'
  const brandLabel = String(uiCopy.nav_brand_label || settings?.company_name || 'Acadvizen')
  const dashboardLabel = String(uiCopy.nav_dashboard_label || 'Dashboard')
  const signOutLabel = String(uiCopy.nav_signout_label || 'Sign Out')
  const menuLabel = String(uiCopy.nav_menu_label || 'Menu')
  const closeLabel = String(uiCopy.nav_close_label || 'Close')
  const signOutConfirmTitle = String(uiCopy.nav_signout_confirm_title || signOutLabel)
  const signOutConfirmMessage = String(uiCopy.nav_signout_confirm_message || 'Are you sure you want to sign out?')
  const signOutCancelLabel = String(uiCopy.nav_signout_cancel_label || 'Cancel')
  const signOutConfirmLabel = String(uiCopy.nav_signout_confirm_label || signOutLabel)
  const userAdminPrefix = String(uiCopy.nav_admin_prefix || 'Admin:')
  const userSignedInPrefix = String(uiCopy.nav_signed_in_prefix || 'Signed in:')

  const handleSignOut = async () => {
    setShowConfirm(false)
    try {
      await signOut('global')
    } catch {
      // noop
    }
  }

  return (
    <header className="sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex items-center gap-3 group min-w-0" data-cursor="hover">
              <div className="relative flex h-11 w-11 items-center justify-center overflow-visible sm:h-12 sm:w-12">
                <Image
                  src={logoSrc}
                  alt={brandLabel}
                  width={48}
                  height={48}
                  className="h-11 w-auto shrink-0 object-contain sm:h-12"
                  style={{ width: 'auto', height: 'auto' }}
                  priority
                />
              </div>
              <span className="truncate text-lg font-bold tracking-tight text-slate-50 sm:text-2xl">
                {brandLabel}
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6 ml-auto">
            {headerLinks.map((item) => (
              <Link
                key={`${item.title}-${item.url}`}
                to={item.url}
                target={item.target || '_self'}
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!loading && user?.email && (
              <span className="hidden sm:inline text-xs text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full">
                {profile?.role === 'admin' ? `${userAdminPrefix} ${user.email}` : `${userSignedInPrefix} ${user.email}`}
              </span>
            )}
            {!loading && user && (
              <div className="flex items-center gap-2">
                <Link
                  to={profile?.role === 'admin' ? '/admin' : '/dashboard'}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.05]"
                >
                  {dashboardLabel}
                </Link>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/[0.05]"
                >
                  {signOutLabel}
                </button>
              </div>
            )}
            <button
              onClick={() => setShowPanel(true)}
              data-cursor="hover"
              className="inline-flex md:hidden items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-200 hover:bg-white/[0.08]"
            >
              <span className="sr-only">{menuLabel}</span>
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
              <div className="text-sm font-semibold text-slate-200">{menuLabel}</div>
              <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-slate-200">
                {closeLabel}
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-200">
              {headerLinks.map((item) => (
                <Link
                  key={`mobile-${item.title}-${item.url}`}
                  to={item.url}
                  target={item.target || '_self'}
                  onClick={() => setShowPanel(false)}
                  className="block rounded-lg px-3 py-2 hover:bg-white/[0.05]"
                >
                  {item.title}
                </Link>
              ))}
            </div>

            <div className="mt-auto space-y-2">
              {user && (
                <button
                  onClick={() => {
                    setShowPanel(false)
                    setShowConfirm(true)
                  }}
                  className="w-full rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
                >
                  {signOutLabel}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">{signOutConfirmTitle}</h3>
            <p className="mt-2 text-sm text-slate-300">{signOutConfirmMessage}</p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-200 border border-white/10 hover:bg-white/5"
              >
                {signOutCancelLabel}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-900 bg-teal-300 hover:bg-teal-200"
              >
                {signOutConfirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
