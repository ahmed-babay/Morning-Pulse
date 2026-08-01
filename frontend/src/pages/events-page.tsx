import { HolidayWidget } from '../features/holidays/holiday-widget'
import { WorldWidget } from '../features/world/world-widget'
import { SectionHeading } from '../components/ui/primitives'

export function EventsPage() {
  return (
    <section>
      <div className="mb-6">
        <SectionHeading eyebrow="What's ahead" title="Events" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <HolidayWidget />
        <WorldWidget />
      </div>
    </section>
  )
}
