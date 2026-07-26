import { useEffect } from 'react'
import NextLink from 'next/link'
import { usePathname, useRouter, useParams as useNextParams } from 'next/navigation'

/**
 * Safe href resolver.
 * Never returns undefined, null, or empty string.
 * Falls back to '/' when no valid URL is provided.
 */
function resolveHref(to, href) {
  const candidate = href || to
  if (candidate === undefined || candidate === null || candidate === '') return '/'
  if (typeof candidate === 'string' && candidate.trim() === '') return '/'
  return candidate
}

export function Link({ to, href, children, ...props }) {
  const nextHref = resolveHref(to, href)
  // Strip invalid HTML attributes that NextLink may warn about
  const cleanProps = { ...props }
  delete cleanProps['aria-disabled']
  return (
    <NextLink href={nextHref} {...cleanProps}>
      {children}
    </NextLink>
  )
}

export function useNavigate() {
  const router = useRouter()
  return (to, options = {}) => {
    if (options?.replace) router.replace(to)
    else router.push(to)
  }
}

export function useLocation() {
  const pathname = usePathname() || '/'
  return {
    pathname,
    search: '',
    hash: '',
    state: null,
  }
}

export function useParams() {
  return useNextParams() || {}
}

export function Navigate({ to = '/', replace = false }) {
  const router = useRouter()
  useEffect(() => {
    if (replace) router.replace(to)
    else router.push(to)
  }, [router, to, replace])
  return null
}

export function BrowserRouter({ children }) {
  return children
}

export function Routes({ children }) {
  return children
}

export function Route({ element }) {
  return element || null
}
