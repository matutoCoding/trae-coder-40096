import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { User, Calendar, Clock, FileText, Settings, Shield, Bell, ChevronRight, Award, Plus } from "lucide-react"
import { useStore } from "@/store"
import { formatDate, formatMoney } from "@/utils/time"

const ROLE_LABEL: Record<string, string> = {
  user: "普通用户",
  instrument_admin: "仪器管理员",
  system_admin: "系统管理员",
}

const LEVEL_COLOR: Record<string, string> = {
  初级: "bg-blue-50 text-blue-700",
  中级: "bg-emerald-50 text-emerald-700",
  高级: "bg-amber-50 text-amber-700",
}

export default function Profile() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const bookings = useStore((s) => s.bookings)
  const waitlist = useStore((s) => s.waitlist)
  const bills = useStore((s) => s.bills)

  const [showQualifications, setShowQualifications] = useState(false)

  const isAdmin = currentUser.role === "instrument_admin" || currentUser.role === "system_admin"

  const stats = useMemo(() => {
    const userBookings = bookings.filter((b) => b.userId === currentUser.id)
    const userWaitlist = waitlist.filter((w) => w.userId === currentUser.id)
    const userBills = bills.filter((b) => b.userId === currentUser.id)
    const totalAmount = userBills.reduce((sum, b) => sum + b.totalAmount, 0)
    return {
      bookingCount: userBookings.length,
      waitlistCount: userWaitlist.length,
      totalBills: totalAmount,
    }
  }, [bookings, waitlist, bills, currentUser.id])

  const menuItems = [
    { label: "我的预约", icon: Calendar, path: "/booking" },
    { label: "候补记录", icon: Clock, path: "/waitlist" },
    { label: "我的账单", icon: FileText, path: "/billing/bills" },
    ...(isAdmin
      ? [
          { label: "费率管理", icon: Settings, path: "/billing/rates" },
          { label: "仪器管理", icon: Shield, path: "/admin/instruments" },
        ]
      : []),
    { label: "通知中心", icon: Bell, path: "/notifications" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div
        className="px-4 pb-6 pt-10"
        style={{ background: "linear-gradient(180deg, #1A365D 0%, #2D4A7A 100%)" }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              currentUser.name.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{currentUser.name}</h1>
            <p className="mt-0.5 text-sm text-white/70">{currentUser.department}</p>
            <span className="mt-1 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs text-white">
              {ROLE_LABEL[currentUser.role] || currentUser.role}
            </span>
          </div>
        </div>
      </div>

      <div className="-mt-3 px-4">
        <div className="flex items-center justify-around rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-[#1A365D]">{stats.bookingCount}</span>
            <span className="mt-0.5 text-xs text-gray-500">预约次数</span>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-[#1A365D]">{stats.waitlistCount}</span>
            <span className="mt-0.5 text-xs text-gray-500">候补次数</span>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-[#1A365D]">{formatMoney(stats.totalBills)}</span>
            <span className="mt-0.5 text-xs text-gray-500">累计费用</span>
          </div>
        </div>
      </div>

      <div className="mt-4 px-4">
        <div className="rounded-xl bg-white shadow-sm">
          <button
            onClick={() => setShowQualifications(!showQualifications)}
            className="flex w-full items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-[#1A365D]" />
              <span className="text-sm font-medium text-gray-900">我的资质</span>
            </div>
            <ChevronRight
              className={`h-5 w-5 text-gray-400 transition-transform ${showQualifications ? "rotate-90" : ""}`}
            />
          </button>

          {showQualifications && (
            <div className="border-t border-gray-100 px-4 pb-4 pt-3">
              {currentUser.qualifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">暂无资质</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {currentUser.qualifications.map((q) => (
                    <div key={q.id} className="rounded-lg bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{q.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLOR[q.level] || "bg-gray-100 text-gray-600"}`}>
                          {q.level}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {q.instrumentCategories.map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full bg-[#1A365D]/10 px-2 py-0.5 text-xs text-[#1A365D]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1.5 text-xs text-gray-400">有效期至 {formatDate(q.expiresAt)}</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => alert("申请已提交")}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-[#1A365D] py-2.5 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                申请资质
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 px-4">
        <div className="rounded-xl bg-white shadow-sm">
          {menuItems.map((item, idx) => (
            <button
              key={item.path + item.label}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center justify-between px-4 py-3.5 ${
                idx !== menuItems.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-[#1A365D]" />
                <span className="text-sm text-gray-900">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
