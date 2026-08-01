import { Newspaper } from 'lucide-react'

import { FavoriteButton } from '../../components/dashboard/favorite-button'
import { PreviewCard } from '../../components/dashboard/preview-card'
import { QueryState } from '../../components/dashboard/query-state'
import { cn } from '../../lib/utils'
import { useNews } from './hooks'

export function NewsWidget({
  limit = 5,
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
        <div className="space-y-1">
          {query.data?.items.slice(0, limit).map((story, index) => (
            <div
              key={story.id}
              className="group flex items-start gap-3 rounded-2xl p-3 hover:bg-ink/[0.045]"
            >
              <span className="font-display text-xl font-bold text-accent/55">
                0{index + 1}
              </span>
              <a
                className="min-w-0 flex-1 font-display text-sm font-bold leading-snug hover:text-accent-strong"
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {story.title}
                <span className="mt-1 block text-xs font-normal text-muted">
                  {story.source}
                </span>
              </a>
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
          ))}
        </div>
      </QueryState>
    </PreviewCard>
  )
}
