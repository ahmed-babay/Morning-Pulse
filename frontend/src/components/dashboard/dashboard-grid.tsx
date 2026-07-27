import {
  CalendarDays,
  Globe2,
  Lightbulb,
  Newspaper,
  Quote,
  TrendingUp,
} from 'lucide-react'
import type { PointerEvent } from 'react'

import { WeatherWidget } from '../../features/weather/weather-widget'
import { SectionHeading, StatusPill } from '../ui/primitives'
import { CardLink, PreviewCard } from './preview-card'

const stories = [
  'Global markets open on a steady note',
  'The small habits reshaping modern work',
  'Cities rethink the morning commute',
]

function trackSpotlight(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === 'touch') return
  const target = event.target as HTMLElement
  const card = target.closest('article')
  if (!(card instanceof HTMLElement)) return
  const bounds = card.getBoundingClientRect()
  card.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`)
  card.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`)
}

export function DashboardGrid() {
  return (
    <section id="today" onPointerMove={trackSpotlight}>
      <div className="mb-6 flex items-end justify-between">
        <SectionHeading eyebrow="At a glance" title="Your world, in focus" />
        <p className="hidden text-sm text-muted sm:block">
          Updated moments ago
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
        <WeatherWidget />

        <PreviewCard
          id="markets"
          title="Markets"
          eyebrow="Daily pulse"
          icon={TrendingUp}
          delay={0.13}
          className="min-h-72 xl:col-span-7"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['S&P 500', '6,421.18', '+0.42%'],
              ['NASDAQ', '21,108.32', '+0.67%'],
              ['BTC', '$118,240', '+1.24%'],
            ].map(([name, value, change]) => (
              <div key={name} className="rounded-2xl bg-ink/[0.045] p-4">
                <p className="text-xs font-bold text-muted">{name}</p>
                <p className="mt-2 font-display text-xl font-bold">{value}</p>
                <p className="mt-2 text-xs font-bold text-emerald-600">
                  {change}
                </p>
              </div>
            ))}
          </div>
          <div
            className="mt-5 h-16 rounded-xl opacity-70"
            aria-label="Markets trending upward"
            role="img"
            style={{
              background:
                'linear-gradient(175deg, transparent 45%, color-mix(in srgb, var(--aqua) 80%, transparent) 46% 49%, transparent 50%), linear-gradient(5deg, transparent 45%, color-mix(in srgb, var(--accent) 40%, transparent) 46% 49%, transparent 50%)',
            }}
          />
        </PreviewCard>

        <PreviewCard
          id="news"
          title="Top stories"
          eyebrow="News"
          icon={Newspaper}
          delay={0.18}
          className="xl:col-span-6 xl:row-span-2"
        >
          <div className="space-y-1">
            {stories.map((story, index) => (
              <a
                key={story}
                href="#main"
                className="group flex gap-4 rounded-2xl p-3 transition hover:bg-ink/[0.045]"
              >
                <span className="font-display text-xl font-bold text-accent/55">
                  0{index + 1}
                </span>
                <span>
                  <span className="block font-display text-base font-bold leading-snug group-hover:text-accent-strong">
                    {story}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    4 min read · The Daily Edit
                  </span>
                </span>
              </a>
            ))}
          </div>
          <CardLink label="Open morning edition" />
        </PreviewCard>

        <PreviewCard
          id="holidays"
          title="Coming up"
          eyebrow="Holidays"
          icon={CalendarDays}
          delay={0.23}
          className="xl:col-span-3"
        >
          <p className="font-display text-5xl font-extrabold tracking-tight">
            23
          </p>
          <p className="mt-1 font-bold">July Revolution Day</p>
          <p className="mt-2 text-sm text-muted">A national holiday in Egypt</p>
          <div className="mt-5">
            <StatusPill tone="neutral">In 361 days</StatusPill>
          </div>
        </PreviewCard>

        <PreviewCard
          id="events"
          title="World events"
          eyebrow="Around the globe"
          icon={Globe2}
          delay={0.28}
          className="xl:col-span-3"
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-accent">PARIS · 10:00</p>
              <p className="mt-1 text-sm font-semibold">
                Climate innovation forum
              </p>
            </div>
            <div className="border-t border-line pt-4">
              <p className="text-xs font-bold text-accent">TOKYO · 18:30</p>
              <p className="mt-1 text-sm font-semibold">
                Digital futures summit
              </p>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          id="quote"
          title="A thought for today"
          eyebrow="Daily quote"
          icon={Quote}
          delay={0.33}
          className="xl:col-span-7"
        >
          <blockquote className="max-w-2xl font-display text-2xl leading-snug font-semibold tracking-tight sm:text-3xl">
            “The secret of getting ahead is getting started.”
          </blockquote>
          <p className="mt-4 text-sm font-bold text-muted">— Mark Twain</p>
        </PreviewCard>

        <PreviewCard
          id="tip"
          title="Start lighter"
          eyebrow="Morning tip"
          icon={Lightbulb}
          delay={0.38}
          className="xl:col-span-5"
        >
          <p className="text-base leading-7 text-muted">
            Pick one meaningful task before opening your inbox. Give it your
            clearest twenty minutes.
          </p>
          <CardLink label="Save this tip" />
        </PreviewCard>
      </div>
    </section>
  )
}
