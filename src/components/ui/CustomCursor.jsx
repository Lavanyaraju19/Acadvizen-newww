import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  const [scrollPulse, setScrollPulse] = useState(false)
  const scrollTimeout = useRef(null)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)

  const dotX = useSpring(x, { stiffness: 900, damping: 55, mass: 0.35 })
  const dotY = useSpring(y, { stiffness: 900, damping: 55, mass: 0.35 })

  const haloX = useSpring(x, { stiffness: 200, damping: 35, mass: 0.9 })
  const haloY = useSpring(y, { stiffness: 200, damping: 35, mass: 0.9 })

  const trailOneX = useSpring(x, { stiffness: 140, damping: 28, mass: 1.1 })
  const trailOneY = useSpring(y, { stiffness: 140, damping: 28, mass: 1.1 })
  const trailTwoX = useSpring(x, { stiffness: 90, damping: 26, mass: 1.4 })
  const trailTwoY = useSpring(y, { stiffness: 90, damping: 26, mass: 1.4 })

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
      const next = e.relatedTarget
      setActive(isInteractive(next))
    }

    const onScroll = () => {
      setScrollPulse(true)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
      scrollTimeout.current = setTimeout(() => setScrollPulse(false), 180)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, true)
    window.addEventListener('mouseout', onOut, true)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      document.body.classList.remove('advz-cursor-none')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver, true)
      window.removeEventListener('mouseout', onOut, true)
      window.removeEventListener('scroll', onScroll)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[9997] pointer-events-none"
        style={{
          x: trailTwoX,
          y: trailTwoY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div
          className="h-4 w-4 rounded-full"
          style={{
            background: 'rgba(0,191,255,0.16)',
            boxShadow: '0 0 26px rgba(0,191,255,0.12)',
            filter: 'blur(1px)',
          }}
        />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[9998] pointer-events-none"
        style={{
          x: trailOneX,
          y: trailOneY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div
          className="h-3 w-3 rounded-full"
          style={{
            background: 'rgba(0,191,255,0.22)',
            boxShadow: '0 0 20px rgba(0,191,255,0.18)',
            filter: 'blur(0.5px)',
          }}
        />
      </motion.div>

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
          className="rounded-full relative"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(0,191,255,0.20), rgba(0,139,139,0.10) 40%, rgba(0,0,0,0) 70%)',
            boxShadow:
              '0 0 22px rgba(0,191,255,0.20), 0 0 48px rgba(0,139,139,0.12), inset 0 0 22px rgba(0,191,255,0.10)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <motion.div
            initial={false}
            animate={{
              scale: scrollPulse ? 1.65 : 1,
              opacity: scrollPulse ? 0.35 : 0,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(45, 212, 191, 0.25)',
              boxShadow: '0 0 20px rgba(0,191,255,0.18)',
            }}
          />
        </motion.div>
      </motion.div>

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
