import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api'
import type { StockBrief } from './types'

export function useStocks() {
  return useQuery({
    queryKey: ['stocks'],
    queryFn: ({ signal }) => apiGet<StockBrief>('/stocks', signal),
    staleTime: 20_000,
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
  })
}
