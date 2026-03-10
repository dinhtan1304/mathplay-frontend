'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { questionsApi, bankExportApi, curriculumApi, authApi } from '@/lib/api'
import type { Question, QuestionFilters, QuestionUpdate, CurriculumTree, CurriculumChapter } from '@/types'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, TYPE_LABELS, cn, formatDateTime } from '@/lib/utils'
import { MathText } from '@/lib/math'
import {
  Search, Download, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  Check, Loader2, BookOpen, ChevronDown, FileText, FileCode,
  SlidersHorizontal, CheckSquare, Square, Globe, Lock, User,
} from 'lucide-react'

const DIFF_OPTIONS = ['NB', 'TH', 'VD', 'VDC'] as const
const TYPE_OPTIONS = ['TN', 'TL', 'DS', 'GH'] as const
const DIFF_BAR: Record<string, string> = {
  NB: 'bg-green-400', TH: 'bg-blue-400', VD: 'bg-yellow-400', VDC: 'bg-red-400',
}
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

  // Load curriculum tree for grade/chapter dropdowns
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
          {/* Question text */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Nội dung câu hỏi</label>
            <textarea value={form.question_text || ''} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} className="input resize-none h-32 font-mono text-sm" placeholder="Hỗ trợ LaTeX $...$" />
          </div>

          {/* Type + Difficulty */}
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

          {/* Curriculum: Grade → Chapter → Lesson */}
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
              <select
                value={form.chapter || ''}
                onChange={e => setForm(f => ({ ...f, chapter: e.target.value, lesson_title: '' }))}
                className="input text-sm"
              >
                <option value="">— Chọn chương —</option>
                {chapters.map(c => (
                  <option key={c.chapter_no} value={c.chapter}>{c.chapter}</option>
                ))}
              </select>
            </div>
          )}

          {form.chapter && lessons.length > 0 && (
            <div>
              <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Bài học</label>
              <select
                value={form.lesson_title || ''}
                onChange={e => setForm(f => ({ ...f, lesson_title: e.target.value }))}
                className="input text-sm"
              >
                <option value="">— Chọn bài —</option>
                {lessons.map(l => (
                  <option key={l.id} value={l.lesson_title}>{l.lesson_title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Topic (manual) */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Chủ đề</label>
            <input value={form.topic || ''} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className="input" />
          </div>

          {/* Answer */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Đáp án</label>
            <input value={form.answer || ''} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} className="input font-mono" />
          </div>

          {/* Solution steps */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Hướng dẫn giải <span className="normal-case text-text-dim">(mỗi bước 1 dòng)</span></label>
            <textarea value={(Array.isArray(form.solution_steps) ? form.solution_steps.join('\n') : form.solution_steps || '')} onChange={e => setForm(f => ({ ...f, solution_steps: e.target.value }))} className="input resize-none h-24 font-mono text-sm" />
          </div>

          {/* Public / Private toggle */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Hiển thị</label>
            <div className="flex gap-2">
              <button
                onClick={() => setForm(f => ({ ...f, is_public: true }))}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors',
                  form.is_public ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-bg-border text-text-dim hover:text-text'
                )}
              >
                <Globe size={14} /> Công khai
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, is_public: false }))}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors',
                  !form.is_public ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' : 'border-bg-border text-text-dim hover:text-text'
                )}
              >
                <Lock size={14} /> Riêng tư
              </button>
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

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-bg-card border border-bg-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-2xl bg-red-400/10 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <h3 className="font-semibold text-text text-center mb-1">Xóa câu hỏi?</h3>
        <p className="text-sm text-text-muted text-center mb-5">Hành động này không thể hoàn tác.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Hủy</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors">Xóa</button>
        </div>
      </div>
    </div>
  )
}

