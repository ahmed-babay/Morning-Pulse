import { BellRing, GitFork, GitPullRequest, MessageSquare } from 'lucide-react'

import { PreviewCard } from '../../components/dashboard/preview-card'
import { LiveDot } from '../../components/ui/live-value'
import { StatusPill } from '../../components/ui/primitives'
import { ApiClientError } from '../../lib/api'
import { useGitHubNotifications } from './hooks'
import type { GitHubNotification } from './types'

function relativeTime(iso: string) {
  const diffMs = Date.parse(iso) - Date.now()
  const diffMinutes = Math.round(diffMs / 60_000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour')
  return formatter.format(Math.round(diffHours / 24), 'day')
}

function ReasonIcon({ type }: { type: string }) {
  if (type === 'PullRequest')
    return <GitPullRequest className="size-4 text-accent" aria-hidden="true" />
  if (type === 'Issue')
    return <MessageSquare className="size-4 text-accent" aria-hidden="true" />
  return <BellRing className="size-4 text-accent" aria-hidden="true" />
}

function NotificationRow({ item }: { item: GitHubNotification }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-start gap-3 rounded-2xl bg-ink/[0.045] p-3 hover:bg-ink/[0.07]"
    >
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-ink/5">
        <ReasonIcon type={item.type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{item.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {item.repository} · {relativeTime(item.updated_at)}
        </p>
      </div>
      {item.unread && (
        <span
          className="mt-1.5 size-2 shrink-0 rounded-full bg-accent"
          aria-label="Unread"
        />
      )}
    </a>
  )
}

function NotConfigured() {
  return (
    <div className="rounded-2xl bg-ink/[0.045] p-5 text-center">
      <GitFork className="mx-auto size-6 text-muted" aria-hidden="true" />
      <p className="mt-3 text-sm font-bold">Connect your GitHub</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Create a classic personal access token with only the{' '}
        <code className="rounded bg-ink/10 px-1 py-0.5">notifications</code>{' '}
        scope, then set{' '}
        <code className="rounded bg-ink/10 px-1 py-0.5">GITHUB__TOKEN</code> in
        your <code className="rounded bg-ink/10 px-1 py-0.5">.env</code>.
      </p>
    </div>
  )
}

export function GitHubWidget() {
  const query = useGitHubNotifications()
  const notConfigured =
    query.error instanceof ApiClientError &&
    query.error.code === 'github_not_configured'

  return (
    <PreviewCard
      id="github"
      title="GitHub"
      eyebrow="Notifications"
      icon={GitFork}
      delay={0.2}
      className="xl:col-span-5"
    >
      {notConfigured ? (
        <NotConfigured />
      ) : query.isPending ? (
        <div
          role="status"
          aria-label="Loading notifications"
          className="space-y-3"
        >
          <div className="h-14 w-full animate-pulse rounded-xl bg-ink/8" />
          <div className="h-14 w-full animate-pulse rounded-xl bg-ink/8" />
        </div>
      ) : query.error ? (
        <div role="alert" className="py-8 text-center">
          <p className="font-bold">This update missed its connection</p>
          <p className="mt-1 text-sm text-muted">{query.error.message}</p>
        </div>
      ) : !query.data?.notifications.length ? (
        <p className="py-8 text-center text-sm text-muted">
          You're all caught up.
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <StatusPill
              tone={query.data.unread_count > 0 ? 'accent' : 'neutral'}
            >
              {query.data.unread_count} unread
            </StatusPill>
            <LiveDot />
          </div>
          <div className="grid gap-2">
            {query.data.notifications.slice(0, 6).map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </PreviewCard>
  )
}
