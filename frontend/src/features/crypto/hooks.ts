import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api'
import type { CryptoBrief } from './types'

export function useCrypto() {
  return useQuery({
    queryKey: ['crypto'],
    queryFn: ({ signal }) => apiGet<CryptoBrief>('/crypto', signal),
    staleTime: 15_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  })
}
