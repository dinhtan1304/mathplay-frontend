// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  email: string
  full_name?: string
  is_active: boolean
  created_at: string
}

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; password: string; full_name?: string }
export interface AuthToken { access_token: string; token_type: string }

// ─── Exam & Parser ────────────────────────────────────────────────────────────
export type ExamStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Exam {
  id: number
  filename: string
  status: ExamStatus
  created_at: string
  question_count?: number
  result_json?: string | null
  error_message?: string | null
}

export interface ParseProgress {
  stage?: string        // 'processing' | 'done' | 'error'
  percent?: number
  message?: string
  result_json?: string
  // legacy fields kept for compat
  exam_id?: number
  status?: string
  progress?: number
  questions_found?: number
}

// ─── Questions ────────────────────────────────────────────────────────────────
export type QuestionType = 'TN' | 'TL' | 'DS' | 'GH'
export type Difficulty = 'NB' | 'TH' | 'VD' | 'VDC'

export interface Question {
  id: number
  question_text: string
  question_type: QuestionType
  difficulty?: Difficulty
  topic?: string
  chapter?: string
  lesson_title?: string
  grade?: number
  options?: string[]
  answer?: string
  solution_steps?: string[]
  exam_id?: number
  user_id: number
  created_at: string
}

export interface QuestionListResponse {
  items: Question[]
  total: number
  page: number
  page_size: number
}

export interface QuestionFilters {
  types: string[]
  topics: string[]
  difficulties: string[]
  grades: number[]
  chapters: string[]
  total_questions?: number
}

export interface QuestionUpdate {
  question_text?: string
  question_type?: QuestionType
  difficulty?: Difficulty
  topic?: string
  chapter?: string
  answer?: string
  solution_steps?: string
  options?: string[]
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_questions: number
  total_exams: number
  completed_exams: number
  topics_count: number
  new_this_week: number
  growth_percent: number
}

export interface ChartData {
  by_difficulty: Record<string, number>
  by_type: Record<string, number>
  by_topic: Record<string, number>
  daily_activity: Record<string, number>
}

export interface Activity {
  id: number
  type: string
  filename: string
  status: ExamStatus
  question_count: number
  created_at: string
}

// ─── Generator ───────────────────────────────────────────────────────────────
export interface GenerateRequest {
  question_type?: string | null
  topic?: string | null
  difficulty?: string | null
  count: number
}

export interface ExamSection {
  difficulty: string
  count: number
}

export interface ExamGenerateRequest {
  topic?: string | null
  question_type?: string | null
  sections: ExamSection[]
}

export interface PromptGenerateRequest {
  prompt: string
  grade?: number | null
  count?: number | null
}

export interface GeneratedQuestion {
  question: string
  type: string
  topic: string
  difficulty: string
  grade?: number | null
  chapter: string
  lesson_title: string
  answer: string
  solution_steps: string[]
  // v3: verification metadata
  _verified?: 'fixed' | 'ambiguous'
  _verify_note?: string
  _potential_duplicates?: number
  _max_similarity?: number
}

export interface VerificationStats {
  total: number
  correct: number
  wrong: number
  ambiguous: number
  fixed: number
  removed: number
}

export interface GenerateResponse {
  questions: GeneratedQuestion[]
  sample_count: number
  message: string
  // v3: verification + criteria
  verification?: VerificationStats | null
  criteria?: {
    grade?: number | null
    chapters?: string[]
    difficulty_mix?: Record<string, number>
    question_type?: string
    total_count?: number
    topic_hint?: string
  } | null
}

// ─── Chat ───────────────────────────────────────────────────────────────────
export interface ChatMessageRequest {
  message: string
  session_id?: number | null
  grade?: number | null
}

export interface ChatContextQuestion {
  id: number
  question_text: string
  topic: string
  difficulty: string
  grade?: number | null
}

export interface ChatMessageResponse {
  answer: string
  session_id: number
  detected_grade?: number | null
  context_questions: ChatContextQuestion[]
}

