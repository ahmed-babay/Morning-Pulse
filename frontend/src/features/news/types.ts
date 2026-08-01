export interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  category: string
  published_at?: string
  summary: string
  image?: string
}

export interface NewsBrief {
  items: NewsItem[]
  attribution: string
}
