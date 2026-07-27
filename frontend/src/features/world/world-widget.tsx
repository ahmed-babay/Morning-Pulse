import { ExternalLink, Globe2, Rocket } from 'lucide-react'

import { PreviewCard } from '../../components/dashboard/preview-card'
import { QueryState } from '../../components/dashboard/query-state'
import { useWorld } from './hooks'

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
        title={brief?.apod?.title ?? 'Astronomy picture'}
        eyebrow="NASA APOD"
        icon={Globe2}
        delay={0.32}
        className="xl:col-span-7"
      >
        <QueryState {...queryState} empty={!brief?.apod}>
          {brief?.apod && (
            <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
              {brief.apod.media_type === 'image' && (
                <img
                  className="h-28 w-full rounded-xl object-cover"
                  src={brief.apod.url}
                  alt=""
                  loading="lazy"
                />
              )}
              <div>
                <p className="line-clamp-4 text-sm leading-6 text-muted">
                  {brief.apod.explanation}
                </p>
                <p className="mt-2 text-[0.65rem] text-muted">
                  NASA · {brief.apod.copyright ?? 'Public imagery'}
                </p>
              </div>
            </div>
          )}
        </QueryState>
      </PreviewCard>
    </>
  )
}
