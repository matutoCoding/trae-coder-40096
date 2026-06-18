export interface Instrument {
  id: string
  name: string
  model: string
  category: string
  location: string
  status: "available" | "in_use" | "maintenance"
  imageUrl: string
  description: string
  requiredQualification: string[]
  rateTableId: string
}

export interface TimeSlot {
  start: string
  end: string
  status: "available" | "booked" | "waitlist"
  bookingId?: string
}

export interface Booking {
  id: string
  instrumentId: string
  userId: string
  startTime: string
  endTime: string
  status: "pending" | "active" | "completed" | "timeout_released" | "cancelled"
  checkedIn: boolean
  createdAt: string
}

export interface WaitlistEntry {
  id: string
  instrumentId: string
  userId: string
  desiredStartTime: string
  desiredEndTime: string
  position: number
  status: "waiting" | "notified" | "confirmed" | "expired" | "cancelled"
  notifiedAt?: string
  confirmDeadline?: string
  createdAt?: string
}

export interface RateTable {
  id: string
  instrumentId: string
  rates: RateTier[]
}

export interface RateTier {
  dayOfWeek: number[]
  startHour: number
  endHour: number
  rateType: "peak" | "standard" | "off_peak"
  pricePerHour: number
}

export interface BillSegment {
  startTime: string
  endTime: string
  rateType: "peak" | "standard" | "off_peak"
  pricePerHour: number
  durationMinutes: number
  subtotal: number
}

export interface Bill {
  id: string
  bookingId: string
  userId: string
  instrumentId: string
  segments: BillSegment[]
  totalAmount: number
  status: "unpaid" | "paid"
  createdAt: string
}

export interface User {
  id: string
  name: string
  department: string
  avatar: string
  qualifications: Qualification[]
  role: "user" | "instrument_admin" | "system_admin"
}

export interface Qualification {
  id: string
  name: string
  level: string
  instrumentCategories: string[]
  expiresAt: string
}

export interface Notification {
  id: string
  type: "waitlist_confirm" | "booking_reminder" | "timeout_release" | "bill_generated"
  title: string
  message: string
  instrumentId?: string
  waitlistEntryId?: string
  bookingId?: string
  read: boolean
  createdAt: string
  confirmDeadline?: string
}

export type RateType = "peak" | "standard" | "off_peak"

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  peak: "高峰",
  standard: "平峰",
  off_peak: "低谷",
}

export const RATE_TYPE_COLORS: Record<RateType, string> = {
  peak: "#E53E3E",
  standard: "#ED8936",
  off_peak: "#48BB78",
}

export const INSTRUMENT_CATEGORIES = [
  "光谱分析",
  "显微成像",
  "色谱分析",
  "质谱分析",
  "力学测试",
  "电化学分析",
]
