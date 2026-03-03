'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  classesApi, assignmentsApi, analyticsApi, getErrorMessage,
} from '@/lib/api'
import type {
  ClassRoom, ClassMember, Assignment, ClassAnalytics,
  AssignmentAnalytics, LeaderboardEntry,
} from '@/types'
import {
  formatDate, formatDateTime, formatDuration, getScoreColor, cn, getLevelTitle,
} from '@/lib/utils'
import {
  Users, ClipboardList, BarChart3, Trophy, Plus, X, Loader2,
  ChevronLeft, Copy, Check, Star, Flame, TrendingDown, AlertCircle,
  UserCheck,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell, PieChart, Pie,
} from 'recharts'

type Tab = 'members' | 'assignments' | 'analytics' | 'leaderboard'

// ─── Create Assignment Modal ──────────────────────────────────
function CreateAssignmentModal({ classId, onCreated, onClose }: {
  classId: number; onCreated: (a: Assignment) => void; onClose: () => void
}) {
  const [form, setForm] = useState({ title: '', description: '', due_date: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!form.title.trim()) { setError('Tiêu đề không được trống'); return }
    setSaving(true)
    try {
      const a = await assignmentsApi.create({
        class_id: classId,
        title: form.title,
        description: form.description || undefined,
        due_date: form.due_date || undefined,
      })
      onCreated(a)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="font-semibold text-text">Tạo bài tập mới</h3>
          <button onClick={onClose}><X size={18} className="text-text-dim" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Tiêu đề *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="VD: Bài kiểm tra chương 1" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none h-20" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Hạn nộp</label>
            <input type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input" />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>
        <div className="px-5 py-4 border-t border-bg-border flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost">Hủy</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Tạo bài tập
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Analytics Tab ────────────────────────────────────────────
function AnalyticsTab({ classId }: { classId: number }) {
  const [data, setData] = useState<ClassAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null)
  const [assignAnalytics, setAssignAnalytics] = useState<AssignmentAnalytics | null>(null)
  const [loadingAssign, setLoadingAssign] = useState(false)

  useEffect(() => {
    analyticsApi.getClass(classId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [classId])

  const loadAssignmentAnalytics = async (assignId: number) => {
    setSelectedAssignment(assignId)
    setLoadingAssign(true)
    try {
      const d = await analyticsApi.getAssignment(assignId)
      setAssignAnalytics(d)
    } finally {
      setLoadingAssign(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-text-dim"><Loader2 className="animate-spin mx-auto" /></div>
  if (!data) return null

  const topicChartData = data.topic_breakdown.map(t => ({ name: t.topic, score: t.avg_score }))
  const scoreDistData = assignAnalytics
    ? Object.entries(assignAnalytics.score_distribution).map(([k, v]) => ({ range: k, count: v }))
    : []

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Học sinh', value: data.total_students, icon: Users },
          { label: 'Đang hoạt động', value: `${data.active_last_7d} / 7 ngày`, icon: UserCheck },
          { label: 'Điểm TB', value: data.avg_class_score ? `${data.avg_class_score}` : '—', icon: Star },
          { label: 'Hoàn thành', value: data.completion_rate ? `${data.completion_rate}%` : '—', icon: Check },
        ].map(item => (
          <div key={item.label} className="card p-4">
            <div className="p-2 rounded-lg bg-accent/10 w-fit mb-2">
              <item.icon size={16} className="text-accent" />
            </div>
            <div className="text-xl font-bold text-text">{item.value}</div>
            <div className="text-xs text-text-muted">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Topic breakdown */}
      {topicChartData.length > 0 && (
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingDown size={15} className="text-red-400" />
            Chủ đề học sinh yếu (điểm trung bình thấp nhất)
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topicChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: '#13161e', border: '1px solid #1e2230', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Điểm TB">
                {topicChartData.map((d, i) => (
                  <Cell key={i} fill={d.score < 50 ? '#ef4444' : d.score < 70 ? '#f59e0b' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Student table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-bg-border">
          <h4 className="text-sm font-semibold text-text">Hiệu suất học sinh</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-xs text-text-dim">
                <th className="px-4 py-2.5 text-left">Học sinh</th>
                <th className="px-4 py-2.5 text-center">Bài nộp</th>
                <th className="px-4 py-2.5 text-center">Điểm TB</th>
                <th className="px-4 py-2.5 text-center">XP</th>
                <th className="px-4 py-2.5 text-center">Streak</th>
                <th className="px-4 py-2.5 text-center">Hoạt động</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map(s => (
                <tr key={s.student_id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text">{s.student_name}</div>
                    <div className="text-xs text-text-dim">{getLevelTitle(s.level)} Lv.{s.level}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-text-muted">{s.total_submissions}</td>
                  <td className={`px-4 py-3 text-center font-semibold ${getScoreColor(s.avg_score)}`}>
                    {s.avg_score ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-yellow-400">{s.total_xp.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-orange-400">
                      <Flame size={12} />{s.streak_days}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-text-dim">
                    {s.last_active ? formatDate(s.last_active) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Leaderboard Tab ─────────────────────────────────────────
function LeaderboardTab({ classId }: { classId: number }) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    classesApi.getLeaderboard(classId).then(setBoard).finally(() => setLoading(false))
  }, [classId])

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>

  const medalColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-bg-border flex items-center gap-2">
        <Trophy size={15} className="text-yellow-400" />
        <h4 className="text-sm font-semibold text-text">Bảng xếp hạng lớp</h4>
      </div>
      {board.length === 0 ? (
        <div className="py-12 text-center text-text-dim text-sm">Chưa có dữ liệu xếp hạng</div>
      ) : (
        <div>
          {board.map((entry, idx) => (
            <div key={entry.student_id} className="table-row px-5 py-3.5 flex items-center gap-4">
              <div className={`w-7 text-center font-bold text-lg ${medalColors[idx] || 'text-text-dim'}`}>
                {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : entry.rank}
              </div>
              <div className="flex-1">
                <div className="font-medium text-text">{entry.student_name}</div>
                <div className="text-xs text-text-dim">{getLevelTitle(entry.level)} · Lv.{entry.level}</div>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 font-bold">{entry.total_xp.toLocaleString()} XP</div>
                <div className="text-xs text-orange-400 flex items-center justify-end gap-0.5">
                  <Flame size={10} />{entry.streak_days} ngày
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const classId = Number(id)

  const [cls, setCls] = useState<ClassRoom | null>(null)
  const [members, setMembers] = useState<ClassMember[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [tab, setTab] = useState<Tab>('members')
  const [loading, setLoading] = useState(true)
  const [showCreateAssign, setShowCreateAssign] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([
      classesApi.get(classId),
      classesApi.getMembers(classId),
      assignmentsApi.list(classId),
    ]).then(([c, m, a]) => {
      setCls(c); setMembers(m); setAssignments(a)
    }).finally(() => setLoading(false))
  }, [classId])

  const copyCode = () => {
    if (!cls) return
    navigator.clipboard.writeText(cls.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="h-24 skeleton card rounded-xl" />
      <div className="h-96 skeleton card rounded-xl" />
    </div>
  )

  if (!cls) return <div className="p-6 text-red-400">Không tìm thấy lớp học</div>

  const TABS = [
    { id: 'members' as Tab, label: 'Học sinh', icon: Users, count: members.length },
    { id: 'assignments' as Tab, label: 'Bài tập', icon: ClipboardList, count: assignments.length },
    { id: 'analytics' as Tab, label: 'Phân tích', icon: BarChart3 },
    { id: 'leaderboard' as Tab, label: 'Bảng xếp hạng', icon: Trophy },
  ]

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {showCreateAssign && (
        <CreateAssignmentModal
          classId={classId}
          onCreated={a => { setAssignments(prev => [a, ...prev]); setShowCreateAssign(false) }}
          onClose={() => setShowCreateAssign(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/classes" className="w-8 h-8 rounded-lg bg-bg-hover hover:bg-bg-border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors">
          <ChevronLeft size={16} className="text-text-muted" />
        </Link>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-text">{cls.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {cls.subject && <span className="text-sm text-text-muted">{cls.subject}</span>}
                {cls.grade && <span className="badge bg-bg-hover text-text-muted">Lớp {cls.grade}</span>}
                <div className="flex items-center gap-1">
                  <span className="font-mono text-sm bg-bg-hover px-2.5 py-1 rounded-lg text-accent tracking-wider">{cls.code}</span>
                  <button onClick={copyCode} className="w-7 h-7 rounded-lg bg-bg-hover hover:bg-bg-border flex items-center justify-center transition-colors">
                    {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} className="text-text-muted" />}
                  </button>
                </div>
              </div>
            </div>
            {tab === 'assignments' && (
              <button onClick={() => setShowCreateAssign(true)} className="btn-primary flex items-center gap-1.5 text-sm">
                <Plus size={14} /> Tạo bài tập
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-hover p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id ? 'bg-bg-card text-text shadow-sm' : 'text-text-muted hover:text-text'
            )}
          >
            <t.icon size={14} />
            {t.label}
            {t.count !== undefined && (
              <span className={cn('badge text-[10px]', tab === t.id ? 'bg-accent/20 text-accent' : 'bg-bg-border text-text-dim')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'members' && (
        <div className="card overflow-hidden">
          {members.length === 0 ? (
            <div className="py-12 text-center">
              <Users size={32} className="text-text-dim mx-auto mb-3" />
              <div className="text-text-muted text-sm">Chưa có học sinh nào</div>
              <div className="text-text-dim text-xs mt-1">Chia sẻ mã lớp <span className="text-accent font-mono">{cls.code}</span> cho học sinh</div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-xs text-text-dim">
                  <th className="px-4 py-3 text-left">Học sinh</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="table-row">
                    <td className="px-4 py-3 font-medium text-text">{m.student_name}</td>
                    <td className="px-4 py-3 text-text-muted">{m.student_email}</td>
                    <td className="px-4 py-3 text-text-dim">{formatDate(m.joined_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'assignments' && (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <div className="card py-12 text-center">
              <ClipboardList size={32} className="text-text-dim mx-auto mb-3" />
              <div className="text-text-muted text-sm">Chưa có bài tập nào</div>
              <button onClick={() => setShowCreateAssign(true)} className="btn-primary mt-4 flex items-center gap-1.5 mx-auto">
                <Plus size={14} /> Tạo bài tập đầu tiên
              </button>
            </div>
          ) : assignments.map(a => (
            <div key={a.id} className="card p-4 flex items-center gap-4">
              <div className={cn('w-2 h-2 rounded-full flex-shrink-0', a.is_active ? 'bg-green-400' : 'bg-text-dim')} />
              <div className="flex-1">
                <div className="font-medium text-text">{a.title}</div>
                {a.description && <div className="text-sm text-text-muted mt-0.5 line-clamp-1">{a.description}</div>}
                <div className="text-xs text-text-dim mt-1">
                  Tạo: {formatDateTime(a.created_at)}
                  {a.due_date && ` · Hạn nộp: ${formatDateTime(a.due_date)}`}
                </div>
              </div>
              <span className={cn('badge', a.is_active ? 'bg-green-400/10 text-green-400' : 'bg-bg-hover text-text-dim')}>
                {a.is_active ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'analytics' && <AnalyticsTab classId={classId} />}
      {tab === 'leaderboard' && <LeaderboardTab classId={classId} />}
    </div>
  )
}
