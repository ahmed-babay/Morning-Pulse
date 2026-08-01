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
