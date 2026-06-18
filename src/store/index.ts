import { create } from "zustand"
import type { Instrument, RateTable, Booking, WaitlistEntry, Bill, User, Notification, RateTier } from "@/types"
import { calculateBillSegments } from "@/utils/billing"
import {
  mockInstruments,
  mockRateTables,
  mockBookings,
  mockWaitlist,
  mockBills,
  mockUser,
  mockNotifications,
} from "@/data/mock"

const TIMEOUT_MINUTES = 15
const CONFIRM_WINDOW_MINUTES = 10

function generateDefaultRates(): RateTier[] {
  return [
    { dayOfWeek: [1, 2, 3, 4, 5], startHour: 8, endHour: 12, rateType: "peak", pricePerHour: 100 },
    { dayOfWeek: [1, 2, 3, 4, 5], startHour: 12, endHour: 14, rateType: "off_peak", pricePerHour: 40 },
    { dayOfWeek: [1, 2, 3, 4, 5], startHour: 14, endHour: 18, rateType: "standard", pricePerHour: 70 },
    { dayOfWeek: [1, 2, 3, 4, 5], startHour: 18, endHour: 22, rateType: "off_peak", pricePerHour: 40 },
    { dayOfWeek: [6, 0], startHour: 8, endHour: 22, rateType: "off_peak", pricePerHour: 30 },
  ]
}

function timeRangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && startB < endA
}

interface AppState {
  instruments: Instrument[]
  rateTables: RateTable[]
  bookings: Booking[]
  waitlist: WaitlistEntry[]
  bills: Bill[]
  currentUser: User
  notifications: Notification[]

  addBooking: (booking: Booking) => boolean
  updateBooking: (id: string, updates: Partial<Booking>) => void
  addWaitlistEntry: (entry: WaitlistEntry) => number
  updateWaitlistEntry: (id: string, updates: Partial<WaitlistEntry>) => void
  addBill: (bill: Bill) => void
  updateBill: (id: string, updates: Partial<Bill>) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  confirmWaitlist: (waitlistId: string) => void
  declineWaitlist: (waitlistId: string) => void
  addInstrument: (instrument: Instrument) => void
  updateInstrument: (id: string, updates: Partial<Instrument>) => void
  updateRateTable: (id: string, rates: RateTable["rates"]) => void
  checkInBooking: (bookingId: string) => void
  completeBooking: (bookingId: string) => void
  cancelBooking: (bookingId: string) => void
  cancelWaitlist: (waitlistId: string) => void
  processTimeouts: () => void
  processWaitlistNotifications: () => void
  hasTimeConflict: (instrumentId: string, start: Date, end: Date, excludeBookingId?: string) => boolean
  notifyNextWaitlist: (instrumentId: string, rangeStart?: string, rangeEnd?: string) => boolean
  getWaitlistCount: (instrumentId: string) => number
}

