import type { RateTier, BillSegment, RateType } from "@/types"

export function calculateBillSegments(
  startTime: Date,
  endTime: Date,
  rates: RateTier[]
): BillSegment[] {
  if (startTime >= endTime) return []

  const segments: BillSegment[] = []
  const dayOfWeek = startTime.getDay()

  const applicableRates = rates.filter((r) => r.dayOfWeek.includes(dayOfWeek))
  if (applicableRates.length === 0) return []

  const switchPoints: number[] = []
  for (const rate of applicableRates) {
    if (!switchPoints.includes(rate.startHour)) switchPoints.push(rate.startHour)
    if (!switchPoints.includes(rate.endHour)) switchPoints.push(rate.endHour)
  }
  switchPoints.sort((a, b) => a - b)

  const startHour = startTime.getHours() + startTime.getMinutes() / 60
  const endHour = endTime.getHours() + endTime.getMinutes() / 60

  for (let i = 0; i < switchPoints.length - 1; i++) {
    const segStart = switchPoints[i]
    const segEnd = switchPoints[i + 1]

    if (segEnd <= startHour || segStart >= endHour) continue

    const overlapStart = Math.max(segStart, startHour)
    const overlapEnd = Math.min(segEnd, endHour)

    const rate = applicableRates.find(
      (r) => r.startHour <= segStart && r.endHour >= segEnd
    )
    if (!rate) continue

    const durationMinutes = Math.round((overlapEnd - overlapStart) * 60)
    const subtotal = (durationMinutes / 60) * rate.pricePerHour

    const segStartDate = new Date(startTime)
    segStartDate.setHours(Math.floor(overlapStart), (overlapStart % 1) * 60, 0, 0)
    const segEndDate = new Date(startTime)
    segEndDate.setHours(Math.floor(overlapEnd), (overlapEnd % 1) * 60, 0, 0)

    segments.push({
      startTime: segStartDate.toISOString(),
      endTime: segEndDate.toISOString(),
      rateType: rate.rateType,
      pricePerHour: rate.pricePerHour,
      durationMinutes,
      subtotal: Math.round(subtotal * 100) / 100,
    })
  }

  return segments
}

export function calculateTotalAmount(segments: BillSegment[]): number {
  return Math.round(segments.reduce((sum, s) => sum + s.subtotal, 0) * 100) / 100
}

export function getRateAtHour(rates: RateTier[], dayOfWeek: number, hour: number): RateTier | undefined {
  return rates.find(
    (r) => r.dayOfWeek.includes(dayOfWeek) && r.startHour <= hour && r.endHour > hour
  )
}

export function getRateTypeColor(type: RateType): string {
  const colors: Record<RateType, string> = {
    peak: "bg-red-500",
    standard: "bg-amber-500",
    off_peak: "bg-emerald-500",
  }
  return colors[type]
}

export function getRateTypeBgColor(type: RateType): string {
  const colors: Record<RateType, string> = {
    peak: "bg-red-50 text-red-700 border-red-200",
    standard: "bg-amber-50 text-amber-700 border-amber-200",
    off_peak: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }
  return colors[type]
}

export function getRateTypeLabel(type: RateType): string {
  const labels: Record<RateType, string> = {
    peak: "高峰",
    standard: "平峰",
    off_peak: "低谷",
  }
  return labels[type]
}
