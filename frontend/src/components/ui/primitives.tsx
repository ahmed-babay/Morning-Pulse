import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../lib/utils'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-panel text-ink shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-accent/30 hover:bg-panel focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'positive' | 'accent'
}) {
  const tones = {
    neutral: 'bg-ink/5 text-muted',
    positive: 'bg-emerald-500/10 text-emerald-700',
    accent: 'bg-accent/10 text-accent-strong',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block animate-pulse rounded-full bg-ink/8 motion-reduce:animate-none',
        className,
      )}
    />
  )
}
