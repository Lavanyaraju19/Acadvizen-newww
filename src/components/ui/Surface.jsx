import { motion } from 'framer-motion'

export function Surface({
  children,
  className = '',
  as: Comp = 'div',
  motionProps,
  ...rest
}) {
  const base =
    'relative z-10 rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl'

  if (motionProps) {
    return (
      <motion.div className={`${base} ${className}`} {...motionProps} {...rest}>
        {children}
      </motion.div>
    )
  }

  return (
    <Comp className={`${base} ${className}`} {...rest}>
      {children}
    </Comp>
  )
}
