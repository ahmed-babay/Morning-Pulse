import { Route, Routes } from 'react-router-dom'

import { AppShell } from './components/layout/app-shell'
import { PageTransition } from './components/layout/page-transition'
import { RouteViewport } from './lib/router'
import { EventsPage } from './pages/events-page'
import { MarketsPage } from './pages/markets-page'
import { NewsPage } from './pages/news-page'
import { OverviewPage } from './pages/overview-page'
import { WeatherPage } from './pages/weather-page'

export function App() {
  return (
    <AppShell>
      <RouteViewport>
        <PageTransition>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/events" element={<EventsPage />} />
          </Routes>
          <footer className="pb-24 pt-12 text-center text-xs font-semibold text-muted lg:pb-4">
            Morning Pulse · Designed for calmer mornings
          </footer>
        </PageTransition>
      </RouteViewport>
    </AppShell>
  )
}

export default App
