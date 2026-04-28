'use client'

import { cn } from '@/lib/utils'
import type { IeltsSectionGroup, QuizDeliveryQuestion } from '@/types'

interface Props {
  section: IeltsSectionGroup
  currentQuestion: QuizDeliveryQuestion | null
  currentQuestionIdx: number
  answers: Record<number, unknown>
  onAnswer: (questionId: number, value: unknown) => void
}

function countWords(text: string): number {
  return text.trim().length === 0
    ? 0
    : text.trim().split(/\s+/).filter(Boolean).length
}

function targetFor(question: QuizDeliveryQuestion | null): number {
  const title =
    (question?.metadata?.ielts_section as string | undefined) ??
    (question?.metadata?.group_instruction as string | undefined) ??
    ''
  if (/task\s*2/i.test(title)) return 250
  return 150
}

export function WritingLayout({
  section,
  currentQuestion,
  currentQuestionIdx,
  answers,
  onAnswer,
}: Props) {
  const globalNumber =
    (currentQuestion?.metadata?.global_number as number | undefined) ??
    currentQuestionIdx + 1
  const value = (currentQuestion ? (answers[currentQuestion.id] as string) : '') ?? ''
  const wordCount = countWords(value)
  const target = targetFor(currentQuestion)
  const passageText = currentQuestion?.metadata?.passage_text as string | undefined

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-7.5rem)]">
      <section className="overflow-y-auto border-r border-bg-border p-6 bg-background">
        <h2 className="text-lg font-bold text-text mb-3">{section.title}</h2>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-3xl font-bold text-primary tabular-nums">
            {globalNumber}
          </span>
          <span className="px-2 py-1 rounded bg-amber-400/10 text-amber-400 text-xs font-semibold">
            Write at least {target} words
          </span>
        </div>
        <article className="prose prose-invert max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-text">
          {currentQuestion?.question_text}
          {passageText && (
            <>
              <br />
              <br />
              {passageText}
            </>
          )}
        </article>
      </section>

      <section className="relative flex flex-col bg-bg-card">
        <textarea
          value={value}
          onChange={e => currentQuestion && onAnswer(currentQuestion.id, e.target.value)}
          placeholder="Bắt đầu viết câu trả lời của bạn ở đây..."
          className="flex-1 resize-none p-6 bg-transparent text-text text-[15px] leading-relaxed focus:outline-none"
        />
        <div className="sticky bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 border-t border-bg-border bg-bg-card">
          <span
            className={cn(
              'text-sm font-mono',
              wordCount < target ? 'text-red-400' : 'text-green-400',
            )}
          >
            Words: {wordCount} / {target}
          </span>
          <span className="text-xs text-text-dim">
            IELTS Writing {target === 250 ? 'Task 2' : 'Task 1'}
          </span>
        </div>
      </section>
    </div>
  )
}
