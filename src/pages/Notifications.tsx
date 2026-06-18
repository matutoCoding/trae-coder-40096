import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, Calendar, AlertTriangle, FileText, Bell, CheckCircle2, XCircle, Clock8 } from "lucide-react"
import { useStore } from "@/store"
import { getRelativeTime } from "@/utils/time"
import { RATE_TYPE_LABELS } from "@/types"
import type { WaitlistEntry } from "@/types"

type FilterTab = "all" | "unread"

const TYPE_ICON: Record<string, typeof Clock> = {
  waitlist_confirm: Clock,
  booking_reminder: Calendar,
  timeout_release: AlertTriangle,
  bill_generated: FileText,
}

function getDateGroup(isoString: string): string {
  const now = new Date()
  const target = new Date(isoString)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diffDays = Math.floor((today.getTime() - targetDay.getTime()) / 86400000)
  if (diffDays === 0) return "今天"
  if (diffDays === 1) return "昨天"
  return "更早"
}

export default function Notifications() {
  const navigate = useNavigate()
  const notifications = useStore((s) => s.notifications)
  const waitlist = useStore((s) => s.waitlist)
  const markNotificationRead = useStore((s) => s.markNotificationRead)
  const confirmWaitlist = useStore((s) => s.confirmWaitlist)
  const declineWaitlist = useStore((s) => s.declineWaitlist)

  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  const getWaitlistStatus = (waitlistEntryId?: string): WaitlistEntry["status"] | null => {
    if (!waitlistEntryId) return null
    return waitlist.find((w) => w.id === waitlistEntryId)?.status ?? null
  }

  const getWaitlistStatusDisplay = (status: WaitlistEntry["status"] | null) => {
    if (!status) return null
    switch (status) {
      case "confirmed":
        return { label: "已确认", Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" }
      case "expired":
        return { label: "已过期", Icon: Clock8, color: "text-gray-500", bg: "bg-gray-50" }
      case "cancelled":
        return { label: "已放弃", Icon: XCircle, color: "text-red-500", bg: "bg-red-50" }
      default:
        return null
    }
  }

  const filtered = useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    if (activeTab === "unread") return sorted.filter((n) => !n.read)
    return sorted
  }, [notifications, activeTab])

  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof filtered }[] = []
    const map = new Map<string, typeof filtered>()
    for (const n of filtered) {
      const group = getDateGroup(n.createdAt)
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(n)
    }
    const order = ["今天", "昨天", "更早"]
    for (const label of order) {
      const items = map.get(label)
      if (items && items.length > 0) groups.push({ label, items })
    }
    return groups
  }, [filtered])

  const handleClick = (id: string) => {
    markNotificationRead(id)
  }

  const handleConfirm = (waitlistEntryId: string, notificationId: string) => {
    confirmWaitlist(waitlistEntryId)
    markNotificationRead(notificationId)
  }

  const handleDecline = (waitlistEntryId: string, notificationId: string) => {
    declineWaitlist(waitlistEntryId)
    markNotificationRead(notificationId)
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
          <h1 className="text-lg font-bold text-gray-900">通知中心</h1>
        </div>
      </header>

      <div className="px-4 mt-3">
        <div className="flex gap-2">
          {(["all", "unread"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#1A365D] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab === "all" ? "全部" : "未读"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Bell className="h-12 w-12 mb-3 text-gray-300" />
          <p className="text-sm">暂无通知</p>
        </div>
      ) : (
        <div className="px-4 mt-3 flex flex-col gap-4">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-gray-400 mb-2">{group.label}</p>
              <div className="flex flex-col gap-2">
                {group.items.map((n) => {
                  const Icon = TYPE_ICON[n.type] || Bell
                  const wlStatus = getWaitlistStatus(n.waitlistEntryId)
                  const wlDisplay = getWaitlistStatusDisplay(wlStatus)
                  const isHandled = !!wlDisplay
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n.id)}
                      className={`rounded-xl bg-white p-4 shadow-sm cursor-pointer active:bg-gray-50 ${isHandled ? "opacity-75" : ""}`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          n.type === "waitlist_confirm"
                            ? "bg-amber-50"
                            : n.type === "booking_reminder"
                            ? "bg-blue-50"
                            : n.type === "timeout_release"
                            ? "bg-red-50"
                            : "bg-gray-50"
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            n.type === "waitlist_confirm"
                              ? "text-amber-600"
                              : n.type === "booking_reminder"
                              ? "text-blue-600"
                              : n.type === "timeout_release"
                              ? "text-red-500"
                              : "text-gray-500"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-gray-900">{n.title}</h3>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {wlDisplay && (
                                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${wlDisplay.bg} ${wlDisplay.color}`}>
                                  <wlDisplay.Icon className="h-3 w-3" />
                                  {wlDisplay.label}
                                </span>
                              )}
                              {!n.read && (
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                              <span className="text-xs text-gray-400">{getRelativeTime(n.createdAt)}</span>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 leading-relaxed">{n.message}</p>
                          {n.type === "waitlist_confirm" && n.waitlistEntryId && !isHandled && (
                            <div className="mt-2.5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleConfirm(n.waitlistEntryId!, n.id)}
                                className="rounded-lg bg-[#1A365D] px-3 py-1.5 text-xs font-medium text-white active:bg-[#122645]"
                              >
                                确认补位
                              </button>
                              <button
                                onClick={() => handleDecline(n.waitlistEntryId!, n.id)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 active:bg-gray-50"
                              >
                                放弃
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
