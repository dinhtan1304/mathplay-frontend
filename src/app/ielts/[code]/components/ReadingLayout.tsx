'use client'

import { QuestionRenderer } from './QuestionRenderer'
import type { IeltsSectionGroup, QuizDeliveryQuestion } from '@/types'

interface Props {
  section: IeltsSectionGroup
  currentQuestion: QuizDeliveryQuestion | null
  currentQuestionIdx: number
  answers: Record<number, unknown>
  onAnswer: (questionId: number, value: unknown) => void
}

function passageFromSection(section: IeltsSectionGroup): string {
  if (section.theory?.sections?.length) {
    return section.theory.sections.map(s => s.content).join('\n\n')
  }
  const first = section.questions.find(
    q => typeof q.metadata?.passage_text === 'string' && q.metadata.passage_text,
  )
  return (first?.metadata?.passage_text as string) ?? ''
}

export function ReadingLayout({
  section,
  currentQuestion,
  currentQuestionIdx,
  answers,
  onAnswer,
}: Props) {
  const passage = passageFromSection(section)
  const groupInstruction = currentQuestion?.metadata?.group_instruction as
    | string
    | undefined
  const globalNumber =
    (currentQuestion?.metadata?.global_number as number | undefined) ??
    currentQuestionIdx + 1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-7.5rem)]">
      <section className="overflow-y-auto border-r border-bg-border p-6 bg-background">
        <h2 className="text-lg font-bold text-text mb-3">{section.title}</h2>
        <article className="prose prose-invert max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-text">
          {passage || (
            <p className="text-text-dim italic">
              Passage chưa có nội dung. Vui lòng upload lại file nếu trống.
            </p>
          )}
        </article>
      </section>

      <section className="overflow-y-auto p-6 bg-bg-card">
        {groupInstruction && (
          <p className="text-sm text-text-dim italic border-l-2 border-primary/40 pl-3 mb-4">
            {groupInstruction}
          </p>
        )}

        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-3xl font-bold text-primary tabular-nums">
            {globalNumber}
          </span>
          <h3 className="text-base font-medium text-text flex-1">
            {currentQuestion?.question_text}
          </h3>
        </div>

        {currentQuestion?.scoring?.word_limit && (
          <p className="text-xs text-amber-500 mb-3">
            ⚠ Điền KHÔNG QUÁ {currentQuestion.scoring.word_limit}
          </p>
        )}

        {currentQuestion && (
          <QuestionRenderer
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswer={v => onAnswer(currentQuestion.id, v)}
          />
        )}
      </section>
    </div>
  )
}
