import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, Save, BarChart3 } from "lucide-react"
import { useStore } from "@/store"
import { getRateTypeLabel, getRateTypeBgColor, calculateBillSegments, calculateTotalAmount } from "@/utils/billing"
import { formatTime, formatMoney, getDayName } from "@/utils/time"
import type { RateTier } from "@/types"

const TIMELINE_START = 8
const TIMELINE_END = 22

const RATE_COLORS: Record<string, string> = {
  peak: "#E53E3E",
  standard: "#ED8936",
  off_peak: "#48BB78",
}

function formatDayRange(days: number[]): string {
  if (days.length === 0) return ""
  const sorted = [...days].sort((a, b) => a - b)
  if (sorted.length === 1) return getDayName(sorted[0])
  let isRange = true
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      isRange = false
      break
    }
  }
  if (isRange) return `${getDayName(sorted[0])}-${getDayName(sorted[sorted.length - 1])}`
  return sorted.map(getDayName).join("、")
}

function generateTimeOptions(): string[] {
  const options: string[] = []
  for (let h = TIMELINE_START; h < TIMELINE_END; h++) {
    options.push(`${h.toString().padStart(2, "0")}:00`)
    options.push(`${h.toString().padStart(2, "0")}:30`)
  }
  options.push("22:00")
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export default function BillingRates() {
  const navigate = useNavigate()
  const instruments = useStore((s) => s.instruments)
  const rateTables = useStore((s) => s.rateTables)
  const updateRateTable = useStore((s) => s.updateRateTable)

  const [selectedInstrumentId, setSelectedInstrumentId] = useState(instruments[0]?.id ?? "")
  const rateTable = rateTables.find((rt) => rt.instrumentId === selectedInstrumentId)

  const [editedRates, setEditedRates] = useState<RateTier[]>([])

  useEffect(() => {
    const rt = rateTables.find((rt) => rt.instrumentId === selectedInstrumentId)
    setEditedRates(rt ? rt.rates.map((r) => ({ ...r })) : [])
  }, [selectedInstrumentId])

  const weekdayRates = useMemo(
    () => editedRates.filter((r) => r.dayOfWeek.includes(1)),
    [editedRates]
  )

  const [previewDay, setPreviewDay] = useState(1)
  const [previewStart, setPreviewStart] = useState("08:00")
  const [previewEnd, setPreviewEnd] = useState("14:00")

  const previewSegments = useMemo(() => {
    if (!rateTable) return []
    const [sh, sm] = previewStart.split(":").map(Number)
    const [eh, em] = previewEnd.split(":").map(Number)
    if (sh * 60 + sm >= eh * 60 + em) return []
    const base = new Date()
    const diff = previewDay - base.getDay()
    base.setDate(base.getDate() + diff)
    const start = new Date(base)
    start.setHours(sh, sm, 0, 0)
    const end = new Date(base)
    end.setHours(eh, em, 0, 0)
    return calculateBillSegments(start, end, editedRates)
  }, [rateTable, previewDay, previewStart, previewEnd, editedRates])

  const previewTotal = useMemo(() => calculateTotalAmount(previewSegments), [previewSegments])

  const handlePriceChange = (index: number, value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) return
    setEditedRates((prev) =>
      prev.map((r, i) => (i === index ? { ...r, pricePerHour: numValue } : r))
    )
  }

  const handleSave = () => {
    if (!rateTable) return
    updateRateTable(rateTable.id, editedRates)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-[#1A365D]">费率管理</h1>
      </div>

      <div className="px-4 mt-4">
        <select
          value={selectedInstrumentId}
          onChange={(e) => setSelectedInstrumentId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1A365D]/40 focus:ring-1 focus:ring-[#1A365D]/20"
        >
          {instruments.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </select>
      </div>

      {rateTable && (
        <>
          <div className="px-4 mt-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#1A365D]" />
                <span className="text-sm font-bold text-gray-900">工作日费率时段</span>
              </div>
              <div className="flex items-center gap-0.5 overflow-hidden rounded-lg h-8">
                {weekdayRates.map((rate, idx) => {
                  const widthPercent =
                    ((rate.endHour - rate.startHour) / (TIMELINE_END - TIMELINE_START)) * 100
                  return (
                    <div
                      key={idx}
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: RATE_COLORS[rate.rateType],
                      }}
                      className="h-full flex items-center justify-center"
                      title={`${getRateTypeLabel(rate.rateType)} ${rate.startHour}:00-${rate.endHour}:00`}
                    />
                  )
                })}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>22:00</span>
              </div>
              <div className="mt-2 flex gap-3">
                {(["peak", "standard", "off_peak"] as const).map((type) => (
                  <span key={type} className="flex items-center gap-1 text-xs text-gray-500">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: RATE_COLORS[type] }}
                    />
                    {getRateTypeLabel(type)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 mt-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-gray-900">费率档位</h2>
              <div className="flex flex-col gap-2">
                {editedRates.map((rate, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                    <div
                      className="h-8 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: RATE_COLORS[rate.rateType] }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500">{formatDayRange(rate.dayOfWeek)}</div>
                      <div className="text-sm text-gray-700">
                        {rate.startHour.toString().padStart(2, "0")}:00 -{" "}
                        {rate.endHour.toString().padStart(2, "0")}:00
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${getRateTypeBgColor(
                        rate.rateType
                      )}`}
                    >
                      {getRateTypeLabel(rate.rateType)}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        type="number"
                        value={rate.pricePerHour}
                        onChange={(e) => handlePriceChange(idx, e.target.value)}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm outline-none focus:border-[#1A365D]/40"
                        min={0}
                        step={10}
                      />
                      <span className="text-xs text-gray-400">/时</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 mt-4">
            <button
              onClick={handleSave}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A365D] py-3 text-sm font-medium text-white active:bg-[#1A365D]/90"
            >
              <Save className="h-4 w-4" />
              保存修改
            </button>
          </div>

          <div className="px-4 mt-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#1A365D]" />
                <span className="text-sm font-bold text-gray-900">跨档拆分预览</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={previewDay}
                  onChange={(e) => setPreviewDay(Number(e.target.value))}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A365D]/40"
                >
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <option key={d} value={d}>
                      {getDayName(d)}
                    </option>
                  ))}
                </select>
                <select
                  value={previewStart}
                  onChange={(e) => setPreviewStart(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A365D]/40"
                >
                  {TIME_OPTIONS.slice(0, -1).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className="text-gray-400">—</span>
                <select
                  value={previewEnd}
                  onChange={(e) => setPreviewEnd(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1A365D]/40"
                >
                  {TIME_OPTIONS.filter((t) => t > previewStart).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {previewSegments.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-col gap-1.5">
                    {previewSegments.map((seg, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getRateTypeBgColor(
                              seg.rateType
                            )}`}
                          >
                            {getRateTypeLabel(seg.rateType)}
                          </span>
                          <span className="text-gray-500">
                            {formatTime(seg.startTime)}-{formatTime(seg.endTime)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-700">{formatMoney(seg.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                    <span className="text-sm text-gray-500">预估总计</span>
                    <span className="text-lg font-bold text-[#1A365D]">{formatMoney(previewTotal)}</span>
                  </div>
                </div>
              )}

              {previewStart >= previewEnd && (
                <p className="mt-2 text-xs text-red-500">结束时间须晚于开始时间</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
