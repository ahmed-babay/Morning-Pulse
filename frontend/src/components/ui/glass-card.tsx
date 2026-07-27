import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

interface GlassCardProps extends Omit<HTMLMotionProps<'article'>, 'children'> {
  delay?: number
  children: ReactNode
}

export function GlassCard({
  className,
  delay = 0,
  children,
  ...props
}: GlassCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      className={cn(
        'glass group relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6',
        className,
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? {} : { y: -4, scale: 1.006 }}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(500px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in srgb, var(--accent) 9%, transparent), transparent 42%)',
        }}
      />
      <div className="relative">{children}</div>
    </motion.article>
  )
}

interface CardHeaderProps {
  title: string
  eyebrow?: string
  icon?: ReactNode
  action?: ReactNode
}

export function CardHeader({ title, eyebrow, icon, action }: CardHeaderProps) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink/5 text-accent dark:bg-white/8">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-0.5 text-[0.67rem] font-bold tracking-[0.18em] text-muted uppercase">
              {eyebrow}
            </p>
          )}
          <h2 className="truncate font-display text-lg font-bold tracking-tight">
            {title}
          </h2>
        </div>
      </div>
      {action}
    </header>
  )
}
