import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin, Shield, Clock, Info, Calendar } from "lucide-react"
import { useStore } from "@/store"
import { formatTime, formatDate, formatMoney } from "@/utils/time"
import { getRateTypeLabel, getRateTypeBgColor } from "@/utils/billing"
import { calculateBillSegments, calculateTotalAmount } from "@/utils/billing"
import { getRateAtHour, getRateTypeColor } from "@/utils/billing"
import type { RateType } from "@/types"

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  available: { label: "可预约", color: "bg-emerald-50 text-emerald-700" },
  in_use: { label: "使用中", color: "bg-amber-50 text-amber-700" },
  maintenance: { label: "维护中", color: "bg-gray-100 text-gray-500" },
}

const RATE_BAR_COLOR: Record<RateType, string> = {
  peak: "bg-red-500",
  standard: "bg-amber-500",
  off_peak: "bg-emerald-500",
}

function generateTimeOptions(): string[] {
  const options: string[] = []
  for (let h = 8; h < 22; h++) {
    options.push(`${h.toString().padStart(2, "0")}:00`)
    options.push(`${h.toString().padStart(2, "0")}:30`)
  }
  options.push("22:00")
  return options
}

const TIME_OPTIONS = generateTimeOptions()

function parseTimeToDate(timeStr: string, base: Date): Date {
  const [h, m] = timeStr.split(":").map(Number)
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d
}

