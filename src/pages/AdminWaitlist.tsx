import { useState, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Clock, Users, CalendarDays, CheckCircle2, XCircle, Clock8, Bell } from "lucide-react"
import { useStore } from "@/store"
import { formatTime, formatDateInput } from "@/utils/time"

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  waiting: { label: "等待中", color: "bg-blue-50 text-blue-700", Icon: Clock },
  notified: { label: "已通知", color: "bg-amber-50 text-amber-700", Icon: Bell },
  confirmed: { label: "已确认", color: "bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
  expired: { label: "已过期", color: "bg-gray-100 text-gray-500", Icon: Clock8 },
  cancelled: { label: "已放弃", color: "bg-red-50 text-red-600", Icon: XCircle },
}

function buildDateStrings(daysAhead = 14): string[] {
  const result: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    result.push(formatDateInput(d))
  }
  return result
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  const weekName = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()]
  const md = `${d.getMonth() + 1}月${d.getDate()}日`
  if (diff === 0) return `${md}（今天）`
  if (diff === 1) return `${md}（明天）`
  return `${md} ${weekName}`
}

function toDateKey(iso: string): string {
  return formatDateInput(new Date(iso))
}

interface SlotKey {
  date: string
  start: string
  end: string
  startIso: string
  endIso: string
}

function slotKey(k: SlotKey) {
  return `${k.date}|${k.start}|${k.end}`
}

export default function AdminWaitlist() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const instruments = useStore((s) => s.instruments)
  const waitlist = useStore((s) => s.waitlist)

  const preInstrumentId = searchParams.get("instrumentId") || ""
  const dateOptions = useMemo(() => buildDateStrings(14), [])

  const [selectedInstrumentId, setSelectedInstrumentId] = useState(
    preInstrumentId || (instruments.length > 0 ? instruments[0].id : "")
  )
  const [selectedDate, setSelectedDate] = useState(dateOptions[0])

  const instrumentSlots = useMemo(() => {
    const slots = new Map<string, SlotKey & { entries: typeof waitlist }>()

    waitlist
      .filter((w) => w.instrumentId === selectedInstrumentId)
      .forEach((w) => {
        const date = toDateKey(w.desiredStartTime)
        if (date !== selectedDate) return
        const start = formatTime(w.desiredStartTime)
        const end = formatTime(w.desiredEndTime)
        const key = `${date}|${start}|${end}`
        if (!slots.has(key)) {
          slots.set(key, {
            date,
            start,
            end,
            startIso: w.desiredStartTime,
            endIso: w.desiredEndTime,
            entries: [],
          })
        }
        slots.get(key)!.entries.push(w)
      })

    return Array.from(slots.values()).sort((a, b) =>
      a.start < b.start ? -1 : a.start > b.start ? 1 : a.end < b.end ? -1 : 1
    )
  }, [waitlist, selectedInstrumentId, selectedDate])

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">候补队列详情</h1>
            <p className="text-xs text-gray-500 truncate">管理员视角 · 按时段查看流转</p>
          </div>
        </div>
      </header>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">选择仪器</label>
          <select
            value={selectedInstrumentId}
            onChange={(e) => setSelectedInstrumentId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#1A365D] focus:ring-1 focus:ring-[#1A365D]/20"
          >
            {instruments.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} - {inst.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-[#1A365D]" />
            <span className="text-sm font-bold text-gray-900">选择日期</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {dateOptions.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  selectedDate === d
                    ? "bg-[#1A365D] text-white"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {getDateLabel(d)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-3">
        {instrumentSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm">该日期暂无候补队列</p>
          </div>
        ) : (
          instrumentSlots.map((slot) => {
            const active = slot.entries.filter(
              (e) => e.status === "waiting" || e.status === "notified"
            )
            const sorted = [...slot.entries].sort((a, b) => {
              if (a.status !== b.status) {
                const order = { notified: 0, waiting: 1, confirmed: 2, expired: 3, cancelled: 4 }
                return order[a.status] - order[b.status]
              }
              return a.position - b.position
            })

            return (
              <div key={slotKey(slot)} className="rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#1A365D]/5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#1A365D]" />
                    <span className="text-sm font-bold text-[#1A365D]">
                      {slot.start} - {slot.end}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-600 border border-gray-100">
                    <Users className="h-3 w-3" />
                    队列 {active.length} 人
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-gray-50">
                  {sorted.map((entry, idx) => {
                    const statusInfo = STATUS_CONFIG[entry.status]
                    const Icon = statusInfo.Icon
                    return (
                      <div key={entry.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                                {entry.status === "waiting" || entry.status === "notified"
                                  ? entry.position
                                  : "—"}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {entry.userId === "u001" ? "张明远" : `用户${entry.userId.slice(-3)}`}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-gray-400">
                              登记于{new Date(entry.createdAt || new Date().toISOString()).toLocaleString()}
                            </p>
                            {entry.status === "notified" && entry.confirmDeadline && (
                              <p className="mt-1 text-[11px] text-amber-600">
                                确认截止：{new Date(entry.confirmDeadline).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                          <span className={`inline-flex items-center gap-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo.color}`}>
                            <Icon className="h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
