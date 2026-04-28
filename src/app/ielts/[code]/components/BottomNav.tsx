'use client'

import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IeltsSection, IeltsSectionGroup, QuizDeliveryQuestion } from '@/types'

interface Props {
  sections: IeltsSectionGroup[]
  currentSectionKind: IeltsSection
  currentQuestionIdx: number
  answers: Record<number, unknown>
  flags: Set<number>
  onSelectQuestion: (idx: number) => void
  onSelectSection: (kind: IeltsSection) => void
  onPrev: () => void
  onNext: () => void
  onToggleFlag: () => void
  currentQuestion: QuizDeliveryQuestion | null
}

const SECTION_LABEL: Record<IeltsSection, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
}

function isAnswered(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as object).length > 0
  return true
}

export function BottomNav({
  sections,
  currentSectionKind,
  currentQuestionIdx,
  answers,
  flags,
  onSelectQuestion,
  onSelectSection,
  onPrev,
  onNext,
  onToggleFlag,
  currentQuestion,
}: Props) {
  const section = sections.find(s => s.kind === currentSectionKind) ?? sections[0]
  const questions = section?.questions ?? []
  const isFlagged = currentQuestion ? flags.has(currentQuestion.id) : false

  return (
    <footer className="sticky bottom-0 z-30 bg-bg-card border-t border-bg-border">
      <div className="px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-1">
          {sections.map(s => (
            <button
              key={s.kind}
              type="button"
              onClick={() => onSelectSection(s.kind)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-semibold transition',
                s.kind === currentSectionKind
                  ? 'bg-primary text-white'
                  : 'bg-bg-border text-text-muted hover:text-text',
              )}
            >
              {SECTION_LABEL[s.kind]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {questions.map((q, idx) => {
              const answered = isAnswered(answers[q.id])
              const flagged = flags.has(q.id)
              const current = idx === currentQuestionIdx
              const globalNumber =
                (q.metadata?.global_number as number | undefined) ?? idx + 1

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onSelectQuestion(idx)}
                  title={`Câu ${globalNumber}`}
                  className={cn(
                    'relative w-8 h-8 flex items-center justify-center text-xs font-semibold transition',
                    flagged ? 'rounded-full' : 'rounded',
                    current && 'ring-2 ring-primary ring-offset-1 ring-offset-bg-card',
                    answered
                      ? 'bg-accent text-white'
                      : 'bg-bg-border text-text-muted hover:text-text',
                    flagged && 'border-2 border-amber-400',
                  )}
                >
                  {globalNumber}
                  {flagged && (
                    <Flag
                      size={8}
                      className="absolute -top-1 -right-1 text-amber-400 fill-amber-400"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleFlag}
            title="Flag câu này"
            className={cn(
              'p-2 rounded hover:bg-bg-border transition',
              isFlagged ? 'text-amber-400' : 'text-text-dim',
            )}
          >
            <Flag size={16} />
          </button>
          <button
            type="button"
            onClick={onPrev}
            disabled={currentQuestionIdx === 0}
            className="p-2 rounded hover:bg-bg-border text-text-muted disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={currentQuestionIdx >= questions.length - 1}
            className="p-2 rounded hover:bg-bg-border text-text-muted disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </footer>
  )
}
