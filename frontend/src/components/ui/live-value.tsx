import { motion, useAnimationControls } from 'framer-motion'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

const FLASH = {
  up: 'color-mix(in srgb, #10b981 30%, transparent)',
  down: 'color-mix(in srgb, #ef4444 28%, transparent)',
}

export function FlashValue({
  value,
  className,
  children,
}: {
  value: number
  className?: string
  children: ReactNode
}) {
  const controls = useAnimationControls()
  const previous = useRef(value)

  useEffect(() => {
    if (value !== previous.current) {
      const direction = value > previous.current ? 'up' : 'down'
      previous.current = value
      void controls.start({
        backgroundColor: [FLASH[direction], 'transparent'],
        transition: { duration: 1.2, ease: 'easeOut' },
      })
    }
  }, [value, controls])

  return (
    <motion.span
      animate={controls}
      className={className}
      style={{ borderRadius: 6 }}
    >
      {children}
    </motion.span>
  )
}

export function LiveDot({ label = 'Live' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold text-muted">
      <span className="relative flex size-1.5">
        <motion.span
          className="absolute inline-flex size-full rounded-full bg-emerald-500"
          animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
        />
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  )
}
