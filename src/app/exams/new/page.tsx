'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { questionsApi, classesApi, assignmentsApi, generatorExportApi, generatorApi, curriculumApi, getErrorMessage } from '@/lib/api'
import type { Question, QuestionFilters, ClassRoom, GeneratorExportRequest, ExportQuestionItem, CurriculumTree } from '@/types'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, TYPE_LABELS, cn, formatDateTime } from '@/lib/utils'
import { MathText } from '@/lib/math'
import {
  Search, X, ChevronLeft, ChevronRight, Plus, Trash2, Loader2, GripVertical,
  Check, Save, Send, Download, FileText, ArrowLeft, ChevronDown,
  BookOpen, Eye, SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DIFF_OPTIONS = ['NB', 'TH', 'VD', 'VDC'] as const
const TYPE_OPTIONS = ['TN', 'TL'] as const
const GRADES = [6, 7, 8, 9, 10, 11, 12]

interface ExamQuestion {
  question: Question
  points: number
}

interface Section {
  id: string
  title: string
  questions: ExamQuestion[]
}

// ─── Send to Class Modal ───────────────────────────────────────────────────────
function SendToClassModal({ examId, onClose }: { examId: number; onClose: () => void }) {
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [classId, setClassId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    classesApi.list().then(setClasses).catch(() => {})
  }, [])

  const handleSend = async () => {
    if (!classId || !title.trim()) { setErr('Chọn lớp và nhập tiêu đề'); return }
    setSending(true); setErr('')
    try {
      await assignmentsApi.create({ class_id: classId, exam_id: examId, title: title.trim(), description: '' })
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
            <Check size={28} className="text-green-400 mx-auto mb-3" />
            <p className="font-medium text-text">Đã gửi!</p>
            <button onClick={onClose} className="btn-primary mt-4 text-sm">Đóng</button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wide">Tiêu đề bài tập</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="input w-full" placeholder="Tên bài tập..." />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1.5 block uppercase tracking-wide">Chọn lớp</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {classes.map(c => (
                    <button key={c.id} onClick={() => setClassId(c.id)}
                      className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all text-sm',
                        classId === c.id ? 'border-accent bg-accent/10 text-accent' : 'border-bg-border text-text-muted hover:bg-bg-hover'
                      )}
                    >
                      {c.name} <span className="text-[10px] text-text-dim ml-auto">Lớp {c.grade}</span>
                    </button>
                  ))}
                </div>
              </div>
              {err && <p className="text-xs text-red-400">{err}</p>}
            </div>
            <div className="px-5 py-4 border-t border-bg-border flex justify-end gap-2">
              <button onClick={onClose} className="btn-ghost text-sm">Hủy</button>
              <button onClick={handleSend} disabled={sending || !classId} className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50">
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Gửi
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Question Mini Card (in exam builder right panel) ─────────────────────────
function ExamQuestionItem({ eq, idx, onRemove, onPointsChange, onMoveUp, onMoveDown, isFirst, isLast }: {
  eq: ExamQuestion; idx: number
  onRemove: () => void
  onPointsChange: (pts: number) => void
  onMoveUp: () => void; onMoveDown: () => void
  isFirst: boolean; isLast: boolean
}) {
  const q = eq.question
  return (
    <div className="flex items-start gap-2 p-3 bg-bg-hover/30 rounded-xl border border-bg-border group">
      <div className="flex flex-col gap-0.5 flex-shrink-0 mt-1">
        <button onClick={onMoveUp} disabled={isFirst} className="w-5 h-5 flex items-center justify-center text-text-dim hover:text-accent disabled:opacity-20 transition-colors">
          <ChevronLeft size={11} className="rotate-90" />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="w-5 h-5 flex items-center justify-center text-text-dim hover:text-accent disabled:opacity-20 transition-colors">
          <ChevronRight size={11} className="rotate-90" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-[10px] text-text-dim bg-bg-card px-1.5 py-0.5 rounded">{idx + 1}</span>
          {q.question_type && <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{TYPE_LABELS[q.question_type] || q.question_type}</span>}
          {q.difficulty && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', DIFFICULTY_COLORS[q.difficulty])}>{DIFFICULTY_LABELS[q.difficulty]}</span>}
        </div>
        <p className="text-xs text-text line-clamp-2"><MathText text={q.question_text} /></p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1 bg-bg-card border border-bg-border rounded-lg px-1.5 py-1">
          <input
            type="number"
            min={0} max={100} step={0.5}
            value={eq.points}
            onChange={e => onPointsChange(Number(e.target.value))}
            className="w-10 bg-transparent text-xs text-center text-text focus:outline-none"
          />
          <span className="text-[10px] text-text-dim">đ</span>
        </div>
        <button onClick={onRemove} className="w-6 h-6 rounded-lg hover:bg-red-400/10 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
          <X size={11} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ExamBuilderPage() {
  const router = useRouter()
  // Exam metadata
  const [examTitle, setExamTitle] = useState('Đề thi')
  const [sections, setSections] = useState<Section[]>([
    { id: 'main', title: '', questions: [] },
  ])

  // Bank panel state
  const [bankQuestions, setBankQuestions] = useState<Question[]>([])
  const [bankTotal, setBankTotal] = useState(0)
  const [bankPage, setBankPage] = useState(1)
  const bankPageSize = 15
  const [bankLoading, setBankLoading] = useState(false)
  const [bankSearch, setBankSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [bankFilterType, setBankFilterType] = useState('')
  const [bankFilterDiff, setBankFilterDiff] = useState('')
  const [bankFilterGrade, setBankFilterGrade] = useState<number | ''>('')
  const [bankFilterChapter, setBankFilterChapter] = useState('')
  const [bankFilters, setBankFilters] = useState<QuestionFilters | null>(null)
  const [curriculum, setCurriculum] = useState<CurriculumTree | null>(null)

  // Save / export state
  const [saving, setSaving] = useState(false)
  const [savedExamId, setSavedExamId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const [saveError, setSaveError] = useState('')
  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const previewIframeRef = useRef<HTMLIFrameElement>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(bankSearch), 400)
    return () => clearTimeout(debounceRef.current)
  }, [bankSearch])

  useEffect(() => {
    questionsApi.getFilters().then(setBankFilters).catch(() => {})
    curriculumApi.getTree().then(setCurriculum).catch(() => {})
  }, [])

  // Chapters available for currently selected grade
  const availableChapters = useMemo(() => {
    if (!curriculum || !bankFilterGrade) return []
    const gradeData = curriculum.grades.find(g => g.grade === bankFilterGrade)
    return gradeData?.chapters ?? []
  }, [curriculum, bankFilterGrade])

  // Reset chapter when grade changes
  useEffect(() => { setBankFilterChapter('') }, [bankFilterGrade])

  // Load bank questions
  const loadBank = useCallback(async () => {
    setBankLoading(true)
    try {
      const res = await questionsApi.list({
        page: bankPage,
        page_size: bankPageSize,
        keyword: debouncedSearch || undefined,
        type: bankFilterType || undefined,
        difficulty: bankFilterDiff || undefined,
        grade: bankFilterGrade || undefined,
        chapter: bankFilterChapter || undefined,
        my_only: true,
      })
      setBankQuestions(res.items); setBankTotal(res.total)
    } catch { setBankQuestions([]) }
    finally { setBankLoading(false) }
  }, [bankPage, debouncedSearch, bankFilterType, bankFilterDiff, bankFilterGrade, bankFilterChapter])

  useEffect(() => { loadBank() }, [loadBank])
  useEffect(() => { setBankPage(1) }, [debouncedSearch, bankFilterType, bankFilterDiff, bankFilterGrade, bankFilterChapter])

  // Computed: all selected question IDs across all sections
  const selectedQuestionIds = useMemo(() => {
    const ids = new Set<number>()
    sections.forEach(s => s.questions.forEach(eq => ids.add(eq.question.id)))
    return ids
  }, [sections])

  const totalQuestions = sections.reduce((s, sec) => s + sec.questions.length, 0)
  const totalPoints = sections.reduce((s, sec) => s + sec.questions.reduce((a, eq) => a + eq.points, 0), 0)

  // Add question to section
  const addQuestion = (q: Question, sectionId: string) => {
    if (selectedQuestionIds.has(q.id)) return
    setSections(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, questions: [...s.questions, { question: q, points: 1 }] }
        : s
    ))
  }

  const removeQuestion = (sectionId: string, qIdx: number) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, questions: s.questions.filter((_, i) => i !== qIdx) }
        : s
    ))
  }

  const moveQuestion = (sectionId: string, fromIdx: number, toIdx: number) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      const qs = [...s.questions]
      const [item] = qs.splice(fromIdx, 1)
      qs.splice(toIdx, 0, item)
      return { ...s, questions: qs }
    }))
  }

  const updatePoints = (sectionId: string, qIdx: number, pts: number) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId
        ? { ...s, questions: s.questions.map((eq, i) => i === qIdx ? { ...eq, points: pts } : eq) }
        : s
    ))
  }

  const addSection = () => {
    setSections(prev => [...prev, {
      id: `sec-${Date.now()}`,
      title: `Phần ${prev.length + 1}`,
      questions: [],
    }])
  }

  const removeSection = (id: string) => {
    if (sections.length <= 1) return
    setSections(prev => prev.filter(s => s.id !== id))
  }

  // Save exam
  const handleSave = async () => {
    if (!sections.flatMap(s => s.questions).length) { setSaveError('Chưa có câu hỏi nào'); return }
    setSaving(true); setSaveError('')
    try {
      // saveAsExam expects GeneratedQuestion format: question/type (not question_text/question_type)
      const payload = sections.flatMap(s => s.questions.map(eq => ({
        question: eq.question.question_text,
        type: eq.question.question_type ?? 'TN',
        difficulty: eq.question.difficulty ?? 'TH',
        topic: eq.question.topic ?? '',
        chapter: eq.question.chapter ?? '',
        lesson_title: eq.question.lesson_title ?? '',
        grade: eq.question.grade ?? null,
        answer: eq.question.answer ?? '',
        solution_steps: eq.question.solution_steps ?? [],
      })))
      const res = await generatorApi.saveAsExam(examTitle, payload)
      setSavedExamId(res.exam_id)
    } catch (e) { setSaveError(getErrorMessage(e)) } finally { setSaving(false) }
  }

  // Build export payload (shared by preview and docx)
  const buildExportPayload = (): GeneratorExportRequest => {
    const allEqs = sections.flatMap(s => s.questions)
    return {
      questions: allEqs.map(eq => ({
        question: eq.question.question_text,
        type: eq.question.question_type,
        difficulty: eq.question.difficulty ?? '',
        topic: eq.question.topic ?? '',
        answer: eq.question.answer ?? '',
        solution_steps: eq.question.solution_steps ?? [],
      } as ExportQuestionItem)),
      title: examTitle,
      subtitle: `${totalQuestions} câu · ${totalPoints} điểm`,
      include_answers: false,
      include_solutions: false,
      group_by_diff: false,
    }
  }

  // Export DOCX
  const handleExportDocx = async () => {
    if (!totalQuestions) return
    setExporting(true); setExportError('')
    try { await generatorExportApi.docx(buildExportPayload()) }
    catch (e) { setExportError(getErrorMessage(e)) }
    finally { setExporting(false) }
  }

  // Preview PDF (renders HTML in modal)
  const handlePreview = async () => {
    if (!totalQuestions) return
    setPreviewing(true); setExportError('')
    try {
      const html = await generatorExportApi.pdf(buildExportPayload())
      setPreviewHtml(html)
      setShowPreview(true)
    } catch (e) { setExportError(getErrorMessage(e)) }
    finally { setPreviewing(false) }
  }

  // Print iframe as PDF
  const handlePrintPdf = () => {
    previewIframeRef.current?.contentWindow?.print()
  }

  const bankTotalPages = Math.ceil(bankTotal / bankPageSize)

  return (
    <div className="h-full flex flex-col">
      {showSendModal && savedExamId && (
        <SendToClassModal examId={savedExamId} onClose={() => setShowSendModal(false)} />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          {/* Preview header */}
          <div className="flex items-center gap-3 px-5 py-3 bg-bg-card border-b border-bg-border flex-shrink-0">
            <Eye size={15} className="text-accent" />
            <span className="font-semibold text-text text-sm flex-1">{examTitle}</span>
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              <Download size={13} /> Tải PDF
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-text transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {/* iframe */}
          <div className="flex-1 bg-neutral-200 overflow-hidden">
            <iframe
              ref={previewIframeRef}
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              title="Xem trước đề thi"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-bg-border flex items-center gap-4 flex-shrink-0">
        <Link href="/exams" className="w-8 h-8 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-text transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <input
          value={examTitle}
          onChange={e => setExamTitle(e.target.value)}
          className="flex-1 bg-transparent text-lg font-semibold text-text focus:outline-none border-b border-transparent focus:border-accent/50 pb-0.5 transition-colors max-w-sm"
          placeholder="Tiêu đề đề thi..."
        />
        <div className="flex items-center gap-1.5 text-xs text-text-dim ml-auto">
          <span className="text-accent font-medium">{totalQuestions}</span> câu ·
          <span className="text-accent font-medium">{totalPoints.toFixed(totalPoints % 1 ? 1 : 0)}</span> điểm
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            disabled={previewing || totalQuestions === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-bg-border text-text-muted hover:text-text hover:bg-bg-hover transition-colors disabled:opacity-40"
          >
            {previewing ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />} Xem trước
          </button>
          <button
            onClick={handleExportDocx}
            disabled={exporting || totalQuestions === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-bg-border text-text-muted hover:text-text hover:bg-bg-hover transition-colors disabled:opacity-40"
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} DOCX
          </button>
          {savedExamId && (
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <Send size={13} /> Gửi lớp
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || totalQuestions === 0}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-40"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {savedExamId ? 'Lưu lại' : 'Lưu đề'}
          </button>
        </div>
        {(saveError || exportError) && <span className="text-xs text-red-400">{saveError || exportError}</span>}
      </div>

      {/* Body: 2 columns */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Bank */}
        <div className="w-[380px] flex-shrink-0 border-r border-bg-border flex flex-col h-full">
          <div className="px-4 py-3 border-b border-bg-border flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={13} className="text-accent" />
              <span className="text-xs font-semibold text-text uppercase tracking-wider">Ngân hàng câu hỏi</span>
            </div>
            {/* Search */}
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
              <input
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                placeholder="Tìm câu hỏi..."
                className="input pl-8 text-xs w-full py-1.5"
              />
              {bankSearch && <button onClick={() => setBankSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"><X size={11} /></button>}
            </div>
            {/* Filters */}
            <div className="flex gap-1.5 flex-wrap">
              <select value={bankFilterType} onChange={e => setBankFilterType(e.target.value)}
                className="bg-bg-hover border border-bg-border rounded-lg px-2 py-1 text-[10px] text-text-muted focus:outline-none">
                <option value="">Loại câu</option>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
              <select value={bankFilterDiff} onChange={e => setBankFilterDiff(e.target.value)}
                className="bg-bg-hover border border-bg-border rounded-lg px-2 py-1 text-[10px] text-text-muted focus:outline-none">
                <option value="">Độ khó</option>
                {DIFF_OPTIONS.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
              </select>
              <select value={bankFilterGrade} onChange={e => setBankFilterGrade(e.target.value ? Number(e.target.value) : '')}
                className="bg-bg-hover border border-bg-border rounded-lg px-2 py-1 text-[10px] text-text-muted focus:outline-none">
                <option value="">Lớp</option>
                {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
              {availableChapters.length > 0 && (
                <select value={bankFilterChapter} onChange={e => setBankFilterChapter(e.target.value)}
                  className="bg-bg-hover border border-bg-border rounded-lg px-2 py-1 text-[10px] text-text-muted focus:outline-none max-w-[140px]">
                  <option value="">Chương</option>
                  {availableChapters.map(c => (
                    <option key={c.chapter_no} value={c.chapter}>{c.chapter}</option>
                  ))}
                </select>
              )}
              {(bankFilterType || bankFilterDiff || bankFilterGrade || bankFilterChapter) && (
                <button onClick={() => { setBankFilterType(''); setBankFilterDiff(''); setBankFilterGrade(''); setBankFilterChapter('') }}
                  className="text-[10px] text-text-dim hover:text-red-400 flex items-center gap-0.5">
                  <X size={9} /> Xóa
                </button>
              )}
            </div>
          </div>

          {/* Bank question list */}
          <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1.5 min-h-0">
            {bankLoading ? (
              <div className="py-8 text-center"><Loader2 size={20} className="animate-spin text-accent mx-auto" /></div>
            ) : bankQuestions.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-dim">Không có câu hỏi nào</div>
            ) : bankQuestions.map(q => {
              const alreadyAdded = selectedQuestionIds.has(q.id)
              return (
                <div
                  key={q.id}
                  className={cn(
                    'p-3 rounded-xl border transition-all cursor-pointer group',
                    alreadyAdded
                      ? 'border-accent/30 bg-accent/5 opacity-60 cursor-not-allowed'
                      : 'border-bg-border hover:border-accent/40 hover:bg-bg-hover/50'
                  )}
                  onClick={() => !alreadyAdded && addQuestion(q, sections[0].id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {q.question_type && <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">{TYPE_LABELS[q.question_type] || q.question_type}</span>}
                        {q.difficulty && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', DIFFICULTY_COLORS[q.difficulty])}>{DIFFICULTY_LABELS[q.difficulty]}</span>}
                        {q.grade && <span className="text-[10px] text-text-dim">Lớp {q.grade}</span>}
                      </div>
                      <p className="text-xs text-text line-clamp-2"><MathText text={q.question_text} /></p>
                    </div>
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                      alreadyAdded ? 'bg-accent/20 text-accent' : 'bg-bg-hover text-text-dim group-hover:bg-accent/10 group-hover:text-accent'
                    )}>
                      {alreadyAdded ? <Check size={11} /> : <Plus size={11} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bank pagination */}
          {bankTotalPages > 1 && (
            <div className="px-3 py-2 border-t border-bg-border flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] text-text-dim">{bankTotal} câu</span>
              <div className="flex gap-1">
                <button onClick={() => setBankPage(p => Math.max(1, p - 1))} disabled={bankPage === 1}
                  className="w-6 h-6 rounded btn-ghost disabled:opacity-40 flex items-center justify-center p-0 text-xs">
                  <ChevronLeft size={12} />
                </button>
                <span className="text-[10px] text-text-dim self-center px-1">{bankPage}/{bankTotalPages}</span>
                <button onClick={() => setBankPage(p => Math.min(bankTotalPages, p + 1))} disabled={bankPage === bankTotalPages}
                  className="w-6 h-6 rounded btn-ghost disabled:opacity-40 flex items-center justify-center p-0 text-xs">
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Exam builder */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto min-h-0">
          <div className="p-6 space-y-4">
            {totalQuestions === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-bg-border rounded-2xl">
                <FileText size={36} className="text-text-dim mx-auto mb-3" />
                <p className="text-text-muted font-medium">Chưa có câu hỏi nào</p>
                <p className="text-text-dim text-sm mt-1">Chọn câu từ ngân hàng bên trái để thêm vào đề</p>
              </div>
            ) : (
              sections.map((section, si) => (
                <div key={section.id} className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden">
                  {/* Section header */}
                  <div className="px-4 py-3 border-b border-bg-border bg-bg-hover/20 flex items-center gap-2">
                    {sections.length > 1 ? (
                      <input
                        value={section.title}
                        onChange={e => setSections(prev => prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                        className="flex-1 bg-transparent text-sm font-medium text-text focus:outline-none"
                        placeholder={`Phần ${si + 1}`}
                      />
                    ) : (
                      <span className="flex-1 text-sm font-medium text-text">{examTitle}</span>
                    )}
                    <span className="text-xs text-text-dim">{section.questions.length} câu</span>
                    {sections.length > 1 && (
                      <button onClick={() => removeSection(section.id)}
                        className="w-6 h-6 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  {/* Section questions */}
                  <div className="p-3 space-y-2">
                    {section.questions.length === 0 ? (
                      <div className="py-6 text-center text-xs text-text-dim">Chọn câu từ ngân hàng để thêm vào đây</div>
                    ) : section.questions.map((eq, qi) => (
                      <ExamQuestionItem
                        key={eq.question.id}
                        eq={eq}
                        idx={qi}
                        onRemove={() => removeQuestion(section.id, qi)}
                        onPointsChange={(pts) => updatePoints(section.id, qi, pts)}
                        onMoveUp={() => qi > 0 && moveQuestion(section.id, qi, qi - 1)}
                        onMoveDown={() => qi < section.questions.length - 1 && moveQuestion(section.id, qi, qi + 1)}
                        isFirst={qi === 0}
                        isLast={qi === section.questions.length - 1}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Add section button */}
            {totalQuestions > 0 && (
              <button
                onClick={addSection}
                className="w-full py-2.5 rounded-xl border border-dashed border-bg-border text-sm text-text-dim hover:text-accent hover:border-accent/40 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Thêm phần mới
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
