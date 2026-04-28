'use client'

import { AlertCircle, Volume2 } from 'lucide-react'
import { QuestionRenderer } from './QuestionRenderer'
import type { IeltsSectionGroup, QuizDeliveryQuestion } from '@/types'

interface Props {
  section: IeltsSectionGroup
  currentQuestion: QuizDeliveryQuestion | null
  currentQuestionIdx: number
  answers: Record<number, unknown>
  onAnswer: (questionId: number, value: unknown) => void
}

export function ListeningLayout({
  section,
  currentQuestion,
  currentQuestionIdx,
  answers,
  onAnswer,
}: Props) {
  const groupInstruction = currentQuestion?.metadata?.group_instruction as
    | string
    | undefined
  const globalNumber =
    (currentQuestion?.metadata?.global_number as number | undefined) ??
    currentQuestionIdx + 1

  return (
    <div className="max-w-4xl mx-auto p-6 h-[calc(100vh-7.5rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text">{section.title}</h2>
        <div className="flex items-center gap-2 text-text-dim">
          <Volume2 size={18} />
          <span className="text-xs">Audio</span>
        </div>
      </div>

      {section.audioUrl ? (
        <div className="mb-6 bg-bg-card border border-bg-border rounded-xl p-4">
          <audio controls src={section.audioUrl} className="w-full" />
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/5 p-4">
          <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-200">
            <p className="font-semibold">Audio chưa có sẵn cho bài này.</p>
            <p className="text-amber-200/80 mt-1">
              Bạn vẫn có thể trả lời câu hỏi dựa trên transcript hoặc nội dung đã có.
            </p>
          </div>
        </div>
      )}

      {groupInstruction && (
        <p className="text-sm text-text-dim italic border-l-2 border-primary/40 pl-3 mb-4">
          {groupInstruction}
        </p>
      )}

      {currentQuestion && (
        <div className="bg-bg-card border border-bg-border rounded-xl p-5">
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-primary tabular-nums">
              {globalNumber}
            </span>
            <h3 className="text-base font-medium text-text flex-1">
              {currentQuestion.question_text}
            </h3>
          </div>

          {currentQuestion.scoring?.word_limit && (
            <p className="text-xs text-amber-500 mb-3">
              ⚠ Điền KHÔNG QUÁ {currentQuestion.scoring.word_limit}
            </p>
          )}

          <QuestionRenderer
            question={currentQuestion}
            answer={answers[currentQuestion.id]}
            onAnswer={v => onAnswer(currentQuestion.id, v)}
          />
        </div>
      )}
    </div>
  )
}
