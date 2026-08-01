export interface WorldBrief {
  events: {
    id: string
    kind: string
    title: string
    occurred_at?: string
    url?: string
    magnitude?: number
  }[]
  launches: {
    id: string
    name: string
    status: string
    window_start: string
    image?: string
    webcast?: string
    location: string
  }[]
  apod: Apod[]
  attribution: string[]
}

export interface Apod {
  title: string
  explanation: string
  date: string
  media_type: string
  url: string
  thumbnail_url?: string
  copyright?: string
}
