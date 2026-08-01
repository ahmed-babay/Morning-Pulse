import type { LocationSearchResult, PreferredLocation, Weather } from './types'

interface Envelope<T> {
  data: T
  request_id: string
}

interface ErrorEnvelope {
  error?: { message?: string }
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...(signal ? { signal } : {}),
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorEnvelope
    throw new Error(body.error?.message ?? 'Weather is temporarily unavailable')
  }
  return ((await response.json()) as Envelope<T>).data
}

export function getWeather(location: PreferredLocation, signal?: AbortSignal) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    name: location.name,
    country: location.country,
  })
  return apiGet<Weather>(`/weather?${params}`, signal)
}

export function searchLocations(query: string, signal?: AbortSignal) {
  return apiGet<LocationSearchResult[]>(
    `/weather/search?query=${encodeURIComponent(query)}`,
    signal,
  )
}
