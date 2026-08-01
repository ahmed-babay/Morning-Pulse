export interface GitHubNotification {
  id: string
  unread: boolean
  reason: string
  title: string
  type: string
  repository: string
  updated_at: string
  url?: string
}

export interface GitHubBrief {
  notifications: GitHubNotification[]
  unread_count: number
  attribution: string
}

export interface TrendingRepo {
  id: number
  name: string
  full_name: string
  description: string
  url: string
  stars: number
  language?: string
  owner_avatar?: string
}

export interface TrendingBrief {
  repositories: TrendingRepo[]
  attribution: string
}
