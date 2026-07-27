import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from './App'
import { AppProviders } from './lib/providers'
import { useThemeStore } from './stores/theme-store'

function renderApp() {
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  )
}

describe('App', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' })
    document.documentElement.dataset.theme = 'light'
    window.localStorage.clear()
  })

  it('renders the dashboard foundation and planned domains', () => {
    renderApp()

    expect(
      screen.getByRole('heading', { name: /good morning, ahmed/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Weather' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Markets' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Top stories' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Coming up' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'World events' }),
    ).toBeInTheDocument()
  })

  it('supports the visible theme toggle', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(
      screen.getByRole('button', { name: /switch to dark theme/i }),
    )

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
})
