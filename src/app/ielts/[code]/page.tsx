'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { quizApi, quizAttemptApi, getErrorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type {
  IeltsGroupedQuiz,
  IeltsSection,
  IeltsSectionGroup,
  QuizAnswerResult,
  QuizAttempt,
  QuizDelivery,
  QuizDeliveryQuestion,
  QuizTheory,
} from '@/types'
import { useIeltsTest } from './hooks/useIeltsTest'
import { TopBar } from './components/TopBar'
import { BottomNav } from './components/BottomNav'
import { ReadingLayout } from './components/ReadingLayout'
import { ListeningLayout } from './components/ListeningLayout'
import { WritingLayout } from './components/WritingLayout'
import { ReviewScreen } from './components/ReviewScreen'

function detectSectionKind(question: QuizDeliveryQuestion): IeltsSection {
  const raw =
    (question.metadata?.ielts_section as string | undefined) ??
    (question.metadata?.group_instruction as string | undefined) ??
    ''
  const lower = raw.toLowerCase()
  if (question.type === 'essay' || lower.startsWith('writing')) return 'writing'
  if (lower.startsWith('listening')) return 'listening'
  return 'reading'
}

function groupByIelts(quiz: QuizDelivery): IeltsGroupedQuiz {
  const byKind = new Map<IeltsSection, Map<string, QuizDeliveryQuestion[]>>()
  const kindOrder: IeltsSection[] = []

  for (const q of quiz.questions) {
    const kind = detectSectionKind(q)
    if (!kindOrder.includes(kind)) kindOrder.push(kind)
    const title =
      (q.metadata?.ielts_section as string | undefined) ??
      `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`
    const kindMap = byKind.get(kind) ?? new Map<string, QuizDeliveryQuestion[]>()
    const list = kindMap.get(title) ?? []
    list.push(q)
    kindMap.set(title, list)
    byKind.set(kind, kindMap)
  }

  const theoriesByTitle = new Map<string, QuizTheory>()
  for (const t of quiz.theories ?? []) theoriesByTitle.set(t.title, t)

  const sections: IeltsSectionGroup[] = kindOrder.flatMap(kind => {
    const kindMap = byKind.get(kind)
    if (!kindMap) return []
    return [...kindMap.entries()].map<IeltsSectionGroup>(([title, questions]) => ({
      kind,
      title,
      theory: theoriesByTitle.get(title) ?? null,
      audioUrl: null,
      questions,
    }))
  })

  // Collapse multiple subsections into one logical section per kind for palette.
  const collapsed = new Map<IeltsSection, IeltsSectionGroup>()
  for (const s of sections) {
    const existing = collapsed.get(s.kind)
    if (!existing) {
      collapsed.set(s.kind, { ...s })
    } else {
      existing.questions = [...existing.questions, ...s.questions]
      if (!existing.theory && s.theory) existing.theory = s.theory
    }
  }
  const finalSections = kindOrder
    .map(k => collapsed.get(k))
    .filter((s): s is IeltsSectionGroup => Boolean(s))

  return { quiz, sections: finalSections }
}

export default function IeltsTestPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [quiz, setQuiz] = useState<QuizDelivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!params.code) return
    let cancelled = false
    setLoading(true)
    quizApi
      .getByCode(params.code)
      .then(q => {
        if (!cancelled) setQuiz(q)
      })
      .catch(err => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [params.code])

  const grouped = useMemo<IeltsGroupedQuiz | null>(
    () => (quiz ? groupByIelts(quiz) : null),
    [quiz],
  )

  const test = useIeltsTest(params.code ?? '', grouped)

  const attemptResults = useMemo<Record<number, QuizAnswerResult>>(() => {
    if (!attempt?.answers) return {}
    return Object.fromEntries(attempt.answers.map(a => [a.question_id, a]))
  }, [attempt])

  const handleSubmit = async () => {
    if (!quiz || submitting) return
    if (!window.confirm('Nộp bài IELTS? Bạn không thể chỉnh sửa sau khi nộp.')) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const started = await quizAttemptApi.start(quiz.id)
      const submitted = await quizAttemptApi.submit(
        started.id,
        Object.entries(test.answers).map(([qid, given]) => ({
          question_id: Number(qid),
          given_answer: given,
        })),
      )
      setAttempt(submitted)
      test.submit()
      test.viewReview()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (error || !quiz || !grouped) {
    return (
      <div className="h-screen flex items-center justify-center bg-background px-6">
        <div className="bg-bg-card border border-bg-border rounded-2xl p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-text mb-2">Không tải được đề thi</h2>
          <p className="text-text-dim text-sm mb-4">
            {error ?? 'Quiz không tồn tại hoặc đã bị xóa.'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn-primary px-4 py-2"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  if (test.stage === 'review') {
    return (
      <ReviewScreen
        grouped={grouped}
        answers={test.answers}
        attemptResults={attemptResults}
        onRetry={() => {
          setAttempt(null)
          test.reset()
        }}
        onExit={() => router.push('/')}
      />
    )
  }

  const section = test.currentSection

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar
        candidateName={user?.full_name || user?.email || 'Candidate'}
        testName={quiz.name}
        sectionKind={test.currentSectionKind}
        remainingMs={test.remainingMs}
        flaggedCount={test.flags.size}
        onSubmit={handleSubmit}
      />

      {submitError && (
        <div className="bg-red-500/10 border-b border-red-500/40 text-red-300 text-sm px-4 py-2">
          {submitError}
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {section?.kind === 'reading' && (
          <ReadingLayout
            section={section}
            currentQuestion={test.currentQuestion}
            currentQuestionIdx={test.currentQuestionIdx}
            answers={test.answers}
            onAnswer={test.setAnswer}
          />
        )}
        {section?.kind === 'listening' && (
          <ListeningLayout
            section={section}
            currentQuestion={test.currentQuestion}
            currentQuestionIdx={test.currentQuestionIdx}
            answers={test.answers}
            onAnswer={test.setAnswer}
          />
        )}
        {section?.kind === 'writing' && (
          <WritingLayout
            section={section}
            currentQuestion={test.currentQuestion}
            currentQuestionIdx={test.currentQuestionIdx}
            answers={test.answers}
            onAnswer={test.setAnswer}
          />
        )}
      </main>

      <BottomNav
        sections={grouped.sections}
        currentSectionKind={test.currentSectionKind}
        currentQuestionIdx={test.currentQuestionIdx}
        answers={test.answers}
        flags={test.flags}
        currentQuestion={test.currentQuestion}
        onSelectQuestion={test.goToQuestion}
        onSelectSection={test.switchSection}
        onPrev={test.goPrev}
        onNext={test.goNext}
        onToggleFlag={() => test.currentQuestion && test.toggleFlag(test.currentQuestion.id)}
      />
    </div>
  )
}
