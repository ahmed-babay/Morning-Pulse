import { NewsWidget } from '../features/news/news-widget'
import { SectionHeading } from '../components/ui/primitives'

export function NewsPage() {
  return (
    <section>
      <div className="mb-6">
        <SectionHeading eyebrow="Curated" title="News" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <NewsWidget limit={12} className="xl:col-span-12" />
      </div>
    </section>
  )
}
