import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { PreferredLocation } from '../features/weather/types'

export const CAIRO_LOCATION: PreferredLocation = {
  name: 'Cairo',
  country: 'Egypt',
  latitude: 30.0444,
  longitude: 31.2357,
}

interface WeatherState {
  location: PreferredLocation
  setLocation: (location: PreferredLocation) => void
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set) => ({
      location: CAIRO_LOCATION,
      setLocation: (location) => set({ location }),
    }),
    { name: 'morning-pulse-weather' },
  ),
)
