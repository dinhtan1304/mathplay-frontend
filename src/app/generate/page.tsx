'use client'
import { useEffect, useState, useMemo } from 'react'
import {
  generatorApi, curriculumApi, questionsApi, generatorExportApi, classesApi, assignmentsApi, getErrorMessage,
} from '@/lib/api'
import type {
  GeneratedQuestion, GenerateResponse, CurriculumTree,
  CurriculumChapter, CurriculumLesson,
  GeneratorExportRequest, VerificationStats, QuestionType, Difficulty, ClassRoom,
} from '@/types'
import { DIFFICULTY_LABELS, cn } from '@/lib/utils'
import { Wand2, Loader2, BookmarkPlus, Download, RefreshCw, ChevronDown, Info, ShieldCheck, AlertTriangle, Copy, MessageSquare, Send, X, Pencil, Check } from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'


// ─── KaTeX Math Renderer ─────────────────────────────────────────────────────

function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => {
    if (!text) return ''
    try {
      // Split on $$...$$ (display) and $...$ (inline), preserving delimiters
      const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/)
      return parts.map(part => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim()
          try {
            return katex.renderToString(math, { displayMode: true, throwOnError: false })
          } catch { return part }
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const math = part.slice(1, -1).trim()
          try {
            return katex.renderToString(math, { displayMode: false, throwOnError: false })
          } catch { return part }
        }
        // Escape HTML in non-math text
        return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }).join('')
    } catch {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }
  }, [text])

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAM_PRESETS = {
  kt15:    { countTN: 5,  countTL: 1,  label: 'KT 15 phút' },
  kt1tiet: { countTN: 28, countTL: 2,  label: 'KT 1 tiết' },
  giuaky:  { countTN: 28, countTL: 2,  label: 'Giữa kỳ' },
  cuoiky:  { countTN: 28, countTL: 3,  label: 'Cuối kỳ' },
  thpt:    { countTN: 50, countTL: 0,  label: 'THPT Quốc gia' },
  custom:  { countTN: 0,  countTL: 0,  label: 'Tùy chọn' },
} as const
type ExamPresetKey = keyof typeof EXAM_PRESETS

const DIFF_PRESETS = {
  balanced: { NB: 40, TH: 30, VD: 20, VDC: 10, label: 'Cân bằng' },
  easy:     { NB: 50, TH: 35, VD: 15, VDC: 0,  label: 'Dễ' },
  hard:     { NB: 25, TH: 30, VD: 30, VDC: 15, label: 'Khó' },
  hsg:      { NB: 10, TH: 20, VD: 40, VDC: 30, label: 'HSG' },
} as const
type DiffPresetKey = keyof typeof DIFF_PRESETS

const DIFF_COLORS: Record<string, string> = {
  NB: '#22c55e', TH: '#6366f1', VD: '#f59e0b', VDC: '#ef4444',
}

const SCOPES = [
  { value: 'chapter', label: 'Theo chương' },
  { value: 'hk1',     label: 'Học kỳ I' },
  { value: 'hk2',     label: 'Học kỳ II' },
  { value: 'full',    label: 'Cả năm' },
]

