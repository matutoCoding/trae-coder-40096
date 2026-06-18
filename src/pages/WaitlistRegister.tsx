import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, Users } from "lucide-react"
import { useStore } from "@/store"
import { formatTime } from "@/utils/time"

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

export default function WaitlistRegister() {
  const { instrumentId } = useParams<{ instrumentId: string }>()
  const navigate = useNavigate()
  const instruments = useStore((s) => s.instruments)
  const waitlist = useStore((s) => s.waitlist)
  const currentUser = useStore((s) => s.currentUser)
  const addWaitlistEntry = useStore((s) => s.addWaitlistEntry)

  const instrument = instruments.find((i) => i.id === instrumentId)

  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const waitingCount = useMemo(() => {
    if (!instrumentId) return 0
    return waitlist.filter(
      (w) => w.instrumentId === instrumentId && w.status === "waiting"
    ).length
  }, [waitlist, instrumentId])

  const isValid = startTime && endTime && startTime < endTime

  if (!instrument) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-400">
        仪器不存在
      </div>
    )
  }

  const handleSubmit = () => {
    if (!instrumentId || !isValid) return

    const today = new Date()
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    const startDate = new Date(today)
    startDate.setHours(sh, sm, 0, 0)
    const endDate = new Date(today)
    endDate.setHours(eh, em, 0, 0)

    const entry = {
      id: `wl_${Date.now()}`,
      instrumentId,
      userId: currentUser.id,
      desiredStartTime: startDate.toISOString(),
      desiredEndTime: endDate.toISOString(),
      position: waitingCount + 1,
      status: "waiting" as const,
    }

    addWaitlistEntry(entry)
    alert("候补登记成功！")
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">候补登记</h1>
        </div>
      </header>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900">{instrument.name}</h2>
          <p className="mt-1 text-sm text-gray-500">{instrument.model}</p>
          <p className="mt-0.5 text-sm text-gray-500">{instrument.location}</p>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#1A365D]" />
            <span className="text-sm font-bold text-gray-900">选择期望时段</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
                {TIME_OPTIONS.filter((t) => startTime ? t > startTime : true).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1A365D]" />
            <span className="text-sm font-bold text-gray-900">当前排队人数</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1A365D]">{waitingCount}<span className="text-sm font-normal text-gray-500 ml-1">人</span></p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full rounded-xl py-3.5 text-base font-bold text-white transition-colors ${
            isValid
              ? "bg-[#1A365D] active:bg-[#122645]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          提交候补
        </button>
      </div>
    </div>
  )
}
