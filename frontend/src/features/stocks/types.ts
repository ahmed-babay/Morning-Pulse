export interface StockAsset {
  id: string
  symbol: string
  name: string
  image?: string
  price_usd: number
  change_pct: number
  sparkline: number[]
}

export interface StockBrief {
  assets: StockAsset[]
  top_gainers: StockAsset[]
  top_losers: StockAsset[]
  attribution: string
}
