import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, Users, X, Check } from "lucide-react"
import { useStore } from "@/store"
import { formatTime, formatDateTime } from "@/utils/time"

type FilterTab = "waiting" | "notified" | "confirmed" | "cancelled" | "expired"

const TABS: { key: FilterTab; label: string }[] = [
  { key: "waiting", label: "等待中" },
  { key: "notified", label: "已通知" },
  { key: "confirmed", label: "已确认" },
  { key: "cancelled", label: "已放弃" },
  { key: "expired", label: "已过期" },
]

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  waiting: { label: "等待中", color: "bg-blue-50 text-blue-700" },
  notified: { label: "已通知", color: "bg-amber-50 text-amber-700" },
  confirmed: { label: "已确认", color: "bg-emerald-50 text-emerald-700" },
  expired: { label: "已过期", color: "bg-gray-100 text-gray-500" },
  cancelled: { label: "已放弃", color: "bg-red-50 text-red-600" },
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(deadline).getTime() - Date.now()
    return Math.max(0, diff)
  })

  const update = useCallback(() => {
    const diff = new Date(deadline).getTime() - Date.now()
    setRemaining(Math.max(0, diff))
  }, [deadline])

  useEffect(() => {
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [update])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return (
    <span className={`text-xs font-medium ${remaining > 0 ? "text-amber-600" : "text-red-500"}`}>
      {remaining > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : "已过期"}
    </span>
  )
}

export default function Waitlist() {
  const navigate = useNavigate()
  const waitlist = useStore((s) => s.waitlist)
  const instruments = useStore((s) => s.instruments)
  const currentUser = useStore((s) => s.currentUser)
  const cancelWaitlist = useStore((s) => s.cancelWaitlist)
  const confirmWaitlist = useStore((s) => s.confirmWaitlist)
  const declineWaitlist = useStore((s) => s.declineWaitlist)

  const [activeTab, setActiveTab] = useState<FilterTab>("waiting")

  const myWaitlist = waitlist.filter((w) => w.userId === currentUser.id)

  const filtered = myWaitlist.filter((w) => w.status === activeTab)

  const handleConfirm = (entry: typeof myWaitlist[0]) => {
    confirmWaitlist(entry.id)
    navigate(`/booking/${entry.instrumentId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">候补排队</h1>
        </div>
      </header>

      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#1A365D] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users className="h-12 w-12 mb-3 text-gray-300" />
          <p className="text-sm">暂无候补记录</p>
        </div>
      ) : (
        <div className="px-4 mt-3 flex flex-col gap-3">
          {filtered.map((entry) => {
            const instrument = instruments.find((i) => i.id === entry.instrumentId)
            const statusInfo = STATUS_CONFIG[entry.status]

            return (
              <div key={entry.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {instrument?.name ?? "未知仪器"}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTime(entry.desiredStartTime)} - {formatTime(entry.desiredEndTime)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="inline-flex items-center justify-center rounded-full bg-[#1A365D]/10 px-2.5 py-0.5 text-xs font-bold text-[#1A365D]">
                      第{entry.position}位
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {entry.status === "notified" && entry.confirmDeadline && (
                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-700">确认截止倒计时</span>
                      <CountdownTimer deadline={entry.confirmDeadline} />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  {entry.status === "waiting" && (
                    <button
                      onClick={() => cancelWaitlist(entry.id)}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 active:bg-gray-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      取消候补
                    </button>
                  )}
                  {entry.status === "notified" && (
                    <>
                      <button
                        onClick={() => handleConfirm(entry)}
                        className="flex items-center gap-1 rounded-lg bg-[#1A365D] px-3 py-1.5 text-sm font-medium text-white active:bg-[#122645]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        确认补位
                      </button>
                      <button
                        onClick={() => declineWaitlist(entry.id)}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 active:bg-gray-50"
                      >
                        放弃
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
