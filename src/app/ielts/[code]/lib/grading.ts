import type { IeltsSection, QuizAnswerResult, QuizDeliveryQuestion } from '@/types'

export interface GradedResult {
  correct: boolean | null
  points: number
}

// Official IELTS Academic Reading raw → band (public conversion table).
// Listening uses the same 40-question → band mapping in practice.
const READING_LISTENING_BAND: [number, number][] = [
  [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0],
  [27, 6.5], [23, 6.0], [19, 5.5], [15, 5.0], [13, 4.5],
  [10, 4.0], [8, 3.5], [6, 3.0], [4, 2.5], [0, 0.0],
]

export function estimateBand(raw: number, section: IeltsSection): number | null {
  if (section === 'writing') return null
  for (const [threshold, band] of READING_LISTENING_BAND) {
    if (raw >= threshold) return band
  }
  return 0
}

function normaliseString(v: unknown): string {
  if (typeof v !== 'string') return ''
  return v.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function gradeAnswer(
  question: QuizDeliveryQuestion,
  userAnswer: unknown,
  serverResult?: QuizAnswerResult,
): GradedResult {
  if (serverResult) {
    return {
      correct: serverResult.is_correct ?? null,
      points: serverResult.points_earned ?? 0,
    }
  }

  if (userAnswer == null || userAnswer === '') {
    return { correct: false, points: 0 }
  }

  const t = question.type

  if (
    t === 'true_false_not_given' ||
    t === 'yes_no_not_given' ||
    t === 'multiple_choice'
  ) {
    return { correct: null, points: 0 }
  }

  if (t === 'essay') {
    return { correct: null, points: 0 }
  }

  return { correct: null, points: 0 }
}

export function sectionStats(
  questions: QuizDeliveryQuestion[],
  answers: Record<number, unknown>,
  results?: Record<number, QuizAnswerResult>,
) {
  let correct = 0
  let total = 0
  for (const q of questions) {
    total += 1
    const r = results?.[q.id]
    if (r?.is_correct) correct += 1
    else if (!r && gradeAnswer(q, answers[q.id]).correct) correct += 1
  }
  return { correct, total }
}
