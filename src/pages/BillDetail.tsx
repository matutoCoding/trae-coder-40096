import { useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, Receipt, Info } from "lucide-react"
import { useStore } from "@/store"
import { formatTime, formatDuration, formatMoney, formatDate } from "@/utils/time"
import { getRateTypeLabel, getRateTypeBgColor, getRateTypeColor } from "@/utils/billing"

const RATE_BORDER_COLORS: Record<string, string> = {
  peak: "#E53E3E",
  standard: "#ED8936",
  off_peak: "#48BB78",
}

export default function BillDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const instruments = useStore((s) => s.instruments)
  const bills = useStore((s) => s.bills)
  const updateBill = useStore((s) => s.updateBill)

  const bill = bills.find((b) => b.id === id)
  const instrument = bill
    ? instruments.find((i) => i.id === bill.instrumentId)
    : undefined

  const rateTypes = useMemo(() => {
    if (!bill) return []
    return [...new Set(bill.segments.map((s) => s.rateType))]
  }, [bill])

  const totalMinutes = useMemo(() => {
    if (!bill) return 0
    return bill.segments.reduce((sum, s) => sum + s.durationMinutes, 0)
  }, [bill])

  const handlePay = () => {
    if (!bill) return
    updateBill(bill.id, { status: "paid" })
  }

  if (!bill) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-400">
        账单不存在
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-[#1A365D]">账单详情</h1>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#1A365D]" />
              <span className="text-sm font-medium text-gray-700">
                {instrument?.name ?? "未知仪器"}
              </span>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                bill.status === "paid"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {bill.status === "paid" ? "已付" : "未付"}
            </span>
          </div>
          <div className="mt-3 text-3xl font-bold text-gray-900">
            {formatMoney(bill.totalAmount)}
          </div>
          <div className="mt-1 text-xs text-gray-400">{formatDate(bill.createdAt)}</div>
        </div>
      </div>

      {rateTypes.length > 1 && (
        <div className="px-4 mt-3">
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <span className="text-xs text-blue-700">
              本账单跨{rateTypes.length}个费率时段，已按切换点分段计费
            </span>
          </div>
        </div>
      )}

      {bill.segments.length > 0 && (
        <div className="px-4 mt-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#1A365D]" />
              <span className="text-sm font-bold text-gray-900">计费时段</span>
            </div>
            <div className="flex gap-0.5 overflow-hidden rounded-lg h-6">
              {bill.segments.map((seg, idx) => {
                const widthPercent = (seg.durationMinutes / totalMinutes) * 100
                return (
                  <div
                    key={idx}
                    className={`h-full rounded-sm ${getRateTypeColor(seg.rateType)}`}
                    style={{ width: `${widthPercent}%` }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-gray-900">费用明细</h2>
          <div className="flex flex-col gap-2">
            {bill.segments.map((seg, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5"
                style={{ borderLeft: `3px solid ${RATE_BORDER_COLORS[seg.rateType]}` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRateTypeBgColor(
                        seg.rateType
                      )}`}
                    >
                      {getRateTypeLabel(seg.rateType)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{formatDuration(seg.durationMinutes)}</span>
                    <span>{formatMoney(seg.pricePerHour)}/时</span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatMoney(seg.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-bold text-gray-900">合计</span>
            <span className="text-xl font-bold text-[#1A365D]">
              {formatMoney(bill.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {bill.status === "unpaid" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <button
            onClick={handlePay}
            className="w-full rounded-xl bg-[#1A365D] py-3 text-sm font-medium text-white active:bg-[#1A365D]/90"
          >
            去支付
          </button>
        </div>
      )}
    </div>
  )
}
