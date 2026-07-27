import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api'
import type { CurrencyBrief } from './types'

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: ({ signal }) => apiGet<CurrencyBrief>('/currencies', signal),
    staleTime: 30 * 60_000,
  })
}
