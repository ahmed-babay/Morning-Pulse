import * as Dialog from '@radix-ui/react-dialog'
import { useQueryClient } from '@tanstack/react-query'
import {
  Command,
  Download,
  Heart,
  RefreshCw,
  Search,
  WifiOff,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from 'react'
import { toast } from 'sonner'

import { useFavoritesStore } from '../../stores/favorites-store'
import { IconButton, StatusPill } from '../ui/primitives'

const sections = [
  ['overview', 'Overview'],
  ['weather', 'Weather'],
  ['markets', 'Crypto markets'],
  ['currencies', 'Currencies'],
  ['news', 'Top stories'],
  ['holidays', 'Holidays'],
  ['events', 'World events'],
  ['launches', 'Space launches'],
  ['apod', 'Astronomy picture'],
  ['quote', 'Daily quote'],
  ['tip', 'Developer tip'],
] as const

function Modal({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  title: string
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
        <Dialog.Content className="glass fixed top-[12vh] left-1/2 z-50 max-h-[76vh] w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 overflow-auto rounded-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-lg font-bold">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label="Close" className="size-8">
                <X className="size-4" />
              </IconButton>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const favorites = useFavoritesStore((state) => state.favorites)
  const commands = useMemo(
    () => [
      ...sections.map(([id, label]) => ({ id, label, href: `#${id}` })),
      ...favorites.map((item) => ({
        id: item.id,
        label: item.title,
        href: item.url ?? `#${item.kind}`,
      })),
    ],
    [favorites],
  )
  const matches = commands.filter((item) =>
    item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  )
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Search Morning Pulse">
      <label className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-panel px-4">
        <Search className="size-4 text-muted" />
        <span className="sr-only">Search sections and saved content</span>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sections and saved content…"
          className="w-full bg-transparent py-3 text-sm outline-none"
        />
      </label>
      <div role="listbox" className="mt-3 space-y-1">
        {matches.map((item) => (
          <a
            key={item.id}
            role="option"
            aria-selected="false"
            href={item.href}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-ink/5 focus:bg-ink/5"
          >
            <Command className="size-4 text-accent" />
            {item.label}
          </a>
        ))}
        {!matches.length && (
          <p className="py-8 text-center text-sm text-muted">No matches</p>
        )}
      </div>
    </Modal>
  )
}

export function FavoritesPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const favorites = useFavoritesStore((state) => state.favorites)
  const toggle = useFavoritesStore((state) => state.toggle)
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Your favorites">
      <div className="mt-4 space-y-2">
        {favorites.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-2xl bg-ink/[0.045] p-3"
          >
            <a
              href={item.url ?? `#${item.kind}`}
              target={item.url ? '_blank' : undefined}
              rel={item.url ? 'noopener noreferrer' : undefined}
              className="min-w-0 text-sm font-bold"
            >
              {item.title}
              {item.subtitle && (
                <span className="mt-1 block truncate text-xs font-normal text-muted">
                  {item.subtitle}
                </span>
              )}
            </a>
            <IconButton
              label={`Remove ${item.title}`}
              className="size-8"
              onClick={() => toggle(item)}
            >
              <X className="size-3.5" />
            </IconButton>
          </div>
        ))}
        {!favorites.length && (
          <p className="py-10 text-center text-sm text-muted">
            Save stories, assets, quotes, and tips to find them here.
          </p>
        )}
      </div>
    </Modal>
  )
}

export function RefreshButton() {
  const client = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const refresh = async () => {
    setRefreshing(true)
    const id = toast.loading('Refreshing your briefing…')
    await client.invalidateQueries()
    setRefreshing(false)
    toast.success('Morning Pulse is up to date', { id })
  }
  return (
    <IconButton label="Refresh all updates" onClick={() => void refresh()}>
      <RefreshCw
        className={`size-[1.1rem] ${refreshing ? 'animate-spin' : ''}`}
      />
    </IconButton>
  )
}

export function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  if (online) return null
  return (
    <StatusPill tone="accent">
      <WifiOff className="mr-1 size-3" /> Offline · showing saved data
    </StatusPill>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  useEffect(() => {
    const capture = (value: Event) => {
      value.preventDefault()
      setEvent(value as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', capture)
    return () => window.removeEventListener('beforeinstallprompt', capture)
  }, [])
  if (!event) return null
  return (
    <button
      type="button"
      onClick={() => void event.prompt().then(() => setEvent(null))}
      className="hidden items-center gap-2 rounded-full border border-line bg-panel px-3 py-2 text-xs font-bold sm:flex"
    >
      <Download className="size-3.5" /> Install
    </button>
  )
}

export function PullToRefresh({ children }: { children: ReactNode }) {
  const start = useRef(0)
  const client = useQueryClient()
  const onStart = (event: TouchEvent) => {
    if (window.scrollY === 0) start.current = event.touches[0]?.clientY ?? 0
  }
  const onEnd = (event: TouchEvent) => {
    const end = event.changedTouches[0]?.clientY ?? 0
    if (start.current && end - start.current > 80) {
      toast.promise(client.invalidateQueries(), {
        loading: 'Refreshing…',
        success: 'Briefing refreshed',
        error: 'Refresh failed',
      })
    }
    start.current = 0
  }
  return (
    <div onTouchStart={onStart} onTouchEnd={onEnd}>
      {children}
    </div>
  )
}

export const SearchIcon = Search
export const FavoritesIcon = Heart
