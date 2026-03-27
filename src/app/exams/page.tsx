'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { parserApi, classesApi, assignmentsApi, generatorExportApi, questionsApi, getErrorMessage } from '@/lib/api'
import type { Exam, ClassRoom, GeneratorExportRequest, ExportQuestionItem } from '@/types'
import { cn, formatDateTime } from '@/lib/utils'
import {
  FileText, Loader2, Trash2, Pencil, Send, Download, BookOpen,
  Upload, ChevronLeft, ChevronRight, X, Check, AlertTriangle,
  Plus, Search,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Rename Modal ──────────────────────────────────────────────────────────────
function RenameModal({ exam, onSave, onClose }: {
  exam: Exam
  onSave: (name: string) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(exam.filename)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setErr('Tên không được để trống'); return }
    setSaving(true); setErr('')
    try { await onSave(trimmed) } catch (e) { setErr(getErrorMessage(e)) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="font-semibold text-text">Đổi tên đề thi</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-4">
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="input w-full"
            placeholder="Tên đề thi..."
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
        <div className="px-5 py-4 border-t border-bg-border flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-sm">Hủy</button>
          <button onClick={submit} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ name, questionCount, onConfirm, onCancel }: {
  name: string; questionCount?: number
  onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-bg-border flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <h3 className="font-semibold text-text">Xóa đề thi</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-text-muted">
            Bạn có chắc muốn xóa <span className="text-text font-medium">"{name}"</span>?
            {(questionCount ?? 0) > 0 && (
              <span className="text-red-400"> {questionCount} câu hỏi trong ngân hàng sẽ không bị xóa.</span>
            )}
          </p>
        </div>
        <div className="px-5 py-4 border-t border-bg-border flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost text-sm">Hủy</button>
          <button onClick={onConfirm} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors font-medium">
            <Trash2 size={13} /> Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Send to Class Modal ───────────────────────────────────────────────────────
function SendToClassModal({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [classId, setClassId] = useState<number | null>(null)
  const [title, setTitle] = useState(exam.filename)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    classesApi.list().then(setClasses).catch(() => {})
  }, [])

  const handleSend = async () => {
    if (!classId || !title.trim()) { setErr('Chọn lớp và nhập tiêu đề bài tập'); return }
    setSending(true); setErr('')
    try {
      await assignmentsApi.create({
        class_id: classId,
        exam_id: exam.id,
        title: title.trim(),
        description: '',
      })
      setSent(true)
    } catch (e) { setErr(getErrorMessage(e)) } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="font-semibold text-text flex items-center gap-2"><Send size={14} className="text-accent" /> Gửi vào lớp</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim"><X size={14} /></button>
        </div>
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <Check size={20} className="text-green-400" />
            </div>
            <p className="text-text font-medium">Đã gửi thành công!</p>
            <p className="text-sm text-text-muted mt-1">Học sinh có thể làm bài trong mục Bài tập.</p>
            <button onClick={onClose} className="btn-primary mt-4 text-sm">Đóng</button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wide">Tiêu đề bài tập</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input w-full"
                  placeholder="Tên bài tập..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wide">Chọn lớp</label>
                {classes.length === 0 ? (
                  <p className="text-sm text-text-dim">Bạn chưa có lớp nào. <Link href="/classes" className="text-accent">Tạo lớp</Link></p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {classes.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setClassId(c.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                          classId === c.id
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-bg-border text-text-muted hover:text-text hover:bg-bg-hover'
                        )}
                      >
                        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', classId === c.id ? 'bg-accent' : 'bg-bg-border')} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{c.name}</div>
                          <div className="text-[10px] text-text-dim">{c.subject} · Lớp {c.grade}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {err && <p className="text-xs text-red-400">{err}</p>}
            </div>
            <div className="px-5 py-4 border-t border-bg-border flex justify-end gap-2">
              <button onClick={onClose} className="btn-ghost text-sm">Hủy</button>
              <button
                onClick={handleSend}
                disabled={sending || !classId}
                className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Gửi vào lớp
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Export Dropdown ───────────────────────────────────────────────────────────
function ExportDropdown({ exam, loading, onExport }: {
  exam: Exam
  loading: boolean
  onExport: (format: 'docx' | 'pdf') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-accent transition-colors"
        title="Xuất file"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-bg-card border border-bg-border rounded-xl shadow-2xl z-30 overflow-hidden min-w-[120px]">
          {(['docx', 'pdf'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => { onExport(fmt); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
            >
              <FileText size={11} /> {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Exam Card ─────────────────────────────────────────────────────────────────
function ExamCard({ exam, onRename, onDelete, onSendToClass, onExport, exporting }: {
  exam: Exam
  onRename: () => void
  onDelete: () => void
  onSendToClass: () => void
  onExport: (format: 'docx' | 'pdf') => void
  exporting: boolean
}) {
  const router = useRouter()

  const statusColor = {
    completed: 'text-green-400 bg-green-400/10',
    processing: 'text-blue-400 bg-blue-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    failed: 'text-red-400 bg-red-400/10',
  }[exam.status] || 'text-text-dim bg-bg-hover'

  const statusLabel = {
    completed: 'Hoàn thành',
    processing: 'Đang xử lý',
    pending: 'Chờ xử lý',
    failed: 'Thất bại',
  }[exam.status] || exam.status

  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-4 hover:border-accent/40 transition-all group">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileText size={18} className="text-accent" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-text text-sm leading-snug truncate" title={exam.filename}>
                {exam.filename}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', statusColor)}>
                  {statusLabel}
                </span>
                {(exam.question_count ?? 0) > 0 && (
                  <span className="text-[10px] text-text-dim">{exam.question_count} câu</span>
                )}
                <span className="text-[10px] text-text-dim">{formatDateTime(exam.created_at)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {exam.status === 'completed' && (
                <>
                  <button
                    onClick={() => router.push(`/bank?exam_id=${exam.id}`)}
                    className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-accent transition-colors"
                    title="Xem câu hỏi"
                  >
                    <BookOpen size={13} />
                  </button>
                  <button
                    onClick={onSendToClass}
                    className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-blue-400 transition-colors"
                    title="Gửi vào lớp"
                  >
                    <Send size={13} />
                  </button>
                  <ExportDropdown exam={exam} loading={exporting} onExport={onExport} />
                </>
              )}
              <button
                onClick={onRename}
                className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-accent transition-colors"
                title="Đổi tên"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onDelete}
                className="w-7 h-7 rounded-lg hover:bg-red-400/10 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors"
                title="Xóa"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {exam.status === 'failed' && exam.error_message && (
            <p className="text-[10px] text-red-400/80 mt-1.5 line-clamp-2">{exam.error_message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [exportError, setExportError] = useState<string | null>(null)

  const [renamingExam, setRenamingExam] = useState<Exam | null>(null)
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [sendingExam, setSendingExam] = useState<Exam | null>(null)
  const [exportingId, setExportingId] = useState<number | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const loadExams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await parserApi.listExams(page, pageSize, debouncedSearch || undefined)
      setExams(res.items); setTotal(res.total)
    } catch { setExams([]); setTotal(0) }
    finally { setLoading(false) }
  }, [page, debouncedSearch])

  useEffect(() => { loadExams() }, [loadExams])
  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const handleRename = async (name: string) => {
    if (!renamingExam) return
    const updated = await parserApi.renameExam(renamingExam.id, name)
    setExams(prev => prev.map(e => e.id === updated.id ? updated : e))
    setRenamingExam(null)
  }

  const handleDelete = async (exam: Exam) => {
    setDeleting(exam.id); setDeletingExam(null)
    try {
      await parserApi.deleteExam(exam.id)
      setExams(prev => prev.filter(e => e.id !== exam.id))
      setTotal(t => t - 1)
    } finally { setDeleting(null) }
  }

  const handleExport = async (exam: Exam, format: 'docx' | 'pdf') => {
    setExportingId(exam.id)
    try {
      // Fetch exam questions
      const res = await questionsApi.list({ exam_id: exam.id, page_size: 200 })
      const questions = res.items
      if (!questions.length) { setExportError('Không có câu hỏi để xuất'); return }

      const payload: GeneratorExportRequest = {
        questions: questions.map(q => ({
          question: q.question_text,
          type: q.question_type,
          difficulty: q.difficulty ?? '',
          topic: q.topic ?? '',
          answer: q.answer ?? '',
          solution_steps: q.solution_steps ?? [],
        } as ExportQuestionItem)),
        title: exam.filename,
        subtitle: '',
        include_answers: true,
        include_solutions: false,
        group_by_diff: false,
      }

      if (format === 'docx') {
        await generatorExportApi.docx(payload)
      } else {
        const html = await generatorExportApi.pdf(payload)
        const w = window.open('', '_blank')
        if (w) { w.document.write(html); w.document.close() }
      }
    } catch (e) {
      setExportError(getErrorMessage(e))
    } finally { setExportingId(null) }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="h-full flex flex-col">
      {renamingExam && (
        <RenameModal exam={renamingExam} onSave={handleRename} onClose={() => setRenamingExam(null)} />
      )}
      {deletingExam && (
        <DeleteConfirm
          name={deletingExam.filename}
          questionCount={deletingExam.question_count}
          onConfirm={() => handleDelete(deletingExam)}
          onCancel={() => setDeletingExam(null)}
        />
      )}
      {sendingExam && (
        <SendToClassModal exam={sendingExam} onClose={() => setSendingExam(null)} />
      )}

      {/* Export error toast */}
      {exportError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg">
          <AlertTriangle size={14} />
          {exportError}
          <button onClick={() => setExportError(null)} className="ml-1 hover:text-red-300"><X size={12} /></button>
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-text">Quản lý đề thi</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {loading ? '...' : `${total} đề thi`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/exams/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-bg-border text-text-muted hover:text-text hover:bg-bg-hover transition-colors">
            <Plus size={14} /> Soạn đề
          </Link>
          <Link href="/upload" className="btn-primary text-sm flex items-center gap-1.5">
            <Upload size={14} /> Upload đề mới
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 pb-4 flex-shrink-0">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên..."
            className="input pl-9 text-sm w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6 min-h-0">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-bg-card border border-bg-border rounded-xl p-4 space-y-2">
                <div className="flex gap-3">
                  <div className="w-10 h-10 skeleton rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 skeleton rounded w-3/4" />
                    <div className="flex gap-2"><div className="h-3 skeleton rounded-full w-16" /><div className="h-3 skeleton rounded w-12" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bg-hover flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-text-dim" />
            </div>
            <div className="text-text-muted font-medium">
              {search ? 'Không tìm thấy đề thi phù hợp' : 'Chưa có đề thi nào'}
            </div>
            <div className="text-text-dim text-sm mt-1">
              {search ? 'Thử từ khóa khác' : 'Upload hoặc tạo đề thi để bắt đầu'}
            </div>
            {!search && (
              <Link href="/upload" className="btn-primary text-sm mt-4 inline-flex items-center gap-1.5">
                <Upload size={14} /> Upload đề thi
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map(exam => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onRename={() => setRenamingExam(exam)}
                onDelete={() => setDeletingExam(exam)}
                onSendToClass={() => setSendingExam(exam)}
                onExport={(fmt) => handleExport(exam, fmt)}
                exporting={exportingId === exam.id}
              />
            ))}
          </div>
        )}

      </div>

      {/* Pagination — outside scroll container so always visible */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-bg-border shrink-0">
          <span className="text-sm text-text-muted">Trang <span className="text-text font-medium">{page}</span> / {totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg btn-ghost disabled:opacity-40 flex items-center justify-center p-0"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg btn-ghost disabled:opacity-40 flex items-center justify-center p-0"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
