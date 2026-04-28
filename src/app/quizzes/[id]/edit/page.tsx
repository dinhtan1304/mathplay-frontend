'use client'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { quizApi, questionsApi, mediaApi, getErrorMessage } from '@/lib/api'
import type {
  Quiz, QuizQuestion, QuizQuestionCreate, QuizTheory,
  QuizQuestionType, ChoiceItem, ReorderItem, Question,
  ImportQuestionsResult, SolutionData, MediaObject,
} from '@/types'
import { cn, formatDateTime } from '@/lib/utils'
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical,
  Settings, BookOpen, Import, Send, Archive, FileUp, Download,
  CheckSquare, ListOrdered, Type, ToggleLeft, FileText,
  ChevronDown, ChevronUp, X, Search, Check, Lightbulb, AlertTriangle, Pencil, ImagePlus, Volume2, Link2,
} from 'lucide-react'
import { MathText } from '@/lib/math'
import { QuizMedia } from '@/components/ui/QuizMedia'

const QUESTION_TYPE_OPTIONS: { value: QuizQuestionType; label: string; icon: typeof CheckSquare }[] = [
  { value: 'multiple_choice', label: 'Trắc nghiệm', icon: CheckSquare },
  { value: 'checkbox', label: 'Nhiều đáp án', icon: CheckSquare },
  { value: 'fill_blank', label: 'Điền chỗ trống', icon: Type },
  { value: 'reorder', label: 'Sắp xếp', icon: ListOrdered },
  { value: 'true_false', label: 'Đúng/Sai', icon: ToggleLeft },
  { value: 'essay', label: 'Tự luận', icon: FileText },
]

// ─── Import Result Banner ───────────────────────────────────────────────────
const SKIP_REASON_LABELS: Record<string, string> = {
  no_access: 'Không có quyền truy cập',
  empty_text: 'Câu hỏi trống (không có nội dung)',
  convert_error: 'Lỗi chuyển đổi định dạng',
}

