'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IeltsGroupedQuiz, IeltsSection } from '@/types'

export type IeltsStage = 'testing' | 'submitted' | 'review'

interface PersistedState {
  answers: Record<number, unknown>
  flags: number[]
  deadlineMs: number
  currentSectionKind: IeltsSection
  currentQuestionIdx: number
}

const SECTION_DEFAULT_MIN: Record<IeltsSection, number> = {
  reading: 60,
  listening: 30,
  writing: 60,
}

const storageKey = (code: string) => `ielts-test-${code}`

export function useIeltsTest(code: string, grouped: IeltsGroupedQuiz | null) {
  const [answers, setAnswers] = useState<Record<number, unknown>>({})
  const [flags, setFlags] = useState<Set<number>>(new Set())
  const [currentSectionKind, setCurrentSectionKind] = useState<IeltsSection>('reading')
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [deadlineMs, setDeadlineMs] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [stage, setStage] = useState<IeltsStage>('testing')
  const hydrated = useRef(false)

  const currentSection = useMemo(() => {
    if (!grouped) return null
    return grouped.sections.find(s => s.kind === currentSectionKind) ?? grouped.sections[0] ?? null
  }, [grouped, currentSectionKind])

  const currentQuestion = useMemo(() => {
    if (!currentSection) return null
    return currentSection.questions[currentQuestionIdx] ?? null
  }, [currentSection, currentQuestionIdx])

  useEffect(() => {
    if (!grouped || hydrated.current) return
    hydrated.current = true

    const firstSection = grouped.sections[0]?.kind ?? 'reading'
    try {
      const raw = sessionStorage.getItem(storageKey(code))
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState
        setAnswers(parsed.answers ?? {})
        setFlags(new Set(parsed.flags ?? []))
        setCurrentSectionKind(parsed.currentSectionKind ?? firstSection)
        setCurrentQuestionIdx(parsed.currentQuestionIdx ?? 0)
        setDeadlineMs(parsed.deadlineMs ?? 0)
        return
      }
    } catch {
      /* fall through */
    }

    setCurrentSectionKind(firstSection)
    const mins = SECTION_DEFAULT_MIN[firstSection] ?? 60
    setDeadlineMs(Date.now() + mins * 60_000)
  }, [code, grouped])

  useEffect(() => {
    if (!hydrated.current) return
    const payload: PersistedState = {
      answers,
      flags: [...flags],
      deadlineMs,
      currentSectionKind,
      currentQuestionIdx,
    }
    try {
      sessionStorage.setItem(storageKey(code), JSON.stringify(payload))
    } catch {
      /* storage quota — ignore */
    }
  }, [code, answers, flags, deadlineMs, currentSectionKind, currentQuestionIdx])

  useEffect(() => {
    if (!deadlineMs || stage !== 'testing') return
    const tick = () => setRemainingMs(Math.max(0, deadlineMs - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [deadlineMs, stage])

  const setAnswer = useCallback((questionId: number, value: unknown) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  const toggleFlag = useCallback((questionId: number) => {
    setFlags(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }, [])

  const goToQuestion = useCallback((idx: number) => {
    setCurrentQuestionIdx(Math.max(0, idx))
  }, [])

  const goNext = useCallback(() => {
    if (!currentSection) return
    setCurrentQuestionIdx(i => Math.min(i + 1, currentSection.questions.length - 1))
  }, [currentSection])

  const goPrev = useCallback(() => {
    setCurrentQuestionIdx(i => Math.max(0, i - 1))
  }, [])

  const switchSection = useCallback(
    (kind: IeltsSection) => {
      setCurrentSectionKind(kind)
      setCurrentQuestionIdx(0)
      const mins = SECTION_DEFAULT_MIN[kind] ?? 60
      setDeadlineMs(Date.now() + mins * 60_000)
    },
    [],
  )

  const submit = useCallback(() => {
    setStage('submitted')
  }, [])

  const viewReview = useCallback(() => {
    setStage('review')
  }, [])

  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey(code))
    } catch {
      /* ignore */
    }
    setAnswers({})
    setFlags(new Set())
    setCurrentQuestionIdx(0)
    setStage('testing')
    const firstSection = grouped?.sections[0]?.kind ?? 'reading'
    setCurrentSectionKind(firstSection)
    const mins = SECTION_DEFAULT_MIN[firstSection] ?? 60
    setDeadlineMs(Date.now() + mins * 60_000)
  }, [code, grouped])

  return {
    answers,
    flags,
    currentSection,
    currentSectionKind,
    currentQuestion,
    currentQuestionIdx,
    remainingMs,
    stage,
    setAnswer,
    toggleFlag,
    goToQuestion,
    goNext,
    goPrev,
    switchSection,
    submit,
    viewReview,
    reset,
  }
}
