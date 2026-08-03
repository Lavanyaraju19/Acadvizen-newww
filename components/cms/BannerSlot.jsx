'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getDeviceType, isBannerEligible } from '../../lib/publicWidgets'

const DISMISS_KEY_PREFIX = 'acadvizen_banner_dismissed_'

function pickImage(banner, deviceType) {
  if (deviceType === 'mobile' && banner.mobile_image) return banner.mobile_image
  if (deviceType === 'tablet' && banner.tablet_image) return banner.tablet_image
  return banner.desktop_image || banner.mobile_image || banner.tablet_image || ''
}

export default function BannerSlot({ type, className = '' }) {
  const pathname = usePathname()
  const [banner, setBanner] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/cms/banners?type=${encodeURIComponent(type)}`, { cache: 'no-store' })
        const json = await res.json()
        const rows = Array.isArray(json?.data) ? json.data : []
        const deviceType = getDeviceType()
        const eligible = rows.find((row) => isBannerEligible(row, { pathname, deviceType }))
        if (!cancelled) setBanner(eligible || null)
      } catch {
        if (!cancelled) setBanner(null)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [type, pathname])

  useEffect(() => {
    if (!banner?.id) return
    if (type === 'floating' || type === 'popup' || type === 'sidebar') {
      setDismissed(sessionStorage.getItem(`${DISMISS_KEY_PREFIX}${banner.id}`) === '1')
    }
  }, [banner?.id, type])

  if (!banner || dismissed) return null

  const deviceType = getDeviceType()
  const image = pickImage(banner, deviceType)
  const style = {
    backgroundColor: banner.background_color || undefined,
    color: banner.text_color || undefined,
  }

  function dismiss() {
    if (banner?.id) sessionStorage.setItem(`${DISMISS_KEY_PREFIX}${banner.id}`, '1')
    setDismissed(true)
  }

  const content = (
    <>
      {image ? <img src={image} alt={banner.alt_text || banner.title || ''} className="h-full w-full object-cover" /> : null}
      {(banner.title || banner.description || (banner.show_button && banner.button_text)) && (
        <div className="relative z-10 flex flex-col gap-2 p-4">
          {banner.title ? <p className="text-base font-semibold sm:text-lg">{banner.title}</p> : null}
          {banner.description ? <p className="text-sm opacity-90">{banner.description}</p> : null}
          {banner.show_button && banner.button_text ? (
            <span
              className="mt-1 inline-block w-fit rounded-lg px-4 py-2 text-xs font-semibold"
              style={{ backgroundColor: banner.button_color || '#5eead4', color: '#020617' }}
            >
              {banner.button_text}
            </span>
          ) : null}
        </div>
      )}
    </>
  )

  const wrapped = banner.link_url ? (
    <a href={banner.link_url} className="block">
      {content}
    </a>
  ) : (
    content
  )

  if (type === 'hero' || type === 'footer') {
    return (
      <div
        data-banner-slot={type}
        style={style}
        className={`relative overflow-hidden rounded-2xl border border-white/10 ${className}`}
      >
        {wrapped}
      </div>
    )
  }

  if (type === 'sidebar') {
    return (
      <div
        data-banner-slot="sidebar"
        style={style}
        className="fixed right-4 top-1/3 z-30 hidden w-56 overflow-hidden rounded-xl border border-white/10 shadow-lg lg:block"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="absolute right-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white"
        >
          &times;
        </button>
        {wrapped}
      </div>
    )
  }

  if (type === 'floating') {
    return (
      <div
        data-banner-slot="floating"
        style={style}
        className="fixed bottom-4 left-4 z-40 w-64 overflow-hidden rounded-xl border border-white/10 shadow-lg"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="absolute right-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white"
        >
          &times;
        </button>
        {wrapped}
      </div>
    )
  }

  if (type === 'popup') {
    return (
      <div
        data-banner-slot="popup"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
      >
        <div style={style} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close popup"
            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-sm text-white"
          >
            &times;
          </button>
          {wrapped}
        </div>
      </div>
    )
  }

  return null
}