function ImportResultBanner({ result, onClose }: {
  result: ImportQuestionsResult
  onClose: () => void
}) {
  const allSuccess = result.skipped_count === 0
  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-2',
      allSuccess ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {allSuccess
            ? <Check size={16} className="text-green-400" />
            : <AlertTriangle size={16} className="text-yellow-400" />
          }
          <span className="text-sm font-medium text-text">
            Import {result.imported_count}/{result.total_requested} câu thành công
          </span>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-md hover:bg-bg-hover flex items-center justify-center text-text-dim">
          <X size={12} />
        </button>
      </div>
      {result.skipped_count > 0 && (
        <div className="space-y-1.5 pl-6">
          <p className="text-xs text-yellow-400 font-medium">
            {result.skipped_count} câu không import được:
          </p>
          {result.skipped.map((s, i) => (
            <div key={i} className="text-xs text-text-dim flex items-center gap-1.5">
              <span className="text-yellow-400/70">#{s.question_id}</span>
              <span>{SKIP_REASON_LABELS[s.reason] || s.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Bank Import Modal ──────────────────────────────────────────────────────
function BankImportModal({ quizId, onDone, onClose }: {
  quizId: number
  onDone: () => void
  onClose: () => void
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [targetType, setTargetType] = useState('auto')
  const [importResult, setImportResult] = useState<ImportQuestionsResult | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await questionsApi.list({
          page, page_size: 20,
          keyword: search || undefined,
          my_only: true,
        })
        setQuestions(res.items)
        setTotal(res.total)
      } catch (e) {
        console.error(e)
        setError(getErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, search])

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleImport = async () => {
    if (selected.size === 0) return
    setImporting(true)
    setImportResult(null)
    try {
      const effectiveType = targetType === 'auto' ? undefined : targetType
      const result = await quizApi.importQuestions(quizId, Array.from(selected), 'bank_import', effectiveType)
      setImportResult(result)
      onDone()
      // Auto-close after 2s if all succeeded
      if (result.skipped_count === 0) {
        setTimeout(onClose, 2000)
      }
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between shrink-0">
          <h3 className="font-semibold text-text">Import từ Bank ({selected.size} đã chọn)</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim"><X size={14} /></button>
        </div>

        {/* Import result banner */}
        {importResult && (
          <div className="px-4 pt-4 shrink-0">
            <ImportResultBanner result={importResult} onClose={() => setImportResult(null)} />
          </div>
        )}

        <div className="p-4 border-b border-bg-border shrink-0 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm câu hỏi..."
              className="input w-full pl-10"
            />
          </div>
          <div>
            <p className="text-xs text-text-dim mb-1.5">Loại câu hỏi khi import:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTargetType('auto')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  targetType === 'auto'
                    ? 'bg-primary text-white'
                    : 'bg-bg text-text-dim hover:bg-bg-hover border border-bg-border'
                )}
              >
                Tự động
              </button>
              {QUESTION_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTargetType(opt.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    targetType === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-bg text-text-dim hover:bg-bg-hover border border-bg-border'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary" /></div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-400 text-sm mb-2">Không thể tải câu hỏi từ bank</p>
              <p className="text-xs text-text-dim">{error}</p>
              <button onClick={() => setPage(p => p)} className="btn-ghost text-xs mt-3">Thử lại</button>
            </div>
          ) : questions.length === 0 ? (
            <p className="text-center text-text-dim py-10">Không tìm thấy câu hỏi</p>
          ) : questions.map(q => (
            <button
              key={q.id}
              onClick={() => toggle(q.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors',
                selected.has(q.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-bg-border hover:border-primary/30 bg-bg'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors',
                  selected.has(q.id) ? 'border-primary bg-primary' : 'border-bg-border'
                )}>
                  {selected.has(q.id) && <Check size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <MathText text={q.question_text} className="text-sm text-text line-clamp-2" />
                  <div className="flex gap-2 mt-1 text-[11px] text-text-dim">
                    <span>{q.question_type}</span>
                    {q.difficulty && <span>{q.difficulty}</span>}
                    {q.answer && <span className="text-green-400">Có đáp án</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-bg-border flex items-center justify-between shrink-0">
          <span className="text-xs text-text-dim">{total} câu hỏi trong bank</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">
              {importResult ? 'Đóng' : 'Hủy'}
            </button>
            {!importResult && (
              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {importing ? <Loader2 size={13} className="animate-spin" /> : <Import size={13} />}
                Import {selected.size} câu{targetType !== 'auto' && ` → ${QUESTION_TYPE_OPTIONS.find(o => o.value === targetType)?.label}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── File Import Modal ─────────────────────────────────────────────────────
const VALID_TYPES = ['multiple_choice', 'checkbox', 'fill_blank', 'reorder', 'true_false', 'essay'] as const

function validateQuestion(q: Record<string, unknown>, idx: number): string[] {
  const errs: string[] = []
  if (!q.type || !VALID_TYPES.includes(q.type as typeof VALID_TYPES[number]))
    errs.push(`type không hợp lệ: "${q.type ?? 'missing'}"`)
  if (!q.question_text || typeof q.question_text !== 'string' || !(q.question_text as string).trim())
    errs.push('Thiếu question_text')
  if ((q.type === 'multiple_choice' || q.type === 'checkbox') && (!Array.isArray(q.choices) || q.choices.length < 2))
    errs.push('choices cần ≥ 2 items')
  if (q.type === 'reorder' && (!Array.isArray(q.items) || q.items.length < 2))
    errs.push('items cần ≥ 2')

  // Answer consistency checks
  if (q.type === 'multiple_choice' && q.answer && Array.isArray(q.choices)) {
    const keys = (q.choices as { key: string }[]).map(c => c.key)
    if (!keys.includes(q.answer as string))
      errs.push(`answer "${q.answer}" không nằm trong choices [${keys.join(',')}]`)
  }
  if (q.type === 'checkbox' && Array.isArray(q.answer) && Array.isArray(q.choices)) {
    const keys = new Set((q.choices as { key: string }[]).map(c => c.key))
    const invalid = (q.answer as string[]).filter(k => !keys.has(k))
    if (invalid.length > 0)
      errs.push(`answer keys [${invalid.join(',')}] không nằm trong choices`)
  }
  if (q.type === 'reorder' && Array.isArray(q.answer) && Array.isArray(q.items)) {
    const ids = new Set((q.items as { id: string }[]).map(i => i.id))
    const invalid = (q.answer as string[]).filter(id => !ids.has(id))
    if (invalid.length > 0)
      errs.push(`answer IDs [${invalid.join(',')}] không nằm trong items`)
  }

  return errs
}

function FileImportModal({ quizId, onDone, onClose }: {
  quizId: number
  onDone: () => void
  onClose: () => void
}) {
  const [phase, setPhase] = useState<'select' | 'preview' | 'importing'>('select')
  const [parsed, setParsed] = useState<Record<string, unknown>[]>([])
  const [validationErrors, setValidationErrors] = useState<{ index: number; msgs: string[] }[]>([])
  const [error, setError] = useState('')
  const [importError, setImportError] = useState('')

  const validQuestions = parsed.filter((_, i) => !validationErrors.find(e => e.index === i))

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleFile = (file: File) => {
    setError('')
    if (file.size > MAX_FILE_SIZE) {
      setError(`File quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 5MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string)
        let arr: Record<string, unknown>[]
        if (Array.isArray(raw)) {
          arr = raw
        } else if (raw && Array.isArray(raw.questions)) {
          arr = raw.questions
        } else {
          setError('JSON phải là array hoặc object có key "questions"')
          return
        }
        if (arr.length === 0) {
          setError('File không có câu hỏi nào')
          return
        }
        setParsed(arr)
        const errs: { index: number; msgs: string[] }[] = []
        arr.forEach((q, i) => {
          const msgs = validateQuestion(q, i)
          if (msgs.length > 0) errs.push({ index: i, msgs })
        })
        setValidationErrors(errs)
        setPhase('preview')
      } catch {
        setError('File JSON không hợp lệ')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (validQuestions.length === 0) return
    setPhase('importing')
    setImportError('')
    try {
      // Chunk to avoid payload size limits and provide progress
      let totalSkipped = 0
      const CHUNK_SIZE = 25
      for (let i = 0; i < validQuestions.length; i += CHUNK_SIZE) {
        const chunk = validQuestions.slice(i, i + CHUNK_SIZE)
        const result = await quizApi.batchCreateQuestions(quizId, chunk as unknown as QuizQuestionCreate[])
        totalSkipped += result.skipped
      }
      onDone()
      if (totalSkipped > 0) {
        setImportError(`Import thành công! Đã bỏ qua ${totalSkipped} câu trùng lặp.`)
        setTimeout(onClose, 2000)
      } else {
        onClose()
      }
    } catch (e) {
      setImportError(getErrorMessage(e))
      setPhase('preview')
    }
  }

  // Type breakdown for preview
  const typeBreakdown = QUESTION_TYPE_OPTIONS.map(opt => ({
    ...opt,
    count: validQuestions.filter(q => q.type === opt.value).length,
  })).filter(t => t.count > 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between shrink-0">
          <h3 className="font-semibold text-text flex items-center gap-2">
            <FileUp size={16} className="text-primary" /> Import từ JSON
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Phase: Select */}
          {phase === 'select' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-bg-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
                onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                onDrop={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  const f = e.dataTransfer.files[0]
                  if (f) handleFile(f)
                }}
                onClick={() => document.getElementById('json-file-input')?.click()}
              >
                <FileUp size={36} className="mx-auto text-text-dim mb-3" />
                <p className="text-sm text-text mb-1">Kéo thả file JSON hoặc bấm để chọn</p>
                <p className="text-xs text-text-dim">Hỗ trợ file .json</p>
                <input
                  id="json-file-input"
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm flex items-center gap-1.5">
                  <AlertTriangle size={14} /> {error}
                </p>
              )}
              {/* Format example */}
              <details className="text-xs">
                <summary className="text-text-dim cursor-pointer hover:text-text">Xem format mẫu (tất cả 6 loại)</summary>
                <pre className="mt-2 bg-bg rounded-lg p-3 text-text-dim overflow-x-auto text-[11px] leading-relaxed">{`[
  {
    "type": "multiple_choice",
    "question_text": "Cho $f(x) = x^2 - 5x + 6$. Tìm nghiệm của f(x) = 0",
    "choices": [
      {"key": "A", "text": "$x = 1$ hoặc $x = 6$", "is_correct": false},
      {"key": "B", "text": "$x = 2$ hoặc $x = 3$", "is_correct": true},
      {"key": "C", "text": "$x = -2$ hoặc $x = -3$", "is_correct": false},
      {"key": "D", "text": "$x = 0$ hoặc $x = 5$", "is_correct": false}
    ],
    "answer": "B",
    "points": 2,
    "difficulty": "medium",
    "subject_code": "toan",
    "tags": ["dai-so", "phuong-trinh"],
    "solution": {
      "steps": ["Phân tích: $x^2 - 5x + 6 = (x-2)(x-3)$", "Nghiệm: $x = 2$ hoặc $x = 3$"],
      "explanation": "Dùng phương pháp phân tích thành nhân tử"
    }
  },
  {
    "type": "checkbox",
    "question_text": "Chọn các số nguyên tố nhỏ hơn 20",
    "choices": [
      {"key": "A", "text": "2", "is_correct": true},
      {"key": "B", "text": "9", "is_correct": false},
      {"key": "C", "text": "11", "is_correct": true},
      {"key": "D", "text": "15", "is_correct": false},
      {"key": "E", "text": "17", "is_correct": true}
    ],
    "answer": ["A", "C", "E"],
    "points": 2,
    "difficulty": "easy"
  },
  {
    "type": "fill_blank",
    "question_text": "Giá trị của $\\\\sqrt{144}$ = ___",
    "answer": {"B1": "12"},
    "points": 1,
    "difficulty": "easy"
  },
  {
    "type": "true_false",
    "question_text": "Tổng ba góc trong một tam giác bằng $180°$",
    "answer": true,
    "points": 1,
    "difficulty": "easy"
  },
  {
    "type": "reorder",
    "question_text": "Sắp xếp các bước giải phương trình $2x + 3 = 7$",
    "items": [
      {"id": "I1", "text": "$2x + 3 = 7$"},
      {"id": "I2", "text": "$2x = 7 - 3$"},
      {"id": "I3", "text": "$2x = 4$"},
      {"id": "I4", "text": "$x = 2$"}
    ],
    "answer": ["I1", "I2", "I3", "I4"],
    "points": 2,
    "difficulty": "medium"
  },
  {
    "type": "essay",
    "question_text": "Chứng minh rằng $\\\\sqrt{2}$ là số vô tỉ",
    "has_correct_answer": false,
    "points": 5,
    "difficulty": "hard"
  }
]`}</pre>
              </details>
              <div className="text-[11px] text-text-dim space-y-1 mt-1">
                <p><strong>Các trường chung:</strong> type*, question_text*, points, difficulty (easy/medium/hard/expert), tags, subject_code, solution, time_limit_seconds</p>
                <p><strong>multiple_choice/checkbox:</strong> choices* (key, text, is_correct), answer (key hoặc [keys])</p>
                <p><strong>fill_blank:</strong> answer ({`{"B1": "đáp án"}`})</p>
                <p><strong>true_false:</strong> answer (true/false)</p>
                <p><strong>reorder:</strong> items* (id, text), answer ([id theo thứ tự đúng])</p>
                <p><strong>essay:</strong> has_correct_answer: false</p>
                <p className="text-text-dim/60">* = bắt buộc. Hỗ trợ LaTeX: dùng $...$ cho inline</p>
              </div>
            </div>
          )}

          {/* Phase: Preview */}
          {(phase === 'preview' || phase === 'importing') && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-bg rounded-xl p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{validQuestions.length}</p>
                    <p className="text-[10px] text-text-dim">hợp lệ</p>
                  </div>
                  {validationErrors.length > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{validationErrors.length}</p>
                      <p className="text-[10px] text-text-dim">lỗi</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text">{parsed.length}</p>
                    <p className="text-[10px] text-text-dim">tổng</p>
                  </div>
                </div>
                {typeBreakdown.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {typeBreakdown.map(t => (
                      <span key={t.value} className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {t.label}: {t.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {importError && (
                <p className="text-red-400 text-sm flex items-center gap-1.5">
                  <AlertTriangle size={14} /> {importError}
                </p>
              )}

              {/* Question list */}
              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                {parsed.map((q, i) => {
                  const errs = validationErrors.find(e => e.index === i)
                  const typeLabel = QUESTION_TYPE_OPTIONS.find(o => o.value === q.type)?.label || String(q.type || '?')
                  return (
                    <div key={i} className={cn(
                      'rounded-lg px-3 py-2 text-sm border',
                      errs ? 'border-red-400/30 bg-red-400/5' : 'border-bg-border bg-bg'
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-text-dim w-6">#{i + 1}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                          errs ? 'text-red-400 bg-red-400/10' : 'text-primary bg-primary/10'
                        )}>
                          {typeLabel}
                        </span>
                        <span className="text-text truncate flex-1">
                          {(q.question_text as string)?.slice(0, 80) || '(trống)'}
                        </span>
                        {!errs && <Check size={12} className="text-green-400 shrink-0" />}
                      </div>
                      {errs && (
                        <div className="mt-1 ml-8">
                          {errs.msgs.map((m, j) => (
                            <p key={j} className="text-[11px] text-red-400">• {m}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-bg-border flex items-center justify-between shrink-0">
          {phase === 'select' ? (
            <>
              <span />
              <button onClick={onClose} className="btn-ghost text-sm">Đóng</button>
            </>
          ) : (
            <>
              <button onClick={() => { setPhase('select'); setParsed([]); setValidationErrors([]); setError(''); setImportError('') }} className="btn-ghost text-sm">
                ← Chọn file khác
              </button>
              <button
                onClick={handleImport}
                disabled={phase === 'importing' || validQuestions.length === 0}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {phase === 'importing' ? <Loader2 size={13} className="animate-spin" /> : <Import size={13} />}
                Import {validQuestions.length} câu hỏi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add Question Form ──────────────────────────────────────────────────────
function AddQuestionForm({ quizId, theories, onAdded, onClose }: {
  quizId: number
  theories: QuizTheory[]
  onAdded: () => void
  onClose: () => void
}) {
  const [type, setType] = useState<QuizQuestionType>('multiple_choice')
  const [text, setText] = useState('')
  const [choices, setChoices] = useState<ChoiceItem[]>([
    { key: 'A', text: '', is_correct: true },
    { key: 'B', text: '', is_correct: false },
    { key: 'C', text: '', is_correct: false },
    { key: 'D', text: '', is_correct: false },
  ])
  const [items, setItems] = useState<ReorderItem[]>([
    { id: 'I1', text: '' }, { id: 'I2', text: '' }, { id: 'I3', text: '' },
  ])
  const [answer, setAnswer] = useState<string>('')
  const [points, setPoints] = useState(1)
  const [difficulty, setDifficulty] = useState('medium')
  const [hintSectionId, setHintSectionId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const data: QuizQuestionCreate = {
        type, question_text: text, points,
        difficulty: difficulty as QuizQuestionCreate['difficulty'],
        hint_section_id: hintSectionId,
      }

      if (type === 'multiple_choice') {
        data.choices = choices
        data.answer = choices.find(c => c.is_correct)?.key || 'A'
      } else if (type === 'checkbox') {
        data.choices = choices
        data.answer = choices.filter(c => c.is_correct).map(c => c.key)
      } else if (type === 'fill_blank') {
        data.answer = { B1: answer }
      } else if (type === 'reorder') {
        data.items = items.filter(i => i.text.trim())
        data.answer = data.items.map(i => i.id)
      } else if (type === 'true_false') {
        data.answer = answer === 'true'
      } else if (type === 'essay') {
        data.has_correct_answer = false
      }

      await quizApi.addQuestion(quizId, data)
      onAdded()
      onClose()
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-bg-card border border-primary/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-text text-sm">Thêm câu hỏi mới</h4>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim"><X size={14} /></button>
      </div>

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {QUESTION_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setType(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              type === opt.value
                ? 'bg-primary text-white'
                : 'bg-bg text-text-dim hover:bg-bg-hover border border-bg-border'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Question text */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Nội dung câu hỏi..."
        className="input w-full min-h-[80px] resize-y"
        rows={3}
      />

      {/* Type-specific fields */}
      {(type === 'multiple_choice' || type === 'checkbox') && (
        <div className="space-y-2">
          <p className="text-xs text-text-dim">
            {type === 'multiple_choice' ? 'Chọn 1 đáp án đúng:' : 'Chọn các đáp án đúng:'}
          </p>
          {choices.map((c, i) => (
            <div key={c.key} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (type === 'multiple_choice') {
                    setChoices(prev => prev.map((ch, j) => ({ ...ch, is_correct: j === i })))
                  } else {
                    setChoices(prev => prev.map((ch, j) => j === i ? { ...ch, is_correct: !ch.is_correct } : ch))
                  }
                }}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  c.is_correct ? 'border-green-400 bg-green-400' : 'border-bg-border hover:border-primary'
                )}
              >
                {c.is_correct && <Check size={12} className="text-white" />}
              </button>
              <span className="text-sm font-medium text-text-dim w-6">{c.key}.</span>
              <input
                value={c.text}
                onChange={e => setChoices(prev => prev.map((ch, j) => j === i ? { ...ch, text: e.target.value } : ch))}
                placeholder={`Đáp án ${c.key}`}
                className="input flex-1"
              />
            </div>
          ))}
          <button
            onClick={() => {
              const next = String.fromCharCode(65 + choices.length)
              setChoices(prev => [...prev, { key: next, text: '', is_correct: false }])
            }}
            className="text-xs text-primary hover:underline"
          >
            + Thêm đáp án
          </button>
        </div>
      )}

      {type === 'fill_blank' && (
        <div>
          <p className="text-xs text-text-dim mb-1">Đáp án:</p>
          <input value={answer} onChange={e => setAnswer(e.target.value)} className="input w-full" placeholder="Đáp án đúng" />
        </div>
      )}

      {type === 'reorder' && (
        <div className="space-y-2">
          <p className="text-xs text-text-dim">Các mục (theo đúng thứ tự):</p>
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-sm text-text-dim w-6">{i + 1}.</span>
              <input
                value={item.text}
                onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, text: e.target.value } : it))}
                className="input flex-1"
                placeholder={`Mục ${i + 1}`}
              />
            </div>
          ))}
          <button
            onClick={() => setItems(prev => [...prev, { id: `I${prev.length + 1}`, text: '' }])}
            className="text-xs text-primary hover:underline"
          >
            + Thêm mục
          </button>
        </div>
      )}

      {type === 'true_false' && (
        <div className="flex gap-3">
          {['true', 'false'].map(v => (
            <button
              key={v}
              onClick={() => setAnswer(v)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                answer === v ? 'border-primary bg-primary/10 text-primary' : 'border-bg-border text-text-dim hover:border-primary/30'
              )}
            >
              {v === 'true' ? 'Đúng' : 'Sai'}
            </button>
          ))}
        </div>
      )}

      {/* Points & difficulty */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-text-dim mb-1 block">Điểm</label>
          <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} className="input w-full" min={0} step={0.5} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-text-dim mb-1 block">Độ khó</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input w-full">
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
            <option value="expert">Chuyên gia</option>
          </select>
        </div>
      </div>

      {/* Hint assignment */}
      {theories.length > 0 && (
        <div>
          <label className="text-xs text-text-dim mb-1 block flex items-center gap-1">
            <Lightbulb size={11} className="text-yellow-400" /> Gợi ý (lý thuyết)
          </label>
          <select
            value={hintSectionId ?? ''}
            onChange={e => setHintSectionId(e.target.value ? Number(e.target.value) : null)}
            className="input w-full text-sm"
          >
            <option value="">Không gán gợi ý</option>
            {theories.map(t =>
              t.sections.map(s => (
                <option key={s.id} value={s.id}>
                  {t.title}{t.sections.length > 1 ? ` — Mục ${s.order + 1}` : ''}: {s.content.slice(0, 50)}...
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost text-sm">Hủy</button>
        <button onClick={handleSave} disabled={saving || !text.trim()} className="btn-primary text-sm flex items-center gap-1.5">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Thêm câu hỏi
        </button>
      </div>
    </div>
  )
}

// ─── Question Card ──────────────────────────────────────────────────────────
function QuestionCard({ q, quizId, theories, onDelete, onUpdate }: {
  q: QuizQuestion
  quizId: number
  theories: QuizTheory[]
  onDelete: () => void
  onUpdate: (updated: QuizQuestion) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingHint, setSavingHint] = useState(false)
  const typeLabel = QUESTION_TYPE_OPTIONS.find(o => o.value === q.type)?.label || q.type

  // Edit state
  const sol = (q.solution ?? { steps: [], explanation: null }) as SolutionData
  const [editText, setEditText] = useState(q.question_text)
  const [editChoices, setEditChoices] = useState<ChoiceItem[]>(q.choices || [])
  const [editAnswer, setEditAnswer] = useState<string>(
    typeof q.answer === 'string' ? q.answer
    : q.answer === true ? 'true'
    : q.answer === false ? 'false'
    : typeof q.answer === 'object' && q.answer !== null ? (q.answer as Record<string, string>).B1 ?? ''
    : ''
  )
  const [editItems, setEditItems] = useState<ReorderItem[]>((q.items as ReorderItem[]) || [])
  const [editPoints, setEditPoints] = useState(q.points)
  const [editSteps, setEditSteps] = useState<string[]>(sol.steps || [])
  const [editExplanation, setEditExplanation] = useState(sol.explanation || '')
  const [editDifficulty, setEditDifficulty] = useState<string>(q.difficulty || '')
  const [editMedia, setEditMedia] = useState<MediaObject | null>(q.media || null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaInputMode, setMediaInputMode] = useState<'upload' | 'url'>('upload')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaUrlType, setMediaUrlType] = useState<'image' | 'audio'>('image')

  const resetEdit = () => {
    setEditText(q.question_text)
    setEditChoices(q.choices || [])
    setEditItems((q.items as ReorderItem[]) || [])
    setEditPoints(q.points)
    setEditDifficulty(q.difficulty || '')
    setEditMedia(q.media || null)
    setMediaUrl('')
    setMediaUrlType('image')
    setMediaInputMode('upload')
    const s = (q.solution ?? { steps: [], explanation: null }) as SolutionData
    setEditSteps(s.steps || [])
    setEditExplanation(s.explanation || '')
    setEditAnswer(
      typeof q.answer === 'string' ? q.answer
      : q.answer === true ? 'true'
      : q.answer === false ? 'false'
      : typeof q.answer === 'object' && q.answer !== null ? (q.answer as Record<string, string>).B1 ?? ''
      : ''
    )
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const data: Partial<QuizQuestionCreate> = {
        question_text: editText,
        points: editPoints,
        difficulty: (editDifficulty || undefined) as QuizQuestionCreate['difficulty'],
        media: editMedia || undefined,
        solution: (editSteps.some(s => s.trim()) || editExplanation.trim())
          ? { steps: editSteps.filter(s => s.trim()), explanation: editExplanation.trim() || undefined }
          : undefined,
      }

      if (q.type === 'multiple_choice') {
        data.choices = editChoices
        data.answer = editChoices.find(c => c.is_correct)?.key || 'A'
      } else if (q.type === 'checkbox') {
        data.choices = editChoices
        data.answer = editChoices.filter(c => c.is_correct).map(c => c.key)
      } else if (q.type === 'fill_blank') {
        data.answer = { B1: editAnswer }
      } else if (q.type === 'reorder') {
        data.items = editItems.filter(i => i.text.trim())
        data.answer = data.items.map(i => i.id)
      } else if (q.type === 'true_false') {
        data.answer = editAnswer === 'true'
      }

      const updated = await quizApi.updateQuestion(quizId, q.id, data)
      onUpdate(updated)
      setEditing(false)
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  // Flatten all theory sections for the dropdown
  const allSections = theories.flatMap(t =>
    t.sections.map(s => ({ sectionId: s.id, theoryTitle: t.title, sectionOrder: s.order, preview: s.content.slice(0, 60) }))
  )
  const currentHint = allSections.find(s => s.sectionId === q.hint_section_id)

  const handleHintChange = async (sectionId: number | null) => {
    setSavingHint(true)
    try {
      const updated = await quizApi.updateQuestion(quizId, q.id, { hint_section_id: sectionId })
      onUpdate(updated)
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSavingHint(false)
    }
  }

  return (
    <div className="bg-bg border border-bg-border rounded-lg overflow-hidden">
      <div
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-bg-hover/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical size={14} className="text-text-dim shrink-0" />
        <span className="text-xs font-mono text-text-dim w-6">#{q.order + 1}</span>
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', {
          'text-blue-400 bg-blue-400/10': q.type === 'multiple_choice',
          'text-purple-400 bg-purple-400/10': q.type === 'checkbox',
          'text-yellow-400 bg-yellow-400/10': q.type === 'fill_blank',
          'text-orange-400 bg-orange-400/10': q.type === 'reorder',
          'text-green-400 bg-green-400/10': q.type === 'true_false',
          'text-text-dim bg-bg-hover': q.type === 'essay',
        })}>
          {typeLabel}
        </span>
        <MathText text={q.question_text} className="flex-1 text-sm text-text truncate" />
        {q.difficulty && (
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', {
            'text-green-400 bg-green-400/10': q.difficulty === 'easy',
            'text-yellow-400 bg-yellow-400/10': q.difficulty === 'medium',
            'text-orange-400 bg-orange-400/10': q.difficulty === 'hard',
            'text-red-400 bg-red-400/10': q.difficulty === 'expert',
          })}>
            {{ easy: 'Dễ', medium: 'TB', hard: 'Khó', expert: 'CG' }[q.difficulty]}
          </span>
        )}
        <span className="text-xs text-text-dim">{q.points}đ</span>
        {q.hint_section_id && <Lightbulb size={12} className="text-yellow-400 shrink-0" />}
        {q.source_type !== 'manual' && (
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            {q.source_type === 'bank_import' ? 'Bank' : 'File'}
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="w-6 h-6 rounded hover:bg-red-500/20 flex items-center justify-center text-text-dim hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
        {expanded ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
      </div>
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-bg-border space-y-3">
          {/* Edit / View toggle */}
          {!editing && (
            <div className="flex justify-end">
              <button
                onClick={() => { resetEdit(); setEditing(true) }}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <Pencil size={11} /> Chỉnh sửa
              </button>
            </div>
          )}

          {/* ─── VIEW MODE ─── */}
          {!editing && (
            <>
              <MathText text={q.question_text} className="text-sm text-text whitespace-pre-wrap" block />
              {q.media?.url && <QuizMedia media={q.media} size="md" className="mt-2" />}
              {q.choices && (
                <div className="space-y-1">
                  {q.choices.map((c: ChoiceItem) => (
                    <div key={c.key} className={cn('text-sm px-2 py-1 rounded', c.is_correct ? 'text-green-400 bg-green-400/5' : 'text-text-dim')}>
                      {c.key}. <MathText text={c.text} /> {c.is_correct && '✓'}
                      {c.media?.url && <QuizMedia media={c.media} size="sm" className="mt-1 ml-4" />}
                    </div>
                  ))}
                </div>
              )}
              {q.items && (
                <div className="space-y-1">
                  {(q.items as ReorderItem[]).map((item, i) => (
                    <div key={item.id} className="text-sm text-text-dim px-2 py-1">
                      {i + 1}. {item.text}
                    </div>
                  ))}
                </div>
              )}
              {q.type === 'fill_blank' && q.answer && (
                <div className="text-sm text-green-400 px-2">
                  Đáp án: {typeof q.answer === 'object'
                    ? Object.entries(q.answer as Record<string, unknown>).map(([k, v]) =>
                        `${k}: ${typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}`
                      ).join(', ')
                    : String(q.answer)}
                </div>
              )}
              {q.type === 'true_false' && q.answer !== null && (
                <div className="text-sm text-green-400 px-2">
                  Đáp án: {q.answer === true ? 'Đúng' : 'Sai'}
                </div>
              )}

              {/* Solution — view */}
              {sol.steps?.length > 0 || sol.explanation ? (
                <div className="bg-bg-hover/50 rounded-lg p-3 space-y-2 border border-bg-border/50">
                  <p className="text-xs font-medium text-text flex items-center gap-1.5">
                    <BookOpen size={12} className="text-primary" /> Lời giải
                  </p>
                  {sol.steps?.length > 0 && (
                    <div className="space-y-1">
                      {sol.steps.map((step, i) => (
                        <div key={i} className="text-xs text-text-dim flex gap-2">
                          <span className="text-primary font-medium shrink-0">B{i + 1}.</span>
                          <MathText text={step} />
                        </div>
                      ))}
                    </div>
                  )}
                  {sol.explanation && (
                    <div className="text-xs text-text-dim border-t border-bg-border/50 pt-2 mt-1">
                      <span className="font-medium text-text">Giải thích:</span> <MathText text={sol.explanation} />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-dim/50 italic">Chưa có lời giải</p>
              )}
            </>
          )}

          {/* ─── EDIT MODE ─── */}
          {editing && (
            <div className="space-y-3">
              {/* Question text */}
              <div>
                <label className="text-xs text-text-dim mb-1 block">Nội dung câu hỏi</label>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="input w-full min-h-[70px] resize-y text-sm"
                  rows={3}
                />
              </div>

              {/* Media upload / URL */}
              <div className="bg-bg-hover/30 rounded-lg p-3 border border-bg-border/50">
                <p className="text-xs font-medium text-text flex items-center gap-1.5 mb-2">
                  <ImagePlus size={12} className="text-primary" /> Hình ảnh / Audio
                </p>
                {editMedia?.url ? (
                  <div className="space-y-2">
                    <QuizMedia media={editMedia} size="md" />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-dim flex items-center gap-1">
                        {editMedia.type === 'image' ? <ImagePlus size={10} /> : <Volume2 size={10} />}
                        {editMedia.type === 'image' ? 'Hình ảnh' : 'Audio'}
                      </span>
                      <button
                        onClick={() => { setEditMedia(null); setMediaUrl('') }}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <X size={10} /> Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Tab toggle */}
                    <div className="flex gap-1 bg-bg-card rounded-lg p-0.5">
                      <button
                        onClick={() => setMediaInputMode('upload')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors',
                          mediaInputMode === 'upload' ? 'bg-primary/15 text-primary font-medium' : 'text-text-dim hover:text-text'
                        )}
                      >
                        <FileUp size={12} /> Tải file
                      </button>
                      <button
                        onClick={() => setMediaInputMode('url')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors',
                          mediaInputMode === 'url' ? 'bg-primary/15 text-primary font-medium' : 'text-text-dim hover:text-text'
                        )}
                      >
                        <Link2 size={12} /> Dán link
                      </button>
                    </div>

                    {mediaInputMode === 'upload' ? (
                      <div>
                        <label className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-bg-border cursor-pointer hover:border-primary/50 transition-colors',
                          uploadingMedia && 'opacity-50 pointer-events-none'
                        )}>
                          {uploadingMedia ? (
                            <Loader2 size={14} className="animate-spin text-primary" />
                          ) : (
                            <ImagePlus size={14} className="text-text-dim" />
                          )}
                          <span className="text-xs text-text-dim">
                            {uploadingMedia ? 'Đang tải lên...' : 'Chọn ảnh hoặc audio'}
                          </span>
                          <input
                            type="file"
                            accept="image/*,audio/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              setUploadingMedia(true)
                              try {
                                const result = await mediaApi.upload(file)
                                setEditMedia({ type: result.type, url: result.url })
                              } catch (err) {
                                alert(getErrorMessage(err))
                              } finally {
                                setUploadingMedia(false)
                                e.target.value = ''
                              }
                            }}
                          />
                        </label>
                        <p className="text-[10px] text-text-dim mt-1">JPG, PNG, GIF, WebP, MP3, WAV, OGG (tối đa 10MB)</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5">
                          <input
                            type="url"
                            value={mediaUrl}
                            onChange={e => {
                              const v = e.target.value
                              setMediaUrl(v)
                              // Auto-detect audio from URL
                              const lower = v.toLowerCase()
                              const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']
                              if (audioExts.some(ext => lower.includes(ext))) {
                                setMediaUrlType('audio')
                              }
                            }}
                            placeholder="https://drive.google.com/file/d/..."
                            className="input flex-1 text-xs h-8"
                          />
                          <select
                            value={mediaUrlType}
                            onChange={e => setMediaUrlType(e.target.value as 'image' | 'audio')}
                            className="input text-xs h-8 w-[90px] shrink-0"
                          >
                            <option value="image">🖼 Ảnh</option>
                            <option value="audio">🔊 Audio</option>
                          </select>
                          <button
                            disabled={!mediaUrl.trim()}
                            onClick={() => {
                              const url = mediaUrl.trim()
                              if (!url) return
                              setEditMedia({ type: mediaUrlType, url })
                            }}
                            className="btn btn-primary h-8 px-3 text-xs shrink-0"
                          >
                            Thêm
                          </button>
                        </div>
                        <p className="text-[10px] text-text-dim">Dán link từ Google Drive, Dropbox, Cloudinary, S3... (chọn loại ảnh/audio)</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Choices edit (multiple_choice / checkbox) */}
              {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                <div className="space-y-2">
                  <p className="text-xs text-text-dim">
                    {q.type === 'multiple_choice' ? 'Chọn 1 đáp án đúng:' : 'Chọn các đáp án đúng:'}
                  </p>
                  {editChoices.map((c, i) => (
                    <div key={c.key} className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (q.type === 'multiple_choice') {
                            setEditChoices(prev => prev.map((ch, j) => ({ ...ch, is_correct: j === i })))
                          } else {
                            setEditChoices(prev => prev.map((ch, j) => j === i ? { ...ch, is_correct: !ch.is_correct } : ch))
                          }
                        }}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                          c.is_correct ? 'border-green-400 bg-green-400' : 'border-bg-border hover:border-primary'
                        )}
                      >
                        {c.is_correct && <Check size={10} className="text-white" />}
                      </button>
                      <span className="text-xs font-medium text-text-dim w-5">{c.key}.</span>
                      <input
                        value={c.text}
                        onChange={e => setEditChoices(prev => prev.map((ch, j) => j === i ? { ...ch, text: e.target.value } : ch))}
                        className="input flex-1 text-sm"
                        placeholder={`Đáp án ${c.key}`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const next = String.fromCharCode(65 + editChoices.length)
                      setEditChoices(prev => [...prev, { key: next, text: '', is_correct: false }])
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    + Thêm đáp án
                  </button>
                </div>
              )}

              {/* Fill blank answer */}
              {q.type === 'fill_blank' && (
                <div>
                  <label className="text-xs text-text-dim mb-1 block">Đáp án</label>
                  <input value={editAnswer} onChange={e => setEditAnswer(e.target.value)} className="input w-full text-sm" placeholder="Đáp án đúng" />
                </div>
              )}

              {/* Reorder items */}
              {q.type === 'reorder' && (
                <div className="space-y-2">
                  <p className="text-xs text-text-dim">Các mục (theo đúng thứ tự):</p>
                  {editItems.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-xs text-text-dim w-5">{i + 1}.</span>
                      <input
                        value={item.text}
                        onChange={e => setEditItems(prev => prev.map((it, j) => j === i ? { ...it, text: e.target.value } : it))}
                        className="input flex-1 text-sm"
                        placeholder={`Mục ${i + 1}`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setEditItems(prev => [...prev, { id: `I${prev.length + 1}`, text: '' }])}
                    className="text-xs text-primary hover:underline"
                  >
                    + Thêm mục
                  </button>
                </div>
              )}

              {/* True/false answer */}
              {q.type === 'true_false' && (
                <div className="flex gap-3">
                  {['true', 'false'].map(v => (
                    <button
                      key={v}
                      onClick={() => setEditAnswer(v)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                        editAnswer === v ? 'border-primary bg-primary/10 text-primary' : 'border-bg-border text-text-dim hover:border-primary/30'
                      )}
                    >
                      {v === 'true' ? 'Đúng' : 'Sai'}
                    </button>
                  ))}
                </div>
              )}

              {/* Points & Difficulty */}
              <div className="flex gap-3">
                <div className="w-28">
                  <label className="text-xs text-text-dim mb-1 block">Điểm</label>
                  <input type="number" value={editPoints} onChange={e => setEditPoints(Number(e.target.value))} className="input w-full text-sm" min={0} step={0.5} />
                </div>
                <div className="w-36">
                  <label className="text-xs text-text-dim mb-1 block">Độ khó</label>
                  <select value={editDifficulty} onChange={e => setEditDifficulty(e.target.value)} className="input w-full text-sm">
                    <option value="">Chưa gán</option>
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                    <option value="expert">Chuyên gia</option>
                  </select>
                </div>
              </div>

              {/* Solution edit */}
              <div className="bg-bg-hover/30 rounded-lg p-3 space-y-2 border border-bg-border/50">
                <p className="text-xs font-medium text-text flex items-center gap-1.5">
                  <BookOpen size={12} className="text-primary" /> Lời giải
                </p>
                <div className="space-y-1.5">
                  {editSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs text-primary font-medium mt-2 shrink-0">B{i + 1}.</span>
                      <textarea
                        value={step}
                        onChange={e => setEditSteps(prev => prev.map((s, j) => j === i ? e.target.value : s))}
                        className="input flex-1 text-xs min-h-[32px] resize-y"
                        rows={1}
                        placeholder={`Bước ${i + 1}`}
                      />
                      <button
                        onClick={() => setEditSteps(prev => prev.filter((_, j) => j !== i))}
                        className="w-6 h-6 mt-0.5 rounded hover:bg-red-500/20 flex items-center justify-center text-text-dim hover:text-red-400 shrink-0"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setEditSteps(prev => [...prev, ''])}
                    className="text-xs text-primary hover:underline"
                  >
                    + Thêm bước giải
                  </button>
                </div>
                <div>
                  <label className="text-xs text-text-dim mb-1 block">Giải thích tổng quát</label>
                  <textarea
                    value={editExplanation}
                    onChange={e => setEditExplanation(e.target.value)}
                    className="input w-full text-xs min-h-[32px] resize-y"
                    rows={2}
                    placeholder="Giải thích cách giải (không bắt buộc)"
                  />
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Hủy</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editText.trim()}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                  Lưu
                </button>
              </div>
            </div>
          )}

          {/* Hint Assignment */}
          <div className="flex items-center gap-2 pt-1 border-t border-bg-border/50 mt-2">
            <Lightbulb size={13} className="text-yellow-400 shrink-0" />
            <select
              value={q.hint_section_id ?? ''}
              onChange={e => handleHintChange(e.target.value ? Number(e.target.value) : null)}
              disabled={savingHint || allSections.length === 0}
              className="input text-xs flex-1 py-1"
            >
              <option value="">{allSections.length === 0 ? 'Chưa có lý thuyết' : 'Không gán gợi ý'}</option>
              {theories.map(t => (
                t.sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {t.title}{t.sections.length > 1 ? ` — Mục ${s.order + 1}` : ''}: {s.content.slice(0, 50)}...
                  </option>
                ))
              ))}
            </select>
            {savingHint && <Loader2 size={12} className="animate-spin text-primary shrink-0" />}
          </div>
          {currentHint && (
            <div className="text-xs text-text-dim bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-2">
              <span className="font-medium text-yellow-400">{currentHint.theoryTitle}</span>: {currentHint.preview}...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Editor ────────────────────────────────────────────────────────────
export default function QuizEditorPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = Number(params.id)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [theories, setTheories] = useState<QuizTheory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // UI state
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBankImport, setShowBankImport] = useState(false)
  const [showFileImport, setShowFileImport] = useState(false)
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'theories'>('questions')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

  const loadQuiz = useCallback(async () => {
    try {
      const [q, qs, ts] = await Promise.all([
        quizApi.get(quizId),
        quizApi.listQuestions(quizId),
        quizApi.listTheories(quizId).catch(() => [] as QuizTheory[]),
      ])
      setQuiz(q)
      setQuestions(qs)
      setTheories(ts)
      setName(q.name)
      setDescription(q.description || '')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => { loadQuiz() }, [loadQuiz])

  const handleSave = async () => {
    if (!quiz) return
    setSaving(true)
    try {
      const updated = await quizApi.update(quizId, {
        name, description: description || undefined,
      } as Partial<Quiz>)
      setQuiz(updated)
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!quiz) return
    const newStatus = quiz.status === 'published' ? 'draft' : 'published'
    try {
      const updated = await quizApi.update(quizId, { status: newStatus } as Partial<Quiz>)
      setQuiz(updated)
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await quizApi.deleteQuestion(quizId, questionId)
      setQuestions(prev => prev.filter(q => q.id !== questionId))
      if (quiz) setQuiz({ ...quiz, question_count: quiz.question_count - 1 })
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text-dim">Quiz không tồn tại</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg-card border-b border-bg-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/quizzes')} className="w-8 h-8 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-lg font-bold text-text bg-transparent border-none outline-none w-full focus:ring-0"
              placeholder="Tên quiz..."
            />
            <div className="flex items-center gap-3 text-xs text-text-dim mt-0.5">
              <span className="font-mono">{quiz.code}</span>
              <span>{quiz.question_count} câu</span>
              <span>{quiz.total_points} điểm</span>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-ghost text-sm flex items-center gap-1.5">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Lưu
          </button>
          <button onClick={handlePublish} className={cn('text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors', quiz.status === 'published' ? 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20' : 'bg-green-400/10 text-green-400 hover:bg-green-400/20')}>
            {quiz.status === 'published' ? <><Archive size={13} /> Bỏ xuất bản</> : <><Send size={13} /> Xuất bản</>}
          </button>
          {quiz.settings?.grading_mode === 'manual' && (
            <button
              onClick={() => router.push(`/quizzes/${quiz.id}/grade`)}
              className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors"
            >
              <Pencil size={13} /> Chấm bài
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Description */}
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Mô tả quiz (tùy chọn)..."
          className="input w-full mb-6 resize-none"
          rows={2}
        />

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-bg-border">
          {(['questions', 'settings', 'theories'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'text-primary border-primary'
                  : 'text-text-dim border-transparent hover:text-text'
              )}
            >
              {tab === 'questions' && `Câu hỏi (${questions.length})`}
              {tab === 'settings' && 'Cài đặt'}
              {tab === 'theories' && 'Lý thuyết'}
            </button>
          ))}
        </div>

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <Plus size={14} /> Thêm thủ công
              </button>
              <button
                onClick={() => setShowBankImport(true)}
                className="btn-ghost text-sm flex items-center gap-1.5 border border-bg-border"
              >
                <Import size={14} /> Import từ Bank
              </button>
              <button
                onClick={() => setShowFileImport(true)}
                className="btn-ghost text-sm flex items-center gap-1.5 border border-bg-border"
              >
                <FileUp size={14} /> Import JSON
              </button>
              <button
                onClick={async () => {
                  try {
                    const data = await quizApi.export(quizId)
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${quiz?.code || `quiz-${quizId}`}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch { /* ignore */ }
                }}
                className="btn-ghost text-sm flex items-center gap-1.5 border border-bg-border"
              >
                <Download size={14} /> Export JSON
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <AddQuestionForm
                quizId={quizId}
                theories={theories}
                onAdded={loadQuiz}
                onClose={() => setShowAddForm(false)}
              />
            )}

            {/* Filter bar */}
            {questions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="input text-xs py-1.5"
                >
                  <option value="all">Tất cả loại</option>
                  {QUESTION_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select
                  value={filterDifficulty}
                  onChange={e => setFilterDifficulty(e.target.value)}
                  className="input text-xs py-1.5"
                >
                  <option value="all">Tất cả độ khó</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                  <option value="expert">Chuyên gia</option>
                  <option value="none">Chưa gán</option>
                </select>
                <span className="text-xs text-text-dim ml-auto">
                  {(() => {
                    const filtered = questions.filter(q =>
                      (filterType === 'all' || q.type === filterType) &&
                      (filterDifficulty === 'all' || (filterDifficulty === 'none' ? !q.difficulty : q.difficulty === filterDifficulty))
                    )
                    return filtered.length === questions.length
                      ? `${questions.length} câu hỏi`
                      : `${filtered.length}/${questions.length} câu hỏi`
                  })()}
                </span>
              </div>
            )}

            {/* Question List */}
            {questions.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={48} className="mx-auto text-text-dim mb-4" />
                <p className="text-text-dim">Chưa có câu hỏi nào</p>
                <p className="text-xs text-text-dim mt-1">Thêm thủ công hoặc import từ bank câu hỏi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {questions
                  .filter(q =>
                    (filterType === 'all' || q.type === filterType) &&
                    (filterDifficulty === 'all' || (filterDifficulty === 'none' ? !q.difficulty : q.difficulty === filterDifficulty))
                  )
                  .map(q => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    quizId={quizId}
                    theories={theories}
                    onDelete={() => handleDeleteQuestion(q.id)}
                    onUpdate={(updated) => setQuestions(prev => prev.map(qq => qq.id === updated.id ? updated : qq))}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab quiz={quiz} onSaved={setQuiz} />
        )}

        {/* Theories Tab */}
        {activeTab === 'theories' && (
          <TheoriesTab quizId={quizId} />
        )}
      </div>

      {/* Bank Import Modal */}
      {showBankImport && (
        <BankImportModal quizId={quizId} onDone={loadQuiz} onClose={() => setShowBankImport(false)} />
      )}

      {/* File Import Modal */}
      {showFileImport && (
        <FileImportModal quizId={quizId} onDone={loadQuiz} onClose={() => setShowFileImport(false)} />
      )}
    </div>
  )
}

// ─── Settings Tab ───────────────────────────────────────────────────────────
function SettingsTab({ quiz, onSaved }: { quiz: Quiz; onSaved: (q: Quiz) => void }) {
  const settingsRouter = useRouter()
  const s = quiz.settings || {} as Record<string, unknown>
  const [settings, setSettings] = useState({
    shuffle_questions: s.shuffle_questions ?? false,
    shuffle_choices: s.shuffle_choices ?? true,
    show_correct_after_each: s.show_correct_after_each ?? true,
    allow_retake: s.allow_retake ?? true,
    max_retakes: s.max_retakes as number | null ?? null,
    passing_score: (s.passing_score ?? 5) as number | null,
    points_mode: (s.points_mode ?? 'fixed') as string,
    show_leaderboard: s.show_leaderboard ?? true,
    time_limit_minutes: s.time_limit_minutes as number | null ?? null,
    allow_review_after_submit: s.allow_review_after_submit ?? true,
    negative_scoring: s.negative_scoring ?? false,
    grading_mode: (s.grading_mode ?? 'auto') as 'auto' | 'manual',
    question_selection_count: s.question_selection_count as number | null ?? null,
    difficulty_distribution: s.difficulty_distribution ?? { easy: 0.50, medium: 0.30, hard: 0.15, expert: 0.05 },
  })
  const [saving, setSaving] = useState(false)

  // Delete quiz state
  const [showDeleteSection, setShowDeleteSection] = useState(false)
  const [deleteInfo, setDeleteInfo] = useState<{ quiz_name: string; question_count: number; theory_count: number; attempt_count: number; assignment_count: number } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingQuiz, setDeletingQuiz] = useState(false)

  const handleDeleteQuiz = async () => {
    setDeletingQuiz(true)
    try {
      await quizApi.delete(quiz.id)
      settingsRouter.push('/quizzes')
    } catch (e) {
      alert(getErrorMessage(e))
      setDeletingQuiz(false)
    }
  }

  const toggleDeleteSection = async () => {
    if (showDeleteSection) {
      setShowDeleteSection(false)
      return
    }
    setShowDeleteSection(true)
    setDeleteConfirmText('')
    try {
      const info = await quizApi.getDeleteInfo(quiz.id)
      setDeleteInfo(info)
    } catch {
      setDeleteInfo({ quiz_name: quiz.name, question_count: quiz.question_count || 0, theory_count: 0, attempt_count: 0, assignment_count: 0 })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await quizApi.update(quiz.id, { settings } as Partial<Quiz>)
      onSaved(updated)
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm text-text">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={cn('w-10 h-5 rounded-full transition-colors relative', checked ? 'bg-primary' : 'bg-bg-border')}
      >
        <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform', checked ? 'left-5' : 'left-0.5')} />
      </button>
    </label>
  )

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-bg-card border border-bg-border rounded-xl p-4 space-y-1">
        <h4 className="text-sm font-semibold text-text mb-3">Hiển thị</h4>
        <Toggle label="Trộn thứ tự câu hỏi" checked={settings.shuffle_questions} onChange={v => setSettings(s => ({ ...s, shuffle_questions: v }))} />
        <Toggle label="Trộn thứ tự đáp án" checked={settings.shuffle_choices} onChange={v => setSettings(s => ({ ...s, shuffle_choices: v }))} />
        <Toggle label="Hiện đáp án đúng sau mỗi câu" checked={settings.show_correct_after_each} onChange={v => setSettings(s => ({ ...s, show_correct_after_each: v }))} />
        <Toggle label="Bảng xếp hạng" checked={settings.show_leaderboard} onChange={v => setSettings(s => ({ ...s, show_leaderboard: v }))} />
      </div>

      <div className="bg-bg-card border border-bg-border rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-text">Làm bài</h4>
        <Toggle label="Cho phép làm lại" checked={settings.allow_retake} onChange={v => setSettings(s => ({ ...s, allow_retake: v }))} />
        <div>
          <label className="text-xs text-text-dim block mb-1">Giới hạn thời gian (phút)</label>
          <input
            type="number"
            value={settings.time_limit_minutes ?? ''}
            onChange={e => setSettings(s => ({ ...s, time_limit_minutes: e.target.value ? Number(e.target.value) : null }))}
            className="input w-32"
            placeholder="Không giới hạn"
            min={0}
          />
        </div>
        <div>
          <label className="text-xs text-text-dim block mb-1">Điểm đạt</label>
          <input
            type="number"
            value={settings.passing_score ?? ''}
            onChange={e => setSettings(s => ({ ...s, passing_score: e.target.value ? Number(e.target.value) : null }))}
            className="input w-32"
            min={0}
            step={0.5}
          />
        </div>
      </div>

      <div className="bg-bg-card border border-bg-border rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-text">Chọn câu hỏi ngẫu nhiên</h4>
        <div>
          <label className="text-xs text-text-dim block mb-1">Số câu hỏi mỗi lần làm</label>
          <input
            type="number"
            value={settings.question_selection_count ?? ''}
            onChange={e => setSettings(s => ({ ...s, question_selection_count: e.target.value ? Number(e.target.value) : null }))}
            className="input w-32"
            placeholder="Tất cả"
            min={1}
          />
          <p className="text-[11px] text-text-dim mt-1">Để trống = lấy tất cả câu hỏi. Nhập số (VD: 20) để random theo tỷ lệ độ khó.</p>
        </div>
        {settings.question_selection_count && (
          <div>
            <label className="text-xs text-text-dim block mb-2">Phân bổ độ khó (%)</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'easy', label: 'Nhận biết (NB)', color: 'text-green-400' },
                { key: 'medium', label: 'Thông hiểu (TH)', color: 'text-blue-400' },
                { key: 'hard', label: 'Vận dụng (VD)', color: 'text-orange-400' },
                { key: 'expert', label: 'Vận dụng cao (VDC)', color: 'text-red-400' },
              ] as const).map(d => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className={cn('text-xs w-28', d.color)}>{d.label}</span>
                  <input
                    type="number"
                    value={Math.round((settings.difficulty_distribution[d.key] || 0) * 100)}
                    onChange={e => {
                      const pct = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                      setSettings(s => ({
                        ...s,
                        difficulty_distribution: { ...s.difficulty_distribution, [d.key]: pct / 100 },
                      }))
                    }}
                    className="input w-16 text-center"
                    min={0}
                    max={100}
                  />
                  <span className="text-xs text-text-dim">%</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-dim mt-1">
              Tổng: {Math.round(Object.values(settings.difficulty_distribution).reduce((a, b) => a + b, 0) * 100)}%
              {Math.abs(Object.values(settings.difficulty_distribution).reduce((a, b) => a + b, 0) - 1) > 0.01 && (
                <span className="text-yellow-400 ml-1">(nên = 100%)</span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="bg-bg-card border border-bg-border rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-text mb-1">Chấm điểm</h4>
        <div>
          <label className="text-xs text-text-dim block mb-2">Chế độ chấm điểm</label>
          <div className="flex gap-2">
            {([
              { value: 'auto' as const, label: 'Tự động', desc: 'Chấm theo đáp án ngay khi nộp bài' },
              { value: 'manual' as const, label: 'Giáo viên chấm', desc: 'Giáo viên xem và chấm điểm thủ công' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setSettings(s => ({ ...s, grading_mode: opt.value }))}
                className={cn(
                  'flex-1 text-left p-3 rounded-xl border-2 transition-all',
                  settings.grading_mode === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-bg-border hover:border-primary/30'
                )}
              >
                <p className={cn('text-sm font-medium', settings.grading_mode === opt.value ? 'text-primary' : 'text-text')}>{opt.label}</p>
                <p className="text-[11px] text-text-dim mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Trừ điểm khi sai" checked={settings.negative_scoring} onChange={v => setSettings(s => ({ ...s, negative_scoring: v }))} />
        <p className="text-[11px] text-text-dim pl-1">Sai = trừ toàn bộ điểm câu. Bỏ qua = 0 điểm.</p>
        <Toggle label="Xem lại đáp án sau khi nộp" checked={settings.allow_review_after_submit} onChange={v => setSettings(s => ({ ...s, allow_review_after_submit: v }))} />
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        Lưu cài đặt
      </button>

      {/* Danger Zone */}
      <div className="border border-red-400/20 rounded-xl overflow-hidden mt-6">
        <button
          onClick={toggleDeleteSection}
          className="w-full flex items-center justify-between p-4 hover:bg-red-400/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Trash2 size={14} className="text-red-400" />
            <span className="text-sm font-medium text-red-400">Xóa quiz</span>
          </div>
          <ChevronDown size={14} className={cn('text-red-400 transition-transform', showDeleteSection && 'rotate-180')} />
        </button>
        {showDeleteSection && (
          <div className="px-4 pb-4 space-y-3 border-t border-red-400/10">
            {deleteInfo ? (
              <>
                <p className="text-sm text-text-dim pt-3">Hành động này sẽ xóa vĩnh viễn quiz và toàn bộ dữ liệu liên quan:</p>
                <ul className="space-y-1 text-sm text-text-dim">
                  {deleteInfo.question_count > 0 && <li>- <span className="font-medium text-text">{deleteInfo.question_count}</span> câu hỏi</li>}
                  {deleteInfo.theory_count > 0 && <li>- <span className="font-medium text-text">{deleteInfo.theory_count}</span> bài lý thuyết</li>}
                  {deleteInfo.attempt_count > 0 && <li>- <span className="font-medium text-text">{deleteInfo.attempt_count}</span> lượt làm bài của học sinh</li>}
                  {deleteInfo.assignment_count > 0 && <li>- <span className="font-medium text-text">{deleteInfo.assignment_count}</span> bài tập sẽ mất liên kết</li>}
                </ul>
                {deleteInfo.attempt_count > 0 ? (
                  <div>
                    <label className="text-xs text-text-dim mb-1.5 block">
                      Gõ <span className="font-semibold text-text">{quiz.name}</span> để xác nhận
                    </label>
                    <input
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      className="input w-full text-sm"
                      placeholder={quiz.name}
                    />
                  </div>
                ) : null}
                <button
                  onClick={handleDeleteQuiz}
                  disabled={deletingQuiz || (deleteInfo.attempt_count > 0 && deleteConfirmText !== quiz.name)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                >
                  {deletingQuiz ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Xóa vĩnh viễn
                </button>
              </>
            ) : (
              <div className="flex justify-center py-3">
                <Loader2 size={16} className="animate-spin text-text-dim" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Theories Tab ───────────────────────────────────────────────────────────
function TheoriesTab({ quizId }: { quizId: number }) {
  const [theories, setTheories] = useState<QuizTheory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    quizApi.listTheories(quizId).then(setTheories).catch(console.error).finally(() => setLoading(false))
  }, [quizId])

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      const theory = await quizApi.addTheory(quizId, {
        title,
        sections: [{ order: 0, content, content_format: 'markdown' }],
      })
      setTheories(prev => [...prev, theory])
      setTitle(''); setContent(''); setShowAdd(false)
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (theoryId: number) => {
    try {
      await quizApi.deleteTheory(quizId, theoryId)
      setTheories(prev => prev.filter(t => t.id !== theoryId))
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-4 max-w-3xl">
      <button onClick={() => setShowAdd(true)} className="btn-primary text-sm flex items-center gap-1.5">
        <Plus size={14} /> Thêm lý thuyết
      </button>

      {showAdd && (
        <div className="bg-bg-card border border-primary/30 rounded-xl p-4 space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Tiêu đề lý thuyết..."
            className="input w-full"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Nội dung (Markdown)..."
            className="input w-full min-h-[120px] resize-y"
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Hủy</button>
            <button onClick={handleAdd} disabled={saving || !title.trim()} className="btn-primary text-sm flex items-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Thêm
            </button>
          </div>
        </div>
      )}

      {theories.length === 0 && !showAdd ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-text-dim mb-4" />
          <p className="text-text-dim">Chưa có lý thuyết nào</p>
          <p className="text-xs text-text-dim mt-1">Thêm lý thuyết để làm hint cho câu hỏi</p>
        </div>
      ) : (
        theories.map(t => (
          <div key={t.id} className="bg-bg-card border border-bg-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-text">{t.title}</h4>
              <button onClick={() => handleDelete(t.id)} className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-text-dim hover:text-red-400">
                <Trash2 size={13} />
              </button>
            </div>
            {t.sections.map(s => (
              <div key={s.id} className="text-sm text-text-dim bg-bg rounded-lg p-3 mt-2 whitespace-pre-wrap">
                {s.content}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
