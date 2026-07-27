import * as Tooltip from '@radix-ui/react-tooltip'
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  CloudSun,
  Compass,
  House,
  Menu,
  Moon,
  Newspaper,
  Sun,
} from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { useThemeStore } from '../../stores/theme-store'
import { AmbientBackground } from './ambient-background'
import { IconButton } from '../ui/primitives'

const navigation = [
  { label: 'Overview', icon: House, active: true },
  { label: 'Weather', icon: CloudSun },
  { label: 'Markets', icon: ChartNoAxesCombined },
  { label: 'News', icon: Newspaper },
  { label: 'Events', icon: CalendarDays },
]

function Brand() {
  return (
    <a href="#main" className="flex items-center gap-3 rounded-xl">
      <span className="grid size-10 place-items-center rounded-2xl bg-ink text-canvas shadow-lg">
        <Sun className="size-5" aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-extrabold tracking-[-0.04em]">
        Morning Pulse
      </span>
    </a>
  )
}

function Sidebar() {
  return (
    <aside className="glass fixed inset-y-4 left-4 z-30 hidden w-64 flex-col rounded-[2rem] p-4 lg:flex">
      <div className="px-2 py-3">
        <Brand />
      </div>
      <nav aria-label="Primary" className="mt-8 space-y-1.5">
        {navigation.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href={`#${label.toLowerCase()}`}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              active
                ? 'bg-ink text-canvas shadow-md'
                : 'text-muted hover:bg-ink/5 hover:text-ink'
            }`}
          >
            <Icon className="size-[1.1rem]" aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl bg-ink/[0.045] p-4">
        <Compass className="mb-3 size-5 text-accent" aria-hidden="true" />
        <p className="text-sm font-bold">Your daily compass</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Calm context for a clear start.
        </p>
      </div>
    </aside>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useThemeStore()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className="noise min-h-screen">
      <AmbientBackground />
      <Sidebar />
      <header className="sticky top-0 z-20 border-b border-line bg-[color:var(--nav)] px-4 py-3 backdrop-blur-2xl sm:px-6 lg:ml-72 lg:border-0 lg:bg-transparent lg:px-8 lg:pt-7">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">
              Monday · July 27
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <IconButton
                  label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? (
                    <Moon className="size-[1.1rem]" />
                  ) : (
                    <Sun className="size-[1.1rem]" />
                  )}
                </IconButton>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  sideOffset={8}
                  className="z-50 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-canvas shadow-xl"
                >
                  Toggle theme
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <IconButton label="Notifications">
              <Bell className="size-[1.1rem]" />
            </IconButton>
            <IconButton label="Open menu" className="sm:hidden">
              <Menu className="size-[1.1rem]" />
            </IconButton>
            <button
              type="button"
              className="ml-1 hidden cursor-pointer items-center gap-2 rounded-full border border-line bg-panel py-1.5 pr-3 pl-1.5 text-sm font-bold shadow-sm backdrop-blur-xl sm:flex"
              aria-label="Open profile menu"
            >
              <span className="grid size-8 place-items-center rounded-full bg-accent text-xs text-white">
                AM
              </span>
              Ahmed
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="px-4 py-8 sm:px-6 lg:ml-72 lg:px-8 lg:pt-5">
        <div className="mx-auto max-w-[90rem]">{children}</div>
      </main>
      <nav
        aria-label="Mobile primary"
        className="glass fixed right-3 bottom-3 left-3 z-30 flex justify-around rounded-2xl px-2 py-2 lg:hidden"
      >
        {navigation.slice(0, 5).map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href={`#${label.toLowerCase()}`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`grid size-11 place-items-center rounded-xl ${
              active ? 'bg-ink text-canvas' : 'text-muted'
            }`}
          >
            <Icon className="size-5" aria-hidden="true" />
          </a>
        ))}
      </nav>
    </div>
  )
}
