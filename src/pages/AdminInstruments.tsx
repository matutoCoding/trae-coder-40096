import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, Edit, Trash2, Save, Settings, DollarSign, Users } from "lucide-react"
import { useStore } from "@/store"
import { INSTRUMENT_CATEGORIES } from "@/types"
import type { Instrument } from "@/types"

const STATUS_OPTIONS = [
  { value: "available", label: "可预约" },
  { value: "in_use", label: "使用中" },
  { value: "maintenance", label: "维护中" },
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

const QUALIFICATION_OPTIONS = [
  "光谱分析仪操作证",
  "电镜操作证",
  "色谱仪操作证",
  "质谱操作证",
  "辐射安全培训证",
]

const EMPTY_FORM = {
  name: "",
  model: "",
  category: INSTRUMENT_CATEGORIES[0],
  location: "",
  status: "available" as Instrument["status"],
  description: "",
  requiredQualification: [] as string[],
}

export default function AdminInstruments() {
  const navigate = useNavigate()
  const instruments = useStore((s) => s.instruments)
  const addInstrument = useStore((s) => s.addInstrument)
  const updateInstrument = useStore((s) => s.updateInstrument)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const startAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const startEdit = (inst: Instrument) => {
    setEditingId(inst.id)
    setForm({
      name: inst.name,
      model: inst.model,
      category: inst.category,
      location: inst.location,
      status: inst.status,
      description: inst.description,
      requiredQualification: [...inst.requiredQualification],
    })
    setShowForm(true)
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const toggleQualification = (q: string) => {
    setForm((prev) => ({
      ...prev,
      requiredQualification: prev.requiredQualification.includes(q)
        ? prev.requiredQualification.filter((x) => x !== q)
        : [...prev.requiredQualification, q],
    }))
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.model.trim()) return

    if (editingId) {
      updateInstrument(editingId, {
        name: form.name,
        model: form.model,
        category: form.category,
        location: form.location,
        status: form.status,
        description: form.description,
        requiredQualification: form.requiredQualification,
      })
    } else {
      addInstrument({
        id: `inst_${Date.now()}`,
        name: form.name,
        model: form.model,
        category: form.category,
        location: form.location,
        status: form.status,
        imageUrl: "",
        description: form.description,
        requiredQualification: form.requiredQualification,
        rateTableId: `rt_${Date.now()}`,
      })
    }

    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <header className="sticky top-0 z-10 bg-white px-4 pb-3 pt-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">仪器管理</h1>
          </div>
          <button
            onClick={startAdd}
            className="flex items-center gap-1 rounded-full bg-[#1A365D] px-3 py-1.5 text-sm text-white"
          >
            <Plus className="h-4 w-4" />
            新增
          </button>
        </div>
      </header>

      {showForm && (
        <div className="px-4 pt-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-gray-900">
              {editingId ? "编辑仪器" : "新增仪器"}
            </h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1A365D] focus:outline-none"
                  placeholder="请输入仪器名称"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">型号</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1A365D] focus:outline-none"
                  placeholder="请输入仪器型号"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">类别</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1A365D] focus:outline-none"
                >
                  {INSTRUMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">位置</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1A365D] focus:outline-none"
                  placeholder="请输入仪器位置"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">状态</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Instrument["status"] })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1A365D] focus:outline-none"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1A365D] focus:outline-none"
                  rows={3}
                  placeholder="请输入仪器描述"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-600">所需资质</label>
                <div className="flex flex-col gap-2">
                  {QUALIFICATION_OPTIONS.map((q) => (
                    <label key={q} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.requiredQualification.includes(q)}
                        onChange={() => toggleQualification(q)}
                        className="h-4 w-4 rounded border-gray-300 text-[#1A365D] focus:ring-[#1A365D]"
                      />
                      {q}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSave}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#1A365D] py-2.5 text-sm font-medium text-white"
              >
                <Save className="h-4 w-4" />
                保存
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-600"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 px-4 pt-4">
        {instruments.length === 0 ? (
          <div className="flex h-60 items-center justify-center text-sm text-gray-400">
            暂无仪器
          </div>
        ) : (
          instruments.map((inst) => (
            <div key={inst.id} className="rounded-xl bg-white shadow-sm">
              <div
                className="flex cursor-pointer items-center gap-3 p-4"
                onClick={() => toggleExpand(inst.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-base font-bold text-gray-900">{inst.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[inst.status]}`}>
                      {STATUS_LABEL[inst.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{inst.model}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-[#1A365D]/10 px-2 py-0.5 text-xs text-[#1A365D]">{inst.category}</span>
                  </div>
                </div>
                <Edit
                  className="h-5 w-5 shrink-0 text-gray-400"
                  onClick={(e) => { e.stopPropagation(); startEdit(inst) }}
                />
              </div>

              {expandedId === inst.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <div className="flex flex-col gap-1 text-sm text-gray-600">
                    <p><span className="text-gray-400">位置：</span>{inst.location}</p>
                    <p><span className="text-gray-400">描述：</span>{inst.description || "无"}</p>
                    <p><span className="text-gray-400">所需资质：</span>
                      {inst.requiredQualification.length > 0
                        ? inst.requiredQualification.join("、")
                        : "无"}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => startEdit(inst)}
                      className="flex items-center gap-1 rounded-lg bg-[#1A365D] px-3 py-1.5 text-xs text-white"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      编辑
                    </button>
                    <button
                      onClick={() => navigate(`/billing/rates?instrumentId=${inst.id}`)}
                      className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-700"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      配置费率
                    </button>
                    <button
                      onClick={() => navigate(`/admin/waitlist?instrumentId=${inst.id}`)}
                      className="flex items-center gap-1 rounded-lg border border-[#1A365D] bg-white px-3 py-1.5 text-xs text-[#1A365D]"
                    >
                      <Users className="h-3.5 w-3.5" />
                      候补队列
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
