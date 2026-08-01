import type { PointerEvent } from 'react'

import { CryptoWidget } from '../../features/crypto/crypto-widget'
import { CurrencyWidget } from '../../features/currencies/currency-widget'
import { DailyContentWidgets } from '../../features/daily-content/daily-content-widgets'
import { GitHubWidget } from '../../features/github/github-widget'
import { HolidayWidget } from '../../features/holidays/holiday-widget'
import { NewsWidget } from '../../features/news/news-widget'
import { StockWidget } from '../../features/stocks/stock-widget'
import { WeatherWidget } from '../../features/weather/weather-widget'
import { WorldWidget } from '../../features/world/world-widget'
import { SectionHeading } from '../ui/primitives'

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
        <CryptoWidget />
        <StockWidget />
        <CurrencyWidget />
        <NewsWidget />
        <HolidayWidget />
        <WorldWidget />
        <GitHubWidget />
        <DailyContentWidgets />
      </div>
    </section>
  )
}
