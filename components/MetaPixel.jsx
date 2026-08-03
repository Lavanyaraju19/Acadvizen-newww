'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
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
  const enabled = isTrackedPublicPath(pathname)

  // Deliberately not next/navigation's useSearchParams(): that hook requires the
  // component to sit inside a <Suspense> boundary, and Suspense anywhere in the
  // render path forces Next.js into streaming mode - which makes notFound() render
  // the not-found UI with an HTTP 200 status instead of a real 404 (a documented
  // Next.js App Router limitation, not something specific to this page). Tracking is
  // a client-only side effect anyway, so reading the query string straight off
  // window.location inside the effect gets the same value without that trade-off.
  useEffect(() => {
    if (!enabled) return
    const search = typeof window !== 'undefined' ? window.location.search : ''
    trackPageView(`${pathname}${search}`)
  }, [enabled, pathname])

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
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta Pixel noscript fallback requires a raw tracking image beacon. */}
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
