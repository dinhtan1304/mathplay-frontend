'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { quizApi, quizAttemptApi, getErrorMessage } from '@/lib/api'
import type { QuizDelivery, QuizDeliveryQuestion, QuizAttempt, SubmitAnswerItem, HintResponse, SolutionData } from '@/types'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, ArrowRight, Loader2, Clock, Send,
  Check, CheckCircle, XCircle, Trophy, RotateCcw, BookOpen, Lightbulb,
  AlertTriangle, Eye, SkipForward, Minus, GripVertical,
} from 'lucide-react'
import { MathText } from '@/lib/math'
import { QuizMedia } from '@/components/ui/QuizMedia'

const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Chọn 1',
  checkbox: 'Chọn nhiều',
  fill_blank: 'Điền khuyết',
  reorder: 'Sắp xếp',
  true_false: 'Đúng/Sai',
  essay: 'Tự luận',
  true_false_not_given: 'T/F/NG',
  yes_no_not_given: 'Y/N/NG',
  matching: 'Nối',
  matching_headings: 'Nối tiêu đề',
}

// ─── Hint Level Config ──────────────────────────────────────────────────────
const HINT_LEVELS = [
  { level: 1, label: 'Xem lý thuyết', penalty: 'miễn phí', color: 'yellow', icon: BookOpen },
  { level: 2, label: 'Xem lời giải', penalty: '-25%', color: 'orange', icon: Eye },
  { level: 3, label: 'Xem đáp án', penalty: '-50%', color: 'red', icon: Eye },
] as const

