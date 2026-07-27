import { LocateFixed, MapPin, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useLocationSearch } from './hooks'
import type { PreferredLocation } from './types'

interface LocationPickerProps {
  onSelect: (location: PreferredLocation) => void
  onClose: () => void
}

export function LocationPicker({ onSelect, onClose }: LocationPickerProps) {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [geoError, setGeoError] = useState('')
  const search = useLocationSearch(query)

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input), 300)
    return () => window.clearTimeout(timer)
  }, [input])

  function locate() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.')
      return
    }
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        onSelect({
          name: 'Current location',
          country: '',
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      () =>
        setGeoError('Location access was denied. Search for a city instead.'),
      { timeout: 8000, maximumAge: 10 * 60_000 },
    )
  }

  return (
    <div className="absolute inset-x-3 top-3 z-20 rounded-2xl border border-line bg-[var(--panel-solid)] p-3 shadow-2xl">
      <div className="flex items-center gap-2">
        <Search className="size-4 text-muted" aria-hidden="true" />
        <label className="sr-only" htmlFor="weather-location">
          Search for a city
        </label>
        <input
          id="weather-location"
          autoFocus
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search city or postcode"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          role="combobox"
          aria-expanded={Boolean(search.data?.length)}
          aria-controls="weather-location-results"
          aria-autocomplete="list"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close location search"
          className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-ink/5"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={locate}
        className="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-xl bg-ink/5 px-3 py-2 text-left text-xs font-bold hover:bg-ink/10"
      >
        <LocateFixed className="size-4 text-accent" aria-hidden="true" />
        Use my current location
      </button>
      {geoError && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {geoError}
        </p>
      )}

      <ul
        id="weather-location-results"
        role="listbox"
        className="mt-2 max-h-48 overflow-y-auto"
      >
        {search.data?.map((result) => (
          <li key={result.id} role="option" aria-selected="false">
            <button
              type="button"
              onClick={() =>
                onSelect({
                  name: result.name,
                  country: result.country,
                  latitude: result.latitude,
                  longitude: result.longitude,
                })
              }
              className="flex w-full cursor-pointer items-start gap-2 rounded-xl px-3 py-2 text-left hover:bg-ink/5"
            >
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span>
                <span className="block text-sm font-bold">{result.name}</span>
                <span className="block text-xs text-muted">
                  {[result.admin_area, result.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {search.isFetching && (
        <p className="px-3 py-2 text-xs text-muted">Searching…</p>
      )}
      {search.isError && (
        <p className="px-3 py-2 text-xs text-red-600" role="alert">
          Couldn’t search locations. Please try again.
        </p>
      )}
      {query.length >= 2 && search.data?.length === 0 && !search.isFetching && (
        <p className="px-3 py-2 text-xs text-muted">No locations found.</p>
      )}
    </div>
  )
}
