import { useState, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search, Filter, MapPin, ArrowLeft } from "lucide-react"
import { useStore } from "@/store"
import { INSTRUMENT_CATEGORIES } from "@/types"

const STATUS_OPTIONS = [
  { value: "available", label: "可预约", activeClass: "bg-emerald-500 text-white" },
  { value: "in_use", label: "使用中", activeClass: "bg-amber-500 text-white" },
  { value: "maintenance", label: "维护中", activeClass: "bg-red-500 text-white" },
] as const

const STATUS_BADGE: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700",
  in_use: "bg-amber-50 text-amber-700",
  maintenance: "bg-red-50 text-red-700",
}

const STATUS_LABEL: Record<string, string> = {
  available: "可预约",
  in_use: "使用中",
  maintenance: "维护中",
}

export default function Instruments() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const instruments = useStore((s) => s.instruments)

  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") ?? "全部"
  )
  const [activeStatus, setActiveStatus] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return instruments.filter((inst) => {
      if (activeCategory !== "全部" && inst.category !== activeCategory) return false
      if (activeStatus && inst.status !== activeStatus) return false
      if (search) {
        const q = search.toLowerCase()
        return inst.name.toLowerCase().includes(q) || inst.model.toLowerCase().includes(q)
      }
      return true
    })
  }, [instruments, activeCategory, activeStatus, search])

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
          <h1 className="text-lg font-bold text-gray-900">仪器列表</h1>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索仪器名称或型号"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-gray-100 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:bg-gray-50 focus:ring-2 focus:ring-[#1A365D]/20"
          />
        </div>
      </header>

      <div className="overflow-x-auto px-4 pt-3">
        <div className="flex gap-2 pb-2" style={{ width: "max-content" }}>
          <button
            onClick={() => setActiveCategory("全部")}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === "全部"
                ? "bg-[#1A365D] text-white"
                : "bg-white text-gray-600 shadow-sm"
            }`}
          >
            全部
          </button>
          {INSTRUMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[#1A365D] text-white"
                  : "bg-white text-gray-600 shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pt-2 pb-1">
        <Filter className="h-4 w-4 text-gray-400" />
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveStatus(activeStatus === opt.value ? null : opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeStatus === opt.value
                ? opt.activeClass
                : "bg-white text-gray-500 shadow-sm"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4 pt-3">
        {filtered.length === 0 ? (
          <div className="flex h-60 items-center justify-center text-sm text-gray-400">
            暂无匹配仪器
          </div>
        ) : (
          filtered.map((inst) => (
            <div
              key={inst.id}
              onClick={() => navigate(`/instruments/${inst.id}`)}
              className="cursor-pointer rounded-xl bg-white p-4 shadow transition-shadow hover:shadow-md"
            >
              <div className="flex gap-3">
                <img
                  src={inst.imageUrl}
                  alt={inst.name}
                  className="h-20 w-20 flex-shrink-0 rounded-lg bg-gray-100 object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-base font-bold text-gray-900">
                      {inst.name}
                    </span>
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[inst.status]}`}
                    >
                      {STATUS_LABEL[inst.status]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{inst.model}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>{inst.location}</span>
                  </div>
                  <span className="w-fit rounded-full bg-[#1A365D]/10 px-2 py-0.5 text-xs text-[#1A365D]">
                    {inst.category}
                  </span>
                </div>
              </div>
              <div className="mt-2 border-t border-gray-50 pt-2 text-right text-xs text-[#1A365D] font-medium">
                查看详情 &gt;
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
