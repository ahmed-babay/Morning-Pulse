import { ArrowUpRight, MoreHorizontal, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { CardHeader, GlassCard } from '../ui/glass-card'
import { IconButton } from '../ui/primitives'

interface PreviewCardProps {
  id: string
  title: string
  eyebrow: string
  icon: LucideIcon
  delay: number
  className?: string
  children: ReactNode
}

export function PreviewCard({
  id,
  title,
  eyebrow,
  icon: Icon,
  delay,
  className,
  children,
}: PreviewCardProps) {
  return (
    <GlassCard id={id} className={className} delay={delay}>
      <CardHeader
        title={title}
        eyebrow={eyebrow}
        icon={<Icon className="size-5" aria-hidden="true" />}
        action={
          <IconButton label={`More ${title} options`} className="size-9">
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </IconButton>
        }
      />
      {children}
    </GlassCard>
  )
}

export function CardLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      className="mt-5 inline-flex items-center gap-1.5 rounded-md text-xs font-bold text-accent-strong hover:underline"
    >
      {label}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </a>
  )
}