export const useStore = create<AppState>((set, get) => ({
  instruments: mockInstruments,
  rateTables: mockRateTables,
  bookings: mockBookings,
  waitlist: mockWaitlist,
  bills: mockBills,
  currentUser: mockUser,
  notifications: mockNotifications,

  hasTimeConflict: (instrumentId, start, end, excludeBookingId) => {
    const { bookings } = get()
    return bookings.some((b) => {
      if (b.id === excludeBookingId) return false
      if (b.instrumentId !== instrumentId) return false
      if (b.status === "cancelled" || b.status === "timeout_released") return false
      return timeRangesOverlap(start, end, new Date(b.startTime), new Date(b.endTime))
    })
  },

  getWaitlistCount: (instrumentId) => {
    return get().waitlist.filter(
      (w) => w.instrumentId === instrumentId && (w.status === "waiting" || w.status === "notified")
    ).length
  },

  addBooking: (booking) => {
    const { hasTimeConflict } = get()
    if (
      hasTimeConflict(
        booking.instrumentId,
        new Date(booking.startTime),
        new Date(booking.endTime)
      )
    ) {
      return false
    }
    set((s) => ({ bookings: [...s.bookings, booking] }))
    return true
  },

  updateBooking: (id, updates) =>
    set((s) => ({
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  addWaitlistEntry: (entry) => {
    const { waitlist } = get()
    const instrumentEntries = waitlist.filter(
      (w) =>
        w.instrumentId === entry.instrumentId &&
        (w.status === "waiting" || w.status === "notified")
    )
    const nextPosition = instrumentEntries.length + 1
    const newEntry = { ...entry, position: nextPosition }
    set((s) => ({ waitlist: [...s.waitlist, newEntry] }))
    return nextPosition
  },

  updateWaitlistEntry: (id, updates) =>
    set((s) => ({
      waitlist: s.waitlist.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),

  addBill: (bill) =>
    set((s) => ({ bills: [...s.bills, bill] })),

  updateBill: (id, updates) =>
    set((s) => ({
      bills: s.bills.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
    })),

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  notifyNextWaitlist: (instrumentId, rangeStart, rangeEnd) => {
    const { waitlist, instruments } = get()
    const instrument = instruments.find((i) => i.id === instrumentId)

    const waiting = waitlist
      .filter((w) => {
        if (w.instrumentId !== instrumentId || w.status !== "waiting") return false
        if (rangeStart && rangeEnd) {
          return timeRangesOverlap(
            new Date(w.desiredStartTime),
            new Date(w.desiredEndTime),
            new Date(rangeStart),
            new Date(rangeEnd)
          )
        }
        return true
      })
      .sort((a, b) => a.position - b.position)

    if (waiting.length === 0) return false

    const nextInLine = waiting[0]
    const deadline = new Date(Date.now() + CONFIRM_WINDOW_MINUTES * 60 * 1000)

    const notification: Notification = {
      id: `ntf_${Date.now()}`,
      type: "waitlist_confirm",
      title: "候补补位通知",
      message: instrument
        ? `${instrument.name} 有时段空出，请在${CONFIRM_WINDOW_MINUTES}分钟内确认补位`
        : `您候补的仪器有时段空出，请在${CONFIRM_WINDOW_MINUTES}分钟内确认`,
      instrumentId,
      waitlistEntryId: nextInLine.id,
      read: false,
      createdAt: new Date().toISOString(),
      confirmDeadline: deadline.toISOString(),
    }

    set((s) => ({
      waitlist: s.waitlist.map((w) =>
        w.id === nextInLine.id
          ? {
              ...w,
              status: "notified" as const,
              notifiedAt: new Date().toISOString(),
              confirmDeadline: deadline.toISOString(),
            }
          : w
      ),
      notifications: [notification, ...s.notifications],
    }))

    return true
  },

  confirmWaitlist: (waitlistId) => {
    const { waitlist, bookings, currentUser, hasTimeConflict } = get()
    const entry = waitlist.find((w) => w.id === waitlistId)
    if (!entry || entry.status === "confirmed" || entry.status === "expired" || entry.status === "cancelled") return

    const start = new Date(entry.desiredStartTime)
    const end = new Date(entry.desiredEndTime)

    if (hasTimeConflict(entry.instrumentId, start, end)) {
      set((s) => ({
        waitlist: s.waitlist.map((w) =>
          w.id === waitlistId ? { ...w, status: "expired" as const } : w
        ),
      }))
      get().notifyNextWaitlist(entry.instrumentId, entry.desiredStartTime, entry.desiredEndTime)
      return
    }

    const booking: Booking = {
      id: `bk_${Date.now()}`,
      instrumentId: entry.instrumentId,
      userId: entry.userId,
      startTime: entry.desiredStartTime,
      endTime: entry.desiredEndTime,
      status: "pending",
      checkedIn: false,
      createdAt: new Date().toISOString(),
    }

    set((s) => ({
      waitlist: s.waitlist.map((w) =>
        w.id === waitlistId ? { ...w, status: "confirmed" as const } : w
      ),
      bookings: [...s.bookings, booking],
    }))

    const remaining = get().waitlist.filter(
      (w) => w.instrumentId === entry.instrumentId && w.status === "waiting"
    )
    remaining.forEach((w, idx) => {
      get().updateWaitlistEntry(w.id, { position: idx + 1 })
    })
  },

  declineWaitlist: (waitlistId) => {
    const { waitlist } = get()
    const entry = waitlist.find((w) => w.id === waitlistId)
    if (!entry) return

    set((s) => ({
      waitlist: s.waitlist.map((w) =>
        w.id === waitlistId ? { ...w, status: "expired" as const } : w
      ),
    }))

    get().notifyNextWaitlist(entry.instrumentId, entry.desiredStartTime, entry.desiredEndTime)
  },

  addInstrument: (instrument) => {
    const rateTableId = `rt_${Date.now()}`
    const rateTable: RateTable = {
      id: rateTableId,
      instrumentId: instrument.id,
      rates: generateDefaultRates(),
    }
    set((s) => ({
      instruments: [...s.instruments, { ...instrument, rateTableId }],
      rateTables: [...s.rateTables, rateTable],
    }))
  },

  updateInstrument: (id, updates) =>
    set((s) => ({
      instruments: s.instruments.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),

  updateRateTable: (id, rates) =>
    set((s) => ({
      rateTables: s.rateTables.map((rt) =>
        rt.id === id ? { ...rt, rates } : rt
      ),
    })),

  checkInBooking: (bookingId) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, checkedIn: true, status: "active" as const }
          : b
      ),
    })),

  completeBooking: (bookingId) => {
    const { bookings, rateTables, bills } = get()
    const booking = bookings.find((b) => b.id === bookingId)
    if (!booking) return

    const existingBill = bills.find((b) => b.bookingId === bookingId)
    if (existingBill) {
      set((s) => ({
        bookings: s.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: "completed" as const } : b
        ),
      }))
      return
    }

    const rateTable = rateTables.find(
      (rt) => rt.instrumentId === booking.instrumentId
    )
    const segments = rateTable
      ? calculateBillSegments(
          new Date(booking.startTime),
          new Date(booking.endTime),
          rateTable.rates
        )
      : []
    const totalAmount = segments.reduce((sum, seg) => sum + seg.subtotal, 0)

    const bill: Bill = {
      id: `bill_${Date.now()}`,
      bookingId,
      userId: booking.userId,
      instrumentId: booking.instrumentId,
      segments,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: "unpaid",
      createdAt: new Date().toISOString(),
    }

    const notification: Notification = {
      id: `ntf_bill_${Date.now()}`,
      type: "bill_generated",
      title: "账单已生成",
      message: `仪器使用已结束，账单金额 ¥${bill.totalAmount.toFixed(2)}`,
      instrumentId: booking.instrumentId,
      read: false,
      createdAt: new Date().toISOString(),
    }

    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "completed" as const } : b
      ),
      bills: [...s.bills, bill],
      notifications: [notification, ...s.notifications],
    }))
  },

  cancelBooking: (bookingId) => {
    const { bookings, notifyNextWaitlist } = get()
    const booking = bookings.find((b) => b.id === bookingId)
    if (!booking) return

    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "cancelled" as const } : b
      ),
    }))

    notifyNextWaitlist(booking.instrumentId, booking.startTime, booking.endTime)
  },

  cancelWaitlist: (waitlistId) => {
    const { waitlist } = get()
    const entry = waitlist.find((w) => w.id === waitlistId)
    if (!entry) return

    const wasNotified = entry.status === "notified"

    set((s) => ({
      waitlist: s.waitlist.map((w) =>
        w.id === waitlistId ? { ...w, status: "cancelled" as const } : w
      ),
    }))

    const remaining = get().waitlist
      .filter(
        (w) =>
          w.instrumentId === entry.instrumentId &&
          (w.status === "waiting" || w.status === "notified")
      )
      .sort((a, b) => a.position - b.position)

    remaining.forEach((w, idx) => {
      get().updateWaitlistEntry(w.id, { position: idx + 1 })
    })

    if (wasNotified) {
      get().notifyNextWaitlist(entry.instrumentId, entry.desiredStartTime, entry.desiredEndTime)
    }
  },

  processTimeouts: () => {
    const { bookings, notifyNextWaitlist } = get()
    const now = new Date()

    bookings.forEach((booking) => {
      if (booking.status !== "pending" || booking.checkedIn) return

      const startTime = new Date(booking.startTime)
      const timeoutTime = new Date(startTime.getTime() + TIMEOUT_MINUTES * 60 * 1000)

      if (now >= timeoutTime) {
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === booking.id
              ? { ...b, status: "timeout_released" as const }
              : b
          ),
          notifications: [
            {
              id: `ntf_to_${booking.id}`,
              type: "timeout_release",
              title: "预约超时释放",
              message: `预约的仪器因超时未签到已自动释放`,
              instrumentId: booking.instrumentId,
              bookingId: booking.id,
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...get().notifications,
          ],
        }))

        notifyNextWaitlist(booking.instrumentId, booking.startTime, booking.endTime)
      }
    })
  },

  processWaitlistNotifications: () => {
    const { waitlist, notifyNextWaitlist } = get()
    const now = new Date()

    waitlist.forEach((entry) => {
      if (entry.status !== "notified" || !entry.confirmDeadline) return
      if (now >= new Date(entry.confirmDeadline)) {
        set((s) => ({
          waitlist: s.waitlist.map((w) =>
            w.id === entry.id ? { ...w, status: "expired" as const } : w
          ),
        }))
        notifyNextWaitlist(entry.instrumentId, entry.desiredStartTime, entry.desiredEndTime)
      }
    })
  },
}))
