'use client'

import { useEffect, useMemo } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { META_PIXEL_ID, trackPageView } from '../lib/metaPixel'

const EXCLUDED_PREFIXES = ['/admin', '/dashboard']
const EXCLUDED_EXACT = ['/admin-dashboard', '/admin-login', '/forgot-password', '/login', '/sales']

function isTrackedPublicPath(pathname = '') {
  if (!pathname) return false
  if (EXCLUDED_EXACT.includes(pathname)) return false
  return !EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export default function MetaPixel() {
  const pathname = usePathname() || ''
  const searchParams = useSearchParams()
  const search = useMemo(() => searchParams?.toString() || '', [searchParams])
  const pathWithSearch = `${pathname}${search ? `?${search}` : ''}`
  const enabled = isTrackedPublicPath(pathname)

  useEffect(() => {
    if (!enabled) return
    trackPageView(pathWithSearch)
  }, [enabled, pathWithSearch])

  if (!enabled) return null

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
if (!window.__acadvizenMetaPixelInitialized) {
  fbq('init', '${META_PIXEL_ID}');
  window.__acadvizenMetaPixelInitialized = true;
}
if (window.__acadvizenMetaPixelLastPage !== window.location.pathname + window.location.search) {
  fbq('track', 'PageView');
  window.__acadvizenMetaPixelLastPage = window.location.pathname + window.location.search;
}`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
