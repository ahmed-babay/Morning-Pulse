import { motion, useReducedMotion } from 'framer-motion'

export function AmbientBackground() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--sun)_13%,transparent),transparent_34%),radial-gradient(circle_at_80%_10%,color-mix(in_srgb,var(--aqua)_13%,transparent),transparent_30%),var(--canvas)]">
      <motion.div
        aria-hidden="true"
        className="ambient-blob absolute -top-32 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        animate={
          reduceMotion
            ? false
            : { x: [0, 36, 0], y: [0, -24, 0], scale: [1, 1.1, 1] }
        }
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="ambient-blob absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-[color:var(--aqua)]/10 blur-3xl"
        animate={
          reduceMotion
            ? false
            : { x: [0, -28, 0], y: [0, 42, 0], scale: [1, 0.92, 1] }
        }
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
