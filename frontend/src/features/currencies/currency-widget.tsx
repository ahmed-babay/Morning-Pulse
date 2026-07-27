import { CircleDollarSign } from 'lucide-react'

import { PreviewCard } from '../../components/dashboard/preview-card'
import { QueryState } from '../../components/dashboard/query-state'
import { useCurrencies } from './hooks'

export function CurrencyWidget() {
  const query = useCurrencies()
  return (
    <PreviewCard
      id="currencies"
      title="Currencies"
      eyebrow="ECB reference rates"
      icon={CircleDollarSign}
      delay={0.16}
      className="xl:col-span-5"
    >
      <QueryState
        pending={query.isPending}
        error={query.error}
        empty={!query.data?.rates.length}
        retry={() => void query.refetch()}
      >
        <div className="grid grid-cols-2 gap-2">
          {query.data?.rates.slice(0, 6).map((rate) => (
            <div className="rounded-xl bg-ink/[0.045] p-3" key={rate.code}>
              <p className="text-xs font-bold text-muted">
                {query.data.base} / {rate.code}
              </p>
              <p className="mt-1 font-display text-lg font-bold">
                {rate.rate.toFixed(3)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[0.65rem] text-muted">
          {query.data?.attribution}
        </p>
      </QueryState>
    </PreviewCard>
  )
}
