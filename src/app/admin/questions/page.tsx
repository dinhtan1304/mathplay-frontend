'use client'
import { useEffect, useMemo, useState } from 'react'
import { adminApi, curriculumApi, getErrorMessage } from '@/lib/api'
import type { Question, QuestionUpdate, CurriculumTree, CurriculumChapter } from '@/types'
import { Trash2, Loader2, Database, AlertTriangle, Check, X, CheckSquare, Square, Eye, EyeOff, Pencil, Globe, Lock, Search, ScanSearch } from 'lucide-react'
import { TYPE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, formatDateTime, cn } from '@/lib/utils'
import { MathText } from '@/lib/math'

const DIFF_OPTIONS = ['NB', 'TH', 'VD', 'VDC'] as const
const TYPE_OPTIONS = ['TN', 'TL', 'DS', 'GH'] as const
const GRADES = [6, 7, 8, 9, 10, 11, 12]

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ q, onSave, onClose }: {
  q: Question; onSave: (data: QuestionUpdate) => Promise<void>; onClose: () => void
}) {
  const [form, setForm] = useState<QuestionUpdate>({
    question_text: q.question_text,
    question_type: q.question_type,
    difficulty: q.difficulty,
    topic: q.topic || '',
    chapter: q.chapter || '',
    lesson_title: q.lesson_title || '',
    grade: q.grade,
    answer: q.answer || '',
    solution_steps: (q.solution_steps || []).join('\n'),
    is_public: q.is_public,
  })
  const [saving, setSaving] = useState(false)
  const [curriculum, setCurriculum] = useState<CurriculumTree | null>(null)

  useEffect(() => {
    curriculumApi.getTree().then(setCurriculum).catch(() => { })
  }, [])

  const gradeData = curriculum?.grades.find(g => g.grade === form.grade)
  const chapters: CurriculumChapter[] = gradeData?.chapters || []
  const chapterData = chapters.find(c => c.chapter === form.chapter)
  const lessons = chapterData?.lessons || []

  const submit = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-bg-border flex items-center justify-between sticky top-0 bg-bg-card z-10">
          <div>
            <h3 className="font-semibold text-text">Chỉnh sửa câu hỏi</h3>
            <p className="text-xs text-text-dim mt-0.5">#{q.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-text transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Nội dung câu hỏi</label>
            <textarea value={form.question_text || ''} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} className="input resize-none h-32 font-mono text-sm" placeholder="Hỗ trợ LaTeX $...$" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Loại câu</label>
              <select value={form.question_type || ''} onChange={e => setForm(f => ({ ...f, question_type: e.target.value as any }))} className="input">
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Độ khó</label>
              <select value={form.difficulty || ''} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as any }))} className="input">
                <option value="">Không xác định</option>
                {DIFF_OPTIONS.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Lớp</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setForm(f => ({ ...f, grade: undefined, chapter: '', lesson_title: '' }))}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  !form.grade ? 'border-accent text-accent bg-accent/10' : 'border-bg-border text-text-dim hover:text-text'
                )}
              >Tất cả</button>
              {GRADES.map(g => (
                <button key={g}
                  onClick={() => setForm(f => ({ ...f, grade: g, chapter: '', lesson_title: '' }))}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    form.grade === g ? 'border-accent text-accent bg-accent/10' : 'border-bg-border text-text-dim hover:text-text'
                  )}
                >{g}</button>
              ))}
            </div>
          </div>
          {form.grade && chapters.length > 0 && (
            <div>
              <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Chương</label>
              <select value={form.chapter || ''} onChange={e => setForm(f => ({ ...f, chapter: e.target.value, lesson_title: '' }))} className="input text-sm">
                <option value="">— Chọn chương —</option>
                {chapters.map(c => <option key={c.chapter_no} value={c.chapter}>{c.chapter}</option>)}
              </select>
            </div>
          )}
          {form.chapter && lessons.length > 0 && (
            <div>
              <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Bài học</label>
              <select value={form.lesson_title || ''} onChange={e => setForm(f => ({ ...f, lesson_title: e.target.value }))} className="input text-sm">
                <option value="">— Chọn bài —</option>
                {lessons.map(l => <option key={l.id} value={l.lesson_title}>{l.lesson_title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Chủ đề</label>
            <input value={form.topic || ''} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Đáp án</label>
            <input value={form.answer || ''} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} className="input font-mono" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Hướng dẫn giải <span className="normal-case text-text-dim">(mỗi bước 1 dòng)</span></label>
            <textarea value={(Array.isArray(form.solution_steps) ? form.solution_steps.join('\n') : form.solution_steps || '')} onChange={e => setForm(f => ({ ...f, solution_steps: e.target.value }))} className="input resize-none h-24 font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Hiển thị</label>
            <div className="flex gap-2">
              <button onClick={() => setForm(f => ({ ...f, is_public: true }))}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors',
                  form.is_public ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-bg-border text-text-dim hover:text-text'
                )}><Globe size={14} /> Công khai</button>
              <button onClick={() => setForm(f => ({ ...f, is_public: false }))}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors',
                  !form.is_public ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' : 'border-bg-border text-text-dim hover:text-text'
                )}><Lock size={14} /> Riêng tư</button>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-bg-border flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Hủy</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkAction, setBulkAction] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Duplicate detection modal
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<Array<{
    questions: Array<{ id: number; question_text: string; question_type: string; difficulty?: string; answer?: string; created_at: string; exam_id?: number; author_email?: string }>
    max_score: number
    is_exact?: boolean
  }>>([])
  const [dupLoading, setDupLoading] = useState(false)
  const [dupSelectedIds, setDupSelectedIds] = useState<Set<number>>(new Set())
  const [dupBulkDeleting, setDupBulkDeleting] = useState(false)
  const [dupError, setDupError] = useState('')

  const pageSize = 20

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const loadQuestions = () => {
    setLoading(true)
    adminApi.getQuestions(page, pageSize, debouncedSearch)
      .then(res => {
        setQuestions(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadQuestions() }, [page, debouncedSearch])
  
  // Clean selection on page change
  useEffect(() => { setSelectedIds(new Set()) }, [page, questions])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Khóa xóa (hard delete) câu hỏi này khỏi hệ thống? Không thể hoàn tác.')) return
    setDeletingId(id)
    try {
      await adminApi.deleteQuestion(id)
      setQuestions(qs => qs.filter(q => q.id !== id))
      setTotal(t => t - 1)
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdate = async (data: QuestionUpdate) => {
    if (!editingQ) return
    try {
      if (typeof data.solution_steps === 'string') {
        const lines = (data.solution_steps as string).split('\n').map(s => s.trim()).filter(Boolean)
        data.solution_steps = JSON.stringify(lines)
      }
      
      const res = await adminApi.updateQuestion(editingQ.id, data)
      setQuestions(qs => qs.map(q => q.id === editingQ.id ? res : q))
      setEditingQ(null)
    } catch (error) {
      console.error(error)
      alert("Lỗi khi cập nhật câu hỏi.")
    }
  }

  const handleBulkVisibility = async (isPublic: boolean) => {
    if (selectedIds.size === 0) return
    setBulkAction(true)
    try {
      const ids = Array.from(selectedIds)
      await adminApi.bulkVisibility(ids, isPublic)
      setQuestions(qs => qs.map(q =>
        selectedIds.has(q.id) ? { ...q, is_public: isPublic } : q
      ))
      setSelectedIds(new Set())
    } catch (e) {
      console.error(e)
      alert("Lỗi khi thay đổi trạng thái đồng loạt.")
    } finally {
      setBulkAction(false)
    }
  }

  // ── Duplicate detection handlers ──
  const handleFindDuplicates = async () => {
    setDupLoading(true); setDupError(''); setDuplicateGroups([]); setDupSelectedIds(new Set())
    try {
      const res = await adminApi.findDuplicates(0.85)
      if (res.message) { setDupError(res.message); return }
      setDuplicateGroups(res.groups)
      setShowDuplicateModal(true)
    } catch (e) { setDupError(getErrorMessage(e)) } finally { setDupLoading(false) }
  }

  const handleDeleteDuplicate = async (id: number, groupIdx: number) => {
    try {
      await adminApi.deleteQuestion(id)
      setDuplicateGroups(prev => {
        const updated = [...prev]
        updated[groupIdx] = { ...updated[groupIdx], questions: updated[groupIdx].questions.filter(q => q.id !== id) }
        return updated.filter(g => g.questions.length >= 2)
      })
      setDupSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
      setQuestions(qs => qs.filter(q => q.id !== id))
      setTotal(t => t - 1)
    } catch (e) { setDupError(getErrorMessage(e)) }
  }

  const dupTotalQuestions = useMemo(
    () => duplicateGroups.reduce((sum, g) => sum + g.questions.length, 0),
    [duplicateGroups]
  )

  const toggleDupSelect = (id: number) => {
    setDupSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }
  const toggleDupGroupSelect = (groupIdx: number) => {
    const group = duplicateGroups[groupIdx]
    if (!group) return
    const groupIds = group.questions.map(q => q.id)
    setDupSelectedIds(prev => {
      const next = new Set(prev)
      const allSel = groupIds.every(id => next.has(id))
      if (allSel) groupIds.forEach(id => next.delete(id)); else groupIds.forEach(id => next.add(id))
      return next
    })
  }
  const toggleDupSelectAll = () => {
    setDupSelectedIds(prev => {
      const allIds = duplicateGroups.flatMap(g => g.questions.map(q => q.id))
      return allIds.length > 0 && allIds.every(id => prev.has(id)) ? new Set() : new Set(allIds)
    })
  }
  const handleBulkDeleteDuplicates = async () => {
    if (dupSelectedIds.size === 0) return
    setDupBulkDeleting(true); setDupError('')
    try {
      const ids = Array.from(dupSelectedIds)
      await adminApi.bulkDelete(ids)
      const deletedSet = new Set(ids)
      setDuplicateGroups(prev =>
        prev.map(g => ({ ...g, questions: g.questions.filter(q => !deletedSet.has(q.id)) }))
            .filter(g => g.questions.length >= 2)
      )
      setDupSelectedIds(new Set())
      setQuestions(qs => qs.filter(q => !deletedSet.has(q.id)))
      setTotal(t => t - ids.length)
    } catch (e) { setDupError(getErrorMessage(e)) } finally { setDupBulkDeleting(false) }
  }

  const totalPages = Math.ceil(total / pageSize)
  const allSelected = selectedIds.size === questions.length && questions.length > 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {editingQ && <EditModal q={editingQ} onSave={handleUpdate} onClose={() => setEditingQ(null)} />}

      {/* ─── Duplicate Detection Modal ────────────────────────────────────── */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-text flex items-center gap-2"><ScanSearch size={15} className="text-accent" /> Kiểm tra câu trùng lặp</h3>
                <p className="text-xs text-text-dim mt-0.5">
                  {duplicateGroups.length} nhóm · {dupTotalQuestions} câu tương đồng ≥ 85%
                </p>
              </div>
              <button onClick={() => setShowDuplicateModal(false)} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim">
                <X size={14} />
              </button>
            </div>
            {/* Bulk action bar */}
            {duplicateGroups.length > 0 && (
              <div className="px-4 py-2.5 border-b border-bg-border flex items-center gap-3 flex-shrink-0 bg-bg-hover/20">
                <button onClick={toggleDupSelectAll} className="text-text-muted hover:text-text transition-colors" title="Chọn tất cả">
                  {dupTotalQuestions > 0 && dupSelectedIds.size === dupTotalQuestions
                    ? <CheckSquare size={15} className="text-accent" />
                    : <Square size={15} />}
                </button>
                <span className="text-xs text-text-dim">
                  {dupSelectedIds.size > 0 ? `Đã chọn ${dupSelectedIds.size} câu` : 'Chọn tất cả'}
                </span>
                {dupSelectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDeleteDuplicates}
                    disabled={dupBulkDeleting}
                    className="ml-auto flex items-center gap-1.5 text-xs text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors border border-red-400/20 disabled:opacity-50"
                  >
                    {dupBulkDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Xóa {dupSelectedIds.size} câu đã chọn
                  </button>
                )}
              </div>
            )}
            {dupError && (
              <div className="px-4 py-2 bg-red-500/10 text-red-400 text-xs border-b border-bg-border flex items-center gap-2">
                <AlertTriangle size={12} /> {dupError}
                <button onClick={() => setDupError('')} className="ml-auto"><X size={11} /></button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {duplicateGroups.length === 0 ? (
                <div className="py-16 text-center">
                  <Check size={32} className="text-green-400 mx-auto mb-3" />
                  <p className="text-text-muted font-medium">Không phát hiện câu trùng lặp</p>
                  <p className="text-text-dim text-sm mt-1">Ngân hàng câu hỏi sạch sẽ!</p>
                </div>
              ) : duplicateGroups.map((group, gi) => {
                const groupIds = group.questions.map(q => q.id)
                const groupAllSelected = groupIds.every(id => dupSelectedIds.has(id))
                return (
                <div key={gi} className="border border-bg-border rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-bg-hover/30 flex items-center gap-3">
                    <button onClick={() => toggleDupGroupSelect(gi)} className="text-text-muted hover:text-text transition-colors" title="Chọn cả nhóm">
                      {groupAllSelected ? <CheckSquare size={14} className="text-accent" /> : <Square size={14} />}
                    </button>
                    <span className="text-xs font-medium text-text-muted flex items-center gap-2 flex-1">
                      Nhóm {gi + 1} · {group.questions.length} câu · {(group.max_score * 100).toFixed(0)}%
                      {group.max_score >= 1.0 && (
                        <span className="text-[10px] font-semibold text-red-400 bg-red-400/15 px-1.5 py-0.5 rounded">Trùng y hệt</span>
                      )}
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-bg-border overflow-hidden">
                      <div className={`h-full rounded-full ${group.max_score >= 1.0 ? 'bg-red-400' : 'bg-orange-400'}`} style={{ width: `${group.max_score * 100}%` }} />
                    </div>
                  </div>
                  <div className="divide-y divide-bg-border">
                    {group.questions.map((q) => (
                      <div key={q.id} className="p-4 flex items-start gap-3">
                        <button onClick={() => toggleDupSelect(q.id)} className="mt-0.5 text-text-muted hover:text-text transition-colors flex-shrink-0">
                          {dupSelectedIds.has(q.id) ? <CheckSquare size={14} className="text-accent" /> : <Square size={14} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[10px] text-text-dim bg-bg-hover px-1.5 py-0.5 rounded">#{q.id}</span>
                            {q.question_type && <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{TYPE_LABELS[q.question_type] || q.question_type}</span>}
                            {q.difficulty && (
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded', DIFFICULTY_COLORS[q.difficulty])}>
                                {DIFFICULTY_LABELS[q.difficulty]}
                              </span>
                            )}
                            {q.author_email && (
                              <span className="text-[10px] text-text-dim bg-bg-hover px-1.5 py-0.5 rounded">{q.author_email.split('@')[0]}</span>
                            )}
                          </div>
                          <p className="text-sm text-text line-clamp-3"><MathText text={q.question_text} /></p>
                          {q.answer && <p className="text-xs text-text-dim mt-1">Đáp án: <span className="text-green-400">{q.answer}</span></p>}
                        </div>
                        <button
                          onClick={() => handleDeleteDuplicate(q.id, gi)}
                          className="flex-shrink-0 flex items-center gap-1 text-[10px] text-red-400 hover:bg-red-400/10 px-2.5 py-1.5 rounded-lg transition-colors border border-red-400/20"
                          title="Xóa câu này"
                        >
                          <Trash2 size={11} /> Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Database size={24} className="text-accent" />
            <div>
              <h1 className="text-2xl font-bold text-text mb-1">Quản lý Ngân hàng Đề</h1>
              <p className="text-text-muted text-sm">Toàn bộ {total.toLocaleString()} câu hỏi trên hệ thống</p>
            </div>
          </div>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/50" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm nội dung câu hỏi..."
              className="input pl-9 h-10 w-64 text-sm"
            />
          </div>

          <button
            onClick={handleFindDuplicates}
            disabled={dupLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-bg-border text-text-dim hover:text-text hover:border-bg-border transition-colors"
            title="Kiểm tra câu trùng lặp"
          >
            {dupLoading ? <Loader2 size={13} className="animate-spin" /> : <ScanSearch size={13} />}
            Trùng lặp
          </button>
          {dupError && !showDuplicateModal && <span className="text-xs text-red-400">{dupError}</span>}
        </div>
        
        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-bg-card border border-bg-border rounded-xl px-4 py-2 animate-slide-up shadow-sm">
            <span className="text-xs font-medium text-accent">{selectedIds.size} đã chọn</span>
            <div className="w-px h-5 bg-bg-border" />
            <button
              onClick={() => handleBulkVisibility(true)}
              disabled={bulkAction}
              className="flex items-center gap-1.5 text-xs text-green-400 hover:bg-green-400/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {bulkAction ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
              Công khai
            </button>
            <button
              onClick={() => handleBulkVisibility(false)}
              disabled={bulkAction}
              className="flex items-center gap-1.5 text-xs text-yellow-400 hover:bg-yellow-400/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {bulkAction ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
              Riêng tư
            </button>
            <div className="w-px h-5 bg-bg-border" />
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-text-dim hover:text-text transition-colors px-2">
              Bỏ chọn
            </button>
          </div>
        )}
      </div>

      <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-dim uppercase bg-bg-hover/50 border-b border-bg-border">
              <tr>
                <th className="pl-6 pr-2 py-4 w-10">
                  <button onClick={() => setSelectedIds(allSelected ? new Set() : new Set(questions.map(q => q.id)))}
                    className="text-text-dim hover:text-accent transition-colors flex items-center justify-center">
                    {allSelected ? <CheckSquare size={16} className="text-accent" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-4 font-semibold w-16">ID / TT</th>
                <th className="px-6 py-4 font-semibold w-24">Người tạo</th>
                <th className="px-6 py-4 font-semibold min-w-[300px]">Nội dung</th>
                <th className="px-6 py-4 font-semibold">Phân loại</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-dim">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">Ngân hàng đề trống</td>
                </tr>
              ) : (
                questions.map(q => {
                  const isSelected = selectedIds.has(q.id)
                  return (
                    <tr key={q.id} className={cn("hover:bg-bg-hover/30 transition-colors align-top", isSelected && "bg-accent/5")}>
                      <td className="pl-6 pr-2 py-4">
                        <button onClick={() => setSelectedIds(prev => { const s = new Set(prev); isSelected ? s.delete(q.id) : s.add(q.id); return s })}
                          className="text-text-dim hover:text-accent transition-colors flex items-center justify-center">
                          {isSelected ? <CheckSquare size={16} className="text-accent" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono text-xs text-text-dim">#{q.id}</div>
                        <div className="text-[10px] flex items-center gap-1 mt-2.5">
                          {q.is_public ? (
                            <span className="text-green-500 flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded" title="Công khai">
                              <Globe size={10} /> CK
                            </span>
                          ) : (
                            <span className="text-yellow-500 flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded" title="Riêng tư">
                              <Lock size={10} /> RT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {q.author_email ? (
                          <div className="truncate w-32" title={q.author_email}>
                            {q.author_email.split('@')[0]}
                          </div>
                        ) : (
                          <span className="text-text-muted italic">Ẩn danh</span>
                        )}
                        <div className="text-[10px] text-text-dim mt-2">{formatDateTime(q.created_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="line-clamp-3 text-text">
                          <MathText text={q.question_text} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {q.question_type && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">
                              {TYPE_LABELS[q.question_type]}
                            </span>
                          )}
                          {q.difficulty && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                              {DIFFICULTY_LABELS[q.difficulty]}
                            </span>
                          )}
                          {q.grade && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-bg-hover text-text-muted">
                              Lớp {q.grade}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setEditingQ(q)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-dim hover:text-accent hover:bg-accent/10 transition-colors"
                          title="Sửa câu hỏi"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deletingId === q.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Xóa câu hỏi khỏi hệ thống"
                        >
                          {deletingId === q.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-bg-border flex items-center justify-between">
            <span className="text-sm text-text-muted">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="btn-ghost px-3 py-1.5 text-sm"
              >Trước</button>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="btn-ghost px-3 py-1.5 text-sm"
              >Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
