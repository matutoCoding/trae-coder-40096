import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, Shield, AlertCircle, CheckCircle, Calendar } from "lucide-react"
import { useStore } from "@/store"
import { formatMoney, formatDuration, formatTime } from "@/utils/time"
import { calculateBillSegments, calculateTotalAmount, getRateTypeLabel, getRateTypeBgColor } from "@/utils/billing"

function generateTimeOptions(): string[] {
  const options: string[] = []
  for (let h = 8; h <= 21; h++) {
    options.push(`${h.toString().padStart(2, "0")}:00`)
    options.push(`${h.toString().padStart(2, "0")}:30`)
  }
  options.push("22:00")
  return options
}

const TIME_OPTIONS = generateTimeOptions()

function getNext7Days(): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 8; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

export default function Booking() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const instruments = useStore((s) => s.instruments)
  const rateTables = useStore((s) => s.rateTables)
  const currentUser = useStore((s) => s.currentUser)
  const addBooking = useStore((s) => s.addBooking)

  const instrument = instruments.find((i) => i.id === id)
  const rateTable = rateTables.find((rt) => rt.instrumentId === id)

  const days = useMemo(() => getNext7Days(), [])
  const [selectedDate, setSelectedDate] = useState<Date>(days[0])
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const qualificationCheck = useMemo(() => {
    if (!instrument) return { passed: true, missing: [] }
    const userQualNames = currentUser.qualifications.map((q) => q.name)
    const missing = instrument.requiredQualification.filter(
      (req) => !userQualNames.includes(req)
    )
    return { passed: missing.length === 0, missing }
  }, [instrument, currentUser])

  const segments = useMemo(() => {
    if (!rateTable || !startTime || !endTime) return []
    const startHour = parseInt(startTime.split(":")[0]) + parseInt(startTime.split(":")[1]) / 60
    const endHour = parseInt(endTime.split(":")[0]) + parseInt(endTime.split(":")[1]) / 60
    if (startHour >= endHour) return []

    const startDate = new Date(selectedDate)
    startDate.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0)
    const endDate = new Date(selectedDate)
    endDate.setHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0)

    return calculateBillSegments(startDate, endDate, rateTable.rates)
  }, [rateTable, startTime, endTime, selectedDate])

  const totalAmount = useMemo(() => calculateTotalAmount(segments), [segments])

  const durationMinutes = useMemo(() => {
    if (!startTime || !endTime) return 0
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    return diff > 0 ? diff : 0
  }, [startTime, endTime])

  const isValid = qualificationCheck.passed && startTime && endTime && durationMinutes > 0

  const canSelectEndTime = (time: string): boolean => {
    if (!startTime) return true
    return time > startTime
  }

  const handleConfirm = () => {
    if (!instrument || !isValid) return

    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    const startDate = new Date(selectedDate)
    startDate.setHours(sh, sm, 0, 0)
    const endDate = new Date(selectedDate)
    endDate.setHours(eh, em, 0, 0)

    const booking = {
      id: `bk_${Date.now()}`,
      instrumentId: instrument.id,
      userId: currentUser.id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      status: "pending" as const,
      checkedIn: false,
      createdAt: new Date().toISOString(),
    }

    addBooking(booking)
    alert("预约成功！")
    navigate(-1)
  }

  if (!instrument) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">仪器不存在</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">确认预约</h1>
        </div>
      </header>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <img
              src={instrument.imageUrl}
              alt={instrument.name}
              className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
              <h2 className="text-base font-bold text-gray-900 truncate">
                {instrument.name}
              </h2>
              <p className="text-xs text-gray-400">{instrument.model}</p>
              <p className="text-xs text-gray-500">{instrument.location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#1A365D]" />
            <span className="text-sm font-bold text-gray-900">选择日期</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {days.map((day, idx) => {
              const isSelected = selectedDate.toDateString() === day.toDateString()
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`shrink-0 flex flex-col items-center rounded-xl px-3 py-2 text-center transition-colors ${
                    isSelected
                      ? "bg-[#1A365D] text-white"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <span className="text-xs">{idx === 0 ? "今天" : WEEKDAYS[day.getDay()]}</span>
                  <span className="text-sm font-bold mt-0.5">
                    {day.getMonth() + 1}/{day.getDate()}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">开始时间</label>
              <select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  if (endTime && e.target.value >= endTime) setEndTime("")
                }}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#1A365D] focus:ring-1 focus:ring-[#1A365D]/20"
              >
                <option value="">请选择</option>
                {TIME_OPTIONS.filter((t) => t !== "22:00").map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">结束时间</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#1A365D] focus:ring-1 focus:ring-[#1A365D]/20"
              >
                <option value="">请选择</option>
                {TIME_OPTIONS.filter((t) => canSelectEndTime(t)).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {durationMinutes > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>时长：{formatDuration(durationMinutes)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#1A365D]" />
            <span className="text-sm font-bold text-gray-900">资质验证</span>
          </div>
          {qualificationCheck.passed ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">资质验证通过</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">资质验证未通过</span>
              </div>
              <div className="mt-2 flex flex-col gap-1 pl-7">
                {qualificationCheck.missing.map((q) => (
                  <span key={q} className="text-xs text-red-400">缺少：{q}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#1A365D]" />
            <span className="text-sm font-bold text-gray-900">费用明细</span>
          </div>
          {segments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">--</p>
          ) : (
            <div>
              <div className="flex flex-col gap-2.5">
                {segments.map((seg, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${getRateTypeBgColor(seg.rateType)}`}>
                        {getRateTypeLabel(seg.rateType)}
                      </span>
                      <span className="text-gray-500 text-xs truncate">
                        {formatTime(seg.startTime)}-{formatTime(seg.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-gray-400 text-xs">{formatDuration(seg.durationMinutes)}</span>
                      <span className="font-medium text-gray-900">{formatMoney(seg.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">合计</span>
                <span className="text-lg font-bold text-[#1A365D]">{formatMoney(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          预约开始后15分钟未签到将自动释放时段，并通知候补用户补位
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className={`w-full rounded-xl py-3.5 text-base font-bold text-white transition-colors ${
            isValid
              ? "bg-[#1A365D] active:bg-[#122645]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          确认预约
        </button>
      </div>
    </div>
  )
}
