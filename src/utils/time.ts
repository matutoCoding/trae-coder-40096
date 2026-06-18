export function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatDateTime(isoString: string): string {
  return `${formatDate(isoString)} ${formatTime(isoString)}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

export function formatMoney(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

export function getDayName(day: number): string {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][day]
}

export function getRelativeTime(isoString: string): string {
  const now = new Date()
  const target = new Date(isoString)
  const diffMs = target.getTime() - now.getTime()
  const diffMin = Math.floor(Math.abs(diffMs) / 60000)

  if (diffMin < 1) return "刚刚"
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}天前`
}

export function generateTimeSlots(date: Date, startHour: number = 8, endHour: number = 22): string[] {
  const slots: string[] = []
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`)
    slots.push(`${h.toString().padStart(2, "0")}:30`)
  }
  return slots
}
