import { CalendarDays } from 'lucide-react'

import { PreviewCard } from '../../components/dashboard/preview-card'
import { QueryState } from '../../components/dashboard/query-state'
import { StatusPill } from '../../components/ui/primitives'
import { useHolidays } from './hooks'

export function HolidayWidget() {
  const query = useHolidays()
  const now = new Date()
  const next = query.data?.holidays.find(
    (holiday) => new Date(`${holiday.date}T00:00:00`) >= now,
  )
  const nextDate = next ? new Date(`${next.date}T00:00:00`) : null
  const days = nextDate
    ? Math.ceil((nextDate.getTime() - now.getTime()) / 86_400_000)
    : 0
  return (
    <PreviewCard
      id="holidays"
      title="Coming up"
      eyebrow="Public holidays"
      icon={CalendarDays}
      delay={0.23}
      className="xl:col-span-3"
    >
      <QueryState
        pending={query.isPending}
        error={query.error}
        empty={!next}
        retry={() => void query.refetch()}
      >
        {next && nextDate && (
          <>
            <p className="font-display text-5xl font-extrabold">
              {nextDate.getDate()}
            </p>
            <p className="mt-1 font-bold">{next.local_name}</p>
            <p className="mt-2 text-sm text-muted">
              {new Intl.DateTimeFormat(undefined, {
                month: 'long',
                year: 'numeric',
              }).format(nextDate)}
            </p>
            <div className="mt-5">
              <StatusPill tone="accent">
                {days === 0 ? 'Today' : `In ${days} days`}
              </StatusPill>
            </div>
          </>
        )}
      </QueryState>
    </PreviewCard>
  )
}
