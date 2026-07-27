export interface WeatherLocation {
  name: string
  country: string
  admin_area: string | null
  latitude: number
  longitude: number
  timezone: string
}

export interface PreferredLocation {
  name: string
  country: string
  latitude: number
  longitude: number
}

export interface LocationSearchResult extends WeatherLocation {
  id: number
}

export interface Weather {
  location: WeatherLocation
  current: {
    temperature: number
    apparent_temperature: number
    humidity: number
    wind_speed: number
    weather_code: number
    condition: string
    is_day: boolean
    observed_at: string
  }
  hourly: Array<{
    time: string
    temperature: number
    weather_code: number
    precipitation_probability: number
  }>
  today: {
    date: string
    temperature_max: number
    temperature_min: number
    sunrise: string
    sunset: string
  }
  temperature_unit: string
  wind_speed_unit: string
  fetched_at: string
  stale: boolean
}
