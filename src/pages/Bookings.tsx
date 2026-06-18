import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Play,
  StopCircle,
  AlertTriangle,
} from "lucide-react"
import { useStore } from "@/store"
import { formatDate, formatTime, formatMoney } from "@/utils/time"

const STATUS_LABEL: Record<string, string> = {
  pending: "待签到",
  active: "使用中",
  completed: "已完成",
  timeout_released: "已释放",
  cancelled: "已取消",
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  active: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  timeout_released: "bg-red-50 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
}

const FILTER_TABS = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待签到" },
  { value: "active", label: "使用中" },
  { value: "completed", label: "已完成" },
]

export default function BookingsList() {
  const navigate = useNavigate()
  const bookings = useStore((s) => s.bookings)
  const instruments = useStore((s) => s.instruments)
  const currentUser = useStore((s) => s.currentUser)
  const checkInBooking = useStore((s) => s.checkInBooking)
  const completeBooking = useStore((s) => s.completeBooking)
  const cancelBooking = useStore((s) => s.cancelBooking)
  const bills = useStore((s) => s.bills)

  const [filter, setFilter] = useState("all")

  const myBookings = useMemo(() => {
    return bookings
      .filter((b) => b.userId === currentUser.id)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
  }, [bookings, currentUser.id])

  const filteredBookings = useMemo(() => {
    if (filter === "all") return myBookings
    return myBookings.filter((b) => b.status === filter)
  }, [myBookings, filter])

  const getInstrument = (id: string) => instruments.find((i) => i.id === id)

  const getBillForBooking = (bookingId: string) =>
    bills.find((b) => b.bookingId === bookingId)

  const handleCheckIn = (bookingId: string) => {
    checkInBooking(bookingId)
  }

  const handleComplete = (bookingId: string) => {
    if (confirm("确认结束使用？系统将自动生成账单。")) {
      completeBooking(bookingId)
    }
  }

  const handleCancel = (bookingId: string) => {
    if (confirm("确定要取消这个预约吗？")) {
      cancelBooking(bookingId)
    }
  }

  const canCheckIn = (booking: typeof myBookings[0]) => {
    if (booking.status !== "pending" || booking.checkedIn) return false
    const now = new Date()
    const startTime = new Date(booking.startTime)
    const timeoutTime = new Date(startTime.getTime() + 15 * 60 * 1000)
    return now >= startTime && now < timeoutTime
  }

  const isOverdue = (booking: typeof myBookings[0]) => {
    if (booking.status !== "pending" || booking.checkedIn) return false
    const now = new Date()
    const startTime = new Date(booking.startTime)
    const timeoutTime = new Date(startTime.getTime() + 15 * 60 * 1000)
    return now >= startTime && now < timeoutTime
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div
        className="px-4 pt-12 pb-6"
        style={{ background: "linear-gradient(180deg, #1A365D 0%, #2D4A7A 100%)" }}
      >
        <h1 className="text-white text-xl font-bold">我的预约</h1>
        <p className="text-blue-200 text-sm mt-0.5">
          共 {myBookings.length} 条预约记录
        </p>
      </div>

      <div className="-mt-3 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-[#1A365D] text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3 flex flex-col gap-3">
        {filteredBookings.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center text-gray-400">
            <Calendar className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">暂无预约记录</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const inst = getInstrument(booking.instrumentId)
            const bill = getBillForBooking(booking.id)
            const statusInfo = STATUS_LABEL[booking.status] || booking.status
            const statusColor =
              STATUS_COLOR[booking.status] || "bg-gray-100 text-gray-500"
            const canCheckInNow = canCheckIn(booking)
            const overdue = isOverdue(booking)

            return (
              <div
                key={booking.id}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-gray-900">
                      {inst?.name || "未知仪器"}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500 truncate">
                      {inst?.model}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{inst?.location}</span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
                  >
                    {statusInfo}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(booking.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      {formatTime(booking.startTime)} -{" "}
                      {formatTime(booking.endTime)}
                    </span>
                  </div>
                </div>

                {overdue && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>请尽快签到，超时15分钟将自动释放</span>
                  </div>
                )}

                {bill && booking.status === "completed" && (
                  <div
                    className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                    onClick={() =>
                      navigate(`/billing/bills/${bill.id}`)
                    }
                  >
                    <span className="text-xs text-gray-500">
                      账单金额
                    </span>
                    <span className="text-sm font-bold text-[#1A365D]">
                      {formatMoney(bill.totalAmount)}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  {booking.status === "pending" &&
                    !booking.checkedIn &&
                    !canCheckInNow && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600"
                      >
                        取消预约
                      </button>
                    )}

                  {canCheckInNow && (
                    <>
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleCheckIn(booking.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#1A365D] py-2 text-sm font-medium text-white"
                      >
                        <CheckCircle className="h-4 w-4" />
                        签到
                      </button>
                    </>
                  )}

                  {booking.status === "active" && (
                    <button
                      onClick={() => handleComplete(booking.id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-500 py-2 text-sm font-medium text-white"
                    >
                      <StopCircle className="h-4 w-4" />
                      结束使用
                    </button>
                  )}

                  {booking.status === "completed" && bill && (
                    <button
                      onClick={() => navigate(`/billing/bills/${bill.id}`)}
                      className="flex-1 rounded-lg border border-[#1A365D] py-2 text-sm font-medium text-[#1A365D]"
                    >
                      查看账单
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="px-4 mt-4">
        <button
          onClick={() => navigate("/instruments")}
          className="w-full rounded-xl bg-white py-3 text-sm font-medium text-[#1A365D] shadow-sm"
        >
          去预约新仪器
        </button>
      </div>
    </div>
  )
}
