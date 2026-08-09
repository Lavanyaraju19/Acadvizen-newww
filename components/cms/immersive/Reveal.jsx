'use client'

import { motion } from 'framer-motion'

const VARIANTS = {
  up: { hidden: { opacity: 0, y: 28 }, shown: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -28 }, shown: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 28 }, shown: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.94 }, shown: { opacity: 1, scale: 1 } },
  none: { hidden: { opacity: 0 }, shown: { opacity: 1 } },
}

export default function Reveal({ children, as = 'up', delay = 0, duration = 0.6, once = true, className = '', viewportMargin = '-80px' }) {
  const variant = VARIANTS[as] || VARIANTS.up
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once, margin: viewportMargin }}
      variants={variant}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Plain (non-motion) wrapper - purely a layout container for a row/grid of RevealItems.
// Each RevealItem below observes its own viewport entry independently rather than relying on
// framer-motion's variant-propagation-from-animating-parent pattern, which proved unreliable
// here (children stayed stuck at their "hidden" variant even after scrolling well past them).
export function RevealGroup({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

export function RevealItem({ children, as = 'up', className = '', duration = 0.55, delay = 0, viewportMargin = '-60px' }) {
  const variant = VARIANTS[as] || VARIANTS.up
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: viewportMargin }}
      variants={variant}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
