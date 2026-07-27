import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

import { FavoriteButton } from '../../components/dashboard/favorite-button'
import { PreviewCard } from '../../components/dashboard/preview-card'
import { QueryState } from '../../components/dashboard/query-state'
import { StatusPill } from '../../components/ui/primitives'
import { useCrypto } from './hooks'

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-10" />
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const points = values
    .map(
      (value, index) =>
        `${(index / (values.length - 1)) * 100},${38 - ((value - min) / range) * 34}`,
    )
    .join(' ')
  return (
    <svg
      viewBox="0 0 100 40"
      className="h-10 w-full"
      role="img"
      aria-label="Seven-day price trend"
    >
      <motion.polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
      />
    </svg>
  )
}

export function CryptoWidget() {
  const query = useCrypto()
  return (
    <PreviewCard
      id="markets"
      title="Crypto markets"
      eyebrow="CoinGecko"
      icon={TrendingUp}
      delay={0.13}
      className="xl:col-span-7"
    >
      <QueryState
        pending={query.isPending}
        error={query.error}
        empty={!query.data?.assets.length}
        retry={() => void query.refetch()}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {query.data?.assets.map((asset) => (
            <div key={asset.id} className="rounded-2xl bg-ink/[0.045] p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-muted">
                    {asset.name} · {asset.symbol}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    ${asset.price_usd.toLocaleString()}
                  </p>
                </div>
                <FavoriteButton
                  item={{
                    id: `asset:${asset.id}`,
                    kind: 'asset',
                    title: asset.name,
                    subtitle: asset.symbol,
                  }}
                />
              </div>
              <Sparkline values={asset.sparkline} />
              <StatusPill tone={asset.change_24h >= 0 ? 'positive' : 'neutral'}>
                {asset.change_24h >= 0 ? '+' : ''}
                {asset.change_24h.toFixed(2)}%
              </StatusPill>
            </div>
          ))}
        </div>
        {!!query.data?.top_gainers.length && (
          <p className="mt-4 text-xs text-muted">
            Top gainer:{' '}
            <strong className="text-ink">
              {query.data.top_gainers[0]?.name}
            </strong>{' '}
            · {query.data.top_gainers[0]?.change_24h.toFixed(2)}%
          </p>
        )}
      </QueryState>
    </PreviewCard>
  )
}
