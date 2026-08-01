import { ExternalLink, Globe2, PlayCircle, Rocket } from 'lucide-react'

import { PreviewCard } from '../../components/dashboard/preview-card'
import { QueryState } from '../../components/dashboard/query-state'
import { ScrollCarousel } from '../../components/ui/scroll-carousel'
import { useWorld } from './hooks'
import type { Apod } from './types'

function ApodCard({ apod }: { apod: Apod }) {
  return (
    <article className="w-60 shrink-0 snap-start overflow-hidden rounded-2xl bg-ink/[0.045] sm:w-64">
      <a
        href={apod.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {apod.media_type === 'image' ? (
          <img
            src={apod.thumbnail_url ?? apod.url}
            alt=""
            className="h-32 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-32 w-full place-items-center bg-gradient-to-br from-accent/15 to-[var(--sun)]/15">
            <PlayCircle className="size-8 text-accent/60" aria-hidden="true" />
          </div>
        )}
        <div className="p-3.5">
          <p className="text-[0.65rem] font-bold tracking-wide text-muted uppercase">
            {new Intl.DateTimeFormat(undefined, {
              month: 'short',
              day: 'numeric',
            }).format(new Date(apod.date))}
          </p>
          <p className="mt-1.5 line-clamp-2 font-display text-sm font-bold leading-snug">
            {apod.title}
          </p>
          <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-muted">
            {apod.explanation}
          </p>
        </div>
      </a>
    </article>
  )
}

export function WorldWidget() {
  const query = useWorld()
  const brief = query.data
  const queryState = {
    pending: query.isPending,
    error: query.error,
    retry: () => void query.refetch(),
  }
  return (
    <>
      <PreviewCard
        id="events"
        title="World events"
        eyebrow="Live public data"
        icon={Globe2}
        delay={0.28}
        className="xl:col-span-3"
      >
        <QueryState {...queryState} empty={!brief?.events.length}>
          <div className="space-y-3">
            {brief?.events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="border-b border-line pb-3 last:border-0"
              >
                <p className="text-[0.65rem] font-bold uppercase text-accent">
                  {event.kind}
                  {event.magnitude ? ` · M${event.magnitude}` : ''}
                </p>
                <p className="mt-1 text-sm font-semibold">{event.title}</p>
              </div>
            ))}
          </div>
        </QueryState>
      </PreviewCard>
      <PreviewCard
        id="launches"
        title="Next launches"
        eyebrow="Launch Library 2"
        icon={Rocket}
        delay={0.3}
        className="xl:col-span-5"
      >
        <QueryState {...queryState} empty={!brief?.launches.length}>
          <div className="space-y-3">
            {brief?.launches.slice(0, 3).map((launch) => (
              <div
                className="flex items-start justify-between gap-3"
                key={launch.id}
              >
                <div>
                  <p className="text-sm font-bold">{launch.name}</p>
                  <p className="text-xs text-muted">
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(launch.window_start))}{' '}
                    · {launch.location}
                  </p>
                </div>
                {launch.webcast && (
                  <a
                    aria-label={`Watch ${launch.name}`}
                    href={launch.webcast}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </QueryState>
      </PreviewCard>
      <PreviewCard
        id="apod"
        title="Astronomy pictures"
        eyebrow="NASA APOD"
        icon={Globe2}
        delay={0.32}
        className="xl:col-span-7"
      >
        <QueryState {...queryState} empty={!brief?.apod.length}>
          <ScrollCarousel>
            {brief?.apod.map((entry) => (
              <ApodCard key={entry.date} apod={entry} />
            ))}
          </ScrollCarousel>
        </QueryState>
      </PreviewCard>
    </>
  )
}
