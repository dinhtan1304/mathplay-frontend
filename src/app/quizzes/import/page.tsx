'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { quizApi, getErrorMessage } from '@/lib/api'
import type { QuizQuestionCreate } from '@/types'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, FileUp, Loader2, AlertTriangle, Check, X,
  BookOpen, FileText, Settings, CheckSquare, ListOrdered,
  Type, ToggleLeft, Import,
} from 'lucide-react'
import { MathText } from '@/lib/math'

const QUESTION_TYPE_OPTIONS = [
  { value: 'multiple_choice', label: 'Trắc nghiệm', icon: CheckSquare },
  { value: 'checkbox', label: 'Nhiều đáp án', icon: CheckSquare },
  { value: 'fill_blank', label: 'Điền chỗ trống', icon: Type },
  { value: 'reorder', label: 'Sắp xếp', icon: ListOrdered },
  { value: 'true_false', label: 'Đúng/Sai', icon: ToggleLeft },
  { value: 'essay', label: 'Tự luận', icon: FileText },
]

const VALID_TYPES = ['multiple_choice', 'checkbox', 'fill_blank', 'reorder', 'true_false', 'essay']

function validateQuestion(q: Record<string, unknown>): string[] {
  const errs: string[] = []
  if (!q.type || !VALID_TYPES.includes(q.type as string))
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

function validateTheory(t: Record<string, unknown>): string[] {
  const errs: string[] = []
  if (!t.title || typeof t.title !== 'string' || !(t.title as string).trim())
    errs.push('Thiếu title')
  if (t.sections !== undefined && !Array.isArray(t.sections))
    errs.push('sections phải là array')
  return errs
}

interface ParsedQuiz {
  quiz: Record<string, unknown>
  theories: Record<string, unknown>[]
  questions: Record<string, unknown>[]
}

type ImportStep = 'quiz' | 'theories' | 'questions' | 'done'

export default function QuizImportPage() {
  const router = useRouter()

  const [phase, setPhase] = useState<'select' | 'preview' | 'importing'>('select')
  const [parsed, setParsed] = useState<ParsedQuiz | null>(null)
  const [parseError, setParseError] = useState('')

  // Validation
  const [questionErrors, setQuestionErrors] = useState<{ index: number; msgs: string[] }[]>([])
  const [theoryErrors, setTheoryErrors] = useState<{ index: number; msgs: string[] }[]>([])
  const [quizErrors, setQuizErrors] = useState<string[]>([])

  // Import progress
  const [importStep, setImportStep] = useState<ImportStep>('quiz')
  const [importError, setImportError] = useState('')
  const [importProgress, setImportProgress] = useState(0)
  const [importTotal, setImportTotal] = useState(0)

  const validQuestions = parsed?.questions.filter((_, i) => !questionErrors.find(e => e.index === i)) ?? []
  const validTheories = parsed?.theories.filter((_, i) => !theoryErrors.find(e => e.index === i)) ?? []

  const typeBreakdown = QUESTION_TYPE_OPTIONS.map(opt => ({
    ...opt,
    count: validQuestions.filter(q => q.type === opt.value).length,
  })).filter(t => t.count > 0)

  const canImport = parsed && quizErrors.length === 0 && (parsed.quiz.name as string)?.trim()

  // ─── Parse file ────────────────────────────────────────────
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleFile = (file: File) => {
    setParseError('')
    if (file.size > MAX_FILE_SIZE) {
      setParseError(`File quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 5MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string)
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          setParseError('JSON phải là object có key "quiz", "theories", "questions"')
          return
        }

        // Support multiple JSON structures:
        // 1. { quiz: {...}, theories: [...], questions: [...] }         — standard
        // 2. { quiz: { ..., theories: [...], questions: [...] } }       — nested
        // 3. { name: "...", theories: [...], questions: [...] }         — flat (no quiz wrapper)
        let quiz: Record<string, unknown>
        let theories: Record<string, unknown>[]
        let questions: Record<string, unknown>[]

        if (raw.quiz && typeof raw.quiz === 'object' && !Array.isArray(raw.quiz)) {
          quiz = raw.quiz
          // theories/questions at root level first, fallback to inside quiz
          theories = Array.isArray(raw.theories) ? raw.theories
            : Array.isArray(raw.quiz.theories) ? raw.quiz.theories : []
          questions = Array.isArray(raw.questions) ? raw.questions
            : Array.isArray(raw.quiz.questions) ? raw.quiz.questions : []
        } else if (raw.name && typeof raw.name === 'string') {
          // Flat: root IS the quiz
          const { theories: t, questions: q, ...rest } = raw
          quiz = rest
          theories = Array.isArray(t) ? t : []
          questions = Array.isArray(q) ? q : []
        } else {
          quiz = raw.quiz || {}
          theories = Array.isArray(raw.theories) ? raw.theories : []
          questions = Array.isArray(raw.questions) ? raw.questions : []
        }

        // Validate quiz
        const qErrs: string[] = []
        if (!quiz.name || typeof quiz.name !== 'string' || !quiz.name.trim())
          qErrs.push('quiz.name bắt buộc')

        // Validate theories
        const tErrs: { index: number; msgs: string[] }[] = []
        theories.forEach((t, i) => {
          const msgs = validateTheory(t)
          if (msgs.length > 0) tErrs.push({ index: i, msgs })
        })

        // Validate questions
        const questErrs: { index: number; msgs: string[] }[] = []
        questions.forEach((q, i) => {
          const msgs = validateQuestion(q)
          if (msgs.length > 0) questErrs.push({ index: i, msgs })
        })

        setParsed({ quiz, theories, questions })
        setQuizErrors(qErrs)
        setTheoryErrors(tErrs)
        setQuestionErrors(questErrs)
        setPhase('preview')
      } catch {
        setParseError('File JSON không hợp lệ')
      }
    }
    reader.readAsText(file)
  }

  // ─── Import ────────────────────────────────────────────────
  const handleImport = async () => {
    if (!parsed || !canImport) return
    setPhase('importing')
    setImportError('')
    setImportStep('quiz')

    try {
      // Step 1: Create quiz
      const quizData = {
        name: parsed.quiz.name as string,
        description: (parsed.quiz.description as string) || undefined,
        cover_image_url: (parsed.quiz.cover_image_url as string) || undefined,
        subject_code: (parsed.quiz.subject_code as string) || undefined,
        grade: (parsed.quiz.grade as number) || undefined,
        mode: (parsed.quiz.mode as string) || 'quiz',
        language: (parsed.quiz.language as string) || 'vi',
        visibility: (parsed.quiz.visibility as string) || 'private',
        tags: Array.isArray(parsed.quiz.tags) ? parsed.quiz.tags as string[] : [],
        settings: parsed.quiz.settings || undefined,
      }
      const createdQuiz = await quizApi.create(quizData as Parameters<typeof quizApi.create>[0])

      // Step 2: Create theories (sequential) and build section ID map
      // Map: sectionMap[theory_index][section_index] = new section DB id
      const sectionMap: Record<number, Record<number, number>> = {}
      if (validTheories.length > 0) {
        setImportStep('theories')
        for (let ti = 0; ti < validTheories.length; ti++) {
          const t = validTheories[ti]
          const sections = Array.isArray(t.sections)
            ? (t.sections as Record<string, unknown>[]).map((s, i) => ({
                order: (s.order as number) ?? i,
                content: (s.content as string) || '',
                content_format: (s.content_format as string) || 'markdown',
                media: (s.media as Record<string, unknown>) || null,
              }))
            : []
          const created = await quizApi.addTheory(createdQuiz.id, {
            title: t.title as string,
            content_type: (t.content_type as string) || 'rich_text',
            tags: Array.isArray(t.tags) ? t.tags as string[] : [],
            display_order: (t.display_order as number) ?? 0,
            sections,
          })
          // Map section indices to new section IDs
          sectionMap[ti] = {}
          const sortedSections = [...(created.sections || [])].sort((a, b) => a.order - b.order)
          sortedSections.forEach((s, si) => { sectionMap[ti][si] = s.id })
        }
      }

      // Step 3: Create questions in chunks for progress feedback
      // Remap hint_theory_index + hint_section_index → hint_section_id
      if (validQuestions.length > 0) {
        setImportStep('questions')
        setImportTotal(validQuestions.length)
        setImportProgress(0)

        const mappedQuestions = validQuestions.map(q => {
          const mapped = { ...q }
          const ti = (q.hint_theory_index ?? q.theory_index) as number | undefined
          const si = (q.hint_section_index ?? 0) as number  // default to first section
          if (ti != null && sectionMap[ti]?.[si]) {
            mapped.hint_section_id = sectionMap[ti][si]
          }
          // Remove portable fields — backend doesn't know these
          delete mapped.hint_theory_index
          delete mapped.hint_section_index
          delete mapped.theory_index
          return mapped
        })

        let totalSkipped = 0
        const CHUNK_SIZE = 25
        for (let i = 0; i < mappedQuestions.length; i += CHUNK_SIZE) {
          const chunk = mappedQuestions.slice(i, i + CHUNK_SIZE)
          const result = await quizApi.batchCreateQuestions(
            createdQuiz.id,
            chunk as unknown as QuizQuestionCreate[],
            'file_import',
          )
          totalSkipped += result.skipped
          setImportProgress(Math.min(i + CHUNK_SIZE, mappedQuestions.length))
        }
        if (totalSkipped > 0) {
          setImportError(`Import thành công! Đã bỏ qua ${totalSkipped} câu trùng lặp.`)
        }
      }

      setImportStep('done')
      // Redirect to editor
      setTimeout(() => router.push(`/quizzes/${createdQuiz.id}/edit`), 1500)
    } catch (e) {
      setImportError(getErrorMessage(e))
      setPhase('preview')
    }
  }

  const resetAll = () => {
    setPhase('select')
    setParsed(null)
    setParseError('')
    setQuizErrors([])
    setTheoryErrors([])
    setQuestionErrors([])
    setImportError('')
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg-card border-b border-bg-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/quizzes')} className="w-8 h-8 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-text">Import Quiz từ JSON</h1>
            <p className="text-xs text-text-dim">Tạo quiz mới từ file JSON bao gồm lý thuyết và câu hỏi</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* ─── Phase: Select ─── */}
        {phase === 'select' && (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-bg-border rounded-2xl p-12 text-center hover:border-primary/40 transition-colors cursor-pointer"
              onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
              onDrop={e => {
                e.preventDefault(); e.stopPropagation()
                const f = e.dataTransfer.files[0]
                if (f) handleFile(f)
              }}
              onClick={() => document.getElementById('quiz-json-input')?.click()}
            >
              <FileUp size={48} className="mx-auto text-text-dim mb-4" />
              <p className="text-text font-medium mb-1">Kéo thả file JSON hoặc bấm để chọn</p>
              <p className="text-sm text-text-dim">File .json chứa quiz, lý thuyết và câu hỏi</p>
              <input
                id="quiz-json-input"
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>

            {parseError && (
              <p className="text-red-400 text-sm flex items-center gap-1.5">
                <AlertTriangle size={14} /> {parseError}
              </p>
            )}

            {/* Format example */}
            <details className="bg-bg-card border border-bg-border rounded-xl">
              <summary className="px-4 py-3 text-sm text-text-dim cursor-pointer hover:text-text font-medium">
                Xem format JSON mẫu
              </summary>
              <pre className="px-4 pb-4 text-[11px] text-text-dim overflow-x-auto leading-relaxed">{`{
  "quiz": {
    "name": "Đại số lớp 8 - Chương 1",
    "description": "Ôn tập phương trình bậc nhất",
    "subject_code": "toan",
    "grade": 8,
    "mode": "quiz",
    "visibility": "private",
    "tags": ["dai-so", "lop-8"],
    "settings": {
      "time_limit_minutes": 30,
      "shuffle_questions": true,
      "shuffle_choices": true,
      "passing_score": 60,
      "passing_score_type": "percentage",
      "allow_retake": true
    }
  },
  "theories": [
    {
      "title": "Phương trình bậc nhất một ẩn",
      "display_order": 0,
      "sections": [
        {
          "order": 0,
          "content": "## Định nghĩa\\nPhương trình bậc nhất một ẩn có dạng $ax + b = 0$ với $a \\\\neq 0$",
          "content_format": "markdown"
        },
        {
          "order": 1,
          "content": "## Cách giải\\n1. Chuyển vế\\n2. Thu gọn\\n3. Chia hai vế cho hệ số của ẩn",
          "content_format": "markdown"
        }
      ]
    }
  ],
  "questions": [
    {
      "type": "multiple_choice",
      "question_text": "Nghiệm của phương trình $2x + 6 = 0$ là:",
      "hint_theory_index": 0,
      "hint_section_index": 0,
      "choices": [
        {"key": "A", "text": "$x = 3$", "is_correct": false},
        {"key": "B", "text": "$x = -3$", "is_correct": true},
        {"key": "C", "text": "$x = 6$", "is_correct": false},
        {"key": "D", "text": "$x = -6$", "is_correct": false}
      ],
      "answer": "B",
      "points": 1,
      "difficulty": "easy",
      "solution": {
        "steps": ["$2x + 6 = 0$", "$2x = -6$", "$x = -3$"],
        "explanation": "Chuyển 6 sang vế phải, chia 2 vế cho 2"
      }
    },
    {
      "type": "true_false",
      "question_text": "Phương trình $0x + 5 = 0$ vô nghiệm",
      "hint_theory_index": 0,
      "hint_section_index": 1,
      "answer": true,
      "points": 1,
      "difficulty": "medium"
    },
    {
      "type": "fill_blank",
      "question_text": "Nghiệm của $3x - 9 = 0$ là $x =$ ___",
      "hint_theory_index": 0,
      "answer": {"B1": "3"},
      "points": 1,
      "difficulty": "easy"
    },
    {
      "type": "reorder",
      "question_text": "Sắp xếp các bước giải phương trình $4x - 8 = 12$",
      "items": [
        {"id": "I1", "text": "$4x - 8 = 12$"},
        {"id": "I2", "text": "$4x = 20$"},
        {"id": "I3", "text": "$x = 5$"}
      ],
      "answer": ["I1", "I2", "I3"],
      "points": 2,
      "difficulty": "medium"
    },
    {
      "type": "essay",
      "question_text": "Giải và biện luận phương trình $ax + b = 0$ theo tham số $a$",
      "has_correct_answer": false,
      "points": 5,
      "difficulty": "hard"
    }
  ]
}`}</pre>
            </details>

            <div className="text-xs text-text-dim space-y-1 bg-bg-card border border-bg-border rounded-xl p-4">
              <p className="font-medium text-text mb-2">Cấu trúc file JSON:</p>
              <p><strong>quiz</strong> (bắt buộc): name*, description, subject_code, grade, mode, visibility, tags, settings</p>
              <p><strong>theories</strong> (tùy chọn): [{`title*, sections: [{order, content, content_format}]`}]</p>
              <p><strong>questions</strong> (tùy chọn): [{`type*, question_text*, choices, items, answer, points, difficulty, solution, tags`}]</p>
              <p className="mt-2 pt-2 border-t border-bg-border"><strong className="text-text">Gán lý thuyết gợi ý:</strong> Thêm <code className="text-primary bg-primary/10 px-1 rounded">hint_theory_index</code> (chỉ mục theory: 0, 1, 2...) và <code className="text-primary bg-primary/10 px-1 rounded">hint_section_index</code> (chỉ mục section, mặc định 0) vào câu hỏi để gán gợi ý. Có thể gán thêm trong bước xem trước.</p>
              <p className="text-text-dim/60 mt-2">* = bắt buộc. Hỗ trợ LaTeX: dùng $...$ cho inline, $$...$$ cho block</p>
            </div>
          </div>
        )}

        {/* ─── Phase: Preview ─── */}
        {phase === 'preview' && parsed && (
          <div className="space-y-4">
            {importError && (
              <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">Import thất bại</p>
                  <p className="text-xs text-red-400/80 mt-1">{importError}</p>
                </div>
              </div>
            )}

            {/* Quiz Info */}
            <div className="bg-bg-card border border-bg-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={14} className="text-primary" />
                <h3 className="text-sm font-semibold text-text">Thông tin Quiz</h3>
                {quizErrors.length > 0 && <AlertTriangle size={12} className="text-red-400" />}
              </div>
              {quizErrors.length > 0 ? (
                <div className="space-y-1">
                  {quizErrors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400">• {err}</p>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-text-dim">Tên:</span> <span className="text-text font-medium">{String(parsed.quiz.name)}</span></div>
                  {parsed.quiz.description ? <div className="col-span-2"><span className="text-text-dim">Mô tả:</span> <span className="text-text">{String(parsed.quiz.description).slice(0, 100)}</span></div> : null}
                  {parsed.quiz.subject_code ? <div><span className="text-text-dim">Môn:</span> <span className="text-text">{String(parsed.quiz.subject_code)}</span></div> : null}
                  {parsed.quiz.grade ? <div><span className="text-text-dim">Lớp:</span> <span className="text-text">{String(parsed.quiz.grade)}</span></div> : null}
                  <div><span className="text-text-dim">Chế độ:</span> <span className="text-text">{String(parsed.quiz.mode || 'quiz')}</span></div>
                  <div><span className="text-text-dim">Hiển thị:</span> <span className="text-text">{String(parsed.quiz.visibility || 'private')}</span></div>
                  {parsed.quiz.settings ? <div><span className="text-text-dim">Settings:</span> <span className="text-green-400 text-xs">Có cấu hình</span></div> : null}
                </div>
              )}
            </div>

            {/* Theories */}
            <div className="bg-bg-card border border-bg-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-yellow-400" />
                <h3 className="text-sm font-semibold text-text">Lý thuyết ({validTheories.length}/{parsed.theories.length})</h3>
              </div>
              {parsed.theories.length === 0 ? (
                <p className="text-xs text-text-dim">Không có lý thuyết</p>
              ) : (
                <div className="space-y-1.5">
                  {parsed.theories.map((t, i) => {
                    const errs = theoryErrors.find(e => e.index === i)
                    const sections = Array.isArray(t.sections) ? t.sections as unknown[] : []
                    return (
                      <div key={i} className={cn(
                        'rounded-lg px-3 py-2 text-sm border',
                        errs ? 'border-red-400/30 bg-red-400/5' : 'border-bg-border bg-bg'
                      )}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-text-dim">#{i + 1}</span>
                          <span className="text-text flex-1 truncate">{(t.title as string) || '(không có title)'}</span>
                          <span className="text-xs text-text-dim">{sections.length} sections</span>
                          {!errs && <Check size={12} className="text-green-400 shrink-0" />}
                        </div>
                        {errs && (
                          <div className="mt-1 ml-8">
                            {errs.msgs.map((m, j) => <p key={j} className="text-[11px] text-red-400">• {m}</p>)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="bg-bg-card border border-bg-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-text">
                  Câu hỏi ({validQuestions.length}/{parsed.questions.length})
                </h3>
              </div>

              {/* Type breakdown */}
              {typeBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {typeBreakdown.map(t => (
                    <span key={t.value} className="text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {t.label}: {t.count}
                    </span>
                  ))}
                </div>
              )}

              {parsed.questions.length === 0 ? (
                <p className="text-xs text-text-dim">Không có câu hỏi</p>
              ) : (
                <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                  {parsed.questions.map((q, i) => {
                    const errs = questionErrors.find(e => e.index === i)
                    const typeLabel = QUESTION_TYPE_OPTIONS.find(o => o.value === q.type)?.label || String(q.type || '?')
                    const ti = (q.hint_theory_index ?? q.theory_index) as number | undefined
                    const si = (q.hint_section_index ?? 0) as number
                    const linkedTheory = ti != null ? validTheories[ti] : null
                    const linkedTitle = linkedTheory ? String(linkedTheory.title || '') : null
                    const linkedSections = linkedTheory && Array.isArray(linkedTheory.sections) ? linkedTheory.sections as Record<string, unknown>[] : []

                    // Build options for theory+section dropdown
                    const hintOptions: { value: string; label: string }[] = [{ value: '', label: 'Không gán gợi ý' }]
                    validTheories.forEach((t, tIdx) => {
                      const secs = Array.isArray(t.sections) ? t.sections as Record<string, unknown>[] : []
                      if (secs.length <= 1) {
                        hintOptions.push({ value: `${tIdx}_0`, label: `${String(t.title || `Theory ${tIdx + 1}`)}` })
                      } else {
                        secs.forEach((s, sIdx) => {
                          const secLabel = (s.content as string)?.slice(0, 40)?.replace(/^#+\s*/, '') || `Section ${sIdx + 1}`
                          hintOptions.push({ value: `${tIdx}_${sIdx}`, label: `${String(t.title || `Theory ${tIdx + 1}`)} → ${secLabel}` })
                        })
                      }
                    })

                    const currentHintValue = ti != null ? `${ti}_${si}` : ''

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
                          <MathText text={(q.question_text as string) || '(trống)'} className="text-text truncate flex-1" />
                          {q.points ? <span className="text-xs text-text-dim">{String(q.points)}đ</span> : null}
                          {!errs && <Check size={12} className="text-green-400 shrink-0" />}
                        </div>
                        {/* Theory hint assignment */}
                        <div className="mt-1.5 ml-8">
                          {validTheories.length > 0 ? (
                            <select
                              value={currentHintValue}
                              onChange={e => {
                                const val = e.target.value
                                // Mutate parsed question in-place
                                if (val) {
                                  const [tStr, sStr] = val.split('_')
                                  q.hint_theory_index = Number(tStr)
                                  q.hint_section_index = Number(sStr)
                                } else {
                                  delete q.hint_theory_index
                                  delete q.hint_section_index
                                  delete q.theory_index
                                }
                                // Force re-render
                                setParsed(prev => prev ? { ...prev, questions: [...prev.questions] } : prev)
                              }}
                              className="text-[11px] bg-bg border border-bg-border rounded px-2 py-1 text-text-dim hover:border-primary/30 focus:border-primary transition-colors max-w-[320px] w-full"
                            >
                              {hintOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : linkedTitle ? (
                            <span className="text-[11px] text-yellow-400 flex items-center gap-1">
                              <BookOpen size={10} /> {linkedTitle}{linkedSections.length > 1 ? ` (section ${si + 1})` : ''}
                            </span>
                          ) : null}
                        </div>
                        {errs && (
                          <div className="mt-1 ml-8">
                            {errs.msgs.map((m, j) => <p key={j} className="text-[11px] text-red-400">• {m}</p>)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Summary + Actions */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={resetAll} className="btn-ghost text-sm flex items-center gap-1.5">
                <ArrowLeft size={14} /> Chọn file khác
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs text-text-dim">
                  {validTheories.length > 0 && <span>{validTheories.length} lý thuyết · </span>}
                  <span>{validQuestions.length} câu hỏi</span>
                  {validTheories.length > 0 && (() => {
                    const hinted = parsed.questions.filter(q => (q.hint_theory_index ?? q.theory_index) != null).length
                    return hinted > 0 ? <span className="text-yellow-400"> · {hinted} có gợi ý</span> : null
                  })()}
                  {questionErrors.length > 0 && <span className="text-red-400"> · {questionErrors.length} lỗi</span>}
                </div>
                <button
                  onClick={handleImport}
                  disabled={!canImport}
                  className="btn-primary flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Import size={14} /> Import Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Phase: Importing ─── */}
        {phase === 'importing' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-6">
              <Loader2 size={40} className="animate-spin text-primary mx-auto" />
              <div className="space-y-3">
                {(['quiz', 'theories', 'questions', 'done'] as ImportStep[]).map(step => {
                  const labels: Record<ImportStep, string> = {
                    quiz: 'Tạo quiz...',
                    theories: 'Tạo lý thuyết...',
                    questions: importTotal > 0 ? `Tạo câu hỏi... (${importProgress}/${importTotal})` : 'Tạo câu hỏi...',
                    done: 'Hoàn tất!',
                  }
                  const isActive = importStep === step
                  const isDone = (['quiz', 'theories', 'questions', 'done'] as ImportStep[]).indexOf(step)
                    < (['quiz', 'theories', 'questions', 'done'] as ImportStep[]).indexOf(importStep)
                  return (
                    <div key={step} className={cn('flex items-center gap-2 text-sm', {
                      'text-primary font-medium': isActive,
                      'text-green-400': isDone,
                      'text-text-dim': !isActive && !isDone,
                    })}>
                      {isDone ? <Check size={14} /> : isActive ? <Loader2 size={14} className="animate-spin" /> : <span className="w-3.5" />}
                      {labels[step]}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
