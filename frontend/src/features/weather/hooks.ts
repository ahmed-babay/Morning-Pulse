import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getWeather, searchLocations } from './api'
import type { PreferredLocation } from './types'

export function useWeather(location: PreferredLocation) {
  return useQuery({
    queryKey: ['weather', location.latitude, location.longitude],
    queryFn: ({ signal }) => getWeather(location, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useLocationSearch(query: string) {
  const normalized = query.trim()
  return useQuery({
    queryKey: ['weather-location-search', normalized],
    queryFn: ({ signal }) => searchLocations(normalized, signal),
    enabled: normalized.length >= 2,
    staleTime: 24 * 60 * 60_000,
  })
}
