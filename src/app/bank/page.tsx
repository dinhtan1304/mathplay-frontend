'use client'
import { useCallback, useEffect, useState } from 'react'
import { questionsApi, bankExportApi, getErrorMessage } from '@/lib/api'
import type { Question, QuestionFilters, QuestionUpdate } from '@/types'
import {
  DIFFICULTY_LABELS, DIFFICULTY_COLORS, TYPE_LABELS, cn, formatDateTime,
} from '@/lib/utils'
import {
  Search, Filter, Download, Pencil, Trash2, X, ChevronLeft,
  ChevronRight, Check, Loader2, BookOpen,
} from 'lucide-react'

const DIFF_OPTIONS = ['NB', 'TH', 'VD', 'VDC']
const TYPE_OPTIONS = ['TN', 'TL', 'DS', 'GH']

function EditModal({ q, onSave, onClose }: {
  q: Question; onSave: (data: QuestionUpdate) => void; onClose: () => void
}) {
  const [form, setForm] = useState<QuestionUpdate>({
    question_text: q.question_text,
    question_type: q.question_type,
    difficulty: q.difficulty,
    topic: q.topic || '',
    chapter: q.chapter || '',
    answer: q.answer || '',
    solution_steps: (q.solution_steps || []).join('\n'),
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="font-semibold text-text">Chỉnh sửa câu hỏi #{q.id}</h3>
          <button onClick={onClose} className="text-text-dim hover:text-text"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Nội dung câu hỏi</label>
            <textarea
              value={form.question_text || ''}
              onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
              className="input resize-none h-28"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Loại câu</label>
              <select value={form.question_type || ''} onChange={e => setForm(f => ({ ...f, question_type: e.target.value as any }))} className="input">
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Độ khó</label>
              <select value={form.difficulty || ''} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as any }))} className="input">
                <option value="">Không xác định</option>
                {DIFF_OPTIONS.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Chủ đề</label>
              <input value={form.topic || ''} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Chương</label>
              <input value={form.chapter || ''} onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Đáp án</label>
            <input value={form.answer || ''} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Hướng dẫn giải</label>
            <textarea value={(Array.isArray(form.solution_steps) ? form.solution_steps.join('\n') : form.solution_steps || '')} onChange={e => setForm(f => ({ ...f, solution_steps: e.target.value }))} className="input resize-none h-20" />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-bg-border flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost">Hủy</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BankPage() {
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [editingQ, setEditingQ] = useState<Question | null>(null)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await questionsApi.list({
        page, page_size: pageSize,
        type: filterType || undefined,
        difficulty: filterDiff || undefined,
        topic: filterTopic || undefined,
        keyword: debouncedSearch || undefined,
      })
      setQuestions(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, filterType, filterDiff, filterTopic, debouncedSearch])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  useEffect(() => {
    questionsApi.getFilters().then(setFilters).catch(() => {})
  }, [])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [filterType, filterDiff, filterTopic, debouncedSearch])

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa câu hỏi này?')) return
    setDeleting(id)
    try {
      await questionsApi.delete(id)
      setQuestions(qs => qs.filter(q => q.id !== id))
      setTotal(t => t - 1)
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    } finally {
      setDeleting(null) }
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

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {editingQ && (
        <EditModal q={editingQ} onSave={handleUpdate} onClose={() => setEditingQ(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Ngân hàng đề</h1>
          <p className="text-text-muted text-sm mt-1">{total} câu hỏi</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-xs text-text-muted">{selectedIds.size} đã chọn</span>
          )}
          <div className="relative">
            <button
              disabled={exporting}
              onClick={() => exportSelected('docx')}
              className="btn-ghost flex items-center gap-1.5 text-sm"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Xuất DOCX
            </button>
          </div>
          <button onClick={() => exportSelected('pdf')} disabled={exporting} className="btn-ghost text-sm flex items-center gap-1.5">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm câu hỏi..."
              className="input pl-8 text-sm"
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input w-40 text-sm">
            <option value="">Tất cả loại</option>
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} className="input w-44 text-sm">
            <option value="">Tất cả độ khó</option>
            {DIFF_OPTIONS.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
          </select>
          {filters?.topics && filters.topics.length > 0 && (
            <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)} className="input w-48 text-sm">
              <option value="">Tất cả chủ đề</option>
              {filters.topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {(filterType || filterDiff || filterTopic || search) && (
            <button
              onClick={() => { setFilterType(''); setFilterDiff(''); setFilterTopic(''); setSearch('') }}
              className="btn-ghost text-sm flex items-center gap-1"
            >
              <X size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Select all */}
        <div className="px-4 py-2.5 border-b border-bg-border flex items-center gap-3 bg-bg-hover/30">
          <input
            type="checkbox"
            className="w-4 h-4 accent-accent"
            checked={selectedIds.size === questions.length && questions.length > 0}
            onChange={e => setSelectedIds(e.target.checked ? new Set(questions.map(q => q.id)) : new Set())}
          />
          <span className="text-xs text-text-dim">
            {loading ? 'Đang tải...' : `Hiển thị ${questions.length} / ${total} câu`}
          </span>
        </div>

        {loading ? (
          <div className="space-y-0">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-4 py-4 border-b border-bg-border flex gap-3 items-center">
                <div className="w-4 h-4 skeleton rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen size={32} className="text-text-dim mx-auto mb-3" />
            <div className="text-text-muted text-sm">Không tìm thấy câu hỏi nào</div>
          </div>
        ) : (
          <div>
            {questions.map(q => (
              <div key={q.id} className="table-row px-4 py-3.5 items-start gap-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-accent mt-0.5 flex-shrink-0"
                  checked={selectedIds.has(q.id)}
                  onChange={() => setSelectedIds(prev => {
                    const s = new Set(prev); s.has(q.id) ? s.delete(q.id) : s.add(q.id); return s
                  })}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {q.question_type && (
                      <span className="badge bg-accent/10 text-accent text-[10px]">{TYPE_LABELS[q.question_type]}</span>
                    )}
                    {q.difficulty && (
                      <span className={`badge text-[10px] ${DIFFICULTY_COLORS[q.difficulty]}`}>{DIFFICULTY_LABELS[q.difficulty]}</span>
                    )}
                    {q.topic && <span className="text-[10px] text-text-dim">{q.topic}</span>}
                    {q.grade && <span className="text-[10px] text-text-dim">Lớp {q.grade}</span>}
                  </div>
                  <p className="text-sm text-text line-clamp-2 leading-relaxed">{q.question_text}</p>
                  <p className="text-xs text-text-dim mt-1">{formatDateTime(q.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingQ(q)}
                    className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-accent transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deleting === q.id}
                    className="w-7 h-7 rounded-lg hover:bg-red-400/10 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors"
                  >
                    {deleting === q.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-2.5 py-1.5">
              <ChevronLeft size={16} />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={cn('w-8 h-8 rounded-lg text-sm', p === page ? 'bg-accent text-white' : 'btn-ghost')}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost px-2.5 py-1.5">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}