export interface ChatSession {
  id: number
  title: string
  updated_at: string
  message_count: number
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatSessionHistory {
  session_id: number
  title: string
  messages: ChatHistoryMessage[]
}

// ─── Curriculum ───────────────────────────────────────────────────────────────
export interface CurriculumLesson {
  id: number
  lesson_title: string
  lesson_no: number
  question_count: number
}

export interface CurriculumChapter {
  chapter_no: number
  chapter: string
  question_count: number
  lessons: CurriculumLesson[]
}

export interface CurriculumGrade {
  grade: number
  question_count: number
  chapters: CurriculumChapter[]
}

export interface CurriculumTree {
  grades: CurriculumGrade[]
}

// ─── Export (generator format) ────────────────────────────────────────────────
export interface ExportQuestionItem {
  question: string
  type: string
  topic: string
  difficulty: string
  answer: string
  solution_steps: string[]
}

export interface GeneratorExportRequest {
  questions: ExportQuestionItem[]
  title: string
  subtitle: string
  include_answers: boolean
  include_solutions: boolean
  group_by_diff: boolean
}

// ─── Classes ─────────────────────────────────────────────────────────────────
export interface ClassRoom {
  id: number
  name: string
  subject?: string
  grade?: number
  description?: string
  code: string
  teacher_id: number
  created_at: string
  member_count: number
  assignment_count: number
}

export interface ClassCreate {
  name: string
  subject?: string
  grade?: number
  description?: string
}

export interface ClassMember {
  id: number
  student_id: number
  student_name: string
  student_email: string
  joined_at: string
}

// ─── Assignments ─────────────────────────────────────────────────────────────
export interface Assignment {
  id: number
  class_id: number
  title: string
  description?: string
  exam_id?: number
  due_date?: string
  is_active: boolean
  created_at: string
}

export interface AssignmentCreate {
  class_id: number
  title: string
  description?: string
  exam_id?: number
  due_date?: string
  question_ids?: number[]
}

// ─── Submissions ─────────────────────────────────────────────────────────────
export interface Submission {
  id: number
  assignment_id: number
  student_id: number
  status: 'pending' | 'in_progress' | 'completed'
  score?: number
  correct_q?: number
  total_q?: number
  game_mode?: string
  xp_earned?: number
  time_spent_s?: number
  submitted_at?: string
  created_at: string
}

export interface SubmissionCreate {
  assignment_id: number
  game_mode?: string
  answers: AnswerInput[]
  time_spent_s?: number
}

export interface AnswerInput {
  question_id: number
  answer: string
}

export interface StudentXP {
  student_id: number
  total_xp: number
  level: number
  streak_days: number
  last_activity_date?: string
}

export interface LeaderboardEntry {
  student_id: number
  student_name: string
  total_xp: number
  level: number
  streak_days: number
  rank: number
}

// ─── Game ─────────────────────────────────────────────────────────────────────
export type GameMode = 
  | 'multiple_choice' 
  | 'drag_drop' 
  | 'fill_blank' 
  | 'order_steps' 
  | 'find_error' 
  | 'flashcard'

export interface GameQuestion {
  question_id: number
  question_text: string
  game_mode: GameMode
  payload: Record<string, unknown>
}

export interface GameSession {
  assignment_id: number
  game_mode: GameMode
  questions: GameQuestion[]
  total: number
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface StudentStat {
  student_id: number
  student_name: string
  total_submissions: number
  avg_score?: number
  last_active?: string
  streak_days: number
  total_xp: number
  level: number
}

export interface TopicStat {
  topic: string
  avg_score: number
  submission_count: number
}

export interface ClassAnalytics {
  class_id: number
  class_name: string
  total_students: number
  active_last_7d: number
  total_assignments: number
  avg_class_score?: number
  completion_rate?: number
  students: StudentStat[]
  topic_breakdown: TopicStat[]
}

export interface AssignmentAnalytics {
  assignment_id: number
  title: string
  total_students: number
  submitted_count: number
  completion_rate: number
  avg_score?: number
  avg_time_s?: number
  score_distribution: Record<string, number>
  hardest_questions: {
    question_id: number
    question_text: string
    correct_rate: number
    total_attempts: number
  }[]
}

export interface StudentDetail {
  student_id: number
  student_name: string
  class_id: number
  class_name: string
  total_submissions: number
  avg_score?: number
  xp: { total: number; level: number; streak_days: number }
  submission_history: {
    assignment_id: number
    title: string
    score?: number
    correct_q?: number
    total_q?: number
    game_mode?: string
    time_spent_s?: number
    xp_earned?: number
    submitted_at?: string
  }[]
  weak_topics: { topic: string; correct_rate: number; attempts: number }[]
}

// ─── Export ───────────────────────────────────────────────────────────────────
export interface ExportRequest {
  question_ids: number[]
  format: 'docx' | 'pdf' | 'json'
}