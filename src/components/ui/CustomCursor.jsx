import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

function isFinePointer() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(pointer:fine)').matches ?? false
}

function isTouchLike() {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(hover:none)').matches ?? true
}

export function CustomCursor() {
  const enabled = useMemo(() => isFinePointer() && !isTouchLike(), [])
  const [active, setActive] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)

  // two-layer cursor: dot is snappy, halo is slower (ripple-ish feel)
  const dotX = useSpring(x, { stiffness: 900, damping: 55, mass: 0.35 })
  const dotY = useSpring(y, { stiffness: 900, damping: 55, mass: 0.35 })

  const haloX = useSpring(x, { stiffness: 200, damping: 35, mass: 0.9 })
  const haloY = useSpring(y, { stiffness: 200, damping: 35, mass: 0.9 })

  useEffect(() => {
    if (!enabled) return
    document.body.classList.add('advz-cursor-none')

    const onMove = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }

    const isInteractive = (el) => {
      if (!el) return false
      return Boolean(
        el.closest(
          'a,button,[role="button"],input,select,textarea,[data-cursor="hover"],[data-cursor="button"]',
        ),
      )
    }

    const onOver = (e) => {
      setActive(isInteractive(e.target))
    }
    const onOut = (e) => {
      // if moving within an interactive element subtree, keep active
      const next = e.relatedTarget
      setActive(isInteractive(next))
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, true)
    window.addEventListener('mouseout', onOut, true)

    return () => {
      document.body.classList.remove('advz-cursor-none')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver, true)
      window.removeEventListener('mouseout', onOut, true)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <>
      {/* Halo */}
      <motion.div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[9999] pointer-events-none"
        style={{
          x: haloX,
          y: haloY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            width: active ? 64 : 44,
            height: active ? 64 : 44,
            opacity: active ? 0.95 : 0.75,
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="rounded-full"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(0,191,255,0.20), rgba(0,139,139,0.10) 40%, rgba(0,0,0,0) 70%)',
            boxShadow:
              '0 0 22px rgba(0,191,255,0.20), 0 0 48px rgba(0,139,139,0.12), inset 0 0 22px rgba(0,191,255,0.10)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        />
      </motion.div>

      {/* Dot */}
      <motion.div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[10000] pointer-events-none"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            scale: active ? 1.3 : 1,
            opacity: 1,
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: 'rgba(0,191,255,0.95)',
            boxShadow: '0 0 18px rgba(0,191,255,0.45)',
          }}
        />
      </motion.div>
    </>
  )
}

