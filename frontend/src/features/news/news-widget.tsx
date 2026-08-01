import { Newspaper } from 'lucide-react'

import { FavoriteButton } from '../../components/dashboard/favorite-button'
import { PreviewCard } from '../../components/dashboard/preview-card'
import { QueryState } from '../../components/dashboard/query-state'
import { ScrollCarousel } from '../../components/ui/scroll-carousel'
import { cn } from '../../lib/utils'
import { useNews } from './hooks'
import type { NewsItem } from './types'

function relativeTime(iso?: string) {
  if (!iso) return ''
  const diffMs = Date.parse(iso) - Date.now()
  const diffHours = Math.round(diffMs / 3_600_000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour')
  return formatter.format(Math.round(diffHours / 24), 'day')
}

function StoryCard({ story }: { story: NewsItem }) {
  return (
    <article className="relative w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-ink/[0.045] sm:w-72">
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {story.image ? (
          <img
            src={story.image}
            alt=""
            className="h-32 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-32 w-full place-items-center bg-gradient-to-br from-accent/15 to-[var(--sun)]/15">
            <Newspaper className="size-7 text-accent/60" aria-hidden="true" />
          </div>
        )}
        <div className="p-3.5">
          <p className="text-[0.65rem] font-bold tracking-wide text-muted uppercase">
            {story.source}
            {story.published_at && ` · ${relativeTime(story.published_at)}`}
          </p>
          <p className="mt-1.5 line-clamp-2 font-display text-sm font-bold leading-snug">
            {story.title}
          </p>
          {story.summary && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">
              {story.summary}
            </p>
          )}
        </div>
      </a>
      <div className="absolute top-2 right-2">
        <FavoriteButton
          item={{
            id: `story:${story.id}`,
            kind: 'story',
            title: story.title,
            subtitle: story.source,
            url: story.url,
          }}
        />
      </div>
    </article>
  )
}

export function NewsWidget({
  limit = 8,
  className,
}: {
  limit?: number
  className?: string
}) {
  const query = useNews()
  return (
    <PreviewCard
      id="news"
      title="Top stories"
      eyebrow="Curated news"
      icon={Newspaper}
      delay={0.18}
      className={cn('xl:col-span-6 xl:row-span-2', className)}
    >
      <QueryState
        pending={query.isPending}
        error={query.error}
        empty={!query.data?.items.length}
        retry={() => void query.refetch()}
      >
        <ScrollCarousel>
          {query.data?.items.slice(0, limit).map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </ScrollCarousel>
      </QueryState>
    </PreviewCard>
  )
}
