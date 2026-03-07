import { useEffect } from 'react'
import NextLink from 'next/link'
import { usePathname, useRouter, useParams as useNextParams } from 'next/navigation'

export function Link({ to = '/', href, children, ...props }) {
  const nextHref = href || to
  return (
    <NextLink href={nextHref} {...props}>
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
