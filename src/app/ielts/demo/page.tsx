'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import type {
  IeltsGroupedQuiz,
  QuizAnswerResult,
  QuizDeliveryQuestion,
  QuizTheory,
} from '@/types'
import { useIeltsTest } from '../[code]/hooks/useIeltsTest'
import { TopBar } from '../[code]/components/TopBar'
import { BottomNav } from '../[code]/components/BottomNav'
import { ReadingLayout } from '../[code]/components/ReadingLayout'
import { ListeningLayout } from '../[code]/components/ListeningLayout'
import { WritingLayout } from '../[code]/components/WritingLayout'
import { ReviewScreen } from '../[code]/components/ReviewScreen'

const DEMO_PASSAGE = `The history of coffee dates back to the 15th century, and possibly earlier. The earliest credible evidence of coffee drinking as the modern beverage appears in modern-day Yemen in southern Arabia in the middle of the 15th century in Sufi shrines, where coffee seeds were first roasted and brewed in a manner similar to how it is now prepared.

Coffee seeds were first exported from East Africa to Yemen, as the coffea arabica plant is thought to have been indigenous to the former. Yemeni traders took coffee back to their homeland and began to cultivate the seed. By the 16th century, the drink had reached the rest of the Middle East and North Africa, later spreading to Europe.

The word "coffee" entered the English language in 1582 via the Dutch koffie, borrowed from the Ottoman Turkish kahve, borrowed in turn from the Arabic qahwah. The Arabic word qahwah originally referred to a type of wine, and its etymology is given by Arab lexicographers as deriving from the verb qahiya, "to have no appetite".

By the 17th century, coffee had made its way to Europe and was becoming popular across the continent. Opponents were overly cautious, calling it the "bitter invention of Satan". The clergy condemned it when it came to Venice in 1615. The controversy was so great that Pope Clement VIII was asked to intervene. Before making a decision however, he decided to taste the beverage for himself. He found the drink so satisfying that he gave it papal approval.

Coffee houses in Mecca soon became a concern for the imams who viewed them as places for political gatherings and banned them between 1512 and 1524, but this ban was unable to be enforced. In 1530, the first coffee house opened in Damascus. The first coffee house in Constantinople was opened in 1554 during the reign of Suleiman I.`

const demoReading: QuizDeliveryQuestion[] = [
  {
    id: 101,
    order: 1,
    type: 'true_false_not_given',
    question_text: 'The earliest evidence of coffee drinking comes from Ethiopia.',
    required: true,
    points: 1,
    has_hint: false,
    metadata: {
      global_number: 1,
      group_instruction:
        'Questions 1–4: Do the following statements agree with the information in the passage? Write TRUE, FALSE or NOT GIVEN.',
      ielts_section: 'Reading Passage 1',
    },
  },
  {
    id: 102,
    order: 2,
    type: 'true_false_not_given',
    question_text: 'The word "coffee" entered English in the 16th century.',
    required: true,
    points: 1,
    has_hint: false,
    metadata: { global_number: 2, ielts_section: 'Reading Passage 1' },
  },
  {
    id: 103,
    order: 3,
    type: 'true_false_not_given',
    question_text: 'Pope Clement VIII banned coffee after tasting it.',
    required: true,
    points: 1,
    has_hint: false,
    metadata: { global_number: 3, ielts_section: 'Reading Passage 1' },
  },
  {
    id: 104,
    order: 4,
    type: 'true_false_not_given',
    question_text:
      'The first coffee house in Constantinople opened during the reign of Suleiman I.',
    required: true,
    points: 1,
    has_hint: false,
    metadata: { global_number: 4, ielts_section: 'Reading Passage 1' },
  },
  {
    id: 105,
    order: 5,
    type: 'matching_headings',
    question_text: 'Match each paragraph to the most suitable heading.',
    required: true,
    points: 3,
    has_hint: false,
    choices: [
      { key: 'i', text: 'Coffee spreads across Europe' },
      { key: 'ii', text: 'The etymology of the word coffee' },
      { key: 'iii', text: 'Coffee and religious opposition' },
      { key: 'iv', text: 'The early export of coffee seeds' },
    ],
    items: [
      { id: 'PA', text: 'Paragraph A' },
      { id: 'PB', text: 'Paragraph B' },
      { id: 'PC', text: 'Paragraph C' },
    ],
    metadata: {
      global_number: 5,
      group_instruction:
        'Questions 5–7: The passage has several paragraphs A–C. Choose the correct heading from the list below.',
      ielts_section: 'Reading Passage 1',
    },
  },
  {
    id: 106,
    order: 6,
    type: 'multiple_choice',
    question_text: 'Where was coffee first cultivated as a crop?',
    required: true,
    points: 1,
    has_hint: false,
    choices: [
      { key: 'A', text: 'Ethiopia' },
      { key: 'B', text: 'Yemen' },
      { key: 'C', text: 'Turkey' },
      { key: 'D', text: 'Venice' },
    ],
    metadata: {
      global_number: 6,
      group_instruction: 'Questions 6–8: Choose the correct letter, A, B, C or D.',
      ielts_section: 'Reading Passage 1',
    },
  },
  {
    id: 107,
    order: 7,
    type: 'fill_blank',
    question_text:
      'Complete the note with ONE WORD AND/OR A NUMBER from the passage.',
    required: true,
    points: 2,
    has_hint: false,
    blank_count: 2,
    blank_labels: ['B1', 'B2'],
    scoring: { mode: 'all_or_nothing', word_limit: 'ONE WORD AND/OR A NUMBER' },
    metadata: {
      global_number: 7,
      group_instruction:
        'Questions 7–8: Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.',
      ielts_section: 'Reading Passage 1',
    },
  },
  {
    id: 108,
    order: 8,
    type: 'fill_blank',
    question_text:
      'First coffee house in Damascus opened in the year ________.',
    required: true,
    points: 1,
    has_hint: false,
    blank_count: 1,
    blank_labels: ['B1'],
    scoring: { mode: 'all_or_nothing', word_limit: 'ONE WORD AND/OR A NUMBER' },
    metadata: { global_number: 8, ielts_section: 'Reading Passage 1' },
  },
]