// ─── Export Dropdown ──────────────────────────────────────────────────────────
function ExportDropdown({ onExport, loading }: { onExport: (fmt: 'docx' | 'pdf' | 'latex') => void; loading: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} disabled={loading} className="btn-primary flex items-center gap-2 py-2">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Xuất file
        <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-bg-border rounded-xl shadow-2xl z-20 overflow-hidden animate-slide-up">
          <button onClick={() => { onExport('docx'); setOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors">
            <FileText size={14} className="text-blue-400" /> Word (.docx)
          </button>
          <button onClick={() => { onExport('pdf'); setOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors">
            <FileText size={14} className="text-red-400" /> PDF (in)
          </button>
          <button onClick={() => { onExport('latex'); setOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors">
            <FileCode size={14} className="text-green-400" /> LaTeX (.tex)
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({ q, idx, selected, isOwner, onSelect, onEdit, onDelete, deleting }: {
  q: Question; idx: number; selected: boolean; isOwner: boolean
  onSelect: () => void; onEdit: () => void; onDelete: () => void; deleting: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const diffColor = DIFF_BAR[q.difficulty || ''] || 'bg-text-dim'
  const hasExtra = !!(q.answer || (q.solution_steps && q.solution_steps.length > 0))
  const authorName = q.author_email?.split('@')[0] || ''

  return (
    <div className={cn('group border-b border-bg-border last:border-0 transition-colors', selected ? 'bg-accent/5' : 'hover:bg-bg-hover/40')}>
      <div className="flex items-start gap-0">
        <div className={cn('w-1 self-stretch flex-shrink-0', diffColor)} />
        <button onClick={onSelect} className="flex-shrink-0 p-4 text-text-dim hover:text-accent transition-colors">
          {selected ? <CheckSquare size={15} className="text-accent" /> : <Square size={15} />}
        </button>
        <div className="flex-1 min-w-0 py-3.5 pr-2">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[10px] font-mono text-text-dim">{idx}</span>
            {q.question_type && <span className="badge bg-accent/10 text-accent text-[10px]">{TYPE_LABELS[q.question_type]}</span>}
            {q.difficulty && <span className={cn('badge text-[10px]', DIFFICULTY_COLORS[q.difficulty])}>{DIFFICULTY_LABELS[q.difficulty]}</span>}
            {q.grade && <span className="text-[10px] text-text-dim bg-bg-hover px-2 py-0.5 rounded-full">Lớp {q.grade}</span>}
            {q.topic && <span className="text-[10px] text-text-dim bg-bg-hover px-2 py-0.5 rounded-full">{q.topic}</span>}
            {!q.is_public && (
              <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                <Lock size={9} /> Riêng tư
              </span>
            )}
          </div>
          <div className="text-sm text-text leading-relaxed">
            <MathText text={q.question_text} />
          </div>
          {hasExtra && (
            <button onClick={() => setExpanded(e => !e)} className="mt-2 flex items-center gap-1 text-xs text-text-dim hover:text-accent transition-colors">
              <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
              {expanded ? 'Ẩn' : 'Xem đáp án'}
            </button>
          )}
          {expanded && (
            <div className="mt-2 space-y-2 animate-slide-up">
              {q.answer && (
                <div className="text-xs bg-green-400/10 text-green-400 px-3 py-2 rounded-lg">
                  <span className="font-semibold">Đáp án: </span><MathText text={q.answer} />
                </div>
              )}
              {q.solution_steps && q.solution_steps.length > 0 && (
                <div className="text-xs bg-bg-hover px-3 py-2.5 rounded-lg space-y-1">
                  <div className="font-medium text-text-muted mb-1">Hướng dẫn:</div>
                  {q.solution_steps.map((s, i) => (
                    <div key={i} className="flex gap-2 text-text-dim">
                      <span className="flex-shrink-0">{i + 1}.</span>
                      <MathText text={s} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            {authorName && (
              <span className="flex items-center gap-1 text-[10px] text-text-dim">
                <User size={9} /> {authorName}
              </span>
            )}
            <span className="text-[10px] text-text-dim">{formatDateTime(q.created_at)}</span>
          </div>
        </div>
        {isOwner && (
          <div className="flex-shrink-0 flex items-center gap-1 py-3.5 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-accent transition-colors" title="Chỉnh sửa">
              <Pencil size={13} />
            </button>
            <button onClick={onDelete} disabled={deleting} className="w-7 h-7 rounded-lg hover:bg-red-400/10 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors" title="Xóa">
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BankPage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [filters, setFilters] = useState<QuestionFilters | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDiff, setFilterDiff] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [filterGrade, setFilterGrade] = useState<number | null>(null)
  const [filterChapter, setFilterChapter] = useState('')
  const [myOnly, setMyOnly] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Fetch current user id
  useEffect(() => {
    authApi.me().then(u => setCurrentUserId(u.id)).catch(() => { })
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await questionsApi.list({
        page,
        page_size: pageSize,
        type: filterType || undefined,
        difficulty: filterDiff || undefined,
        topic: filterTopic || undefined,
        grade: filterGrade || undefined,
        chapter: filterChapter || undefined,
        keyword: debouncedSearch || undefined,
        my_only: myOnly || undefined,
      })
      setQuestions(res.items); setTotal(res.total)
    } catch (err) {
      console.error('Failed to load questions:', err)
      setQuestions([]); setTotal(0)
    } finally { setLoading(false) }
  }, [page, filterType, filterDiff, filterTopic, filterGrade, filterChapter, debouncedSearch, myOnly])

  useEffect(() => { loadQuestions() }, [loadQuestions])
  useEffect(() => { questionsApi.getFilters().then(setFilters).catch(() => { }) }, [])
  useEffect(() => { setPage(1) }, [filterType, filterDiff, filterTopic, filterGrade, filterChapter, debouncedSearch, myOnly])

  // When grade changes, reset chapter filter
  const handleGradeSelect = (g: number | null) => {
    setFilterGrade(g)
    setFilterChapter('')
  }

  const handleDelete = async (id: number) => {
    setDeleting(id); setDeletingId(null)
    try {
      await questionsApi.delete(id)
      setQuestions(qs => qs.filter(q => q.id !== id))
      setTotal(t => t - 1)
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    } finally { setDeleting(null) }
  }

  const handleUpdate = async (data: QuestionUpdate) => {
    if (!editingQ) return
    const updated = await questionsApi.update(editingQ.id, data)
    setQuestions(qs => qs.map(q => q.id === updated.id ? updated : q))
    setEditingQ(null)
  }

  const exportSelected = async (format: 'docx' | 'pdf' | 'latex') => {
    setExporting(true)
    const params = {
      topic: filterTopic || undefined,
      difficulty: filterDiff || undefined,
      question_type: filterType || undefined,
      keyword: search || undefined,
      grade: filterGrade || undefined,
      chapter: filterChapter || undefined,
    }
    try {
      if (format === 'pdf') {
        const html = await bankExportApi.pdf(params)
        const w = window.open('', '_blank')
        if (w) { w.document.write(html); w.document.close() }
      } else if (format === 'docx') {
        await bankExportApi.docx(params)
      } else {
        await bankExportApi.latex(params)
      }
    } catch (e) { console.error(e) }
    finally { setExporting(false) }
  }

  // Chapters for selected grade
  const availableChapters = filterGrade && filters?.chapters
    ? filters.chapters
    : []

  const allSelected = selectedIds.size === questions.length && questions.length > 0
  const hasActiveFilter = !!(filterType || filterDiff || filterTopic || filterGrade || filterChapter || search)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="h-full flex">
      {editingQ && <EditModal q={editingQ} onSave={handleUpdate} onClose={() => setEditingQ(null)} />}
      {deletingId !== null && <DeleteConfirm onConfirm={() => handleDelete(deletingId)} onCancel={() => setDeletingId(null)} />}

      {/* Grade Sidebar */}
      <div className="w-40 flex-shrink-0 border-r border-bg-border flex flex-col py-4 gap-0.5 overflow-y-auto">
        <p className="text-[10px] font-medium text-text-dim uppercase tracking-wide px-4 mb-2">Lớp</p>
        <button
          onClick={() => handleGradeSelect(null)}
          className={cn('flex items-center justify-between px-4 py-2 text-sm transition-colors rounded-lg mx-2',
            !filterGrade ? 'text-accent bg-accent/10 font-medium' : 'text-text-muted hover:text-text hover:bg-bg-hover'
          )}
        >
          <span>Tất cả</span>
          {!filterGrade && <span className="text-[10px] text-accent">{total}</span>}
        </button>
        {GRADES.map(g => (
          <button
            key={g}
            onClick={() => handleGradeSelect(g)}
            className={cn('flex items-center justify-between px-4 py-2 text-sm transition-colors rounded-lg mx-2',
              filterGrade === g ? 'text-accent bg-accent/10 font-medium' : 'text-text-muted hover:text-text hover:bg-bg-hover'
            )}
          >
            <span>Lớp {g}</span>
          </button>
        ))}

        <div className="mt-auto pt-4 border-t border-bg-border mx-2">
          <button
            onClick={() => setMyOnly(m => !m)}
            className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors',
              myOnly ? 'text-accent bg-accent/10 font-medium' : 'text-text-dim hover:text-text hover:bg-bg-hover'
            )}
          >
            <User size={12} /> Của tôi
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-text">Ngân hàng đề</h1>
            <p className="text-text-muted text-sm mt-0.5">
              {loading ? '...' : `${total.toLocaleString()} câu hỏi`}
              {filterGrade && <span className="text-accent ml-1">· Lớp {filterGrade}</span>}
              {myOnly && <span className="text-accent ml-1">· Của tôi</span>}
              {hasActiveFilter && !filterGrade && !myOnly && <span className="text-accent ml-1">· đang lọc</span>}
            </p>
          </div>
          <ExportDropdown onExport={exportSelected} loading={exporting} />
        </div>

        {/* Search + Filter Bar */}
        <div className="px-6 pb-4 flex-shrink-0 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm câu hỏi..." className="input pl-10 text-sm" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors"><X size={14} /></button>}
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                (showFilters || filterType || filterDiff || filterTopic)
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-bg-border text-text-muted hover:text-text hover:bg-bg-hover'
              )}
            >
              <SlidersHorizontal size={14} />
              Lọc
              {(filterType || filterDiff || filterTopic) && (
                <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
                  {[filterType, filterDiff, filterTopic].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Chapter chips — show when grade is selected */}
          {filterGrade && availableChapters.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterChapter('')}
                className={cn('px-3 py-1 rounded-full text-xs border transition-colors',
                  !filterChapter ? 'border-accent text-accent bg-accent/10' : 'border-bg-border text-text-dim hover:text-text'
                )}
              >Tất cả chương</button>
              {availableChapters.map(ch => (
                <button
                  key={ch}
                  onClick={() => setFilterChapter(filterChapter === ch ? '' : ch)}
                  className={cn('px-3 py-1 rounded-full text-xs border transition-colors truncate max-w-[200px]',
                    filterChapter === ch ? 'border-accent text-accent bg-accent/10' : 'border-bg-border text-text-dim hover:text-text'
                  )}
                  title={ch}
                >
                  {ch.length > 30 ? ch.slice(0, 30) + '…' : ch}
                </button>
              ))}
            </div>
          )}

          {showFilters && (
            <div className="bg-bg-card border border-bg-border rounded-xl p-4 animate-slide-up">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-36">
                  <label className="text-[10px] font-medium text-text-dim uppercase tracking-wide mb-1.5 block">Loại câu</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input text-sm">
                    <option value="">Tất cả</option>
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-48">
                  <label className="text-[10px] font-medium text-text-dim uppercase tracking-wide mb-1.5 block">Độ khó</label>
                  <div className="flex gap-1.5">
                    {DIFF_OPTIONS.map(d => (
                      <button key={d} onClick={() => setFilterDiff(filterDiff === d ? '' : d)}
                        className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                          filterDiff === d ? `${DIFFICULTY_COLORS[d]} border-current` : 'border-bg-border text-text-dim hover:text-text'
                        )}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                {filters?.topics && filters.topics.length > 0 && (
                  <div className="flex-1 min-w-44">
                    <label className="text-[10px] font-medium text-text-dim uppercase tracking-wide mb-1.5 block">Chủ đề</label>
                    <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="input text-sm">
                      <option value="">Tất cả</option>
                      {filters.topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
                {hasActiveFilter && (
                  <div className="flex items-end">
                    <button onClick={() => { setFilterType(''); setFilterDiff(''); setFilterTopic(''); setSearch('') }}
                      className="flex items-center gap-1.5 text-xs text-text-dim hover:text-red-400 transition-colors py-2 px-3 rounded-lg hover:bg-red-400/10">
                      <X size={12} /> Xóa lọc
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {(filterType || filterDiff || filterTopic) && !showFilters && (
            <div className="flex gap-2 flex-wrap">
              {filterType && (
                <span className="flex items-center gap-1.5 text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                  {TYPE_LABELS[filterType]}<button onClick={() => setFilterType('')}><X size={10} /></button>
                </span>
              )}
              {filterDiff && (
                <span className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full', DIFFICULTY_COLORS[filterDiff])}>
                  {DIFFICULTY_LABELS[filterDiff]}<button onClick={() => setFilterDiff('')}><X size={10} /></button>
                </span>
              )}
              {filterTopic && (
                <span className="flex items-center gap-1.5 text-xs bg-bg-hover text-text-muted px-2.5 py-1 rounded-full">
                  {filterTopic}<button onClick={() => setFilterTopic('')}><X size={10} /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-auto px-6 pb-6 min-h-0">
          <div className="bg-bg-card border border-bg-border rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="px-4 py-2.5 border-b border-bg-border flex items-center gap-3 bg-bg-hover/20">
              <button onClick={() => setSelectedIds(allSelected ? new Set() : new Set(questions.map(q => q.id)))}
                className="text-text-dim hover:text-accent transition-colors ml-1">
                {allSelected ? <CheckSquare size={15} className="text-accent" /> : <Square size={15} />}
              </button>
              <span className="text-xs text-text-dim flex-1">
                {loading ? 'Đang tải...' : `${questions.length} / ${total} câu`}
              </span>
              {selectedIds.size > 0 && <span className="text-xs font-medium text-accent">{selectedIds.size} đã chọn</span>}
            </div>

            {loading ? (
              <div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 border-b border-bg-border last:border-0">
                    <div className="w-1 h-16 skeleton rounded flex-shrink-0" />
                    <div className="w-4 h-4 skeleton rounded mt-1 flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="flex gap-2"><div className="w-16 h-4 skeleton rounded-full" /><div className="w-20 h-4 skeleton rounded-full" /></div>
                      <div className="h-4 skeleton rounded w-4/5" />
                      <div className="h-4 skeleton rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : questions.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-bg-hover flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={28} className="text-text-dim" />
                </div>
                <div className="text-text-muted font-medium">Không tìm thấy câu hỏi</div>
                <div className="text-text-dim text-sm mt-1">{hasActiveFilter ? 'Thử thay đổi bộ lọc' : 'Hãy upload đề thi để bắt đầu'}</div>
                {hasActiveFilter && (
                  <button onClick={() => { setFilterType(''); setFilterDiff(''); setFilterTopic(''); setSearch('') }} className="btn-ghost text-sm mt-4">Xóa bộ lọc</button>
                )}
              </div>
            ) : (
              <div>
                {questions.map((q, idx) => (
                  <QuestionCard key={q.id} q={q}
                    idx={(page - 1) * pageSize + idx + 1}
                    selected={selectedIds.has(q.id)}
                    isOwner={currentUserId === q.user_id}
                    onSelect={() => setSelectedIds(prev => { const s = new Set(prev); s.has(q.id) ? s.delete(q.id) : s.add(q.id); return s })}
                    onEdit={() => setEditingQ(q)}
                    onDelete={() => setDeletingId(q.id)}
                    deleting={deleting === q.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-text-muted">Trang <span className="text-text font-medium">{page}</span> / {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg btn-ghost disabled:opacity-40 flex items-center justify-center p-0">
                  <ChevronLeft size={15} />
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                  return (
                    <button key={p} onClick={() => setPage(p)} className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors', p === page ? 'bg-accent text-white' : 'btn-ghost')}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg btn-ghost disabled:opacity-40 flex items-center justify-center p-0">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
