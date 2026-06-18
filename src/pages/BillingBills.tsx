import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, FileText, CreditCard, Receipt } from "lucide-react"
import { useStore } from "@/store"
import { formatDate, formatMoney } from "@/utils/time"

export default function BillingBills() {
  const navigate = useNavigate()
  const instruments = useStore((s) => s.instruments)
  const bills = useStore((s) => s.bills)

  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return {
        key: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`,
        label: `${d.getMonth() + 1}月`,
      }
    })
  }, [])

  const [selectedMonth, setSelectedMonth] = useState(months[0]?.key ?? "")

  const filteredBills = useMemo(
    () => bills.filter((b) => b.createdAt.startsWith(selectedMonth)),
    [bills, selectedMonth]
  )

  const monthTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const m of months) {
      const monthBills = bills.filter((b) => b.createdAt.startsWith(m.key))
      totals[m.key] = monthBills.reduce((sum, b) => sum + b.totalAmount, 0)
    }
    return totals
  }, [bills, months])

  const unpaidSummary = useMemo(() => {
    const unpaid = bills.filter((b) => b.status === "unpaid")
    return {
      count: unpaid.length,
      total: unpaid.reduce((sum, b) => sum + b.totalAmount, 0),
    }
  }, [bills])

  const getInstrumentName = (instrumentId: string) =>
    instruments.find((i) => i.id === instrumentId)?.name ?? "未知仪器"

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-[#1A365D]">我的账单</h1>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-[#1A365D] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-white/70">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs">待付金额</span>
          </div>
          <div className="mt-1 text-3xl font-bold text-white">
            {formatMoney(unpaidSummary.total)}
          </div>
          <div className="mt-1 text-xs text-white/60">{unpaidSummary.count} 笔未付账单</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {months.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedMonth(m.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              selectedMonth === m.key
                ? "bg-[#1A365D] text-white"
                : "bg-white text-gray-600 shadow-sm"
            }`}
          >
            {m.label} {formatMoney(monthTotals[m.key] ?? 0)}
          </button>
        ))}
      </div>

      <div className="px-4 mt-3 flex flex-col gap-3">
        {filteredBills.map((bill) => (
          <button
            key={bill.id}
            onClick={() => navigate(`/billing/bills/${bill.id}`)}
            className="w-full rounded-xl bg-white p-4 shadow-sm text-left"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {getInstrumentName(bill.instrumentId)}
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
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="text-xs text-gray-400">{formatDate(bill.createdAt)}</div>
                <div className="mt-0.5 text-xs text-gray-400">
                  含{bill.segments.length}段计费
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatMoney(bill.totalAmount)}
              </div>
            </div>
          </button>
        ))}
        {filteredBills.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileText className="mb-2 h-10 w-10" />
            <span className="text-sm">暂无账单</span>
          </div>
        )}
      </div>
    </div>
  )
}
