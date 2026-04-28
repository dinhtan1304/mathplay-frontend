'use client'

import { Check, X, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { estimateBand, sectionStats } from '../lib/grading'
import type { IeltsGroupedQuiz, IeltsSection, QuizAnswerResult } from '@/types'

interface Props {
  grouped: IeltsGroupedQuiz
  answers: Record<number, unknown>
  attemptResults?: Record<number, QuizAnswerResult>
  onRetry: () => void
  onExit: () => void
}

const SECTION_LABEL: Record<IeltsSection, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
}

function formatAnswer(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function ReviewScreen({
  grouped,
  answers,
  attemptResults,
  onRetry,
  onExit,
}: Props) {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 h-[calc(100vh-4rem)] overflow-y-auto">
      <header className="bg-bg-card border border-bg-border rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-text mb-1">Kết quả IELTS</h1>
        <p className="text-text-dim text-sm">
          Ước tính band score dựa trên conversion chuẩn IELTS. Kết quả chính thức sẽ
          do giáo viên chấm với Writing.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {grouped.sections.map(section => {
          const { correct, total } = sectionStats(
            section.questions,
            answers,
            attemptResults,
          )
          const band = estimateBand(correct, section.kind)
          return (
            <div
              key={section.kind}
              className="bg-bg-card border border-bg-border rounded-xl p-5"
            >
              <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">
                {SECTION_LABEL[section.kind]}
              </h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text">{correct}</span>
                <span className="text-text-dim">/ {total}</span>
              </div>
              {band !== null ? (
                <p className="text-primary mt-1 text-sm font-semibold">
                  Est. band {band.toFixed(1)}
                </p>
              ) : (
                <p className="text-text-dim mt-1 text-xs italic">
                  Cần giáo viên chấm
                </p>
              )}
            </div>
          )
        })}
      </div>

      {grouped.sections.map(section => (
        <div
          key={section.kind}
          className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden"
        >
          <h2 className="px-5 py-3 border-b border-bg-border font-semibold text-text">
            {section.title}
          </h2>
          <table className="w-full text-sm">
            <thead className="bg-background/50 text-text-dim">
              <tr>
                <th className="text-left px-4 py-2 w-16">#</th>
                <th className="text-left px-4 py-2">Câu hỏi</th>
                <th className="text-left px-4 py-2 w-60">Đáp án của bạn</th>
                <th className="text-center px-4 py-2 w-16">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {section.questions.map((q, idx) => {
                const r = attemptResults?.[q.id]
                const correct = r?.is_correct
                const global =
                  (q.metadata?.global_number as number | undefined) ?? idx + 1
                return (
                  <tr
                    key={q.id}
                    className="border-t border-bg-border hover:bg-background/30"
                  >
                    <td className="px-4 py-2 text-text-dim tabular-nums">
                      {global}
                    </td>
                    <td className="px-4 py-2 text-text">
                      <p className="line-clamp-2">{q.question_text}</p>
                    </td>
                    <td className="px-4 py-2 text-text-dim">
                      <code className="text-xs">
                        {formatAnswer(answers[q.id])}
                      </code>
                      {r?.correct_answer != null && correct === false && (
                        <div className="text-xs text-green-400 mt-1">
                          ✓ {formatAnswer(r.correct_answer)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {correct === true ? (
                        <Check size={18} className="mx-auto text-green-400" />
                      ) : correct === false ? (
                        <X size={18} className="mx-auto text-red-400" />
                      ) : (
                        <Minus size={18} className="mx-auto text-text-dim" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div className="flex justify-center gap-3 pb-6">
        <button
          type="button"
          onClick={onExit}
          className={cn(
            'px-5 py-2 rounded-xl border border-bg-border',
            'text-text-muted hover:text-text hover:border-primary/30 transition',
          )}
        >
          Về trang chủ
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary px-5 py-2"
        >
          Làm lại
        </button>
      </div>
    </div>
  )
}
