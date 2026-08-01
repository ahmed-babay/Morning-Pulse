import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from './App'
import { AppProviders } from './lib/providers'
import { useThemeStore } from './stores/theme-store'
import { CAIRO_LOCATION, useWeatherStore } from './stores/weather-store'

const weatherResponse = {
  data: {
    location: {
      ...CAIRO_LOCATION,
      admin_area: 'Cairo',
      timezone: 'Africa/Cairo',
    },
    current: {
      temperature: 28.4,
      apparent_temperature: 29.2,
      humidity: 51,
      wind_speed: 12.6,
      weather_code: 0,
      condition: 'Clear sky',
      is_day: true,
      observed_at: '2026-07-27T08:00:00',
    },
    hourly: [
      {
        time: '2026-07-27T08:00:00',
        temperature: 28.4,
        weather_code: 0,
        precipitation_probability: 0,
      },
    ],
    today: {
      date: '2026-07-27',
      temperature_max: 36,
      temperature_min: 24,
      sunrise: '2026-07-27T06:11:00',
      sunset: '2026-07-27T19:50:00',
    },
    temperature_unit: '°C',
    wind_speed_unit: 'km/h',
    fetched_at: '2026-07-27T06:00:00Z',
    stale: false,
  },
  request_id: 'test',
}

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
    useWeatherStore.setState({ location: CAIRO_LOCATION })
    document.documentElement.dataset.theme = 'light'
    window.localStorage.clear()
    const responses: [string, unknown][] = [
      ['/weather', weatherResponse],
      [
        '/crypto',
        {
          data: { assets: [], top_gainers: [], attribution: 'CoinGecko' },
          request_id: 'test',
        },
      ],
      [
        '/stocks',
        {
          data: {
            assets: [],
            top_gainers: [],
            top_losers: [],
            attribution: 'Yahoo Finance',
          },
          request_id: 'test',
        },
      ],
      [
        '/currencies',
        {
          data: {
            base: 'USD',
            rates: [],
            history: {},
            supported: [],
            attribution: 'Frankfurter',
          },
          request_id: 'test',
        },
      ],
      [
        '/news',
        { data: { items: [], attribution: 'RSS' }, request_id: 'test' },
      ],
      [
        '/holidays',
        {
          data: { holidays: [], attribution: 'Nager.Date' },
          request_id: 'test',
        },
      ],
      [
        '/github/notifications',
        {
          data: { notifications: [], unread_count: 0, attribution: 'GitHub' },
          request_id: 'test',
        },
      ],
      [
        '/world',
        {
          data: { events: [], launches: [], apod: null, attribution: [] },
          request_id: 'test',
        },
      ],
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: string | URL | Request) => {
        const url = String(input)
        const match = responses.find(([fragment]) => url.includes(fragment))
        const data = match ? match[1] : { data: {}, request_id: 'test' }
        return Promise.resolve(
          new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }),
    )
  })

  afterEach(() => vi.unstubAllGlobals())

  it('renders the dashboard foundation and planned domains', () => {
    renderApp()

    expect(
      screen.getByRole('heading', {
        name: /good (morning|afternoon|evening), ahmed/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Weather' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Crypto markets' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Stock market' }),
    ).toBeInTheDocument()
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

  it('renders live normalized weather details', async () => {
    renderApp()

    expect(await screen.findByText('Clear sky')).toBeInTheDocument()
    expect(screen.getByText('Humidity')).toBeInTheDocument()
    expect(screen.getByText('51%')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Hourly temperature forecast' }),
    ).toBeInTheDocument()
  })

  it('opens command search with the keyboard shortcut', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.keyboard('{Control>}k{/Control}')
    expect(
      screen.getByRole('dialog', { name: 'Search Morning Pulse' }),
    ).toBeInTheDocument()
  })
})
