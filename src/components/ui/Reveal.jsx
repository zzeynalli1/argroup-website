import { motion, useReducedMotion } from 'framer-motion'

/**
 * Shared scroll-reveal wrapper for the Services showcase sections — fades
 * and lifts content in once as it enters the viewport. Honors
 * prefers-reduced-motion by skipping the animation entirely rather than
 * just shortening it, per CLAUDE.md's interaction restraint rule.
 */
export default function Reveal({ children, className = '', delay = 0, y = 24, as = 'div' }) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    const Static = as
    return <Static className={className}>{children}</Static>
  }

  const MotionTag = motion[as]

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </MotionTag>
  )
}
