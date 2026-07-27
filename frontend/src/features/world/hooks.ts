import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api'
import type { WorldBrief } from './types'

export function useWorld() {
  return useQuery({
    queryKey: ['world'],
    queryFn: ({ signal }) => apiGet<WorldBrief>('/world', signal),
    staleTime: 15 * 60_000,
  })
}
