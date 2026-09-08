'use client'

import { useEffect, useRef, useState } from 'react'

// Wraps an arbitrary CMS-supplied image URL with an error fallback. Discovered via real
// production data: `tools_extended.logo_url` rows point to Clearbit's public Logo API
// (logo.clearbit.com), which has been discontinued and no longer resolves - those images are
// broken for real site visitors today, not just in a sandboxed test run.
//
// The browser starts loading `src` as soon as it parses the server-rendered HTML, which can
// happen (and fail) before React finishes hydrating and attaches the `onError` listener - a
// non-bubbling `error` event that fires before hydration is simply missed. The effect below
// covers that race by checking the already-mounted <img>'s `complete`/`naturalWidth` once
// hydration runs; `onError` still covers any failure that happens after that point.
export default function SafeImage({ src, alt = '', className = '', loading = 'lazy', fallback = null }) {
  const [failed, setFailed] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    setFailed(false)
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) {
      setFailed(true)
    }
  }, [src])

  if (!src || failed) return fallback

  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary CMS-supplied image URL with error handling
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
