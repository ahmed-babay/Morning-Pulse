import { DashboardGrid } from './components/dashboard/dashboard-grid'
import { GreetingHero } from './components/dashboard/greeting-hero'
import { AppShell } from './components/layout/app-shell'
import { PageTransition } from './components/layout/page-transition'
import { RouteViewport } from './lib/router'

export function App() {
  return (
    <AppShell>
      <RouteViewport>
        <PageTransition>
          <GreetingHero />
          <DashboardGrid />
          <footer className="pb-24 pt-12 text-center text-xs font-semibold text-muted lg:pb-4">
            Morning Pulse · Designed for calmer mornings
          </footer>
        </PageTransition>
      </RouteViewport>
    </AppShell>
  )
}

export default App