export default function QuizPlayPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = Number(params.id)

  const [quiz, setQuiz] = useState<QuizDelivery | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [result, setResult] = useState<QuizAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Current question index
  const [currentIdx, setCurrentIdx] = useState(0)

  // Answers: questionId → answer value (undefined = not answered/skipped)
  const [answers, setAnswers] = useState<Record<number, unknown>>({})
  const [timers, setTimers] = useState<Record<number, number>>({})
  const questionStartRef = useRef<number>(Date.now())
  const quizStartRef = useRef<number>(Date.now())

  // Live elapsed second (ticks every 1s for display)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  // Hint state: questionId → max hint level revealed (0 = none)
  const [hintLevels, setHintLevels] = useState<Record<number, number>>({})
  // Hint data cache: "questionId_level" → HintResponse
  const [hintData, setHintData] = useState<Record<string, HintResponse>>({})
  const [hintLoading, setHintLoading] = useState(false)

  // Per-question time-expired tracking
  const [timeExpired, setTimeExpired] = useState<Record<number, boolean>>({})

  const negativeScoring = quiz?.settings?.negative_scoring ?? false

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
  }

  // Live elapsed for current question (accumulated + current session)
  const currentQId = quiz?.questions[currentIdx]?.id
  const liveQuestionMs = currentQId != null
    ? (timers[currentQId] || 0) + (Date.now() - questionStartRef.current)
    : 0
  // Total quiz elapsed
  const liveTotalMs = Date.now() - quizStartRef.current
  // Suppress unused tick warning — tick drives re-render for live timers
  void tick

  // Load quiz and start attempt
  useEffect(() => {
    const init = async () => {
      try {
        const q = await quizApi.deliver(quizId)
        const att = await quizAttemptApi.start(quizId)

        // Filter to selected questions if random selection was used
        if (att.selected_question_ids && att.selected_question_ids.length > 0) {
          const selectedSet = new Set(att.selected_question_ids)
          q.questions = q.questions.filter(qq => selectedSet.has(qq.id))
          // Preserve backend randomized order
          q.questions.sort((a, b) =>
            att.selected_question_ids!.indexOf(a.id) - att.selected_question_ids!.indexOf(b.id)
          )
          q.question_count = q.questions.length
          q.total_points = q.questions.reduce((sum, qq) => sum + qq.points, 0)
        }

        setQuiz(q)
        setAttempt(att)
      } catch (e) {
        console.error(e)
        alert(getErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [quizId])

  // Track time per question
  useEffect(() => {
    questionStartRef.current = Date.now()
  }, [currentIdx])

  const recordTime = () => {
    if (!quiz) return
    const q = quiz.questions[currentIdx]
    if (!q) return
    const elapsed = Date.now() - questionStartRef.current
    setTimers(prev => ({ ...prev, [q.id]: (prev[q.id] || 0) + elapsed }))
  }

  const setAnswer = (questionId: number, value: unknown) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const clearAnswer = (questionId: number) => {
    setAnswers(prev => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
  }

  const goNext = () => {
    if (!quiz) return
    recordTime()
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(prev => prev + 1)
    }
  }

  const goPrev = () => {
    recordTime()
    if (currentIdx > 0) setCurrentIdx(prev => prev - 1)
  }

  // ─── Auto-advance when per-question time expires ────────────
  useEffect(() => {
    if (!quiz || result) return
    const q = quiz.questions[currentIdx]
    if (!q || !q.time_limit_seconds || timeExpired[q.id]) return

    const elapsedMs = (timers[q.id] || 0) + (Date.now() - questionStartRef.current)
    if (elapsedMs / 1000 >= q.time_limit_seconds) {
      setTimeExpired(prev => ({ ...prev, [q.id]: true }))
      recordTime()
      const nextIdx = quiz.questions.findIndex(
        (qq, i) => i > currentIdx && !timeExpired[qq.id]
      )
      if (nextIdx !== -1) {
        setCurrentIdx(nextIdx)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, currentIdx, result])

  // ─── Hint request ──────────────────────────────────────────────────────────
  const requestHint = async (questionId: number) => {
    if (!attempt) return
    const currentLevel = hintLevels[questionId] || 0
    const nextLevel = currentLevel + 1
    if (nextLevel > 3) return

    const cacheKey = `${questionId}_${nextLevel}`
    if (!hintData[cacheKey]) {
      setHintLoading(true)
      try {
        const data = await quizAttemptApi.getHint(attempt.id, questionId, nextLevel)
        setHintData(prev => ({ ...prev, [cacheKey]: data }))
      } catch (e) {
        alert(getErrorMessage(e))
        setHintLoading(false)
        return
      } finally {
        setHintLoading(false)
      }
    }

    setHintLevels(prev => ({ ...prev, [questionId]: nextLevel }))
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!quiz || !attempt) return
    recordTime()
    setSubmitting(true)
    try {
      const submitAnswers: SubmitAnswerItem[] = quiz.questions.map(q => {
        const maxHintLevel = hintLevels[q.id] || 0
        return {
          question_id: q.id,
          given_answer: answers[q.id] ?? null,
          time_ms: timers[q.id] || 0,
          hint_used: maxHintLevel > 0,
          hint_level: maxHintLevel,
        }
      })
      const res = await quizAttemptApi.submit(attempt.id, submitAnswers)
      setResult(res)
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-text-dim text-sm">Đang tải quiz...</p>
        </div>
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

  // ─── Result Screen ──────────────────────────────────────────────────────────
  if (result) {
    const isPendingReview = result.status === 'pending_review'
    const scoreNegative = (result.score ?? 0) < 0
    return (
      <div className="min-h-screen bg-bg p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {isPendingReview ? (
            /* ─── Pending Review (manual grading) ─── */
            <div className="bg-bg-card border border-yellow-400/30 rounded-2xl p-6 text-center">
              <Clock size={48} className="mx-auto mb-4 text-yellow-400" />
              <h2 className="text-2xl font-bold text-text mb-2">Đã nộp bài</h2>
              <p className="text-text-dim text-sm mb-4">
                Bài làm của bạn đang chờ giáo viên chấm điểm.
                <br />Kết quả sẽ được cập nhật sau khi giáo viên hoàn tất chấm bài.
              </p>
              <div className="flex justify-center gap-4 mt-4 text-sm text-text-dim">
                <div className="text-center">
                  <p className="text-lg font-bold text-text">{result.total_questions}</p>
                  <p className="text-xs">Câu hỏi</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-text">{result.max_score}</p>
                  <p className="text-xs">Tổng điểm</p>
                </div>
                {result.time_spent_s && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-text">
                      {Math.floor(result.time_spent_s / 60)}:{String(result.time_spent_s % 60).padStart(2, '0')}
                    </p>
                    <p className="text-xs">Thời gian</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ─── Completed (auto-graded) ─── */
            <div className="bg-bg-card border border-bg-border rounded-2xl p-6 text-center">
              <Trophy size={48} className={cn('mx-auto mb-4', result.passed ? 'text-yellow-400' : 'text-text-dim')} />
              <h2 className="text-2xl font-bold text-text mb-2">
                {result.passed ? 'Chúc mừng!' : 'Hoàn thành'}
              </h2>
              <div className="flex justify-center gap-6 my-6">
                <div className="text-center">
                  <p className={cn('text-3xl font-bold', scoreNegative ? 'text-red-400' : 'text-primary')}>
                    {result.score}
                  </p>
                  <p className="text-xs text-text-dim">/{result.max_score} điểm</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-text">{result.percentage}%</p>
                  <p className="text-xs text-text-dim">Tỷ lệ</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{result.correct_count}</p>
                  <p className="text-xs text-text-dim">/{result.total_questions} đúng</p>
                </div>
              </div>
              {result.passed !== null && (
                <p className={cn('text-sm font-medium', result.passed ? 'text-green-400' : 'text-red-400')}>
                  {result.passed ? 'Đạt yêu cầu' : 'Chưa đạt yêu cầu'}
                </p>
              )}
              {result.graded_by_id && (
                <p className="text-xs text-text-dim mt-2">Chấm bởi giáo viên</p>
              )}
            </div>
          )}

          {/* Answer Review — only for auto-graded completed results */}
          {!isPendingReview && quiz.settings.allow_review_after_submit && result.answers && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text">Chi tiết đáp án</h3>
              {result.answers.map((a, i) => {
                const q = quiz.questions.find(qq => qq.id === a.question_id)
                const skipped = a.given_answer === null || a.given_answer === undefined
                const isNeg = a.points_earned < 0
                return (
                  <div key={a.id} className={cn(
                    'bg-bg-card border rounded-xl p-4',
                    skipped ? 'border-bg-border' : a.is_correct ? 'border-green-400/30' : 'border-red-400/30'
                  )}>
                    <div className="flex items-start gap-2">
                      {skipped ? (
                        <SkipForward size={16} className="text-text-dim mt-0.5 shrink-0" />
                      ) : a.is_correct ? (
                        <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <MathText text={q?.question_text || `Câu ${i + 1}`} className="text-sm text-text" />
                        <div className="flex items-center gap-2 mt-1 text-xs text-text-dim">
                          {skipped ? (
                            <span>Bỏ qua · 0 điểm</span>
                          ) : (
                            <>
                              <span>Đáp án: <span className="font-medium">{JSON.stringify(a.given_answer)}</span></span>
                              <span className={cn('font-medium', isNeg ? 'text-red-400' : a.is_correct ? 'text-green-400' : 'text-text-dim')}>
                                {isNeg ? '' : '+'}{a.points_earned} điểm
                              </span>
                            </>
                          )}
                          {a.hint_used && (
                            <span className="text-yellow-400">Gợi ý cấp {a.hint_level}</span>
                          )}
                        </div>
                        {a.teacher_comment && (
                          <div className="mt-2 bg-blue-400/5 border border-blue-400/20 rounded-lg p-3">
                            <p className="text-[11px] text-blue-400 mb-1 font-medium">Nhận xét của giáo viên:</p>
                            <p className="text-sm text-text">{a.teacher_comment}</p>
                          </div>
                        )}
                        {a.is_correct && a.explanation && (
                          <div className="mt-2 bg-bg/50 border border-bg-border rounded-lg p-3">
                            <p className="text-[11px] text-text-dim mb-1 font-medium">Giải thích:</p>
                            <MathText text={a.explanation} className="text-sm text-text" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button onClick={() => router.push('/quizzes')} className="btn-ghost flex items-center gap-1.5">
              <ArrowLeft size={14} /> Về danh sách
            </button>
            <button onClick={() => window.location.reload()} className="btn-primary flex items-center gap-1.5">
              <RotateCcw size={14} /> Làm lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Quiz Taking Screen ─────────────────────────────────────────────────────
  const currentQ = quiz.questions[currentIdx]
  const answered = Object.keys(answers).length
  const isLast = currentIdx === quiz.questions.length - 1
  const currentHintLevel = currentQ ? (hintLevels[currentQ.id] || 0) : 0
  const nextHintConfig = currentHintLevel < 3 ? HINT_LEVELS[currentHintLevel] : null

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-bg-card border-b border-bg-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/quizzes')} className="text-text-dim hover:text-text">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-text">{quiz.name}</h2>
              <p className="text-xs text-text-dim">Câu {currentIdx + 1}/{quiz.questions.length} · Đã trả lời {answered}/{quiz.questions.length} · <Clock size={10} className="inline" /> {fmtTime(liveTotalMs)}</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Nộp bài
          </button>
        </div>
      </div>

      {/* Negative scoring warning */}
      {negativeScoring && (
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <div className="bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle size={13} className="shrink-0" />
            <span>Trả lời sai sẽ bị trừ 0.5 điểm. Không chọn thì không bị trừ.</span>
          </div>
        </div>
      )}

      {/* Question Navigation Dots */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex flex-wrap gap-1.5 mb-6">
          {quiz.questions.map((q, i) => {
            const hasAnswer = answers[q.id] !== undefined
            const hasHint = (hintLevels[q.id] || 0) > 0
            const expired = timeExpired[q.id]
            return (
              <button
                key={q.id}
                onClick={() => { recordTime(); setCurrentIdx(i) }}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-medium transition-colors relative',
                  expired && !hasAnswer
                    ? 'bg-red-400/20 text-red-400 border border-red-400/30'
                    : i === currentIdx
                      ? 'bg-primary text-white'
                      : hasAnswer
                        ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                        : 'bg-bg-card text-text-dim border border-bg-border hover:border-primary/30'
                )}
              >
                {i + 1}
                {hasHint && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-3xl mx-auto px-4 pb-24">
        {currentQ && (
          <div className="bg-bg-card border border-bg-border rounded-2xl p-6">
            {/* Question header */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs font-mono text-text-dim">#{currentIdx + 1}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{currentQ.points} điểm</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium text-text-dim bg-bg-border/50">
                {QUESTION_TYPE_LABELS[currentQ.type] || currentQ.type}
              </span>
              {currentQ.difficulty && (
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', {
                  'text-green-400 bg-green-400/10': currentQ.difficulty === 'easy',
                  'text-blue-400 bg-blue-400/10': currentQ.difficulty === 'medium',
                  'text-orange-400 bg-orange-400/10': currentQ.difficulty === 'hard',
                  'text-red-400 bg-red-400/10': currentQ.difficulty === 'expert',
                })}>
                  {{ easy: 'NB', medium: 'TH', hard: 'VD', expert: 'VDC' }[currentQ.difficulty] || currentQ.difficulty}
                </span>
              )}
            </div>

            {/* Question text */}
            <MathText text={currentQ.question_text} className="text-text text-base whitespace-pre-wrap" block />
            <QuizMedia media={currentQ.media} size="md" className="mt-3 mb-4" />
            {!currentQ.media && <div className="mb-6" />}

            {/* Time expired banner */}
            {timeExpired[currentQ.id] && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-sm text-red-400">
                <Clock size={14} />
                <span className="font-medium">Hết giờ!</span>
                <span className="text-red-400/70 text-xs">Câu hỏi này đã hết thời gian trả lời.</span>
              </div>
            )}

            {/* ─── 3-Level Hint System ─── */}
            <div className="mb-6 space-y-3">
              {/* Level 1: Theory (miễn phí) */}
              {currentHintLevel >= 1 && (() => {
                const data = hintData[`${currentQ.id}_1`]
                if (!data?.theory_content) return (
                  <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 text-xs text-text-dim italic">
                    Câu này chưa có lý thuyết gợi ý
                  </div>
                )
                return (
                  <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4">
                    <p className="text-xs font-medium text-yellow-400 mb-2 flex items-center gap-1.5">
                      <BookOpen size={12} /> {data.theory_title || 'Lý thuyết'}
                      <span className="text-yellow-400/60 ml-auto">Gợi ý 1 — miễn phí</span>
                    </p>
                    <MathText text={data.theory_content} className="text-sm text-text" block />
                  </div>
                )
              })()}

              {/* Level 2: Solution steps (-25%) */}
              {currentHintLevel >= 2 && (() => {
                const data = hintData[`${currentQ.id}_2`]
                const sol = data?.solution
                if (!sol?.steps?.length) return (
                  <div className="bg-orange-400/5 border border-orange-400/20 rounded-xl p-4 text-xs text-text-dim italic">
                    Câu này chưa có lời giải
                  </div>
                )
                return (
                  <div className="bg-orange-400/5 border border-orange-400/20 rounded-xl p-4">
                    <p className="text-xs font-medium text-orange-400 mb-2 flex items-center gap-1.5">
                      <Eye size={12} /> Các bước giải
                      <span className="text-orange-400/60 ml-auto">Gợi ý 2 — trừ 25%</span>
                    </p>
                    <div className="space-y-1">
                      {sol.steps.map((step, i) => (
                        <div key={i} className="text-sm text-text flex gap-2">
                          <span className="text-orange-400 font-medium shrink-0">B{i + 1}.</span>
                          <MathText text={step} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Level 3: Answer + Explanation (-50%) */}
              {currentHintLevel >= 3 && (() => {
                const data = hintData[`${currentQ.id}_3`]
                if (data?.answer === null || data?.answer === undefined) return null
                const answerStr = typeof data.answer === 'string' ? data.answer
                  : typeof data.answer === 'boolean' ? (data.answer ? 'Đúng' : 'Sai')
                  : Array.isArray(data.answer) ? data.answer.join(', ')
                  : typeof data.answer === 'object' ? Object.entries(data.answer as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(', ')
                  : JSON.stringify(data.answer)
                return (
                  <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                    <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1.5">
                      <Eye size={12} /> Đáp án
                      <span className="text-red-400/60 ml-auto">Gợi ý 3 — trừ 50%</span>
                    </p>
                    <p className="text-base font-semibold text-text mb-1">
                      <MathText text={answerStr} />
                    </p>
                    {data.explanation && (
                      <div className="text-sm text-text-dim border-t border-red-400/10 pt-2 mt-2">
                        <p className="text-[11px] text-red-400/60 mb-1">Giải thích:</p>
                        <MathText text={data.explanation} />
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Next hint button */}
              {nextHintConfig && (
                <button
                  onClick={() => requestHint(currentQ.id)}
                  disabled={hintLoading}
                  className={cn(
                    'text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors',
                    nextHintConfig.color === 'yellow' && 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20',
                    nextHintConfig.color === 'orange' && 'bg-orange-400/10 text-orange-400 hover:bg-orange-400/20',
                    nextHintConfig.color === 'red' && 'bg-red-400/10 text-red-400 hover:bg-red-400/20',
                  )}
                >
                  {hintLoading ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Lightbulb size={11} />
                  )}
                  {nextHintConfig.label} ({nextHintConfig.penalty})
                </button>
              )}
            </div>

            {/* Answer input by type */}
            <div className={cn(timeExpired[currentQ.id] && 'opacity-50 pointer-events-none')}>
            {currentQ.type === 'multiple_choice' && currentQ.choices && (
              <div className="space-y-2">
                {currentQ.choices.map(c => {
                  const isSelected = answers[currentQ.id] === c.key
                  return (
                    <button
                      key={c.key}
                      onClick={() => setAnswer(currentQ.id, c.key)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-bg-border hover:border-primary/30'
                      )}
                    >
                      <span className={cn(
                        'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                        isSelected ? 'border-primary' : 'border-text-dim/30'
                      )}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-text-dim mr-1">{c.key}.</span>
                          <MathText text={c.text} className="text-text" />
                        </div>
                        {c.media?.url && <QuizMedia media={c.media} size="sm" className="mt-1.5 ml-5" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {currentQ.type === 'checkbox' && currentQ.choices && (
              <div className="space-y-2">
                {currentQ.choices.map(c => {
                  const selected = Array.isArray(answers[currentQ.id]) && (answers[currentQ.id] as string[]).includes(c.key)
                  return (
                    <button
                      key={c.key}
                      onClick={() => {
                        const prev = (answers[currentQ.id] as string[]) || []
                        const next = selected ? prev.filter(k => k !== c.key) : [...prev, c.key]
                        setAnswer(currentQ.id, next.length > 0 ? next : undefined as unknown)
                      }}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3',
                        selected ? 'border-primary bg-primary/5' : 'border-bg-border hover:border-primary/30'
                      )}
                    >
                      <span className={cn(
                        'w-4 h-4 rounded-[3px] border-2 shrink-0 flex items-center justify-center transition-colors',
                        selected ? 'border-primary bg-primary' : 'border-text-dim/30'
                      )}>
                        {selected && <Check size={10} className="text-white" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-text-dim mr-1">{c.key}.</span>
                          <MathText text={c.text} className="text-text" />
                        </div>
                        {c.media?.url && <QuizMedia media={c.media} size="sm" className="mt-1.5 ml-5" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {currentQ.type === 'fill_blank' && (() => {
              const labels = currentQ.blank_labels?.length
                ? currentQ.blank_labels
                : Array.from({ length: Math.max(currentQ.blank_count || 1, 1) }, (_, i) => `B${i + 1}`)
              const currentVal = (answers[currentQ.id] as Record<string, string>) || {}
              return (
                <div className="space-y-3">
                  {labels.map((label, i) => (
                    <div key={label} className="flex items-center gap-3">
                      {labels.length > 1 && (
                        <span className="text-xs font-mono text-primary bg-primary/10 rounded px-2 py-1 shrink-0 min-w-[36px] text-center">
                          {label}
                        </span>
                      )}
                      <input
                        value={currentVal[label] || ''}
                        onChange={e => {
                          const next = { ...currentVal, [label]: e.target.value }
                          // Remove empty keys
                          const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v))
                          if (Object.keys(cleaned).length > 0) setAnswer(currentQ.id, cleaned)
                          else clearAnswer(currentQ.id)
                        }}
                        className="input flex-1 text-base"
                        placeholder={labels.length > 1 ? `Đáp án ô ${label}...` : 'Nhập đáp án...'}
                        autoFocus={i === 0}
                      />
                    </div>
                  ))}
                </div>
              )
            })()}

            {currentQ.type === 'reorder' && currentQ.items && (
              <ReorderInput
                items={currentQ.items as { id: string; text: string }[]}
                value={(answers[currentQ.id] as string[]) || []}
                onChange={v => setAnswer(currentQ.id, v)}
              />
            )}

            {currentQ.type === 'true_false' && (
              <div className="flex gap-3">
                {[true, false].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => setAnswer(currentQ.id, v)}
                    className={cn(
                      'flex-1 py-4 rounded-xl border-2 text-lg font-medium transition-all',
                      answers[currentQ.id] === v ? 'border-primary bg-primary/5 text-primary' : 'border-bg-border text-text-dim hover:border-primary/30'
                    )}
                  >
                    {v ? 'Đúng' : 'Sai'}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'essay' && (
              <textarea
                value={(answers[currentQ.id] as string) || ''}
                onChange={e => {
                  const val = e.target.value
                  if (val) setAnswer(currentQ.id, val)
                  else clearAnswer(currentQ.id)
                }}
                className="input w-full min-h-[150px] resize-y"
                placeholder="Viết câu trả lời..."
                rows={6}
              />
            )}

            {/* Skip button (visible when negative scoring is on and answer exists) */}
            {negativeScoring && answers[currentQ.id] !== undefined && (
              <button
                onClick={() => clearAnswer(currentQ.id)}
                className="mt-3 text-xs text-text-dim hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Minus size={11} /> Bỏ chọn (0 điểm)
              </button>
            )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="btn-ghost flex items-center gap-1.5 disabled:opacity-30"
          >
            <ArrowLeft size={14} /> Câu trước
          </button>
          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-1.5"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Nộp bài
            </button>
          ) : (
            <button onClick={goNext} className="btn-primary flex items-center gap-1.5">
              Câu tiếp <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Reorder Component (Drag & Drop + Fallback Buttons) ────────────────────
function ReorderInput({ items, value, onChange }: {
  items: { id: string; text: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const orderedIds = value.length > 0 ? value : items.map(i => i.id)
  const itemMap = Object.fromEntries(items.map(i => [i.id, i]))
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  // Touch drag state
  const touchItemRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIdx(idx)
  }

  const handleDrop = (dropIdx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null)
      setOverIdx(null)
      return
    }
    const next = [...orderedIds]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(dropIdx, 0, moved)
    onChange(next)
    setDragIdx(null)
    setOverIdx(null)
  }

  const handleDragEnd = () => {
    setDragIdx(null)
    setOverIdx(null)
  }

  // Touch handlers for mobile drag
  const handleTouchStart = (idx: number) => () => {
    touchItemRef.current = idx
    setDragIdx(idx)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchItemRef.current === null || !containerRef.current) return
    const touch = e.touches[0]
    const container = containerRef.current
    const children = Array.from(container.children) as HTMLElement[]

    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect()
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        setOverIdx(i)
        break
      }
    }
  }

  const handleTouchEnd = () => {
    if (touchItemRef.current !== null && overIdx !== null && touchItemRef.current !== overIdx) {
      const next = [...orderedIds]
      const [moved] = next.splice(touchItemRef.current, 1)
      next.splice(overIdx, 0, moved)
      onChange(next)
    }
    touchItemRef.current = null
    setDragIdx(null)
    setOverIdx(null)
  }

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const next = [...orderedIds]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onChange(next)
  }

  const moveDown = (idx: number) => {
    if (idx >= orderedIds.length - 1) return
    const next = [...orderedIds]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-text-dim mb-2 flex items-center gap-1.5">
        <GripVertical size={12} /> Kéo để sắp xếp thứ tự đúng
      </p>
      <div ref={containerRef} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {orderedIds.map((id, idx) => {
          const item = itemMap[id]
          if (!item) return null
          const isDragging = dragIdx === idx
          const isOver = overIdx === idx && dragIdx !== idx
          return (
            <div
              key={id}
              draggable
              onDragStart={handleDragStart(idx)}
              onDragOver={handleDragOver(idx)}
              onDrop={handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onTouchStart={handleTouchStart(idx)}
              className={cn(
                'flex items-center gap-2 bg-bg border rounded-lg p-3 mb-1.5 cursor-grab active:cursor-grabbing select-none transition-all',
                isDragging ? 'opacity-40 border-primary/50' : 'border-bg-border',
                isOver ? 'border-primary border-dashed bg-primary/5 scale-[1.02]' : '',
              )}
            >
              <GripVertical size={16} className="text-text-dim shrink-0 touch-none" />
              <span className="text-sm font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5 min-w-[24px] text-center shrink-0">
                {idx + 1}
              </span>
              <MathText text={item.text} className="flex-1 text-sm text-text" />
              <div className="flex gap-0.5 shrink-0">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="w-6 h-6 rounded hover:bg-bg-hover flex items-center justify-center text-text-dim disabled:opacity-20"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx >= orderedIds.length - 1}
                  className="w-6 h-6 rounded hover:bg-bg-hover flex items-center justify-center text-text-dim disabled:opacity-20"
                >
                  ▼
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
