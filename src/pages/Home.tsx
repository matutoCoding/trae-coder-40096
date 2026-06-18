import { useStore } from "@/store"
import { useNavigate } from "react-router-dom"
import { Search, Bell, ChevronRight, Zap, Clock, Star, MapPin } from "lucide-react"
import { INSTRUMENT_CATEGORIES } from "@/types"

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  available: { label: "可用", color: "bg-green-100 text-green-700" },
  in_use: { label: "使用中", color: "bg-amber-100 text-amber-700" },
  maintenance: { label: "维护中", color: "bg-gray-100 text-gray-500" },
}

export default function Home() {
  const navigate = useNavigate()
  const instruments = useStore((s) => s.instruments)
  const notifications = useStore((s) => s.notifications)
  const bookings = useStore((s) => s.bookings)
  const waitlist = useStore((s) => s.waitlist)
  const bills = useStore((s) => s.bills)

  const unreadCount = notifications.filter((n) => !n.read).length
  const unpaidBills = bills.filter((b) => b.status === "unpaid").length
  const hotInstruments = instruments.slice(0, 3)
  const recentNotifications = notifications.slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div
        className="px-4 pt-12 pb-6"
        style={{ background: "linear-gradient(180deg, #1A365D 0%, #2D4A7A 100%)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">你好，张明远</h1>
            <p className="text-blue-200 text-sm mt-0.5">探索科研仪器资源</p>
          </div>
          <button
            className="relative p-2"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索仪器名称..."
            className="w-full rounded-full bg-white pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      <div className="-mt-3 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {INSTRUMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => navigate(`/instruments?category=${encodeURIComponent(cat)}`)}
              className="shrink-0 rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-700 active:bg-gray-50"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">热门仪器</h2>
          <button
            onClick={() => navigate("/instruments")}
            className="flex items-center text-sm text-blue-600"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {hotInstruments.map((inst) => {
            const status = STATUS_MAP[inst.status]
            return (
              <button
                key={inst.id}
                onClick={() => navigate(`/instruments/${inst.id}`)}
                className="shrink-0 w-48 rounded-xl bg-white shadow overflow-hidden text-left"
              >
                <div className="h-32 bg-gray-100">
                  <img
                    src={inst.imageUrl}
                    alt={inst.name}
                    className="h-32 w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 text-sm truncate">
                    {inst.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{inst.model}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500 truncate">
                      {inst.location}
                    </span>
                  </div>
                  <span
                    className={`inline-block mt-2 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="px-4 mt-5">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate("/booking")}
            className="rounded-lg bg-white shadow p-3 flex flex-col items-center gap-1"
          >
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">{bookings.length}</span>
            <span className="text-xs text-gray-500">我的预约</span>
          </button>
          <button
            onClick={() => navigate("/waitlist")}
            className="rounded-lg bg-white shadow p-3 flex flex-col items-center gap-1"
          >
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-xl font-bold text-gray-900">{waitlist.length}</span>
            <span className="text-xs text-gray-500">候补排队</span>
          </button>
          <button
            onClick={() => navigate("/billing/bills")}
            className="rounded-lg bg-white shadow p-3 flex flex-col items-center gap-1"
          >
            <Star className="w-5 h-5 text-red-500" />
            <span className="text-xl font-bold text-gray-900">{unpaidBills}</span>
            <span className="text-xs text-gray-500">待付账单</span>
          </button>
        </div>
      </section>

      <section className="px-4 mt-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">最新通知</h2>
        <div className="flex flex-col gap-2">
          {recentNotifications.map((ntf) => (
            <div
              key={ntf.id}
              className="flex items-start gap-3 rounded-lg bg-white shadow p-3"
            >
              <div className="mt-0.5 rounded-full bg-blue-100 p-1.5">
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {ntf.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {ntf.message}
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {new Date(ntf.createdAt).toLocaleDateString("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
