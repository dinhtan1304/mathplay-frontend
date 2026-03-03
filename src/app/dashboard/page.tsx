'use client'
import { useEffect, useState } from 'react'
import { dashboardApi, getErrorMessage } from '@/lib/api'
import type { DashboardStats, ChartData, Activity } from '@/types'
import { formatDateTime, DIFFICULTY_LABELS, TYPE_LABELS } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, FileText, BookOpen, Target, Hash, Clock, CheckCircle } from 'lucide-react'

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

function StatCard({ icon: Icon, label, value, sub, trend }: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; trend?: number
}) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-lg bg-accent/10">
          <Icon size={18} className="text-accent" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-text">{value}</div>
        <div className="text-sm text-text-muted">{label}</div>
        {sub && <div className="text-xs text-text-dim mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function ActivityRow({ item }: { item: Activity }) {
  const statusMap: Record<string, { label: string; cls: string }> = {
    completed: { label: 'Hoàn thành', cls: 'text-green-400 bg-green-400/10' },
    processing: { label: 'Đang xử lý', cls: 'text-yellow-400 bg-yellow-400/10' },
    failed: { label: 'Lỗi', cls: 'text-red-400 bg-red-400/10' },
    pending: { label: 'Chờ', cls: 'text-text-dim bg-bg-hover' },
  }
  const s = statusMap[item.status] || statusMap.pending
  return (
    <div className="table-row px-4 py-3 items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
        <FileText size={14} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text truncate">{item.filename}</div>
        <div className="text-xs text-text-dim">{formatDateTime(item.created_at)}</div>
      </div>
      <div className="flex items-center gap-3 text-right flex-shrink-0">
        <span className="text-xs text-text-muted">{item.question_count} câu</span>
        <span className={`badge ${s.cls}`}>{s.label}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getCharts(),
      dashboardApi.getActivity(),
    ])
      .then(([s, c, a]) => { setStats(s); setCharts(c); setActivity(a) })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-28 skeleton" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card h-60 skeleton" />
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="p-6">
      <div className="card p-6 text-center text-red-400">{error}</div>
    </div>
  )

  // Prepare chart data
  const dailyData = charts ? Object.entries(charts.daily_activity)
    .slice(-30)
    .map(([day, count]) => ({ day: day.slice(5), count })) : []

  const diffData = charts ? Object.entries(charts.by_difficulty).map(([k, v]) => ({
    name: DIFFICULTY_LABELS[k] || k, value: v
  })) : []

  const typeData = charts ? Object.entries(charts.by_type).map(([k, v]) => ({
    name: TYPE_LABELS[k] || k, value: v
  })) : []

  const topicData = charts ? Object.entries(charts.by_topic)
    .slice(0, 8)
    .map(([k, v]) => ({ topic: k.length > 12 ? k.slice(0, 12) + '…' : k, count: v })) : []

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Tổng quan hoạt động của bạn</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Tổng câu hỏi" value={stats?.total_questions ?? 0}
          sub={`+${stats?.new_this_week ?? 0} tuần này`} trend={stats?.growth_percent} />
        <StatCard icon={FileText} label="Đề thi đã tải" value={stats?.total_exams ?? 0}
          sub={`${stats?.completed_exams ?? 0} hoàn thành`} />
        <StatCard icon={Target} label="Chủ đề" value={stats?.topics_count ?? 0}
          sub="Đã phân loại" />
        <StatCard icon={Hash} label="Tỷ lệ hoàn thành" value={`${stats ? Math.round((stats.completed_exams / Math.max(stats.total_exams, 1)) * 100) : 0}%`}
          sub="Đề đã xử lý xong" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily activity - wide */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text">Hoạt động 30 ngày qua</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" name="Câu hỏi" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By difficulty - pie */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text">Theo độ khó</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={diffData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" paddingAngle={3}>
                {diffData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {diffData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-text-muted">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By topic */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text">Top chủ đề</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topicData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Câu hỏi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By type */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text">Loại câu hỏi</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} name="Câu hỏi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="font-semibold text-text">Hoạt động gần đây</h3>
          <span className="text-xs text-text-dim">{activity.length} đề thi</span>
        </div>
        {activity.length === 0 ? (
          <div className="p-8 text-center text-text-dim text-sm">
            Chưa có hoạt động nào. Hãy tải lên đề thi đầu tiên!
          </div>
        ) : (
          <div>
            {activity.map(item => <ActivityRow key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  )
}