const TARGETS = [
  { value: 'dattra', label: 'Đại trà' },
  { value: 'kha',    label: 'Khá – Giỏi' },
  { value: 'hsg',    label: 'HSG / Chuyên' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-2">{children}</div>
}

function QuestionCard({ q, num, onEdit }: { q: GeneratedQuestion; num: number; onEdit?: (updated: GeneratedQuestion) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editQ, setEditQ] = useState(q)
  const color = DIFF_COLORS[q.difficulty] || '#6366f1'

  const handleSave = () => { onEdit?.(editQ); setEditing(false) }
  const handleCancel = () => { setEditQ(q); setEditing(false) }

  if (editing) {
    return (
      <div className="p-4 border-b border-bg-border last:border-0 bg-bg-hover/30" style={{ borderLeft: `3px solid ${color}` }}>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-dim w-10 shrink-0">Câu {num}</span>
            <div className="flex gap-1.5 ml-auto">
              <select value={editQ.difficulty} onChange={e => setEditQ(q => ({ ...q, difficulty: e.target.value }))}
                className="input text-xs py-1 px-2 h-auto">
                {(['NB','TH','VD','VDC'] as const).map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
              </select>
              <select value={editQ.type} onChange={e => setEditQ(q => ({ ...q, type: e.target.value }))}
                className="input text-xs py-1 px-2 h-auto">
                <option value="TN">Trắc nghiệm</option>
                <option value="TL">Tự luận</option>
              </select>
              <button onClick={handleSave} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-white text-xs font-medium">
                <Check size={11} /> Lưu
              </button>
              <button onClick={handleCancel} className="px-2.5 py-1 rounded-lg bg-bg-hover text-text-muted text-xs">Hủy</button>
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">Nội dung câu hỏi</div>
            <textarea value={editQ.question} rows={4}
              onChange={e => setEditQ(q => ({ ...q, question: e.target.value }))}
              className="input text-sm resize-y w-full font-mono" />
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">Đáp án</div>
            <input value={editQ.answer}
              onChange={e => setEditQ(q => ({ ...q, answer: e.target.value }))}
              className="input text-sm w-full" />
          </div>
          <div>
            <div className="text-xs text-text-muted mb-1">Lời giải (mỗi bước một dòng)</div>
            <textarea value={editQ.solution_steps.join('\n')} rows={3}
              onChange={e => setEditQ(q => ({ ...q, solution_steps: e.target.value.split('\n') }))}
              className="input text-sm resize-y w-full font-mono" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 border-b border-bg-border last:border-0 group" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-start gap-3">
        <span className="text-xs font-mono text-text-dim mt-0.5 w-10 flex-shrink-0">Câu {num}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className="badge text-[10px]" style={{ background: `${color}20`, color }}>
              {DIFFICULTY_LABELS[q.difficulty] || q.difficulty}
            </span>
            <span className="badge bg-accent/10 text-accent text-[10px]">
              {q.type === 'TN' ? 'Trắc nghiệm' : q.type === 'TL' ? 'Tự luận' : q.type}
            </span>
            {q.topic && <span className="text-[10px] text-text-dim">{q.topic}</span>}
            <span className="badge bg-yellow-400/10 text-yellow-400 text-[10px]">AI</span>
            {q._verified === 'fixed' && (
              <span className="badge bg-orange-400/10 text-orange-400 text-[10px] flex items-center gap-0.5">
                <ShieldCheck size={9} /> Đã sửa đáp án
              </span>
            )}
            {q._verified === 'ambiguous' && (
              <span className="badge bg-yellow-500/10 text-yellow-500 text-[10px] flex items-center gap-0.5"
                title={q._verify_note || ''}>
                <AlertTriangle size={9} /> Cần kiểm tra
              </span>
            )}
            {(q._potential_duplicates ?? 0) > 0 && (
              <span className="badge bg-purple-400/10 text-purple-400 text-[10px] flex items-center gap-0.5"
                title={`Tương tự ${Math.round((q._max_similarity ?? 0) * 100)}% với ${q._potential_duplicates} câu trong ngân hàng`}>
                <Copy size={9} /> Có thể trùng
              </span>
            )}
          </div>
          <p className="text-sm text-text leading-relaxed"><MathText text={q.question} /></p>
          {(q.answer || q.solution_steps.length > 0) && (
            <button onClick={() => setExpanded(e => !e)}
              className="mt-2 flex items-center gap-1 text-xs text-text-dim hover:text-accent transition-colors">
              <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
              {expanded ? 'Ẩn đáp án' : 'Xem đáp án & lời giải'}
            </button>
          )}
          {expanded && (
            <div className="mt-2 space-y-2 animate-slide-up">
              {q.answer && (
                <div className="text-xs bg-green-400/10 text-green-400 px-3 py-2 rounded-lg">
                  <span className="font-medium">Đáp án: </span><MathText text={q.answer} />
                </div>
              )}
              {q.solution_steps.length > 0 && (
                <div className="text-xs bg-bg-hover px-3 py-2 rounded-lg">
                  <div className="font-medium text-text-muted mb-1">Lời giải:</div>
                  {q.solution_steps.map((s, i) => (
                    <div key={i} className="text-text-muted"><span className="text-text-dim">{i+1}.</span> <MathText text={s} /></div>
                  ))}
                </div>
              )}
              {q._verify_note && (
                <div className="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-2 rounded-lg">
                  <span className="font-medium">Ghi chú kiểm tra: </span><MathText text={q._verify_note || ''} />
                </div>
              )}
            </div>
          )}
        </div>
        {onEdit && (
          <button onClick={() => setEditing(true)}
            className="shrink-0 opacity-0 group-hover:opacity-100 text-text-dim hover:text-accent transition-all mt-0.5"
            title="Chỉnh sửa câu hỏi">
            <Pencil size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const [mode, setMode] = useState<'single' | 'exam' | 'prompt'>('exam')

  // Exam preset
  const [examPreset, setExamPreset] = useState<ExamPresetKey>('giuaky')
  const [customTN, setCustomTN] = useState(28)
  const [customTL, setCustomTL] = useState(2)

  // Difficulty
  const [diffPreset, setDiffPreset] = useState<DiffPresetKey>('balanced')
  const [diffDist, setDiffDist] = useState({ NB: 40, TH: 30, VD: 20, VDC: 10 })

  // Single
  const [singleCount, setSingleCount] = useState(5)
  const [singleType, setSingleType] = useState('')
  const [singleDiff, setSingleDiff] = useState('')

  // Prompt (RAG free-text)
  const [promptText, setPromptText] = useState('')
  const [promptCount, setPromptCount] = useState(10)

  // Shared
  const [topic, setTopic] = useState('')
  const [scope, setScope] = useState('chapter')
  const [target, setTarget] = useState('dattra')

  // Curriculum
  const [curriculumTree, setCurriculumTree] = useState<CurriculumTree | null>(null)
  const [grade, setGrade] = useState<number | null>(null)
  const [chapters, setChapters] = useState<CurriculumChapter[]>([])
  const [chapterNo, setChapterNo] = useState('')
  const [lessons, setLessons] = useState<CurriculumLesson[]>([])
  const [lessonId, setLessonId] = useState('')
  const [bankCount, setBankCount] = useState<number | null>(null)
  const [topicOptions, setTopicOptions] = useState<string[]>([])

  // Result
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Send to class dialog
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [sendTitle, setSendTitle] = useState('')
  const [sendClasses, setSendClasses] = useState<ClassRoom[]>([])
  const [sendClassId, setSendClassId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [sentMsg, setSentMsg] = useState('')

  // Export / preview
  const [previewAnswers, setPreviewAnswers] = useState(true)
  const [previewSolutions, setPreviewSolutions] = useState(true)
  const [previewHtml, setPreviewHtml] = useState('')
  const [exportLoading, setExportLoading] = useState<string | null>(null)

  useEffect(() => {
    curriculumApi.getTree().then(setCurriculumTree).catch(() => {})
    questionsApi.getFilters().then(() => setTopicOptions([])).catch(() => {})
  }, [])

  useEffect(() => {
    const p = DIFF_PRESETS[diffPreset]
    setDiffDist({ NB: p.NB, TH: p.TH, VD: p.VD, VDC: p.VDC })
  }, [diffPreset])

  const handleGradeSelect = (g: number) => {
    setGrade(g); setChapterNo(''); setLessons([]); setLessonId(''); setTopic('')
    const node = curriculumTree?.grades.find(n => n.grade === g)
    setChapters(node?.chapters || [])
    setBankCount(node?.question_count ?? null)
  }

  const handleChapterChange = (chNo: string) => {
    setChapterNo(chNo); setLessonId(''); setLessons([])
    if (!chNo) {
      setBankCount(curriculumTree?.grades.find(n => n.grade === grade)?.question_count ?? null)
      return
    }
    const ch = chapters.find(c => String(c.chapter_no) === chNo)
    if (!ch) return
    setLessons(ch.lessons)
    setBankCount(ch.question_count)
    if (!topic) setTopic(ch.chapter.replace(/^Chương\s+[IVXLC\d]+\.\s*/i, ''))
  }

  const handleLessonChange = (lId: string) => {
    setLessonId(lId)
    const ls = lessons.find(l => String(l.id) === lId)
    if (ls) { setBankCount(ls.question_count); setTopic(ls.lesson_title) }
  }

  const diffTotal = diffDist.NB + diffDist.TH + diffDist.VD + diffDist.VDC

  const buildContextTopic = () => {
    const parts: string[] = []
    if (grade) parts.push(`Lớp ${grade}`)
    const preset = EXAM_PRESETS[examPreset]
    if (mode === 'exam') {
      const cTN = examPreset === 'custom' ? customTN : preset.countTN
      const cTL = examPreset === 'custom' ? customTL : preset.countTL
      parts.push(`${preset.label}: ${cTN} câu TN, ${cTL} câu TL`)
      parts.push(`Độ khó ${DIFF_PRESETS[diffPreset].label}`)
    }
    parts.push(`Đối tượng: ${TARGETS.find(t => t.value === target)?.label}`)
    if (topic) parts.push(`Nội dung: ${topic}`)
    return parts.join(' · ')
  }

  const buildSections = () => {
    const preset = EXAM_PRESETS[examPreset]
    const total = (examPreset === 'custom' ? customTN : preset.countTN)
                + (examPreset === 'custom' ? customTL : preset.countTL)
    if (total === 0) return []
    const diffs = ['NB', 'TH', 'VD', 'VDC'] as const
    const sections: { difficulty: string; count: number }[] = []
    let allocated = 0
    diffs.forEach(d => {
      const pct = diffDist[d]
      if (pct === 0) return
      const count = Math.round(total * pct / 100)
      if (count > 0) { sections.push({ difficulty: d, count }); allocated += count }
    })
    // Fix rounding drift: adjust last section so total is exact
    const remainder = total - allocated
    if (remainder !== 0 && sections.length > 0) {
      sections[sections.length - 1].count += remainder
    }
    return sections.filter(s => s.count > 0)
  }

  const handleGenerate = async () => {
    setGenerating(true); setError(''); setResult(null); setSavedMsg(''); setPreviewHtml('')
    const ctx = buildContextTopic()
    try {
      let res: GenerateResponse
      if (mode === 'prompt') {
        res = await generatorApi.generateFromPrompt({
          prompt: promptText.trim(),
          grade: grade || undefined,
          count: promptCount || undefined,
        })
      } else if (mode === 'exam') {
        const sections = buildSections()
        if (!sections.length) throw new Error('Chưa cấu hình số câu')
        res = await generatorApi.generateExam({ topic: ctx, sections })
      } else {
        res = await generatorApi.generate({
          question_type: singleType || undefined,
          topic: ctx || undefined,
          difficulty: singleDiff || undefined,
          count: singleCount,
        })
      }
      setResult(res)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveToBank = async () => {
    if (!result?.questions.length) return
    setSaving(true)
    try {
      const questions = result.questions.map(q => ({
        question_text: q.question || '',
        question_type: (q.type || 'TN') as QuestionType,
        topic: q.topic || '',
        difficulty: (q.difficulty || 'TH') as Difficulty,
        grade: grade || undefined,
        chapter: q.chapter || '',
        lesson_title: q.lesson_title || '',
        answer: q.answer || '',
        solution_steps: Array.isArray(q.solution_steps) ? q.solution_steps : [],
      }))
      const res = await questionsApi.bulkCreate(questions)
      setSavedMsg(`✓ Đã lưu ${res.saved} câu${res.skipped ? `, bỏ qua ${res.skipped} trùng` : ''}`)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const openSendDialog = async () => {
    setSendTitle(topic || (mode === 'exam' ? 'Đề kiểm tra' : 'Bài tập luyện tập'))
    setSendClassId(null)
    setSentMsg('')
    setSendDialogOpen(true)
    try {
      const classes = await classesApi.list()
      setSendClasses(classes)
    } catch (e) {
      setSendClasses([])
    }
  }

  const handleSendToClass = async () => {
    if (!result?.questions.length || !sendClassId) return
    setSending(true)
    try {
      const { exam_id } = await generatorApi.saveAsExam(sendTitle.trim() || 'Bài tập', result.questions)
      await assignmentsApi.create({ class_id: sendClassId, exam_id, title: sendTitle.trim() || 'Bài tập' })
      setSentMsg('✓ Đã gửi vào lớp thành công!')
      setTimeout(() => setSendDialogOpen(false), 1500)
    } catch (e) {
      setSentMsg(`⚠ ${getErrorMessage(e)}`)
    } finally {
      setSending(false)
    }
  }

  const buildExportPayload = (): GeneratorExportRequest | null => {
    if (!result?.questions.length) return null
    return {
      questions: result.questions.map(q => ({
        question: q.question, type: q.type, topic: q.topic,
        difficulty: q.difficulty, answer: q.answer, solution_steps: q.solution_steps,
      })),
      title: mode === 'exam' ? 'ĐỀ KIỂM TRA' : 'ĐỀ THI TOÁN HỌC',
      subtitle: topic || '',
      include_answers: previewAnswers,
      include_solutions: previewSolutions,
      group_by_diff: mode === 'exam',
    }
  }

  const handleExport = async (format: 'docx' | 'pdf' | 'latex') => {
    const payload = buildExportPayload(); if (!payload) return
    setExportLoading(format)
    try {
      if (format === 'pdf') {
        const html = await generatorExportApi.pdf({ ...payload, include_answers: true, include_solutions: true })
        const w = window.open('', '_blank')
        if (w) { w.document.write(html); w.document.close() }
      } else if (format === 'docx') {
        await generatorExportApi.docx(payload)
      } else {
        await generatorExportApi.latex(payload)
      }
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setExportLoading(null)
    }
  }

  // Auto-refresh preview when result or options change
  useEffect(() => {
    if (!result?.questions.length) return
    const payload: GeneratorExportRequest = {
      questions: result.questions.map(q => ({
        question: q.question, type: q.type, topic: q.topic,
        difficulty: q.difficulty, answer: q.answer, solution_steps: q.solution_steps,
      })),
      title: mode === 'exam' ? 'ĐỀ KIỂM TRA' : 'ĐỀ THI TOÁN HỌC',
      subtitle: topic || '',
      include_answers: previewAnswers,
      include_solutions: previewSolutions,
      group_by_diff: mode === 'exam',
    }
    generatorExportApi.pdf(payload)
      .then(html => setPreviewHtml(
        html.replace(/<div class="print-toolbar">[\s\S]*?<\/div>/, '')
            .replace('</style>', '\n.exam-container{margin:0 auto;padding:24px 28px;}body{background:#fff;}\n</style>')
      ))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewAnswers, previewSolutions, result, mode, topic])

  const handleEditQuestion = (index: number, updated: GeneratedQuestion) => {
    if (!result) return
    const questions = [...result.questions]
    questions[index] = updated
    setResult({ ...result, questions })
  }

  // Group by difficulty for exam mode display
  const grouped = result
    ? (['NB','TH','VD','VDC'] as const).reduce<Record<string, GeneratedQuestion[]>>((acc, d) => {
        const qs = result.questions.filter(q => q.difficulty === d)
        if (qs.length) acc[d] = qs
        return acc
      }, {})
    : {}

  return (
    <div className="p-5 flex flex-col gap-4 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-text">Sinh đề AI</h1>
        <p className="text-text-muted text-sm mt-1">
          AI tham khảo ngân hàng câu hỏi của bạn để tạo câu tương tự
        </p>
      </div>

      {/* ── Config: 4 columns ── */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

          {/* ─ Col 1: Chế độ ─ */}
          <div className="card p-4 space-y-3">
            <SectionLabel>Chế độ</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {([
                { v: 'exam',   l: 'Sinh đề' },
                { v: 'single', l: 'Câu đơn' },
                { v: 'prompt', l: 'Prompt tự do' },
              ] as const).map(o => (
                <button key={o.v} onClick={() => setMode(o.v)}
                  className={cn('py-2 rounded-lg text-sm font-medium transition-colors',
                    mode === o.v ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
                  {o.l}
                </button>
              ))}
            </div>
            {/* Count summary */}
            {mode === 'exam' && (() => {
              const p = EXAM_PRESETS[examPreset]
              const tn = examPreset === 'custom' ? customTN : p.countTN
              const tl = examPreset === 'custom' ? customTL : p.countTL
              return (
                <div className="rounded-lg bg-accent/10 py-2 text-center">
                  <div className="text-2xl font-bold text-accent leading-none">{tn + tl}</div>
                  <div className="text-[10px] text-text-muted mt-1">{tn} TN · {tl} TL</div>
                </div>
              )
            })()}
            {mode === 'single' && (
              <div>
                <div className="text-xs text-text-muted mb-1.5">Số câu muốn sinh</div>
                <input type="number" min={1} max={50} value={singleCount}
                  onChange={e => setSingleCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className="input text-sm text-center font-bold w-full" />
                <input type="range" min={1} max={50} value={singleCount}
                  onChange={e => setSingleCount(Number(e.target.value))}
                  className="w-full accent-accent mt-2" />
              </div>
            )}
            {mode === 'prompt' && (
              <div>
                <div className="text-xs text-text-muted mb-1.5">Số câu muốn sinh</div>
                <input type="number" min={1} max={50} value={promptCount}
                  onChange={e => setPromptCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className="input text-sm text-center font-bold w-full" />
              </div>
            )}
          </div>

          {/* ─ Col 2: Chương trình học + Chủ đề ─ */}
          <div className="card p-4 space-y-3">
            <SectionLabel>Chương trình học</SectionLabel>
            <div>
              <div className="text-xs text-text-muted mb-1.5">Khối lớp</div>
              <div className="flex flex-wrap gap-1.5">
                {[6,7,8,9,10,11,12].map(g => (
                  <button key={g} onClick={() => handleGradeSelect(g)}
                    className={cn('w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      grade === g ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {grade && (
              <div>
                <div className="text-xs text-text-muted mb-1.5">Phạm vi</div>
                <div className="flex flex-wrap gap-1">
                  {SCOPES.map(s => (
                    <button key={s.value} onClick={() => { setScope(s.value); setChapterNo(''); setLessons([]); setLessonId('') }}
                      className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                        scope === s.value ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {grade && scope === 'chapter' && chapters.length > 0 && (
              <div>
                <div className="text-xs text-text-muted mb-1.5">Chương</div>
                <select value={chapterNo} onChange={e => handleChapterChange(e.target.value)} className="input text-sm">
                  <option value="">Tất cả chương</option>
                  {chapters.map(ch => {
                    const short = ch.chapter.replace(/^Chương\s+/, 'Ch.').replace(/\.\s+/, ' – ')
                    return (
                      <option key={ch.chapter_no} value={ch.chapter_no}>
                        {short}{ch.question_count > 0 ? ` (${ch.question_count})` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
            {chapterNo && lessons.length > 0 && (
              <div>
                <div className="text-xs text-text-muted mb-1.5">Bài học</div>
                <select value={lessonId} onChange={e => handleLessonChange(e.target.value)} className="input text-sm">
                  <option value="">Tất cả bài trong chương</option>
                  {lessons.map(ls => (
                    <option key={ls.id} value={ls.id}>
                      {ls.lesson_title}{ls.question_count > 0 ? ` (${ls.question_count})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {grade !== null && bankCount !== null && (
              <div className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs',
                bankCount > 0 ? 'bg-green-400/10 text-green-400' : 'bg-bg-hover text-text-dim')}>
                <Info size={11} />
                {bankCount > 0 ? `${bankCount} câu mẫu trong ngân hàng` : 'Chưa có câu — AI sinh từ đầu'}
              </div>
            )}
            <div>
              <div className="text-xs text-text-muted mb-1.5">Chủ đề / Ghi chú</div>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="VD: Hàm số bậc hai, Đạo hàm..."
                className="input text-sm" />
            </div>
          </div>

          {/* ─ Col 3: Cấu hình đề + Số lượng câu ─ */}
          <div className="card p-4 space-y-3">
            {mode === 'exam' && (
              <>
                <SectionLabel>Cấu hình đề thi</SectionLabel>
                <div>
                  <div className="text-xs text-text-muted mb-1.5">Loại đề</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(Object.entries(EXAM_PRESETS) as [ExamPresetKey, any][]).map(([key, p]) => (
                      <button key={key} onClick={() => setExamPreset(key)}
                        className={cn('py-1.5 rounded-lg text-[11px] font-medium text-center transition-colors',
                          examPreset === key ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-text-muted mb-1">Câu TN</div>
                    <input type="number" min={0} max={100}
                      value={examPreset === 'custom' ? customTN : EXAM_PRESETS[examPreset].countTN}
                      readOnly={examPreset !== 'custom'}
                      onChange={e => examPreset === 'custom' && setCustomTN(Number(e.target.value))}
                      className={cn('input text-sm text-center font-semibold',
                        examPreset !== 'custom' && 'opacity-60 cursor-default')} />
                  </div>
                  <div>
                    <div className="text-xs text-text-muted mb-1">Câu TL</div>
                    <input type="number" min={0} max={20}
                      value={examPreset === 'custom' ? customTL : EXAM_PRESETS[examPreset].countTL}
                      readOnly={examPreset !== 'custom'}
                      onChange={e => examPreset === 'custom' && setCustomTL(Number(e.target.value))}
                      className={cn('input text-sm text-center font-semibold',
                        examPreset !== 'custom' && 'opacity-60 cursor-default')} />
                  </div>
                </div>
              </>
            )}
            {mode === 'single' && (
              <>
                <SectionLabel>Cấu hình câu đơn</SectionLabel>
                <div>
                  <div className="text-xs text-text-muted mb-1.5">Loại câu</div>
                  <select value={singleType} onChange={e => setSingleType(e.target.value)} className="input text-sm">
                    <option value="">Bất kỳ</option>
                    <option value="TN">Trắc nghiệm</option>
                    <option value="TL">Tự luận</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1.5">Độ khó</div>
                  <select value={singleDiff} onChange={e => setSingleDiff(e.target.value)} className="input text-sm">
                    <option value="">Bất kỳ</option>
                    {['NB','TH','VD','VDC'].map(d => (
                      <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {mode === 'prompt' && (
              <>
                <SectionLabel>
                  <div className="flex items-center gap-1.5"><MessageSquare size={12} />Prompt</div>
                </SectionLabel>
                <textarea value={promptText} rows={6}
                  onChange={e => setPromptText(e.target.value)}
                  placeholder={"VD: Tạo 10 câu TN lớp 8 ôn hằng đẳng thức...\n\nHoặc: 5 câu TL lớp 12 về đạo hàm mức VDC\n\nHoặc: Đề ôn HK2 lớp 9 tập trung hệ phương trình"}
                  className="input text-sm resize-none" />
                <div>
                  <div className="text-xs text-text-muted mb-1.5">Lớp (tuỳ chọn)</div>
                  <select value={grade ?? ''} onChange={e => e.target.value ? handleGradeSelect(Number(e.target.value)) : setGrade(null as any)} className="input text-sm">
                    <option value="">AI tự nhận diện</option>
                    {[6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Lớp {g}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* ─ Col 4: Phân phối độ khó + Đối tượng ─ */}
          <div className="card p-4 space-y-3">
            {mode === 'exam' && (
              <>
                <SectionLabel>Phân phối độ khó</SectionLabel>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.entries(DIFF_PRESETS) as [DiffPresetKey, any][]).map(([key, p]) => (
                    <button key={key} onClick={() => setDiffPreset(key)}
                      className={cn('py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                        diffPreset === key ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['NB','TH','VD','VDC'] as const).map(d => (
                    <div key={d} className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold w-8 shrink-0" style={{ color: DIFF_COLORS[d] }}>
                        {DIFFICULTY_LABELS[d]}
                      </span>
                      <input type="number" min={0} max={100} value={diffDist[d]}
                        onChange={e => setDiffDist(p => ({ ...p, [d]: Number(e.target.value) }))}
                        className="input text-sm py-1 text-center flex-1 min-w-0" />
                      <span className="text-[10px] text-text-dim">%</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-right">
                  Tổng: <span className={diffTotal === 100 ? 'text-green-400 font-semibold' : 'text-red-400 font-bold'}>{diffTotal}%</span>
                </div>
                <div className="border-t border-bg-border pt-3">
                  <div className="text-xs text-text-muted mb-1.5">Đối tượng học sinh</div>
                  <div className="flex flex-col gap-1">
                    {TARGETS.map(t => (
                      <button key={t.value} onClick={() => setTarget(t.value)}
                        className={cn('py-1.5 rounded-lg text-xs font-medium transition-colors',
                          target === t.value ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {mode === 'single' && (
              <div className="flex flex-col gap-3 h-full">
                <SectionLabel>Phân phối & Đối tượng</SectionLabel>
                <div className="text-xs text-text-muted mb-1.5">Đối tượng học sinh</div>
                <div className="flex flex-col gap-1.5">
                  {TARGETS.map(t => (
                    <button key={t.value} onClick={() => setTarget(t.value)}
                      className={cn('py-2 rounded-lg text-sm font-medium transition-colors',
                        target === t.value ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs bg-accent/10 text-accent mt-auto">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  AI tham khảo câu mẫu trong ngân hàng phù hợp với cấu hình đã chọn
                </div>
              </div>
            )}
            {mode === 'prompt' && (
              <div className="flex flex-col gap-3 h-full">
                <SectionLabel>Ghi chú</SectionLabel>
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs bg-accent/10 text-accent">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  AI sẽ phân tích yêu cầu, tìm câu mẫu trong ngân hàng, sinh đề mới và kiểm tra đáp án tự động
                </div>
                <div className="text-xs text-text-muted mb-1.5 mt-1">Đối tượng học sinh</div>
                <div className="flex flex-col gap-1.5">
                  {TARGETS.map(t => (
                    <button key={t.value} onClick={() => setTarget(t.value)}
                      className={cn('py-2 rounded-lg text-sm font-medium transition-colors',
                        target === t.value ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate button — full width */}
        <div>
          <button onClick={handleGenerate}
            disabled={generating || (mode === 'exam' && diffTotal !== 100) || (mode === 'prompt' && !promptText.trim())}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
            {generating
              ? <><Loader2 size={16} className="animate-spin" />Đang sinh đề...</>
              : <><Wand2 size={16} />{mode === 'prompt' ? 'Sinh đề từ prompt' : 'Sinh đề AI'}</>}
          </button>
          {mode === 'exam' && diffTotal !== 100 && (
            <p className="text-xs text-red-400 text-center mt-1">Tổng % phải = 100 (hiện {diffTotal}%)</p>
          )}
          {mode === 'prompt' && !promptText.trim() && (
            <p className="text-xs text-text-dim text-center mt-1">Nhập mô tả yêu cầu để bắt đầu</p>
          )}
        </div>
      </div>

      {/* ── Bottom: List + Preview ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Left: Question list */}
        <div className="flex flex-col gap-3">
          {!result && !generating && !error && (
            <div className="card flex items-center justify-center py-24">
              <div className="text-center">
                <Wand2 size={40} className="text-text-dim mx-auto mb-3" />
                <div className="text-text-muted">Cấu hình và nhấn "Sinh đề AI"</div>
                <div className="text-text-dim text-sm mt-1">AI tham khảo ngân hàng câu hỏi của bạn</div>
              </div>
            </div>
          )}

          {generating && (
            <div className="card p-12 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-text-muted">AI đang sinh câu hỏi...</div>
                {grade && <div className="text-text-dim text-sm">Lớp {grade} · {topic || 'Toán học'}</div>}
              </div>
            </div>
          )}

          {error && (
            <div className="card p-5 text-red-400 text-sm">⚠ {error}</div>
          )}

          {result && (
            <>
              {/* Toolbar */}
              <div className="card p-4 flex items-center gap-3 flex-wrap">
                <div>
                  <div className="font-semibold text-text">
                    {result.questions.length} câu hỏi
                    {result.sample_count > 0 && (
                      <span className="text-text-muted text-sm font-normal ml-2">
                        (tham khảo {result.sample_count} câu mẫu)
                      </span>
                    )}
                  </div>
                  {result.verification && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <ShieldCheck size={11} /> {result.verification.correct} đúng
                      </span>
                      {result.verification.fixed > 0 && (
                        <span className="text-xs text-orange-400 flex items-center gap-1">
                          <AlertTriangle size={11} /> {result.verification.fixed} đã sửa
                        </span>
                      )}
                      {result.verification.removed > 0 && (
                        <span className="text-xs text-red-400">{result.verification.removed} loại bỏ</span>
                      )}
                      {result.verification.ambiguous > 0 && (
                        <span className="text-xs text-yellow-500">{result.verification.ambiguous} cần kiểm tra</span>
                      )}
                    </div>
                  )}
                  {result.criteria && mode === 'prompt' && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {result.criteria.grade && (
                        <span className="badge bg-accent/10 text-accent text-[10px]">Lớp {result.criteria.grade}</span>
                      )}
                      {result.criteria.chapters?.map(ch => (
                        <span key={ch} className="badge bg-bg-hover text-text-muted text-[10px]">{ch}</span>
                      ))}
                      {result.criteria.difficulty_mix && Object.entries(result.criteria.difficulty_mix).map(([d, n]) => (
                        <span key={d} className="text-[10px]" style={{ color: DIFF_COLORS[d] }}>{n}×{d}</span>
                      ))}
                    </div>
                  )}
                  {savedMsg && <div className="text-xs text-green-400 mt-0.5">{savedMsg}</div>}
                </div>
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <button onClick={handleGenerate} className="btn-ghost text-sm flex items-center gap-1.5">
                    <RefreshCw size={13} /> Tạo lại
                  </button>
                  <button onClick={handleSaveToBank} disabled={saving}
                    className="btn-ghost text-sm flex items-center gap-1.5">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <BookmarkPlus size={13} />}
                    Lưu vào ngân hàng
                  </button>
                  <button onClick={openSendDialog}
                    className="btn-primary text-sm flex items-center gap-1.5 py-1.5">
                    <Send size={13} /> Gửi vào lớp
                  </button>
                  <button onClick={() => handleExport('docx')} disabled={!!exportLoading}
                    className="btn-primary text-sm flex items-center gap-1.5 py-1.5">
                    {exportLoading === 'docx' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    DOCX
                  </button>
                  <button onClick={() => handleExport('pdf')} disabled={!!exportLoading}
                    className="btn-ghost text-sm flex items-center gap-1.5 py-1.5">
                    {exportLoading === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    PDF
                  </button>
                  <button onClick={() => handleExport('latex')} disabled={!!exportLoading}
                    className="btn-ghost text-sm flex items-center gap-1.5 py-1.5">
                    {exportLoading === 'latex' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    LaTeX
                  </button>
                </div>
              </div>

              {/* Question list */}
              <div className="card overflow-hidden">
                <div className="max-h-[calc(100vh-500px)] overflow-y-auto min-h-[200px]">
                  {mode === 'exam'
                    ? Object.entries(grouped).map(([diff, qs]) => (
                        <div key={diff}>
                          <div className="px-4 py-2.5 flex items-center gap-2 sticky top-0 z-10"
                            style={{ background: `${DIFF_COLORS[diff]}14`, borderLeft: `4px solid ${DIFF_COLORS[diff]}` }}>
                            <span className="font-bold text-sm" style={{ color: DIFF_COLORS[diff] }}>
                              {DIFFICULTY_LABELS[diff]}
                            </span>
                            <span className="text-text-dim text-xs">{qs.length} câu</span>
                          </div>
                          {qs.map((q, i) => {
                            const globalNum = result.questions.findIndex(r => r === q) + 1
                            return <QuestionCard key={i} q={q} num={globalNum}
                              onEdit={updated => handleEditQuestion(result.questions.findIndex(r => r === q), updated)} />
                          })}
                        </div>
                      ))
                    : result.questions.map((q, i) => <QuestionCard key={i} q={q} num={i + 1}
                        onEdit={updated => handleEditQuestion(i, updated)} />)
                  }
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: PDF Preview */}
        <div className="flex flex-col">
          {!result && !generating && (
            <div className="card flex items-center justify-center py-24 flex-1">
              <div className="text-center">
                <Copy size={36} className="text-text-dim mx-auto mb-3" />
                <div className="text-text-dim text-sm">Xem trước đề sẽ hiển thị ở đây</div>
              </div>
            </div>
          )}

          {generating && (
            <div className="card flex items-center justify-center py-24 flex-1">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
                <div className="text-text-dim text-sm">Đang tạo xem trước...</div>
              </div>
            </div>
          )}

          {result && (
            <div className="card overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-bg-border flex items-center gap-4 shrink-0">
                <span className="text-sm font-medium text-text">Xem trước PDF</span>
                <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                  <input type="checkbox" checked={previewAnswers}
                    onChange={e => setPreviewAnswers(e.target.checked)} className="accent-accent" />
                  Đáp án
                </label>
                <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                  <input type="checkbox" checked={previewSolutions}
                    onChange={e => setPreviewSolutions(e.target.checked)} className="accent-accent" />
                  Lời giải
                </label>
              </div>
              {previewHtml
                ? <iframe srcDoc={previewHtml} className="w-full border-0" style={{ height: 'calc(100vh - 460px)', minHeight: 400 }} title="PDF Preview" />
                : (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center space-y-2">
                      <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
                      <div className="text-text-dim text-xs">Đang tạo xem trước...</div>
                    </div>
                  </div>
                )
              }
            </div>
          )}
        </div>
      </div>

      {/* ── Send to class dialog ── */}
      {sendDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-bg-card border border-bg-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">Gửi vào lớp</h2>
              <button onClick={() => setSendDialogOpen(false)} className="text-text-dim hover:text-text">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-dim mb-1.5 block">Tên bài tập *</label>
                <input
                  value={sendTitle}
                  onChange={e => setSendTitle(e.target.value)}
                  placeholder="VD: Đề kiểm tra 45 phút chương 2"
                  className="input text-sm w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-dim mb-1.5 block">Chọn lớp *</label>
                {sendClasses.length === 0 ? (
                  <div className="text-sm text-text-muted text-center py-4">
                    Bạn chưa có lớp nào. Tạo lớp trong mục Quản lý lớp trước.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {sendClasses.map(cls => (
                      <button key={cls.id} onClick={() => setSendClassId(cls.id)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                          sendClassId === cls.id
                            ? 'border-accent bg-accent/10 text-text'
                            : 'border-bg-border bg-bg-hover text-text-muted hover:text-text'
                        )}>
                        <div className="font-medium">{cls.name}</div>
                        {(cls.subject || cls.grade) && (
                          <div className="text-xs text-text-dim mt-0.5">
                            {cls.subject}{cls.grade ? ` · Lớp ${cls.grade}` : ''}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {sentMsg && (
                <div className={cn('text-sm px-3 py-2 rounded-lg',
                  sentMsg.startsWith('✓') ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400')}>
                  {sentMsg}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setSendDialogOpen(false)} className="btn-ghost flex-1 py-2 text-sm">Hủy</button>
                <button
                  onClick={handleSendToClass}
                  disabled={sending || !sendClassId || !sendTitle.trim()}
                  className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1.5">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Gửi bài tập
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
