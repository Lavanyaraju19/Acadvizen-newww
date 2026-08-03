'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getDeviceType, isPopupEligible, markPopupSeen } from '../../lib/publicWidgets'

export default function PopupEngine() {
  const pathname = usePathname()
  const [candidate, setCandidate] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    setVisible(false)
    setCandidate(null)

    async function load() {
      try {
        const res = await fetch('/api/cms/popups', { cache: 'no-store' })
        const json = await res.json()
        const rows = Array.isArray(json?.data) ? json.data : []
        const deviceType = getDeviceType()
        const eligible = rows.find((row) => isPopupEligible(row, { pathname, deviceType }))
        if (!cancelled) setCandidate(eligible || null)
      } catch {
        if (!cancelled) setCandidate(null)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [pathname])

  useEffect(() => {
    if (!candidate) return undefined

    const show = () => setVisible(true)

    if (candidate.trigger_type === 'immediate') {
      show()
      return undefined
    }

    if (candidate.trigger_type === 'delay') {
      const seconds = Number(candidate.trigger_value) || 5
      const timer = setTimeout(show, seconds * 1000)
      return () => clearTimeout(timer)
    }

    if (candidate.trigger_type === 'scroll') {
      const thresholdPercent = Number(candidate.trigger_value) || 50
      const onScroll = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight
        const scrolledPercent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100
        if (scrolledPercent >= thresholdPercent) {
          show()
          window.removeEventListener('scroll', onScroll)
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }

    if (candidate.trigger_type === 'exit_intent') {
      const onMouseOut = (event) => {
        if (event.clientY <= 0) {
          show()
          document.removeEventListener('mouseout', onMouseOut)
        }
      }
      document.addEventListener('mouseout', onMouseOut)
      return () => document.removeEventListener('mouseout', onMouseOut)
    }

    if (candidate.trigger_type === 'click') {
      const onClick = () => {
        show()
        document.removeEventListener('click', onClick)
      }
      document.addEventListener('click', onClick)
      return () => document.removeEventListener('click', onClick)
    }

    return undefined
  }, [candidate])

  if (!candidate || !visible) return null

  function close() {
    markPopupSeen(candidate)
    setVisible(false)
  }

  return (
    <div
      data-popup-engine="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={candidate.name || 'Popup'}
    >
      {candidate.overlay !== false ? (
        <button
          type="button"
          aria-label="Close popup overlay"
          onClick={close}
          className="absolute inset-0 cursor-default"
        />
      ) : null}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl">
        {candidate.close_button !== false ? (
          <button
            type="button"
            onClick={close}
            aria-label="Close popup"
            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-sm text-white"
          >
            &times;
          </button>
        ) : null}
        {candidate.image_url ? (
          <img src={candidate.image_url} alt={candidate.name || ''} className="h-40 w-full object-cover" />
        ) : null}
        <div className="p-5">
          {candidate.html_content ? (
            <div className="text-sm text-slate-200" dangerouslySetInnerHTML={{ __html: candidate.html_content }} />
          ) : candidate.content ? (
            <p className="whitespace-pre-line text-sm text-slate-200">{candidate.content}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
