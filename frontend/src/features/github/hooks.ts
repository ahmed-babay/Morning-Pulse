import { useQuery } from '@tanstack/react-query'

import { apiGet, ApiClientError } from '../../lib/api'
import type { GitHubBrief } from './types'

export function useGitHubNotifications() {
  return useQuery({
    queryKey: ['github', 'notifications'],
    queryFn: ({ signal }) =>
      apiGet<GitHubBrief>('/github/notifications', signal),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: (failureCount, error) =>
      !(
        error instanceof ApiClientError &&
        error.code === 'github_not_configured'
      ) && failureCount < 2,
  })
}
