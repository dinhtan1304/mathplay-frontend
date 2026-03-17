'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { questionsApi, bankExportApi, curriculumApi, authApi, parserApi, getErrorMessage } from '@/lib/api'
import type { Question, QuestionFilters, QuestionUpdate, CurriculumTree, CurriculumChapter, Exam } from '@/types'
import GenerateSimilarModal from '@/components/GenerateSimilarModal'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, TYPE_LABELS, cn, formatDateTime } from '@/lib/utils'
import { MathText } from '@/lib/math'
import {
  Search, Download, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  Check, Loader2, BookOpen, ChevronDown, FileText, FileCode,
  SlidersHorizontal, CheckSquare, Square, Globe, Lock, User,
  Eye, EyeOff, Filter, Flag, AlertTriangle, Sparkles, FlaskConical,
  ArrowUpDown, ScanSearch, ArrowUp, ArrowDown,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const DIFF_OPTIONS = ['NB', 'TH', 'VD', 'VDC'] as const
const TYPE_OPTIONS = ['TN', 'TL'] as const
const DIFF_BAR: Record<string, string> = {
  NB: 'bg-green-400', TH: 'bg-blue-400', VD: 'bg-yellow-400', VDC: 'bg-red-400',
}
const DIFF_DOT: Record<string, string> = {
  NB: 'bg-green-400', TH: 'bg-blue-400', VD: 'bg-yellow-400', VDC: 'bg-red-400',
}

const GRADES = [6, 7, 8, 9, 10, 11, 12]

// ─── Searchable Multi-Select Dropdown ─────────────────────────────────────────
function FilterDropdown({ label, items, selected, onToggle, labelMap, colorMap, placeholder }: {
  label: string
  items: string[]
  selected: string[]
  onToggle: (val: string) => void
  labelMap?: Record<string, string>
  colorMap?: Record<string, string>
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when opening
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(item => {
      const text = labelMap?.[item] || item
      return text.toLowerCase().includes(q)
    })
  }, [items, query, labelMap])

  const selectedCount = selected.length
  const displayText = selectedCount === 0
    ? (placeholder || `Chọn ${label.toLowerCase()}`)
    : selectedCount === 1
      ? (labelMap?.[selected[0]] || selected[0])
      : `${selectedCount} đã chọn`

  if (items.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1.5">{label}</p>
      <button
        onClick={() => { setOpen(o => !o); setQuery('') }}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs border transition-all duration-150',
          open ? 'border-accent bg-accent/5 text-accent' :
          selectedCount > 0 ? 'border-accent/50 text-accent bg-accent/5' :
          'border-bg-border text-text-muted hover:border-text-dim hover:text-text'
        )}
      >
        <span className="truncate text-left">{displayText}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selectedCount > 0 && (
            <span
              className="w-4 h-4 rounded-full bg-accent text-white text-[9px] flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); selected.forEach(s => onToggle(s)) }}
              title="Xóa tất cả"
            >
              {selectedCount}
            </span>
          )}
          <ChevronDown size={12} className={cn('transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-bg-card border border-bg-border rounded-xl shadow-2xl z-30 overflow-hidden animate-slide-up">
          {/* Search input */}
          {items.length > 5 && (
            <div className="p-2 border-b border-bg-border">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Tìm ${label.toLowerCase()}...`}
                  className="w-full bg-bg-hover border-0 rounded-lg text-xs py-1.5 pl-7 pr-2 text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-text-dim">Không tìm thấy</div>
            ) : (
              filtered.map(item => {
                const isSelected = selected.includes(item)
                const itemLabel = labelMap?.[item] || item
                const dotColor = colorMap?.[item]
                return (
                  <button
                    key={item}
                    onClick={() => onToggle(item)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors',
                      isSelected
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-text-muted hover:text-text hover:bg-bg-hover'
                    )}
                  >
                    {isSelected
                      ? <CheckSquare size={12} className="text-accent flex-shrink-0" />
                      : <Square size={12} className="flex-shrink-0 opacity-50" />
                    }
                    {dotColor && <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColor)} />}
                    <span className="truncate text-left">{itemLabel}</span>
                  </button>
                )
              })
            )}
          </div>

          {/* Quick actions footer */}
          {selectedCount > 0 && (
            <div className="px-3 py-1.5 border-t border-bg-border flex justify-end">
              <button
                onClick={() => { selected.forEach(s => onToggle(s)); setQuery('') }}
                className="text-[10px] text-text-dim hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X size={9} /> Bỏ chọn tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
  const [saveError, setSaveError] = useState<string | null>(null)
  const [curriculum, setCurriculum] = useState<CurriculumTree | null>(null)
  // AI solve
  const [solving, setSolving] = useState(false)
  const [solveError, setSolveError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<{ answer: string; solution_steps: string[] } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    curriculumApi.getTree().then(setCurriculum).catch(() => { })
  }, [])

  const gradeData = curriculum?.grades.find(g => g.grade === form.grade)
  const chapters: CurriculumChapter[] = gradeData?.chapters || []
  const chapterData = chapters.find(c => c.chapter === form.chapter)
  const lessons = chapterData?.lessons || []

  const submit = async () => {
    setSaveError(null)
    if (form.is_public && !form.answer?.trim()) {
      setSaveError('Câu hỏi công khai phải có đáp án.')
      return
    }
    setSaving(true)
    try { await onSave(form) } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setSaveError(msg || 'Lưu thất bại.')
    } finally { setSaving(false) }
  }

  const handleSolve = async () => {
    setSolving(true); setSolveError(null); setAiResult(null)
    try {
      const result = await questionsApi.solve(q.id)
      const hasExisting = form.answer?.trim() || form.solution_steps?.toString().trim()
      if (hasExisting) {
        setAiResult(result)
        setConfirmOpen(true)
      } else {
        // No existing data — auto-fill immediately
        setForm(f => ({
          ...f,
          answer: result.answer,
          solution_steps: result.solution_steps.join('\n'),
        }))
        setSolveError(null)
      }
    } catch (err: unknown) {
      setSolveError(getErrorMessage(err))
    } finally {
      setSolving(false)
    }
  }

  const applyAiResult = () => {
    if (!aiResult) return
    setForm(f => ({
      ...f,
      answer: aiResult.answer,
      solution_steps: aiResult.solution_steps.join('\n'),
    }))
    setConfirmOpen(false)
    setAiResult(null)
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
                <option value="">Không xác định</option>
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
            <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">
              Đáp án <span className="normal-case text-text-dim font-normal">— hỗ trợ markdown &amp; LaTeX $...$</span>
            </label>
            <textarea value={form.answer || ''} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} className="input resize-none h-20 font-mono text-sm" placeholder="Ví dụ: **A.** $x = 2$ hoặc nhiều dòng..." />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Hướng dẫn giải <span className="normal-case text-text-dim font-normal">(mỗi bước 1 dòng, hỗ trợ markdown &amp; LaTeX)</span>
              </label>
              <button
                type="button"
                onClick={handleSolve}
                disabled={solving || !form.question_text?.trim()}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border border-accent/40 text-accent hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {solving
                  ? <><Loader2 size={11} className="animate-spin" /> Đang giải...</>
                  : <><FlaskConical size={11} /> Kiểm tra lời giải AI</>
                }
              </button>
            </div>
            {solveError && (
              <p className="text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg mb-2">{solveError}</p>
            )}
            <textarea value={(Array.isArray(form.solution_steps) ? form.solution_steps.join('\n') : form.solution_steps || '')} onChange={e => setForm(f => ({ ...f, solution_steps: e.target.value }))} className="input resize-none h-28 font-mono text-sm" />
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
        <div className="px-6 py-4 border-t border-bg-border flex flex-col gap-3">
          {saveError && (
            <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{saveError}</p>
          )}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn-ghost">Hủy</button>
            <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Lưu thay đổi
            </button>
          </div>
        </div>
      </div>

      {/* AI solve confirm dialog */}
      {confirmOpen && aiResult && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setConfirmOpen(false)}>
          <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-bg-border flex items-center gap-2">
              <FlaskConical size={16} className="text-accent" />
              <h4 className="font-semibold text-text text-sm">AI đã giải xong</h4>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-text-muted">Câu hỏi này đã có đáp án / hướng dẫn. Bạn có muốn thay thế bằng kết quả của AI không?</p>
              <div className="bg-bg-hover rounded-xl p-4 space-y-2 text-sm">
                <div>
                  <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Đáp án AI</span>
                  <p className="text-green-400 mt-1 font-mono text-xs">{aiResult.answer}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Hướng dẫn giải ({aiResult.solution_steps.length} bước)</span>
                  <ol className="mt-1 space-y-0.5">
                    {aiResult.solution_steps.slice(0, 4).map((s, i) => (
                      <li key={i} className="text-xs text-text-muted font-mono truncate">{s}</li>
                    ))}
                    {aiResult.solution_steps.length > 4 && (
                      <li className="text-xs text-text-dim">...và {aiResult.solution_steps.length - 4} bước nữa</li>
                    )}
                  </ol>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-bg-border flex gap-2 justify-end">
              <button onClick={() => setConfirmOpen(false)} className="btn-ghost text-sm">Giữ nguyên</button>
              <button onClick={applyAiResult} className="btn-primary text-sm flex items-center gap-2">
                <Check size={14} /> Cập nhật từ AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Report Modal ─────────────────────────────────────────────────────────────
const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'wrong_answer', label: 'Đáp án sai' },
  { value: 'duplicate', label: 'Câu hỏi trùng lặp' },
  { value: 'inappropriate', label: 'Nội dung không phù hợp' },
  { value: 'poor_quality', label: 'Chất lượng kém / thiếu thông tin' },
  { value: 'other', label: 'Lý do khác' },
]

function ReportModal({ questionId, onClose }: { questionId: number; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!reason) { setError('Vui lòng chọn lý do.'); return }
    setSubmitting(true); setError(null)
    try {
      await questionsApi.report(questionId, reason, detail.trim() || undefined)
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Gửi báo cáo thất bại.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-bg-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            <h3 className="font-semibold text-text">Báo cáo câu hỏi #{questionId}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-text transition-colors"><X size={16} /></button>
        </div>
        {done ? (
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-3">
              <Check size={22} className="text-green-400" />
            </div>
            <p className="text-text font-medium">Đã gửi báo cáo!</p>
            <p className="text-text-dim text-sm mt-1">Cảm ơn bạn đã phản hồi. Chúng tôi sẽ xem xét sớm.</p>
            <button onClick={onClose} className="mt-4 btn-ghost text-sm">Đóng</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Lý do báo cáo</label>
              <div className="space-y-2">
                {REPORT_REASONS.map(r => (
                  <button key={r.value} onClick={() => setReason(r.value)}
                    className={cn('w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-colors',
                      reason === r.value ? 'border-orange-400 text-orange-300 bg-orange-400/10' : 'border-bg-border text-text-muted hover:text-text hover:bg-bg-hover'
                    )}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-2 block uppercase tracking-wide">Chi tiết <span className="normal-case text-text-dim font-normal">(tùy chọn)</span></label>
              <textarea value={detail} onChange={e => setDetail(e.target.value)} className="input resize-none h-20 text-sm" placeholder="Mô tả thêm về vấn đề..." />
            </div>
            {error && <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 justify-end pt-1">
              <button onClick={onClose} className="btn-ghost">Hủy</button>
              <button onClick={submit} disabled={submitting || !reason}
                className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                Gửi báo cáo
              </button>
            </div>
          </div>
        )}
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
function QuestionCard({ q, idx, selected, isOwner, onSelect, onEdit, onDelete, onReport, deleting }: {
  q: Question; idx: number; selected: boolean; isOwner: boolean
  onSelect: () => void; onEdit: () => void; onDelete: () => void; onReport: () => void; deleting: boolean
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
        <div className="flex-shrink-0 flex items-center gap-1 py-3.5 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {isOwner ? (<>
            <button onClick={onEdit} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-accent transition-colors" title="Chỉnh sửa">
              <Pencil size={13} />
            </button>
            <button onClick={onDelete} disabled={deleting} className="w-7 h-7 rounded-lg hover:bg-red-400/10 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors" title="Xóa">
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </>) : (
            <button onClick={onReport} className="w-7 h-7 rounded-lg hover:bg-orange-400/10 flex items-center justify-center text-text-dim hover:text-orange-400 transition-colors" title="Báo cáo câu hỏi">
              <Flag size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BankPage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [filters, setFilters] = useState<QuestionFilters | null>(null)
  const [curriculum, setCurriculum] = useState<CurriculumTree | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Filter states — multi-select arrays
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [filterDiffs, setFilterDiffs] = useState<string[]>([])
  const [filterGrades, setFilterGrades] = useState<number[]>([])
  const [filterChapters, setFilterChapters] = useState<string[]>([])
  const [myOnly, setMyOnly] = useState(false)
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all')

  // Sort state
  const [sortBy, setSortBy] = useState<'created_at' | 'difficulty' | 'question_type'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  // Filter by exam source
  const [filterExamId, setFilterExamId] = useState<number | undefined>(undefined)
  const [exams, setExams] = useState<Exam[]>([])

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [reportingId, setReportingId] = useState<number | null>(null)
  const [showGenerateSimilar, setShowGenerateSimilar] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [bulkAction, setBulkAction] = useState(false)
  const [showFilterSidebar, setShowFilterSidebar] = useState(true)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  // Duplicate detection
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<Array<{
    questions: Array<{ id: number; question_text: string; question_type: string; difficulty?: string; answer?: string; created_at: string }>
    max_score: number
  }>>([])
  const [dupLoading, setDupLoading] = useState(false)
  const [dupError, setDupError] = useState('')

  const searchParams = useSearchParams()

  // One-time init: auth, filters, curriculum, exams list
  useEffect(() => {
    authApi.me().then(u => setCurrentUserId(u.id)).catch(() => { })
    questionsApi.getFilters().then(setFilters).catch(() => { })
    curriculumApi.getTree().then(setCurriculum).catch(() => { })
    parserApi.listExams(1, 100).then(r => setExams(r.items)).catch(() => { })
  }, [])

  // Read exam_id from query param on mount only
  useEffect(() => {
    const examIdParam = searchParams.get('exam_id')
    if (examIdParam) setFilterExamId(Number(examIdParam))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // ─── Derived: chapters filtered by selected grades ───────────────────────
  const availableChapters = useMemo(() => {
    if (!curriculum) return filters?.chapters || []
    if (filterGrades.length === 0) {
      // No grade selected → show all chapters from curriculum
      const allChapters = new Set<string>()
      curriculum.grades.forEach(g => g.chapters.forEach(c => allChapters.add(c.chapter)))
      return Array.from(allChapters).sort()
    }
    // Filter chapters by selected grades
    const chaptersForGrades = new Set<string>()
    curriculum.grades
      .filter(g => filterGrades.includes(g.grade))
      .forEach(g => g.chapters.forEach(c => chaptersForGrades.add(c.chapter)))
    return Array.from(chaptersForGrades).sort()
  }, [curriculum, filterGrades, filters?.chapters])

  // When grades change, remove chapters that are no longer valid
  useEffect(() => {
    if (filterChapters.length > 0 && availableChapters.length > 0) {
      const valid = filterChapters.filter(ch => availableChapters.includes(ch))
      if (valid.length !== filterChapters.length) {
        setFilterChapters(valid)
      }
    }
  }, [availableChapters, filterChapters])

  // ─── Load questions ────────────────────────────────────────────────────────
  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await questionsApi.list({
        page,
        page_size: pageSize,
        type: filterTypes.length > 0 ? filterTypes.join(',') : undefined,
        difficulty: filterDiffs.length > 0 ? filterDiffs.join(',') : undefined,
        grade: filterGrades.length > 0 ? filterGrades.join(',') : undefined,
        chapter: filterChapters.length > 0 ? filterChapters.join(',') : undefined,
        keyword: debouncedSearch || undefined,
        exam_id: filterExamId,
        my_only: myOnly || undefined,
        visibility: filterVisibility !== 'all' ? filterVisibility : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      setQuestions(res.items); setTotal(res.total)
    } catch (err) {
      console.error('Failed to load questions:', err)
      setQuestions([]); setTotal(0)
    } finally { setLoading(false) }
  }, [page, filterTypes, filterDiffs, filterGrades, filterChapters, debouncedSearch, myOnly, filterVisibility, filterExamId, sortBy, sortOrder])

  useEffect(() => { loadQuestions() }, [loadQuestions])
  useEffect(() => { setPage(1) }, [filterTypes, filterDiffs, filterGrades, filterChapters, debouncedSearch, myOnly, filterVisibility, filterExamId, sortBy, sortOrder])

  // ─── Handlers ──────────────────────────────────────────────────────────────
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

  const handleBulkDelete = async () => {
    setConfirmBulkDelete(false)
    setBulkAction(true)
    try {
      const ownedIds = questions
        .filter(q => selectedIds.has(q.id) && q.user_id === currentUserId)
        .map(q => q.id)
      if (ownedIds.length === 0) return
      await questionsApi.bulkDelete(ownedIds)
      setQuestions(qs => qs.filter(q => !ownedIds.includes(q.id)))
      setTotal(t => t - ownedIds.length)
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Bulk delete failed:', err)
    } finally { setBulkAction(false) }
  }

  const handleBulkVisibility = async (isPublic: boolean) => {
    if (selectedIds.size === 0) return
    setBulkAction(true)
    try {
      const ids = Array.from(selectedIds)
      const res = await questionsApi.bulkVisibility(ids, isPublic)
      if (isPublic) {
        // Only update questions that were actually changed (have answers)
        setQuestions(qs => qs.map(q =>
          selectedIds.has(q.id) && q.user_id === currentUserId && q.answer?.trim()
            ? { ...q, is_public: true }
            : q
        ))
      } else {
        setQuestions(qs => qs.map(q =>
          selectedIds.has(q.id) && q.user_id === currentUserId
            ? { ...q, is_public: false }
            : q
        ))
      }
      setSelectedIds(new Set())
      if (res.skipped_no_answer) {
        alert(res.detail)
      }
    } catch (err) {
      console.error('Bulk visibility failed:', err)
    } finally { setBulkAction(false) }
  }

  const exportSelected = async (format: 'docx' | 'pdf' | 'latex') => {
    setExporting(true)
    const params = {
      difficulty: filterDiffs.length > 0 ? filterDiffs.join(',') : undefined,
      question_type: filterTypes.length > 0 ? filterTypes.join(',') : undefined,
      keyword: search || undefined,
      grade: filterGrades.length > 0 ? filterGrades.join(',') : undefined,
      chapter: filterChapters.length > 0 ? filterChapters.join(',') : undefined,
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

  // Toggle helpers
  const toggleFilter = <T,>(arr: T[], val: T, setter: (v: T[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const activeFilterCount = filterTypes.length + filterDiffs.length + filterGrades.length + filterChapters.length
    + (filterVisibility !== 'all' ? 1 : 0) + (filterExamId ? 1 : 0)
  const hasActiveFilter = activeFilterCount > 0 || !!search
  const clearAllFilters = () => {
    setFilterTypes([]); setFilterDiffs([])
    setFilterGrades([]); setFilterChapters([]); setSearch('')
    setFilterVisibility('all'); setFilterExamId(undefined)
  }

  const handleFindDuplicates = async () => {
    setDupLoading(true); setDupError(''); setDuplicateGroups([])
    try {
      const res = await questionsApi.findDuplicates(0.92)
      setDuplicateGroups(res.groups)
      setShowDuplicateModal(true)
    } catch (e) { setDupError(getErrorMessage(e)) } finally { setDupLoading(false) }
  }

  const handleDeleteDuplicate = async (id: number, groupIdx: number) => {
    try {
      await questionsApi.delete(id)
      setDuplicateGroups(prev => {
        const updated = [...prev]
        updated[groupIdx] = {
          ...updated[groupIdx],
          questions: updated[groupIdx].questions.filter(q => q.id !== id),
        }
        return updated.filter(g => g.questions.length >= 2)
      })
      setQuestions(qs => qs.filter(q => q.id !== id))
      setTotal(t => t - 1)
    } catch (e) { setDupError(getErrorMessage(e)) }
  }

  const allSelected = selectedIds.size === questions.length && questions.length > 0
  const totalPages = Math.ceil(total / pageSize)
  const selectedOwnedIds = useMemo(
    () => questions.filter(q => selectedIds.has(q.id) && q.user_id === currentUserId).map(q => q.id),
    [questions, selectedIds, currentUserId]
  )
  const hasOwnedSelection = selectedOwnedIds.length > 0

  return (
    <div className="h-full flex">
      {editingQ && <EditModal q={editingQ} onSave={handleUpdate} onClose={() => setEditingQ(null)} />}
      {deletingId !== null && <DeleteConfirm onConfirm={() => handleDelete(deletingId)} onCancel={() => setDeletingId(null)} />}
      {reportingId !== null && <ReportModal questionId={reportingId} onClose={() => setReportingId(null)} />}

      {/* ─── Duplicate Detection Modal ────────────────────────────────────── */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-text flex items-center gap-2"><ScanSearch size={15} className="text-accent" /> Kiểm tra câu trùng lặp</h3>
                <p className="text-xs text-text-dim mt-0.5">{duplicateGroups.length} nhóm câu tương đồng ≥ 92%</p>
              </div>
              <button onClick={() => setShowDuplicateModal(false)} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim">
                <X size={14} />
              </button>
            </div>
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
                  <p className="text-text-dim text-sm mt-1">Ngân hàng câu hỏi của bạn sạch sẽ!</p>
                </div>
              ) : duplicateGroups.map((group, gi) => (
                <div key={gi} className="border border-bg-border rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-bg-hover/30 flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted">Nhóm {gi + 1} · Độ tương đồng {(group.max_score * 100).toFixed(0)}%</span>
                    <div className="w-16 h-1.5 rounded-full bg-bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-orange-400" style={{ width: `${group.max_score * 100}%` }} />
                    </div>
                  </div>
                  <div className="divide-y divide-bg-border">
                    {group.questions.map((q) => (
                      <div key={q.id} className="p-4 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[10px] text-text-dim bg-bg-hover px-1.5 py-0.5 rounded">#{q.id}</span>
                            {q.question_type && <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{q.question_type}</span>}
                            {q.difficulty && (
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded', DIFFICULTY_COLORS[q.difficulty])}>
                                {DIFFICULTY_LABELS[q.difficulty]}
                              </span>
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
              ))}
            </div>
          </div>
        </div>
      )}

      {showGenerateSimilar && (
        <GenerateSimilarModal
          selectedIds={Array.from(selectedIds)}
          onClose={() => setShowGenerateSimilar(false)}
          onSaved={() => { loadQuestions(); setSelectedIds(new Set()) }}
        />
      )}

      {/* ─── Filter Sidebar ──────────────────────────────────────────────── */}
      {showFilterSidebar && (
        <div className="w-60 flex-shrink-0 border-r border-bg-border flex flex-col h-full overflow-hidden">
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-bg-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-accent" />
              <span className="text-xs font-semibold text-text uppercase tracking-wider">Bộ lọc</span>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters}
                className="flex items-center gap-1 text-[10px] text-text-dim hover:text-red-400 transition-colors"
                title="Xóa tất cả bộ lọc"
              >
                <X size={10} /> Xóa ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {/* Visibility filter */}
            <div>
              <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1.5">Hiển thị</p>
              <div className="flex gap-1">
                {(['all', 'public', 'private'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setFilterVisibility(v)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] border transition-colors',
                      filterVisibility === v
                        ? v === 'public'
                          ? 'border-green-500 text-green-400 bg-green-500/10 font-medium'
                          : v === 'private'
                            ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10 font-medium'
                            : 'border-accent text-accent bg-accent/10 font-medium'
                        : 'border-bg-border text-text-dim hover:text-text hover:bg-bg-hover'
                    )}
                  >
                    {v === 'all' && <><Eye size={10} /><span>Tất cả</span></>}
                    {v === 'public' && <><Globe size={10} /><span>Công khai</span></>}
                    {v === 'private' && <><Lock size={10} /><span>Riêng tư</span></>}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade dropdown */}
            <FilterDropdown
              label="Lớp"
              items={GRADES.map(String)}
              selected={filterGrades.map(String)}
              onToggle={(val) => toggleFilter(filterGrades, Number(val), setFilterGrades)}
              labelMap={Object.fromEntries(GRADES.map(g => [String(g), `Lớp ${g}`]))}
              placeholder="Tất cả lớp"
            />

            {/* Difficulty dropdown */}
            <FilterDropdown
              label="Độ khó"
              items={[...DIFF_OPTIONS]}
              selected={filterDiffs}
              onToggle={(val) => toggleFilter(filterDiffs, val, setFilterDiffs)}
              labelMap={DIFFICULTY_LABELS}
              colorMap={DIFF_DOT}
              placeholder="Tất cả độ khó"
            />

            {/* Type dropdown */}
            <FilterDropdown
              label="Loại câu"
              items={[...TYPE_OPTIONS]}
              selected={filterTypes}
              onToggle={(val) => toggleFilter(filterTypes, val, setFilterTypes)}
              labelMap={TYPE_LABELS}
              placeholder="Tất cả loại"
            />

            {/* Chapter dropdown — auto-filtered by selected grades */}
            <FilterDropdown
              label="Chương"
              items={availableChapters}
              selected={filterChapters}
              onToggle={(val) => toggleFilter(filterChapters, val, setFilterChapters)}
              placeholder={filterGrades.length > 0
                ? `Chương thuộc ${filterGrades.length === 1 ? `lớp ${filterGrades[0]}` : `${filterGrades.length} lớp`}`
                : 'Tất cả chương'
              }
            />

            {/* Filter by exam source */}
            {exams.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1.5">Nguồn đề</p>
                <select
                  value={filterExamId ?? ''}
                  onChange={e => setFilterExamId(e.target.value ? Number(e.target.value) : undefined)}
                  className={cn(
                    'w-full px-2.5 py-2 rounded-lg text-xs border transition-colors bg-transparent focus:outline-none',
                    filterExamId ? 'border-accent/50 text-accent bg-accent/5' : 'border-bg-border text-text-muted hover:border-text-dim'
                  )}
                >
                  <option value="">Tất cả nguồn</option>
                  {exams.filter(e => e.status === 'completed').map(e => (
                    <option key={e.id} value={e.id}>{e.filename}</option>
                  ))}
                </select>
              </div>
            )}

            {/* My only */}
            <button
              onClick={() => setMyOnly(m => !m)}
              className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all duration-150',
                myOnly ? 'text-accent bg-accent/10 font-medium' : 'text-text-dim hover:text-text hover:bg-bg-hover'
              )}
            >
              {myOnly ? <CheckSquare size={13} className="text-accent" /> : <Square size={13} />}
              <User size={12} />
              <span>Chỉ của tôi</span>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-text">Ngân hàng đề</h1>
            <p className="text-text-muted text-sm mt-0.5">
              {loading ? '...' : `${total.toLocaleString()} câu hỏi`}
              {filterGrades.length === 1 && <span className="text-accent ml-1">· Lớp {filterGrades[0]}</span>}
              {filterGrades.length > 1 && <span className="text-accent ml-1">· {filterGrades.length} lớp</span>}
              {myOnly && <span className="text-accent ml-1">· Của tôi</span>}
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-1 text-accent">
                  <SlidersHorizontal size={11} /> {activeFilterCount} lọc
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFindDuplicates}
              disabled={dupLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-bg-border text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
              title="Kiểm tra câu trùng lặp"
            >
              {dupLoading ? <Loader2 size={13} className="animate-spin" /> : <ScanSearch size={13} />}
              <span className="hidden sm:inline">Trùng lặp</span>
            </button>
            {dupError && <span className="text-xs text-red-400">{dupError}</span>}

            {/* Sort controls */}
            <div className="flex items-center gap-1 border border-bg-border rounded-lg overflow-hidden">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-xs text-text-muted px-2 py-2 focus:outline-none hover:text-text cursor-pointer"
              >
                <option value="created_at">Ngày tạo</option>
                <option value="difficulty">Độ khó</option>
                <option value="question_type">Loại câu</option>
              </select>
              <button
                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-2 text-text-dim hover:text-accent transition-colors border-l border-bg-border"
                title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
              >
                {sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              </button>
            </div>

            <ExportDropdown onExport={exportSelected} loading={exporting} />
          </div>
        </div>

        {/* Search + Toggle + Bulk */}
        <div className="px-6 pb-4 flex-shrink-0 space-y-3">
          <div className="flex gap-2">
            {/* Toggle filter sidebar */}
            <button
              onClick={() => setShowFilterSidebar(f => !f)}
              className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                showFilterSidebar
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-bg-border text-text-muted hover:text-text hover:bg-bg-hover'
              )}
              title={showFilterSidebar ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
            >
              <SlidersHorizontal size={14} />
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm câu hỏi..." className="input pl-10 text-sm" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors"><X size={14} /></button>}
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex gap-1.5 flex-wrap items-center">
              {filterGrades.map(g => (
                <span key={`g-${g}`} className="flex items-center gap-1.5 text-[10px] bg-accent/10 text-accent px-2 py-1 rounded-full">
                  Lớp {g}
                  <button onClick={() => toggleFilter(filterGrades, g, setFilterGrades)}><X size={9} /></button>
                </span>
              ))}
              {filterDiffs.map(d => (
                <span key={`d-${d}`} className={cn('flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full', DIFFICULTY_COLORS[d])}>
                  {DIFFICULTY_LABELS[d]}
                  <button onClick={() => toggleFilter(filterDiffs, d, setFilterDiffs)}><X size={9} /></button>
                </span>
              ))}
              {filterTypes.map(t => (
                <span key={`t-${t}`} className="flex items-center gap-1.5 text-[10px] bg-accent/10 text-accent px-2 py-1 rounded-full">
                  {TYPE_LABELS[t]}
                  <button onClick={() => toggleFilter(filterTypes, t, setFilterTypes)}><X size={9} /></button>
                </span>
              ))}
              {filterChapters.map(ch => (
                <span key={`ch-${ch}`} className="flex items-center gap-1.5 text-[10px] bg-bg-hover text-text-muted px-2 py-1 rounded-full max-w-[180px]">
                  <span className="truncate">{ch}</span>
                  <button onClick={() => toggleFilter(filterChapters, ch, setFilterChapters)} className="flex-shrink-0"><X size={9} /></button>
                </span>
              ))}
              {filterExamId && (
                <span className="flex items-center gap-1.5 text-[10px] bg-accent/10 text-accent px-2 py-1 rounded-full max-w-[180px]">
                  <FileText size={9} />
                  <span className="truncate">{exams.find(e => e.id === filterExamId)?.filename ?? `Đề #${filterExamId}`}</span>
                  <button onClick={() => setFilterExamId(undefined)} className="flex-shrink-0"><X size={9} /></button>
                </span>
              )}
              <button onClick={clearAllFilters} className="flex items-center gap-1 text-[10px] text-text-dim hover:text-red-400 transition-colors px-2 py-1">
                <X size={10} /> Xóa hết
              </button>
            </div>
          )}

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 bg-bg-card border border-bg-border rounded-xl px-4 py-2.5 animate-slide-up">
              <span className="text-xs font-medium text-accent">{selectedIds.size} đã chọn</span>
              <div className="w-px h-5 bg-bg-border" />
              {hasOwnedSelection && (
                <>
                  <button
                    onClick={() => handleBulkVisibility(true)}
                    disabled={bulkAction}
                    className="flex items-center gap-1.5 text-xs text-green-400 hover:bg-green-400/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {bulkAction ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                    Công khai
                  </button>
                  <button
                    onClick={() => handleBulkVisibility(false)}
                    disabled={bulkAction}
                    className="flex items-center gap-1.5 text-xs text-yellow-400 hover:bg-yellow-400/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {bulkAction ? <Loader2 size={12} className="animate-spin" /> : <EyeOff size={12} />}
                    Riêng tư
                  </button>
                </>
              )}
              <button
                onClick={() => setShowGenerateSimilar(true)}
                className="flex items-center gap-1.5 text-xs text-accent hover:bg-accent/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                <Sparkles size={12} /> Sinh tương tự
              </button>
              {hasOwnedSelection && (
                confirmBulkDelete ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-red-400 font-medium">Xóa {selectedOwnedIds.length} câu?</span>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkAction}
                      className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 hover:bg-red-400/20 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      {bulkAction ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                      Xác nhận
                    </button>
                    <button
                      onClick={() => setConfirmBulkDelete(false)}
                      className="text-xs text-text-dim hover:text-text px-2 py-1.5 rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmBulkDelete(true)}
                    disabled={bulkAction}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <Trash2 size={12} /> Xóa đã chọn
                  </button>
                )
              )}
              <div className="flex-1" />
              <button onClick={() => { setSelectedIds(new Set()); setConfirmBulkDelete(false) }} className="text-xs text-text-dim hover:text-text transition-colors">
                Bỏ chọn
              </button>
            </div>
          )}
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-auto px-6 pb-6 min-h-0">
          <div className="bg-bg-card border border-bg-border rounded-xl overflow-hidden">
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
                  <button onClick={clearAllFilters} className="btn-ghost text-sm mt-4">Xóa bộ lọc</button>
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
                    onReport={() => setReportingId(q.id)}
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