export default function InstrumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const instruments = useStore((s) => s.instruments)
  const rateTables = useStore((s) => s.rateTables)
  const bookings = useStore((s) => s.bookings)
  const currentUser = useStore((s) => s.currentUser)

  const instrument = instruments.find((i) => i.id === id)
  const rateTable = instrument
    ? rateTables.find((rt) => rt.id === instrument.rateTableId)
    : undefined

  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("10:00")

  const todayBookings = useMemo(() => {
    if (!instrument) return []
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`
    return bookings.filter(
      (b) =>
        b.instrumentId === instrument.id &&
        b.startTime.startsWith(todayStr) &&
        b.status !== "cancelled" &&
        b.status !== "timeout_released"
    )
  }, [bookings, instrument])

  const userQualificationNames = useMemo(
    () => currentUser.qualifications.map((q) => q.name),
    [currentUser.qualifications]
  )

  const missingQualifications = useMemo(() => {
    if (!instrument) return []
    return instrument.requiredQualification.filter(
      (rq) => !userQualificationNames.includes(rq)
    )
  }, [instrument, userQualificationNames])

  const hasAllQualifications = missingQualifications.length === 0

  const todayRates = useMemo(() => {
    if (!rateTable) return []
    const dayOfWeek = new Date().getDay()
    return rateTable.rates.filter((r) => r.dayOfWeek.includes(dayOfWeek))
  }, [rateTable])

  const timelineHours = useMemo(() => {
    const hours: { hour: number; status: "available" | "booked" | "mine" }[] = []
    for (let h = 8; h < 22; h++) {
      let status: "available" | "booked" | "mine" = "available"
      for (const b of todayBookings) {
        const start = new Date(b.startTime).getHours()
        const end = new Date(b.endTime).getHours()
        if (h >= start && h < end) {
          status = b.userId === currentUser.id ? "mine" : "booked"
          break
        }
      }
      hours.push({ hour: h, status })
    }
    return hours
  }, [todayBookings, currentUser.id])

  const costSegments = useMemo(() => {
    if (!rateTable || !startTime || !endTime) return []
    if (startTime >= endTime) return []
    const today = new Date()
    const start = parseTimeToDate(startTime, today)
    const end = parseTimeToDate(endTime, today)
    return calculateBillSegments(start, end, rateTable.rates)
  }, [rateTable, startTime, endTime])

  const totalCost = useMemo(() => calculateTotalAmount(costSegments), [costSegments])

  if (!instrument) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-400">
        仪器不存在
      </div>
    )
  }

  const canBook = hasAllQualifications && instrument.status !== "maintenance"
  const statusInfo = STATUS_BADGE[instrument.status]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="relative">
        {instrument.imageUrl ? (
          <img
            src={instrument.imageUrl}
            alt={instrument.name}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-gray-200">
            <Info className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900">{instrument.name}</h1>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{instrument.model}</p>
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{instrument.location}</span>
          </div>
          <span className="mt-2 inline-block rounded-full bg-[#1A365D]/10 px-2.5 py-0.5 text-xs font-medium text-[#1A365D]">
            {instrument.category}
          </span>
          {instrument.description && (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {instrument.description}
            </p>
          )}
        </div>
      </div>

      {instrument.requiredQualification.length > 0 && (
        <div className="px-4 mt-3">
          <div className="rounded-xl bg-white p-4 shadow">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-[#1A365D]" />
              <h2 className="text-base font-bold text-gray-900">操作资质要求</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {instrument.requiredQualification.map((q) => {
                const has = userQualificationNames.includes(q)
                return (
                  <span
                    key={q}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                      has
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {q}
                    {has ? " ✓" : " ✗"}
                  </span>
                )
              })}
            </div>
            {!hasAllQualifications && (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                您缺少必要操作资质，无法预约此仪器
              </div>
            )}
          </div>
        </div>
      )}

      {rateTable && todayRates.length > 0 && (
        <div className="px-4 mt-3">
          <div className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-base font-bold text-gray-900">时段费率</h2>
            <div className="flex flex-col gap-2">
              {todayRates.map((rate, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
                  <div className={`h-8 w-1.5 rounded-full ${RATE_BAR_COLOR[rate.rateType]}`} />
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">
                      {rate.startHour.toString().padStart(2, "0")}:00 - {rate.endHour.toString().padStart(2, "0")}:00
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRateTypeBgColor(rate.rateType)}`}>
                    {getRateTypeLabel(rate.rateType)}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatMoney(rate.pricePerHour)}/时
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-base font-bold text-gray-900">今日排期</h2>
          <div className="flex items-end gap-0.5">
            {timelineHours.map(({ hour, status }) => {
              const rate = rateTable ? getRateAtHour(rateTable.rates, new Date().getDay(), hour) : undefined
              const bgColor =
                status === "mine"
                  ? "bg-blue-500"
                  : status === "booked"
                  ? "bg-orange-400"
                  : rate
                  ? getRateTypeColor(rate.rateType)
                  : "bg-gray-200"
              return (
                <div key={hour} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`h-8 w-full rounded-sm ${bgColor} ${
                      status === "available" ? "opacity-30" : "opacity-90"
                    }`}
                  />
                  {hour % 2 === 0 && (
                    <span className="text-[10px] text-gray-400">{hour}</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-300 opacity-30" />
              可用
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-400" />
              已预约
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
              我的预约
            </span>
          </div>
          {todayBookings.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              {todayBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {formatTime(b.startTime)} - {formatTime(b.endTime)}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.userId === currentUser.id
                        ? "bg-blue-50 text-blue-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {b.userId === currentUser.id ? "我的预约" : "已被预约"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {rateTable && (
        <div className="px-4 mt-3">
          <div className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-base font-bold text-gray-900">费用预估</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">开始时间</label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A365D]/40 focus:ring-1 focus:ring-[#1A365D]/20"
                >
                  {TIME_OPTIONS.slice(0, -1).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <span className="mt-5 text-gray-400">—</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">结束时间</label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A365D]/40 focus:ring-1 focus:ring-[#1A365D]/20"
                >
                  {TIME_OPTIONS.filter((t) => t > startTime).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            {costSegments.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-col gap-1.5">
                  {costSegments.map((seg, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRateTypeBgColor(seg.rateType)}`}>
                          {getRateTypeLabel(seg.rateType)}
                        </span>
                        <span className="text-gray-500">
                          {formatTime(seg.startTime)}-{formatTime(seg.endTime)}
                        </span>
                      </div>
                      <span className="font-medium text-gray-700">
                        {formatMoney(seg.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="text-sm text-gray-500">预估总计</span>
                  <span className="text-lg font-bold text-[#1A365D]">
                    {formatMoney(totalCost)}
                  </span>
                </div>
              </div>
            )}
            {startTime >= endTime && (
              <p className="mt-2 text-xs text-red-500">结束时间须晚于开始时间</p>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/waitlist/register/${instrument.id}`)}
            className="flex-1 rounded-lg border border-[#1A365D] px-4 py-2.5 text-sm font-medium text-[#1A365D] active:bg-gray-50"
          >
            加入候补
          </button>
          <button
            disabled={!canBook}
            onClick={() => navigate(`/booking/${instrument.id}`)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white active:bg-[#1A365D]/90 ${
              canBook
                ? "bg-[#1A365D]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            立即预约
          </button>
        </div>
      </div>
    </div>
  )
}
