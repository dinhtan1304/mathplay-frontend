'use client'

import { cn } from '@/lib/utils'
import type { QuizDeliveryQuestion } from '@/types'

interface Props {
  question: QuizDeliveryQuestion
  answer: unknown
  onAnswer: (value: unknown) => void
  hideTextarea?: boolean
}

type ChoiceRef = { key: string; text: string }
type ItemRef = { id: string; text: string }

export function QuestionRenderer({ question, answer, onAnswer, hideTextarea }: Props) {
  const { type } = question

  if (type === 'true_false_not_given' || type === 'yes_no_not_given') {
    const options =
      type === 'true_false_not_given'
        ? ['TRUE', 'FALSE', 'NOT GIVEN']
        : ['YES', 'NO', 'NOT GIVEN']
    return (
      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onAnswer(opt)}
            className={cn(
              'w-full px-4 py-3 rounded-xl border-2 text-left font-medium transition-all',
              answer === opt
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-bg-border text-text-dim hover:border-primary/30',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (type === 'matching' || type === 'matching_headings') {
    const choices = (question.choices ?? []) as ChoiceRef[]
    const items = (question.items ?? []) as ItemRef[]
    const current = (answer as Record<string, string>) ?? {}
    return (
      <div className="space-y-3">
        {type === 'matching_headings' && choices.length > 0 && (
          <div className="rounded-lg bg-bg-card border border-bg-border p-3 text-sm space-y-1 mb-4">
            <p className="font-semibold mb-1 text-text">List of Headings</p>
            {choices.map(c => (
              <p key={c.key} className="text-text-dim">
                <span className="font-mono mr-1 text-text">{c.key}.</span>
                {c.text}
              </p>
            ))}
          </div>
        )}
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3">
            <span className="flex-1 text-sm text-text">{item.text}</span>
            <select
              value={current[item.id] ?? ''}
              onChange={e => onAnswer({ ...current, [item.id]: e.target.value })}
              className="w-40 border border-bg-border rounded-lg px-2 py-1.5 text-sm bg-background text-text"
            >
              <option value="">— chọn —</option>
              {choices.map(c => (
                <option key={c.key} value={c.key}>
                  {c.key}
                  {type === 'matching' ? `. ${c.text}` : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'fill_blank') {
    const labels =
      question.blank_labels && question.blank_labels.length > 0
        ? question.blank_labels
        : Array.from(
            { length: Math.max(question.blank_count ?? 1, 1) },
            (_, i) => `B${i + 1}`,
          )
    const current = (answer as Record<string, string>) ?? {}
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
              value={current[label] ?? ''}
              onChange={e => {
                const next = { ...current, [label]: e.target.value }
                const cleaned = Object.fromEntries(
                  Object.entries(next).filter(([, v]) => v),
                )
                onAnswer(Object.keys(cleaned).length > 0 ? cleaned : undefined)
              }}
              className="input flex-1 text-base"
              placeholder={
                labels.length > 1 ? `Đáp án ô ${label}...` : 'Nhập đáp án...'
              }
              autoFocus={i === 0}
            />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'multiple_choice') {
    const choices = (question.choices ?? []) as ChoiceRef[]
    return (
      <div className="space-y-2">
        {choices.map(c => (
          <button
            key={c.key}
            type="button"
            onClick={() => onAnswer(c.key)}
            className={cn(
              'w-full px-4 py-3 rounded-xl border-2 text-left transition-all',
              answer === c.key
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-bg-border text-text-dim hover:border-primary/30',
            )}
          >
            <span className="font-semibold mr-2">{c.key}.</span>
            {c.text}
          </button>
        ))}
      </div>
    )
  }

  if (type === 'essay' && !hideTextarea) {
    return (
      <textarea
        value={(answer as string) || ''}
        onChange={e => onAnswer(e.target.value)}
        className="w-full h-64 p-3 rounded-lg border border-bg-border bg-background text-text text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Viết câu trả lời của bạn..."
      />
    )
  }

  return null
}
