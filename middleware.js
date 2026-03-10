import { NextResponse } from 'next/server'

function isProtectedAdminPath(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/admin-dashboard'
}

export function middleware(request) {
  const { pathname } = request.nextUrl
  const adminSession = request.cookies.get('acadvizen_admin_session')?.value

  if (isProtectedAdminPath(pathname) && !adminSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin-login'
    return NextResponse.redirect(url)
  }

  if (pathname === '/admin-login' && adminSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
