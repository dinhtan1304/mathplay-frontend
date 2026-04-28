'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { quizApi, quizAttemptApi, getErrorMessage } from '@/lib/api'
import type { Quiz, QuizAttempt, QuizAnswerResult, QuizQuestion } from '@/types'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Loader2, Check, CheckCircle, XCircle,
  Save, ChevronDown, ChevronUp, Send, MessageSquare, User,
} from 'lucide-react'
import { MathText } from '@/lib/math'
import { QuizMedia } from '@/components/ui/QuizMedia'

export default function QuizGradePage() {
  const params = useParams()
  const router = useRouter()
  const quizId = Number(params.id)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)

  // Currently selected attempt
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null)

  // Grading state per answer: answerId → { points, is_correct, comment }
  const [grades, setGrades] = useState<Record<number, {
    points_earned: number
    is_correct: boolean | null
    teacher_comment: string
  }>>({})
  const [savingAnswerId, setSavingAnswerId] = useState<number | null>(null)
  const [finalizing, setFinalizing] = useState(false)
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set())

  useEffect(() => {
    const load = async () => {
      try {
        const [q, qs, atts] = await Promise.all([
          quizApi.get(quizId),
          quizApi.listQuestions(quizId),
          quizAttemptApi.getPendingReview(quizId),
        ])
        setQuiz(q)
        setQuestions(qs)
        setAttempts(atts)
        if (atts.length > 0) setSelectedAttemptId(atts[0].id)
      } catch (e) {
        alert(getErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId])

  const selectedAttempt = attempts.find(a => a.id === selectedAttemptId)

  // Initialize grades from attempt answers
  useEffect(() => {
    if (!selectedAttempt) return
    const initial: typeof grades = {}
    for (const a of selectedAttempt.answers) {
      initial[a.id] = {
        points_earned: a.points_earned,
        is_correct: a.is_correct ?? null,
        teacher_comment: a.teacher_comment || '',
      }
    }
    setGrades(initial)
    setExpandedAnswers(new Set(selectedAttempt.answers.map(a => a.id)))
  }, [selectedAttemptId, selectedAttempt])

  const updateGrade = (answerId: number, field: string, value: unknown) => {
    setGrades(prev => ({
      ...prev,
      [answerId]: { ...prev[answerId], [field]: value },
    }))
  }

  const handleSaveAnswer = async (answer: QuizAnswerResult) => {
    if (!selectedAttempt) return
    const grade = grades[answer.id]
    if (!grade) return

    setSavingAnswerId(answer.id)
    try {
      const updated = await quizAttemptApi.gradeAnswer(selectedAttempt.id, answer.id, {
        points_earned: grade.points_earned,
        is_correct: grade.is_correct,
        teacher_comment: grade.teacher_comment || null,
      })
      // Update in local state
      setAttempts(prev => prev.map(att => {
        if (att.id !== selectedAttempt.id) return att
        return {
          ...att,
          answers: att.answers.map(a => a.id === answer.id ? { ...a, ...updated } : a),
        }
      }))
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setSavingAnswerId(null)
    }
  }

  const handleFinalize = async () => {
    if (!selectedAttempt) return
    if (!confirm('Xác nhận hoàn tất chấm bài? Kết quả sẽ được gửi đến học sinh.')) return

    setFinalizing(true)
    try {
      await quizAttemptApi.finalizeGrading(selectedAttempt.id)
      // Remove from pending list, or update status
      setAttempts(prev => prev.filter(a => a.id !== selectedAttempt.id))
      if (attempts.length > 1) {
        const remaining = attempts.filter(a => a.id !== selectedAttempt.id)
        setSelectedAttemptId(remaining[0]?.id ?? null)
      } else {
        setSelectedAttemptId(null)
      }
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setFinalizing(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedAnswers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getQuestion = (questionId: number) => questions.find(q => q.id === questionId)

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
        <p className="text-text-dim">Quiz not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg-card border-b border-bg-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/quizzes/${quizId}/edit`)} className="text-text-dim hover:text-text">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-text">Cham diem: {quiz.name}</h2>
              <p className="text-xs text-text-dim">
                {attempts.length} bai cho cham
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 flex gap-4">
        {/* Left: Attempt List */}
        <div className="w-64 shrink-0">
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">
            Bai cho cham ({attempts.length})
          </h3>
          {attempts.length === 0 ? (
            <div className="bg-bg-card border border-bg-border rounded-xl p-4 text-center">
              <CheckCircle size={24} className="mx-auto text-green-400 mb-2" />
              <p className="text-sm text-text">Da cham tat ca!</p>
              <button
                onClick={() => router.push(`/quizzes/${quizId}/edit`)}
                className="btn-ghost text-xs mt-3"
              >
                Quay lai quiz
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {attempts.map(att => (
                <button
                  key={att.id}
                  onClick={() => setSelectedAttemptId(att.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border transition-all',
                    att.id === selectedAttemptId
                      ? 'border-primary bg-primary/5'
                      : 'border-bg-border bg-bg-card hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-text-dim" />
                    <span className="text-sm font-medium text-text">
                      {att.student_id ? `Hoc sinh #${att.student_id}` : 'Khach'}
                    </span>
                  </div>
                  <div className="text-xs text-text-dim mt-1">
                    Lan {att.attempt_no} · {att.total_questions} cau
                    {att.time_spent_s && ` · ${Math.floor(att.time_spent_s / 60)}p${att.time_spent_s % 60}s`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Grading Panel */}
        <div className="flex-1 min-w-0">
          {selectedAttempt ? (
            <div className="space-y-4">
              {/* Attempt Info */}
              <div className="bg-bg-card border border-bg-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">
                    {selectedAttempt.student_id ? `Hoc sinh #${selectedAttempt.student_id}` : 'Khach'} — Lan {selectedAttempt.attempt_no}
                  </p>
                  <p className="text-xs text-text-dim">
                    {selectedAttempt.total_questions} cau · Tong diem: {selectedAttempt.max_score}
                    {selectedAttempt.time_spent_s && ` · Thoi gian: ${Math.floor(selectedAttempt.time_spent_s / 60)}:${String(selectedAttempt.time_spent_s % 60).padStart(2, '0')}`}
                  </p>
                </div>
                <button
                  onClick={handleFinalize}
                  disabled={finalizing}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  {finalizing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Hoan tat cham bai
                </button>
              </div>

              {/* Answers to grade */}
              {selectedAttempt.answers.map((answer, i) => {
                const qq = getQuestion(answer.question_id)
                const grade = grades[answer.id]
                const isExpanded = expandedAnswers.has(answer.id)
                const maxPoints = qq ? qq.points : 1

                return (
                  <div key={answer.id} className="bg-bg-card border border-bg-border rounded-xl overflow-hidden">
                    {/* Question header (clickable) */}
                    <button
                      onClick={() => toggleExpand(answer.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-bg-hover/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                        <span className="text-xs font-mono text-text-dim shrink-0">#{i + 1}</span>
                        <span className="text-sm text-text truncate">
                          {qq?.question_text || `Cau ${i + 1}`}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-border/50 text-text-dim shrink-0">
                          {qq?.type || '?'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {grade && grade.points_earned > 0 && (
                          <span className="text-xs font-medium text-green-400">{grade.points_earned}/{maxPoints}</span>
                        )}
                        {isExpanded ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
                      </div>
                    </button>

                    {/* Expanded: question + answer + grading form */}
                    {isExpanded && grade && (
                      <div className="border-t border-bg-border p-4 space-y-4">
                        {/* Full question text */}
                        {qq && (
                          <div>
                            <p className="text-[11px] text-text-dim font-medium mb-1">De bai:</p>
                            <MathText text={qq.question_text} className="text-sm text-text" block />
                            {qq.media?.url && <QuizMedia media={qq.media} size="md" className="mt-2" />}
                          </div>
                        )}

                        {/* Correct answer (for reference) */}
                        {qq?.answer !== null && qq?.answer !== undefined && (
                          <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-3">
                            <p className="text-[11px] text-green-400 font-medium mb-1">Dap an dung:</p>
                            <p className="text-sm text-text font-medium">
                              {typeof qq.answer === 'string' ? qq.answer
                                : typeof qq.answer === 'boolean' ? (qq.answer ? 'Dung' : 'Sai')
                                : JSON.stringify(qq.answer)}
                            </p>
                          </div>
                        )}

                        {/* Student's answer */}
                        <div className={cn(
                          'border rounded-lg p-3',
                          answer.given_answer === null || answer.given_answer === undefined
                            ? 'bg-bg border-bg-border'
                            : 'bg-blue-400/5 border-blue-400/20'
                        )}>
                          <p className="text-[11px] text-blue-400 font-medium mb-1">Cau tra loi cua hoc sinh:</p>
                          {answer.given_answer === null || answer.given_answer === undefined ? (
                            <p className="text-sm text-text-dim italic">Bo qua (khong tra loi)</p>
                          ) : (
                            <p className="text-sm text-text">
                              {typeof answer.given_answer === 'string' ? answer.given_answer
                                : typeof answer.given_answer === 'boolean' ? (answer.given_answer ? 'Dung' : 'Sai')
                                : JSON.stringify(answer.given_answer)}
                            </p>
                          )}
                        </div>

                        {/* Grading form */}
                        <div className="flex items-end gap-4">
                          {/* Points */}
                          <div>
                            <label className="text-xs text-text-dim block mb-1">Diem</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={grade.points_earned}
                                onChange={e => updateGrade(answer.id, 'points_earned', Math.max(0, Math.min(maxPoints, Number(e.target.value) || 0)))}
                                className="input w-20 text-center"
                                min={0}
                                max={maxPoints}
                                step={0.25}
                              />
                              <span className="text-xs text-text-dim">/ {maxPoints}</span>
                            </div>
                          </div>

                          {/* Quick buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                updateGrade(answer.id, 'points_earned', maxPoints)
                                updateGrade(answer.id, 'is_correct', true)
                              }}
                              className={cn(
                                'px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                                grade.is_correct === true
                                  ? 'border-green-400 bg-green-400/10 text-green-400'
                                  : 'border-bg-border text-text-dim hover:border-green-400/50'
                              )}
                            >
                              <CheckCircle size={12} className="inline mr-1" />
                              Dung
                            </button>
                            <button
                              onClick={() => {
                                updateGrade(answer.id, 'points_earned', 0)
                                updateGrade(answer.id, 'is_correct', false)
                              }}
                              className={cn(
                                'px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                                grade.is_correct === false
                                  ? 'border-red-400 bg-red-400/10 text-red-400'
                                  : 'border-bg-border text-text-dim hover:border-red-400/50'
                              )}
                            >
                              <XCircle size={12} className="inline mr-1" />
                              Sai
                            </button>
                          </div>

                          {/* Save */}
                          <button
                            onClick={() => handleSaveAnswer(answer)}
                            disabled={savingAnswerId === answer.id}
                            className="btn-ghost text-xs flex items-center gap-1 ml-auto"
                          >
                            {savingAnswerId === answer.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                            Luu
                          </button>
                        </div>

                        {/* Teacher comment */}
                        <div>
                          <label className="text-xs text-text-dim flex items-center gap-1 mb-1">
                            <MessageSquare size={10} /> Nhan xet
                          </label>
                          <textarea
                            value={grade.teacher_comment}
                            onChange={e => updateGrade(answer.id, 'teacher_comment', e.target.value)}
                            className="input w-full text-sm resize-none"
                            rows={2}
                            placeholder="Nhan xet cho hoc sinh (tuy chon)..."
                            maxLength={1000}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-bg-card border border-bg-border rounded-xl p-8 text-center">
              <p className="text-text-dim text-sm">Chon bai lam ben trai de bat dau cham diem</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
