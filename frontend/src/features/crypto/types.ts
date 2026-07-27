export interface CryptoAsset {
  id: string
  symbol: string
  name: string
  image?: string
  price_usd: number
  change_24h: number
  market_cap: number
  sparkline: number[]
}

export interface CryptoBrief {
  assets: CryptoAsset[]
  top_gainers: CryptoAsset[]
  attribution: string
}
