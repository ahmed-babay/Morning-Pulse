import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api'
import type { NewsBrief } from './types'

export function useNews(category = 'world') {
  return useQuery({
    queryKey: ['news', category],
    queryFn: ({ signal }) =>
      apiGet<NewsBrief>(`/news?category=${category}`, signal),
    staleTime: 10 * 60_000,
  })
}
