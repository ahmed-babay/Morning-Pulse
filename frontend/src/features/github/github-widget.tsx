import {
  BellRing,
  ChevronDown,
  GitFork,
  GitPullRequest,
  MessageSquare,
  Star,
} from 'lucide-react'
import { useState } from 'react'

import { PreviewCard } from '../../components/dashboard/preview-card'
import { StatusPill } from '../../components/ui/primitives'
import { ApiClientError } from '../../lib/api'
import { useGitHubNotifications, useGitHubTrending } from './hooks'
import type { GitHubNotification, TrendingRepo } from './types'

const VIEWS = {
  notifications: 'Notifications',
  trending: 'Trending repos',
} as const

type View = keyof typeof VIEWS

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

function TrendingRow({ repo }: { repo: TrendingRepo }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-start gap-3 rounded-2xl bg-ink/[0.045] p-3 hover:bg-ink/[0.07]"
    >
      {repo.owner_avatar ? (
        <img
          src={repo.owner_avatar}
          alt=""
          className="mt-0.5 size-7 shrink-0 rounded-full"
          loading="lazy"
        />
      ) : (
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-ink/5">
          <GitFork className="size-3.5 text-accent" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{repo.full_name}</p>
        {repo.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted">
            {repo.description}
          </p>
        )}
        {repo.language && (
          <p className="mt-1 text-[0.65rem] font-bold text-muted">
            {repo.language}
          </p>
        )}
      </div>
      <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs font-bold text-muted">
        <Star
          className="size-3.5 text-[var(--sun)]"
          fill="currentColor"
          aria-hidden="true"
        />
        {repo.stars.toLocaleString()}
      </span>
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

function ViewPicker({
  view,
  onChange,
}: {
  view: View
  onChange: (view: View) => void
}) {
  return (
    <div className="relative">
      <select
        value={view}
        onChange={(event) => onChange(event.target.value as View)}
        className="cursor-pointer appearance-none rounded-full border border-line bg-ink/[0.045] py-1.5 pr-8 pl-3 text-xs font-bold text-ink outline-none focus-visible:outline-accent"
        aria-label="GitHub widget view"
      >
        {Object.entries(VIEWS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
  )
}

function NotificationsView() {
  const query = useGitHubNotifications()
  const notConfigured =
    query.error instanceof ApiClientError &&
    query.error.code === 'github_not_configured'

  if (notConfigured) return <NotConfigured />
  if (query.isPending)
    return (
      <div
        role="status"
        aria-label="Loading notifications"
        className="space-y-3"
      >
        <div className="h-14 w-full animate-pulse rounded-xl bg-ink/8" />
        <div className="h-14 w-full animate-pulse rounded-xl bg-ink/8" />
      </div>
    )
  if (query.error)
    return (
      <div role="alert" className="py-8 text-center">
        <p className="font-bold">This update missed its connection</p>
        <p className="mt-1 text-sm text-muted">{query.error.message}</p>
      </div>
    )
  if (!query.data?.notifications.length)
    return (
      <p className="py-8 text-center text-sm text-muted">
        You're all caught up.
      </p>
    )

  return (
    <>
      <div className="mb-3 flex items-center justify-end">
        <StatusPill tone={query.data.unread_count > 0 ? 'accent' : 'neutral'}>
          {query.data.unread_count} unread
        </StatusPill>
      </div>
      <div className="grid gap-2">
        {query.data.notifications.slice(0, 6).map((item) => (
          <NotificationRow key={item.id} item={item} />
        ))}
      </div>
    </>
  )
}

function TrendingView() {
  const query = useGitHubTrending()

  if (query.isPending)
    return (
      <div
        role="status"
        aria-label="Loading trending repos"
        className="space-y-3"
      >
        <div className="h-14 w-full animate-pulse rounded-xl bg-ink/8" />
        <div className="h-14 w-full animate-pulse rounded-xl bg-ink/8" />
      </div>
    )
  if (query.error)
    return (
      <div role="alert" className="py-8 text-center">
        <p className="font-bold">This update missed its connection</p>
        <p className="mt-1 text-sm text-muted">{query.error.message}</p>
      </div>
    )
  if (!query.data?.repositories.length)
    return (
      <p className="py-8 text-center text-sm text-muted">
        Nothing trending right now.
      </p>
    )

  return (
    <div className="grid gap-2">
      {query.data.repositories.slice(0, 6).map((repo) => (
        <TrendingRow key={repo.id} repo={repo} />
      ))}
    </div>
  )
}

export function GitHubWidget() {
  const [view, setView] = useState<View>('notifications')

  return (
    <PreviewCard
      id="github"
      title="GitHub"
      eyebrow={
        view === 'notifications' ? 'Notifications' : 'New & starred this week'
      }
      icon={GitFork}
      delay={0.2}
      className="xl:col-span-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <ViewPicker view={view} onChange={setView} />
      </div>
      {view === 'notifications' ? <NotificationsView /> : <TrendingView />}
    </PreviewCard>
  )
}
