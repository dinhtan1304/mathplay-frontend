'use client'
import { useEffect, useState } from 'react'
import { dashboardApi } from '@/lib/api'
import type { DashboardStats, ChartData, Activity } from '@/types'
import { formatDateTime, DIFFICULTY_LABELS, TYPE_LABELS } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, FileText, BookOpen, Target,
  Hash, Clock, CheckCircle, Upload, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

function StatCard({ icon: Icon, label, value, sub, trend }: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; trend?: number
}) {
  return (
    <div className="stat-card animate-slide-up group hover:border-bg-border/80 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-accent/8 group-hover:bg-accent/12 transition-colors">
          <Icon size={18} className="text-accent" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
          }`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-text tracking-tight">{value}</div>
        <div className="text-sm text-text-muted font-medium">{label}</div>
        {sub && <div className="text-xs text-text-dim mt-1">{sub}</div>}
      </div>
    </div>
  )
}

function EmptyState({ message, hint, action }: {
  message: string; hint?: string; action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="w-10 h-10 rounded-xl bg-bg-hover flex items-center justify-center">
        <BookOpen size={18} className="text-text-dim" />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-text-muted">{message}</div>
        {hint && <div className="text-xs text-text-dim mt-0.5">{hint}</div>}
      </div>
      {action && (
        <Link href={action.href}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors">
          {action.label} <ArrowRight size={12} />
        </Link>
      )}
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

function CardSkeleton({ h = 'h-28' }: { h?: string }) {
  return <div className={`card ${h} skeleton`} />
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)

  useEffect(() => {
    // Load each section independently — one failure won't break the whole page
    dashboardApi.getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false))

    dashboardApi.getCharts()
      .then(setCharts)
      .catch(() => setCharts(null))
      .finally(() => setLoadingCharts(false))

    dashboardApi.getActivity()
      .then(setActivity)
      .catch(() => setActivity([]))
      .finally(() => setLoadingActivity(false))
  }, [])

  // Prepare chart data
  const dailyData = charts
    ? Object.entries(charts.daily_activity).slice(-30)
        .map(([day, count]) => ({ day: day.slice(5), count }))
    : []

  const diffData = charts
    ? Object.entries(charts.by_difficulty).map(([k, v]) => ({
        name: DIFFICULTY_LABELS[k] || k, value: v,
      }))
    : []

  const typeData = charts
    ? Object.entries(charts.by_type).map(([k, v]) => ({
        name: TYPE_LABELS[k] || k, value: v,
      }))
    : []

  const topicData = charts
    ? Object.entries(charts.by_topic).slice(0, 8)
        .map(([k, v]) => ({ topic: k.length > 14 ? k.slice(0, 14) + '…' : k, count: v }))
    : []

  const hasNoData = !loadingStats && stats?.total_questions === 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Dashboard</h1>
          <p className="text-text-dim text-sm mt-1">Tổng quan hoạt động</p>
        </div>
        {hasNoData && (
          <Link href="/upload" className="btn-primary flex items-center gap-2 text-sm">
            <Upload size={14} /> Upload đề thi đầu tiên
          </Link>
        )}
      </div>

      {/* Onboarding banner — hiện khi chưa có data */}
      {hasNoData && (
        <div className="card p-5 border-accent/30 bg-accent/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <Upload size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-text text-sm">Chào mừng đến với MathPlay!</div>
            <div className="text-text-muted text-xs mt-0.5">
              Tải lên đề thi PDF hoặc DOCX để bắt đầu xây dựng ngân hàng câu hỏi của bạn.
            </div>
          </div>
          <Link href="/upload" className="btn-primary text-sm py-1.5 whitespace-nowrap flex items-center gap-1.5">
            Bắt đầu <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={BookOpen} label="Tổng câu hỏi" value={stats?.total_questions ?? 0}
              sub={stats?.new_this_week ? `+${stats.new_this_week} tuần này` : 'Chưa có câu hỏi'}
              trend={stats?.growth_percent} />
            <StatCard icon={FileText} label="Đề thi đã tải" value={stats?.total_exams ?? 0}
              sub={`${stats?.completed_exams ?? 0} hoàn thành`} />
            <StatCard icon={Target} label="Chủ đề" value={stats?.topics_count ?? 0}
              sub="Đã phân loại" />
            <StatCard
              icon={Hash}
              label="Tỷ lệ hoàn thành"
              value={`${stats && stats.total_exams > 0
                ? Math.round((stats.completed_exams / stats.total_exams) * 100)
                : 0}%`}
              sub="Đề đã xử lý xong"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily activity */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text">Hoạt động 30 ngày qua</h3>
          </div>
          {loadingCharts ? (
            <div className="h-44 skeleton rounded-lg" />
          ) : dailyData.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu" hint="Upload đề thi để xem biểu đồ hoạt động"
              action={{ label: 'Upload ngay', href: '/upload' }} />
          ) : (
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
                <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" name="Câu hỏi" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By difficulty */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text">Theo độ khó</h3>
          </div>
          {loadingCharts ? (
            <div className="h-44 skeleton rounded-lg" />
          ) : diffData.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={diffData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                    dataKey="value" paddingAngle={3}>
                    {diffData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {diffData.map((d, i) => (
                  <div key={`${d.name}-${i}`} className="flex items-center gap-1.5 text-xs text-text-muted">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </>
          )}
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
          {loadingCharts ? (
            <div className="h-48 skeleton rounded-lg" />
          ) : topicData.length === 0 ? (
            <EmptyState message="Chưa có chủ đề nào" hint="Câu hỏi cần có trường chủ đề để hiện ở đây" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topicData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Câu hỏi" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By type */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text">Loại câu hỏi</h3>
          </div>
          {loadingCharts ? (
            <div className="h-48 skeleton rounded-lg" />
          ) : typeData.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} name="Câu hỏi" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="font-semibold text-text">Hoạt động gần đây</h3>
          <span className="text-xs text-text-dim">{loadingActivity ? '...' : `${activity.length} đề thi`}</span>
        </div>
        {loadingActivity ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 skeleton rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 skeleton rounded w-2/3" />
                  <div className="h-3 skeleton rounded w-1/3" />
                </div>
                <div className="w-16 h-5 skeleton rounded-full" />
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-sm text-text-muted">Chưa có hoạt động nào</div>
            <div className="text-xs text-text-dim mt-1 mb-4">Tải lên đề thi để bắt đầu</div>
            <Link href="/upload" className="btn-primary text-sm inline-flex items-center gap-1.5">
              <Upload size={13} /> Upload đề thi
            </Link>
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