import { WeatherWidget } from '../features/weather/weather-widget'
import { SectionHeading } from '../components/ui/primitives'

export function WeatherPage() {
  return (
    <section>
      <div className="mb-6">
        <SectionHeading eyebrow="Forecast" title="Weather" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <WeatherWidget className="xl:col-span-12" />
      </div>
    </section>
  )
}
