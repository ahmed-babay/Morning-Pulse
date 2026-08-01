import { motion } from 'framer-motion'
import {
  Cloud,
  CloudRain,
  Droplets,
  MapPin,
  RefreshCw,
  Sunrise,
  Sunset,
  Wind,
} from 'lucide-react'
import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'

import { GlassCard, CardHeader } from '../../components/ui/glass-card'
import {
  IconButton,
  Skeleton,
  StatusPill,
} from '../../components/ui/primitives'
import { useWeatherStore } from '../../stores/weather-store'
import { useWeather } from './hooks'
import { LocationPicker } from './location-picker'

function shortTime(value: string) {
  const hour = Number(value.slice(11, 13))
  if (Number.isNaN(hour)) return value
  return `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`
}

const STARS = [
  { top: '18%', left: '22%', delay: 0 },
  { top: '30%', left: '68%', delay: 0.6 },
  { top: '58%', left: '14%', delay: 1.2 },
  { top: '68%', left: '76%', delay: 0.3 },
  { top: '14%', left: '52%', delay: 0.9 },
]

const RAINDROPS = [
  { left: '30%', delay: 0 },
  { left: '48%', delay: 0.35 },
  { left: '64%', delay: 0.15 },
  { left: '38%', delay: 0.55 },
]

function WeatherOrb({ code, isDay }: { code: number; isDay: boolean }) {
  const rainy = code >= 51
  const cloudy = code >= 2

  return (
    <div
      className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full"
      style={{
        background: rainy
          ? 'linear-gradient(145deg, color-mix(in srgb, var(--aqua) 35%, transparent), color-mix(in srgb, var(--ink) 8%, transparent))'
          : 'color-mix(in srgb, var(--sun) 15%, transparent)',
      }}
      aria-hidden="true"
    >
      {!isDay &&
        STARS.map((star, index) => (
          <motion.span
            key={index}
            className="absolute size-[3px] rounded-full bg-white"
            style={{ top: star.top, left: star.left }}
            animate={{ opacity: [0.15, 1, 0.15] }}
            transition={{
              repeat: Infinity,
              duration: 2.4,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

      {isDay && !cloudy && (
        <motion.div
          className="absolute size-20 rounded-full"
          style={{
            background:
              'repeating-conic-gradient(color-mix(in srgb, var(--sun) 35%, transparent) 0deg 8deg, transparent 8deg 20deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
        />
      )}

      <motion.div
        className="absolute size-11 rounded-full"
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ repeat: Infinity, duration: 4 }}
        style={{
          background: isDay
            ? 'var(--sun)'
            : 'color-mix(in srgb, var(--ink) 60%, white)',
          boxShadow: '0 0 36px color-mix(in srgb, var(--sun) 65%, transparent)',
        }}
      />

      {(cloudy || rainy) && (
        <motion.div
          className="absolute right-3 bottom-4"
          animate={{ x: [0, 3, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        >
          <Cloud
            className="size-11 text-[var(--panel-solid)] drop-shadow-md"
            fill="currentColor"
          />
        </motion.div>
      )}

      {rainy &&
        RAINDROPS.map((drop, index) => (
          <motion.span
            key={index}
            className="absolute top-11 h-2.5 w-0.5 rounded-full bg-[var(--aqua)]"
            style={{ left: drop.left }}
            animate={{ y: [0, 22], opacity: [0, 1, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1.1,
              delay: drop.delay,
              ease: 'easeIn',
            }}
          />
        ))}
    </div>
  )
}

function WeatherSkeleton() {
  return (
    <div aria-label="Loading weather" role="status">
      <div className="flex justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-14 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="size-24" />
      </div>
      <Skeleton className="mt-6 h-24 w-full rounded-2xl" />
    </div>
  )
}

export function WeatherWidget() {
  const [pickerOpen, setPickerOpen] = useState(false)
  const location = useWeatherStore((state) => state.location)
  const setLocation = useWeatherStore((state) => state.setLocation)
  const weather = useWeather(location)

  return (
    <GlassCard id="weather" delay={0.08} className="min-h-96 xl:col-span-5">
      <CardHeader
        title="Weather"
        eyebrow={`${location.name}${location.country ? ` · ${location.country}` : ''}`}
        icon={<Cloud className="size-5" aria-hidden="true" />}
        action={
          <IconButton
            label="Change weather location"
            className="size-9"
            onClick={() => setPickerOpen(true)}
          >
            <MapPin className="size-4" aria-hidden="true" />
          </IconButton>
        }
      />
      {pickerOpen && (
        <LocationPicker
          onClose={() => setPickerOpen(false)}
          onSelect={(next) => {
            setLocation(next)
            setPickerOpen(false)
          }}
        />
      )}

      {weather.isPending && <WeatherSkeleton />}
      {weather.isError && (
        <div
          className="grid min-h-56 place-items-center text-center"
          role="alert"
        >
          <div>
            <CloudRain
              className="mx-auto size-8 text-muted"
              aria-hidden="true"
            />
            <p className="mt-3 font-bold">Weather slipped behind a cloud</p>
            <p className="mt-1 text-sm text-muted">{weather.error.message}</p>
            <button
              type="button"
              onClick={() => void weather.refetch()}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-strong"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        </div>
      )}

      {weather.data && (
        <div className={weather.isPlaceholderData ? 'opacity-60' : undefined}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <motion.p
                key={weather.data.current.temperature}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-6xl font-extrabold tracking-[-0.06em]"
              >
                {Math.round(weather.data.current.temperature)}°
              </motion.p>
              <p className="mt-2 font-semibold">
                {weather.data.current.condition}
              </p>
              <p className="mt-1 text-sm text-muted">
                Feels like{' '}
                {Math.round(weather.data.current.apparent_temperature)}° · H{' '}
                {Math.round(weather.data.today.temperature_max)}° / L{' '}
                {Math.round(weather.data.today.temperature_min)}°
              </p>
              {weather.data.stale && (
                <span className="mt-2 inline-block">
                  <StatusPill tone="accent">
                    Saved forecast · reconnecting
                  </StatusPill>
                </span>
              )}
            </div>
            <WeatherOrb
              code={weather.data.current.weather_code}
              isDay={weather.data.current.is_day}
            />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [Droplets, 'Humidity', `${weather.data.current.humidity}%`],
              [
                Wind,
                'Wind',
                `${Math.round(weather.data.current.wind_speed)} km/h`,
              ],
              [Sunrise, 'Sunrise', shortTime(weather.data.today.sunrise)],
              [Sunset, 'Sunset', shortTime(weather.data.today.sunset)],
            ].map(([Icon, label, value]) => {
              const MetricIcon = Icon as typeof Droplets
              return (
                <div
                  key={String(label)}
                  className="rounded-xl bg-ink/[0.045] p-2.5"
                >
                  <dt className="flex items-center gap-1 text-[0.65rem] font-bold text-muted">
                    <MetricIcon className="size-3.5" aria-hidden="true" />
                    {label as string}
                  </dt>
                  <dd className="mt-1 text-xs font-bold">{value as string}</dd>
                </div>
              )
            })}
          </dl>

          <div
            className="mt-4 h-28 border-t border-line pt-3"
            role="img"
            aria-label="Hourly temperature forecast"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weather.data.hourly}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis
                  dataKey="time"
                  tickFormatter={shortTime}
                  tick={{ fill: 'var(--muted)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <Tooltip
                  labelFormatter={(label) => shortTime(String(label))}
                  formatter={(value) => [
                    `${Math.round(Number(value))}°`,
                    'Temperature',
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: 'var(--line)',
                    background: 'var(--panel-solid)',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
