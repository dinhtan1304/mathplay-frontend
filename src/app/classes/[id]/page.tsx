'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  classesApi, assignmentsApi, analyticsApi, generatorApi, getErrorMessage,
} from '@/lib/api'
import type {
  ClassRoom, ClassMember, Assignment, StudentDetail, LeaderboardEntry,
} from '@/types'
import {
  formatDate, formatDateTime, cn, getLevelTitle, getScoreColor,
} from '@/lib/utils'
import {
  Users, ClipboardList, Trophy, Plus, X, Loader2,
  ChevronLeft, Copy, Check, Flame, Send, AlertTriangle,
} from 'lucide-react'

type Tab = 'members' | 'assignments' | 'leaderboard'

// ─── Create Assignment Modal ──────────────────────────────────
function CreateAssignmentModal({ classId, onCreated, onClose }: {
  classId: number; onCreated: (a: Assignment) => void; onClose: () => void
}) {
  const [form, setForm] = useState({ title: '', description: '', deadline: '' })
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
        deadline: form.deadline || undefined,
      })
      onCreated(a)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
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
            <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="input" />
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

// ─── Student Detail Panel ─────────────────────────────────────
function StudentDetailPanel({ member, classId, onClose }: {
  member: ClassMember; classId: number; onClose: () => void
}) {
  const [detail, setDetail] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingTopic, setSendingTopic] = useState<string | null>(null)
  const [sentMsg, setSentMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    setDetail(null)
    setSentMsg(null)
    analyticsApi.getStudent(member.student_id, classId)
      .then(setDetail)
      .finally(() => setLoading(false))
  }, [member.student_id, classId])

  const handleSendTopic = async (topic: string) => {
    setSendingTopic(topic)
    setSentMsg(null)
    try {
      const res = await generatorApi.generate({ topic, difficulty: 'medium', count: 5 })
      if (!res.questions.length) throw new Error('Không tạo được câu hỏi')
      const { exam_id } = await generatorApi.saveAsExam(`Luyện tập: ${topic}`, res.questions)
      await assignmentsApi.create({ class_id: classId, exam_id, title: `Luyện tập: ${topic}` })
      setSentMsg({ type: 'ok', text: `✓ Đã gửi bài luyện "${topic}" cho cả lớp!` })
    } catch (e) {
      setSentMsg({ type: 'err', text: `⚠ ${getErrorMessage(e)}` })
    } finally {
      setSendingTopic(null)
    }
  }

  return (
    <div className="card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg flex-shrink-0">
            {member.student_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-text">{member.student_name}</div>
            <div className="text-xs text-text-muted">{member.student_email}</div>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-bg-hover hover:bg-bg-border flex items-center justify-center transition-colors">
          <X size={14} className="text-text-muted" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-accent" size={24} />
          </div>
        )}

        {!loading && !detail && (
          <div className="text-center text-text-muted text-sm py-12">Không có dữ liệu phân tích</div>
        )}

        {detail && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-hover rounded-xl p-3">
                <div className="text-xs text-text-muted mb-1">Điểm trung bình</div>
                <div className={`text-xl font-bold ${getScoreColor(detail.avg_score)}`}>
                  {detail.avg_score ?? '—'}
                </div>
              </div>
              <div className="bg-bg-hover rounded-xl p-3">
                <div className="text-xs text-text-muted mb-1">Bài đã nộp</div>
                <div className="text-xl font-bold text-text">{detail.total_submissions}</div>
              </div>
              <div className="bg-bg-hover rounded-xl p-3">
                <div className="text-xs text-text-muted mb-1">XP tích lũy</div>
                <div className="text-xl font-bold text-yellow-400">{detail.xp.total.toLocaleString()}</div>
              </div>
              <div className="bg-bg-hover rounded-xl p-3">
                <div className="text-xs text-text-muted mb-1">Chuỗi học</div>
                <div className="text-xl font-bold text-orange-400 flex items-center gap-1">
                  <Flame size={16} />{detail.xp.streak_days} ngày
                </div>
              </div>
            </div>

            {/* Weak topics */}
            <div>
              <div className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-yellow-400" />
                Chủ đề cần cải thiện
              </div>
              {detail.weak_topics.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">
                  <Check size={22} className="text-green-400 mx-auto mb-2" />
                  Học sinh chưa có chủ đề yếu
                </div>
              ) : (
                <div className="space-y-2.5">
                  {detail.weak_topics.map(wt => (
                    <div key={wt.topic} className="bg-bg-hover rounded-xl p-3.5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-sm font-medium text-text truncate">{wt.topic}</div>
                        <button
                          onClick={() => handleSendTopic(wt.topic)}
                          disabled={sendingTopic !== null}
                          className="flex items-center gap-1.5 text-xs bg-accent/15 hover:bg-accent/25 text-accent px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
                        >
                          {sendingTopic === wt.topic
                            ? <Loader2 size={10} className="animate-spin" />
                            : <Send size={10} />}
                          Gửi bài
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.round(wt.correct_rate * 100)}%`,
                              background: wt.correct_rate < 0.4 ? '#ef4444' : wt.correct_rate < 0.7 ? '#f59e0b' : '#22c55e',
                            }}
                          />
                        </div>
                        <span className="text-xs text-text-dim whitespace-nowrap">
                          {Math.round(wt.correct_rate * 100)}% đúng · {wt.attempts} lần
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sentMsg && (
              <div className={cn(
                'text-sm px-4 py-3 rounded-xl border',
                sentMsg.type === 'ok'
                  ? 'bg-green-400/10 text-green-400 border-green-400/20'
                  : 'bg-red-400/10 text-red-400 border-red-400/20'
              )}>
                {sentMsg.text}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Leaderboard Tab ──────────────────────────────────────────
function LeaderboardTab({ classId }: { classId: number }) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    classesApi.getLeaderboard(classId).then(setBoard).finally(() => setLoading(false))
  }, [classId])

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>

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
              <div className="w-8 text-center font-bold text-lg">
                {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : <span className="text-text-dim text-sm">{entry.rank}</span>}
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
  const [loadError, setLoadError] = useState('')
  const [showCreateAssign, setShowCreateAssign] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedMember, setSelectedMember] = useState<ClassMember | null>(null)

  useEffect(() => {
    // Load class info and members (critical — show error if fail)
    Promise.all([
      classesApi.get(classId),
      classesApi.getMembers(classId),
    ]).then(([c, m]) => {
      setCls(c); setMembers(m)
    }).catch(e => {
      setLoadError(getErrorMessage(e))
    }).finally(() => setLoading(false))

    // Load assignments separately (non-critical — silently ignore errors)
    assignmentsApi.list(classId).then(setAssignments).catch(() => {})
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

  if (!cls) return (
    <div className="p-6">
      <div className="text-red-400 font-medium">Không tìm thấy lớp học</div>
      {loadError && <div className="text-red-400/70 text-sm mt-1">{loadError}</div>}
    </div>
  )

  const TABS = [
    { id: 'members' as Tab, label: 'Học sinh', icon: Users, count: members.length },
    { id: 'assignments' as Tab, label: 'Bài đã gửi', icon: ClipboardList, count: assignments.length },
    { id: 'leaderboard' as Tab, label: 'Xếp hạng', icon: Trophy },
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
              {cls.description && <p className="text-sm text-text-muted mt-1">{cls.description}</p>}
            </div>
            {tab === 'assignments' && (
              <button onClick={() => setShowCreateAssign(true)} className="btn-primary flex items-center gap-1.5 text-sm flex-shrink-0">
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
            onClick={() => { setTab(t.id); if (t.id !== 'members') setSelectedMember(null) }}
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

      {/* ── Members Tab ───────────────────────────────────────── */}
      {tab === 'members' && (
        <div className={cn(
          'gap-5',
          selectedMember ? 'grid grid-cols-1 lg:grid-cols-[1fr_360px] items-start' : ''
        )}>
          {/* Student list */}
          <div className="card overflow-hidden">
            {members.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={32} className="text-text-dim mx-auto mb-3" />
                <div className="text-text-muted text-sm">Chưa có học sinh nào</div>
                <div className="text-text-dim text-xs mt-1">
                  Chia sẻ mã lớp <span className="text-accent font-mono">{cls.code}</span> cho học sinh
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bg-border text-xs text-text-dim">
                    <th className="px-4 py-3 text-left">Học sinh</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Tham gia</th>
                    <th className="px-4 py-3 text-right">Phân tích</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr
                      key={m.id}
                      className={cn(
                        'table-row cursor-pointer',
                        selectedMember?.id === m.id && 'bg-accent/5 border-l-2 border-l-accent'
                      )}
                      onClick={() => setSelectedMember(prev => prev?.id === m.id ? null : m)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                            {m.student_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-text">{m.student_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-muted hidden sm:table-cell">{m.student_email}</td>
                      <td className="px-4 py-3 text-text-dim hidden md:table-cell">{formatDate(m.joined_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-accent">
                          {selectedMember?.id === m.id ? 'Đóng ▲' : 'Xem ▶'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Student detail panel */}
          {selectedMember && (
            <StudentDetailPanel
              member={selectedMember}
              classId={classId}
              onClose={() => setSelectedMember(null)}
            />
          )}
        </div>
      )}

      {/* ── Assignments Tab ───────────────────────────────────── */}
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
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text">{a.title}</div>
                {a.description && <div className="text-sm text-text-muted mt-0.5 line-clamp-1">{a.description}</div>}
                <div className="text-xs text-text-dim mt-1">
                  Tạo: {formatDateTime(a.created_at)}
                  {a.deadline && ` · Hạn nộp: ${formatDateTime(a.deadline)}`}
                </div>
              </div>
              {a.submission_count !== undefined && (
                <div className="text-right text-xs text-text-muted flex-shrink-0">
                  <div className="text-base font-bold text-text">
                    {a.completed_count ?? 0}/{a.submission_count}
                  </div>
                  <div>hoàn thành</div>
                </div>
              )}
              <span className={cn('badge flex-shrink-0', a.is_active ? 'bg-green-400/10 text-green-400' : 'bg-bg-hover text-text-dim')}>
                {a.is_active ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Leaderboard Tab ───────────────────────────────────── */}
      {tab === 'leaderboard' && <LeaderboardTab classId={classId} />}
    </div>
  )
}
