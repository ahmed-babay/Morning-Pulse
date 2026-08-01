import { CryptoWidget } from '../features/crypto/crypto-widget'
import { CurrencyWidget } from '../features/currencies/currency-widget'
import { StockWidget } from '../features/stocks/stock-widget'
import { SectionHeading } from '../components/ui/primitives'

export function MarketsPage() {
  return (
    <section>
      <div className="mb-6">
        <SectionHeading eyebrow="Live data" title="Markets" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <CryptoWidget />
        <CurrencyWidget />
        <StockWidget />
      </div>
    </section>
  )
}