const demoListening: QuizDeliveryQuestion[] = [
  {
    id: 201,
    order: 9,
    type: 'fill_blank',
    question_text: 'Customer name: ________',
    required: true,
    points: 1,
    has_hint: false,
    blank_count: 1,
    blank_labels: ['B1'],
    scoring: { mode: 'all_or_nothing', word_limit: 'ONE WORD ONLY' },
    metadata: {
      global_number: 9,
      group_instruction:
        'Questions 9–12: Complete the form. Write ONE WORD ONLY for each answer.',
      ielts_section: 'Listening Section 1',
    },
  },
  {
    id: 202,
    order: 10,
    type: 'fill_blank',
    question_text: 'Phone number: ________',
    required: true,
    points: 1,
    has_hint: false,
    blank_count: 1,
    blank_labels: ['B1'],
    scoring: { mode: 'all_or_nothing', word_limit: 'A NUMBER' },
    metadata: { global_number: 10, ielts_section: 'Listening Section 1' },
  },
  {
    id: 203,
    order: 11,
    type: 'multiple_choice',
    question_text: 'Which service is the customer booking?',
    required: true,
    points: 1,
    has_hint: false,
    choices: [
      { key: 'A', text: 'City tour' },
      { key: 'B', text: 'Hotel reservation' },
      { key: 'C', text: 'Car rental' },
    ],
    metadata: {
      global_number: 11,
      group_instruction: 'Question 11: Choose the correct letter.',
      ielts_section: 'Listening Section 1',
    },
  },
  {
    id: 204,
    order: 12,
    type: 'fill_blank',
    question_text: 'Preferred date: ________',
    required: true,
    points: 1,
    has_hint: false,
    blank_count: 1,
    blank_labels: ['B1'],
    metadata: { global_number: 12, ielts_section: 'Listening Section 1' },
  },
]

const demoWriting: QuizDeliveryQuestion[] = [
  {
    id: 301,
    order: 13,
    type: 'essay',
    question_text:
      'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.',
    required: true,
    points: 0,
    has_hint: false,
    metadata: {
      global_number: 13,
      ielts_section: 'Writing Task 1',
    },
  },
  {
    id: 302,
    order: 14,
    type: 'essay',
    question_text:
      'Some people believe that unpaid community service should be a compulsory part of high school programmes (for example, working for a charity, improving the neighbourhood or teaching sports to younger children). To what extent do you agree or disagree? Write at least 250 words.',
    required: true,
    points: 0,
    has_hint: false,
    metadata: {
      global_number: 14,
      ielts_section: 'Writing Task 2',
    },
  },
]

const demoTheory: QuizTheory = {
  id: 9001,
  quiz_id: 9000,
  title: 'Reading Passage 1',
  content_type: 'rich_text',
  language: 'en',
  tags: [],
  display_order: 0,
  created_at: new Date().toISOString(),
  sections: [
    {
      id: 9101,
      theory_id: 9001,
      order: 1,
      content: DEMO_PASSAGE,
      content_format: 'markdown',
    } as unknown as QuizTheory['sections'][number],
  ],
}

const DEMO_GROUPED: IeltsGroupedQuiz = {
  quiz: {
    id: 9000,
    code: 'DEMO',
    name: 'IELTS Demo — Preview UI',
    subject_code: 'ielts',
    mode: 'exam',
    settings: {} as never,
    question_count: 14,
    total_points: 14,
    questions: [...demoReading, ...demoListening, ...demoWriting],
    theories: [demoTheory],
  } as never,
  sections: [
    {
      kind: 'reading',
      title: 'Reading Passage 1 — The Origins of Coffee',
      theory: demoTheory,
      audioUrl: null,
      questions: demoReading,
    },
    {
      kind: 'listening',
      title: 'Listening Section 1 — Booking Inquiry',
      theory: null,
      audioUrl: null,
      questions: demoListening,
    },
    {
      kind: 'writing',
      title: 'Writing — Tasks 1 & 2',
      theory: null,
      audioUrl: null,
      questions: demoWriting,
    },
  ],
}

export default function IeltsDemoPage() {
  const router = useRouter()
  const { user } = useAuth()

  const grouped = useMemo(() => DEMO_GROUPED, [])
  const test = useIeltsTest('DEMO', grouped)
  const [mockResults] = useState<Record<number, QuizAnswerResult>>({})

  const section = test.currentSection

  if (test.stage === 'review') {
    return (
      <ReviewScreen
        grouped={grouped}
        answers={test.answers}
        attemptResults={mockResults}
        onRetry={() => test.reset()}
        onExit={() => router.push('/')}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="bg-primary/10 border-b border-primary/30 px-4 py-1.5 text-center text-xs text-primary">
        🎭 DEMO MODE — Dữ liệu giả để review UI. Không lưu kết quả thật.
      </div>

      <TopBar
        candidateName={user?.full_name || user?.email || 'Demo Candidate'}
        testName={grouped.quiz.name}
        sectionKind={test.currentSectionKind}
        remainingMs={test.remainingMs}
        flaggedCount={test.flags.size}
        onSubmit={() => {
          test.submit()
          test.viewReview()
        }}
      />

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
        onToggleFlag={() =>
          test.currentQuestion && test.toggleFlag(test.currentQuestion.id)
        }
      />
    </div>
  )
}
