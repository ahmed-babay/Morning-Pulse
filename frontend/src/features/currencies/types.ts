export interface CurrencyBrief {
  base: string
  date: string
  rates: { code: string; rate: number }[]
  history: Record<string, Record<string, number>>
  supported: string[]
  attribution: string
}
