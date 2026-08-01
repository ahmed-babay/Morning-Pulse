import { motion } from 'framer-motion'
import { ChevronDown, LineChart } from 'lucide-react'
import { useState } from 'react'

import { FavoriteButton } from '../../components/dashboard/favorite-button'
import { PreviewCard } from '../../components/dashboard/preview-card'
import { QueryState } from '../../components/dashboard/query-state'
import { FlashValue, LiveDot } from '../../components/ui/live-value'
import { StatusPill } from '../../components/ui/primitives'
import { useStocks } from './hooks'
import type { StockAsset } from './types'

const VIEWS = {
  gainers: 'Top gainers',
  losers: 'Top losers',
  watchlist: 'Watchlist',
} as const

type View = keyof typeof VIEWS

function Sparkline({
  values,
  positive,
}: {
  values: number[]
  positive: boolean
}) {
  if (values.length < 2) return <div className="h-8" />
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const points = values
    .map(
      (value, index) =>
        `${(index / (values.length - 1)) * 100},${30 - ((value - min) / range) * 26}`,
    )
    .join(' ')
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-20 shrink-0" aria-hidden="true">
      <motion.polyline
        points={points}
        fill="none"
        stroke={positive ? '#10b981' : '#ef4444'}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
      />
    </svg>
  )
}

function StockRow({ asset }: { asset: StockAsset }) {
  const positive = asset.change_pct >= 0
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.045] p-3">
      {asset.image ? (
        <img
          src={asset.image}
          alt=""
          className="size-8 shrink-0 rounded-lg bg-white object-contain p-1"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden'
          }}
        />
      ) : (
        <div className="size-8 shrink-0 rounded-lg bg-ink/10" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-muted">
          {asset.name} · {asset.symbol}
        </p>
        <FlashValue value={asset.price_usd}>
          <p className="mt-0.5 font-display text-base font-bold">
            ${asset.price_usd.toLocaleString()}
          </p>
        </FlashValue>
      </div>
      <Sparkline values={asset.sparkline} positive={positive} />
      <div className="flex flex-col items-end gap-1.5">
        <StatusPill tone={positive ? 'positive' : 'neutral'}>
          {positive ? '+' : ''}
          {asset.change_pct.toFixed(2)}%
        </StatusPill>
        <FavoriteButton
          item={{
            id: `stock:${asset.id}`,
            kind: 'asset',
            title: asset.name,
            subtitle: asset.symbol,
          }}
        />
      </div>
    </div>
  )
}

export function StockWidget() {
  const query = useStocks()
  const [view, setView] = useState<View>('gainers')

  const rows =
    view === 'gainers'
      ? query.data?.top_gainers
      : view === 'losers'
        ? query.data?.top_losers
        : query.data?.assets

  return (
    <PreviewCard
      id="stocks"
      title="Stock market"
      eyebrow="Yahoo Finance"
      icon={LineChart}
      delay={0.14}
      className="xl:col-span-7"
    >
      <QueryState
        pending={query.isPending}
        error={query.error}
        empty={!query.data?.assets.length}
        retry={() => void query.refetch()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="relative">
            <select
              value={view}
              onChange={(event) => setView(event.target.value as View)}
              className="cursor-pointer appearance-none rounded-full border border-line bg-ink/[0.045] py-1.5 pr-8 pl-3 text-xs font-bold text-ink outline-none focus-visible:outline-accent"
              aria-label="Stock list view"
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
          <LiveDot />
        </div>
        <div className="grid gap-2.5">
          {rows?.map((asset) => (
            <StockRow key={asset.id} asset={asset} />
          ))}
        </div>
      </QueryState>
    </PreviewCard>
  )
}
