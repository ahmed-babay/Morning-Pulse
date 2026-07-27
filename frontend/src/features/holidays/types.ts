export interface HolidayBrief {
  holidays: {
    date: string
    local_name: string
    name: string
    country_code: string
    global_holiday: boolean
  }[]
  attribution: string
}
