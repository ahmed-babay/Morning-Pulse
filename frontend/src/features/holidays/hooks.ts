import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api'
import type { HolidayBrief } from './types'

export function useHolidays() {
  const country = navigator.language.split('-')[1]?.toUpperCase() ?? 'US'
  return useQuery({
    queryKey: ['holidays', country],
    queryFn: ({ signal }) =>
      apiGet<HolidayBrief>(`/holidays?country=${country}`, signal),
    staleTime: 12 * 60 * 60_000,
  })
}
