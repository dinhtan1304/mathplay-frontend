import type { PageConfig, QuizDisplayInfo } from '@/lib/templates'

export interface TemplateProps {
  config: PageConfig
  quizInfo?: QuizDisplayInfo[]
  isPreview?: boolean
  slug?: string
}

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Cơ bản',
  medium: 'Trung bình',
  hard: 'Nâng cao',
}
