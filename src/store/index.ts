import { create } from "zustand"
import type { Instrument, RateTable, Booking, WaitlistEntry, Bill, User, Notification } from "@/types"
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

interface AppState {
  instruments: Instrument[]
  rateTables: RateTable[]
  bookings: Booking[]
  waitlist: WaitlistEntry[]
  bills: Bill[]
  currentUser: User
  notifications: Notification[]

  addBooking: (booking: Booking) => void
  updateBooking: (id: string, updates: Partial<Booking>) => void
  addWaitlistEntry: (entry: WaitlistEntry) => void
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
  releaseTimeoutBooking: (bookingId: string) => void
  checkInBooking: (bookingId: string) => void
  completeBooking: (bookingId: string) => void
  cancelBooking: (bookingId: string) => void
  cancelWaitlist: (waitlistId: string) => void
}

export const useStore = create<AppState>((set) => ({
  instruments: mockInstruments,
  rateTables: mockRateTables,
  bookings: mockBookings,
  waitlist: mockWaitlist,
  bills: mockBills,
  currentUser: mockUser,
  notifications: mockNotifications,

  addBooking: (booking) =>
    set((s) => ({ bookings: [...s.bookings, booking] })),

  updateBooking: (id, updates) =>
    set((s) => ({
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  addWaitlistEntry: (entry) =>
    set((s) => ({ waitlist: [...s.waitlist, entry] })),

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

  confirmWaitlist: (waitlistId) =>
    set((s) => {
      const entry = s.waitlist.find((w) => w.id === waitlistId)
      if (!entry) return s

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

      return {
        waitlist: s.waitlist.map((w) =>
          w.id === waitlistId ? { ...w, status: "confirmed" as const } : w
        ),
        bookings: [...s.bookings, booking],
      }
    }),

  declineWaitlist: (waitlistId) =>
    set((s) => ({
      waitlist: s.waitlist.map((w) =>
        w.id === waitlistId ? { ...w, status: "expired" as const } : w
      ),
    })),

  addInstrument: (instrument) =>
    set((s) => ({ instruments: [...s.instruments, instrument] })),

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

  releaseTimeoutBooking: (bookingId) =>
    set((s) => {
      const booking = s.bookings.find((b) => b.id === bookingId)
      if (!booking) return s

      const waitingEntries = s.waitlist
        .filter(
          (w) =>
            w.instrumentId === booking.instrumentId &&
            w.status === "waiting"
        )
        .sort((a, b) => a.position - b.position)

      const updates: Partial<AppState> = {
        bookings: s.bookings.map((b) =>
          b.id === bookingId
            ? { ...b, status: "timeout_released" as const }
            : b
        ),
      }

      if (waitingEntries.length > 0) {
        const nextInLine = waitingEntries[0]
        const notification: Notification = {
          id: `ntf_${Date.now()}`,
          type: "waitlist_confirm",
          title: "候补补位通知",
          message: `您候补的仪器有时段空出，请在10分钟内确认`,
          instrumentId: booking.instrumentId,
          waitlistEntryId: nextInLine.id,
          read: false,
          createdAt: new Date().toISOString(),
          confirmDeadline: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }
        updates.waitlist = s.waitlist.map((w) =>
          w.id === nextInLine.id
            ? {
                ...w,
                status: "notified" as const,
                notifiedAt: new Date().toISOString(),
                confirmDeadline: new Date(
                  Date.now() + 10 * 60 * 1000
                ).toISOString(),
              }
            : w
        )
        updates.notifications = [notification, ...s.notifications]
      }

      return updates
    }),

  checkInBooking: (bookingId) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, checkedIn: true, status: "active" as const }
          : b
      ),
    })),

  completeBooking: (bookingId) =>
    set((s) => {
      const booking = s.bookings.find((b) => b.id === bookingId)
      if (!booking) return s

      const rateTable = s.rateTables.find(
        (rt) => rt.instrumentId === booking.instrumentId
      )
      if (!rateTable) return { bookings: s.bookings.map((b) => b.id === bookingId ? { ...b, status: "completed" as const } : b) }

      const segments = calculateBillSegments(
        new Date(booking.startTime),
        new Date(booking.endTime),
        rateTable.rates
      )
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

      return {
        bookings: s.bookings.map((b) =>
          b.id === bookingId ? { ...b, status: "completed" as const } : b
        ),
        bills: [...s.bills, bill],
      }
    }),

  cancelBooking: (bookingId) =>
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "cancelled" as const } : b
      ),
    })),

  cancelWaitlist: (waitlistId) =>
    set((s) => ({
      waitlist: s.waitlist.map((w) =>
        w.id === waitlistId ? { ...w, status: "cancelled" as const } : w
      ),
    })),
}))
