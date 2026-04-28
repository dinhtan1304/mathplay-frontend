// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  email: string
  full_name?: string
  is_active: boolean
  role: 'student' | 'teacher' | 'admin'
  created_at: string
}

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; password: string; full_name?: string; role?: 'student' | 'teacher' }
export interface AuthToken { access_token: string; token_type: string }

// ─── Subject ──────────────────────────────────────────────────────────────────
export interface Subject {
  subject_code: string
  name_vi: string
  name_short: string
  name_en?: string
  category: 'bat_buoc' | 'lua_chon' | 'tich_hop'
  grade_min: number
  grade_max: number
  parent_code?: string | null
  display_order: number
  icon?: string | null
}

// ─── Exam & Parser ────────────────────────────────────────────────────────────
export type ExamStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Exam {
  id: number
  filename: string
  subject_code?: string
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
  // IELTS complete payload
  quiz_id?: number
  quiz_code?: string
  question_count?: number
}

// ─── Questions ────────────────────────────────────────────────────────────────
export type QuestionType = 'TN' | 'TL' | 'DS' | 'GH'
export type Difficulty = 'NB' | 'TH' | 'VD' | 'VDC'

export interface Question {
  id: number
  question_text: string
  subject_code?: string
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
  is_public: boolean
  is_bank_duplicate?: boolean
  author_email?: string
  created_at: string
}

export interface QuestionListResponse {
  items: Question[]
  total: number
  page: number
  page_size: number
}

export interface QuestionFilters {
  subjects: string[]
  types: string[]
  difficulties: string[]
  grades: number[]
  chapters: string[]
  total_questions?: number
}

export interface QuestionUpdate {
  question_text?: string
  subject_code?: string
  question_type?: QuestionType
  difficulty?: Difficulty
  topic?: string
  chapter?: string
  lesson_title?: string
  grade?: number
  answer?: string
  solution_steps?: string
  options?: string[]
  is_public?: boolean
  extra_data?: string | null
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
  subject_code?: string
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
  subject_code?: string | null
  sections: ExamSection[]
}

export interface PromptGenerateRequest {
  prompt: string
  subject_code?: string | null
  grade?: number | null
  count?: number | null
}

export interface GeneratedQuestion {
  question: string
  type: string
  subject_code?: string
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
  subject_code?: string
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
  subject_code?: string
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
  class_name?: string
  title: string
  description?: string
  exam_id?: number
  deadline?: string
  max_attempts?: number
  show_answer?: boolean
  is_active: boolean
  created_at: string
  submission_count?: number
  completed_count?: number
}

export interface AssignmentCreate {
  class_id: number
  title: string
  description?: string
  exam_id?: number
  deadline?: string
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

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export type QuizQuestionType =
  | 'multiple_choice'
  | 'checkbox'
  | 'fill_blank'
  | 'reorder'
  | 'true_false'
  | 'essay'
  // IELTS types
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'matching'
  | 'matching_headings'

export type QuizStatus = 'draft' | 'published' | 'archived'
export type QuizVisibility = 'private' | 'public' | 'unlisted' | 'class_only'
export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface MediaObject {
  type: 'image' | 'audio'
  url: string
  alt?: string
}

export interface QuizSettings {
  time_limit_minutes?: number | null
  shuffle_questions: boolean
  shuffle_choices: boolean
  show_correct_after_each: boolean
  allow_retake: boolean
  max_retakes?: number | null
  passing_score?: number | null
  passing_score_type: 'points' | 'percentage'
  points_mode: 'fixed' | 'speed_bonus'
  show_leaderboard: boolean
  allow_review_after_submit: boolean
  auto_submit_on_timeout: boolean
  hint_penalty: { level_1: number; level_2: number; level_3: number }
  negative_scoring: boolean
  question_selection_count?: number | null
  difficulty_distribution?: Record<string, number>
  grading_mode: 'auto' | 'manual'
}

export interface Quiz {
  id: number
  code: string
  name: string
  description?: string | null
  cover_image_url?: string | null
  created_by_id: number
  subject_code?: string | null
  grade?: number | null
  mode: string
  language: string
  visibility: QuizVisibility
  status: QuizStatus
  tags: string[]
  version: number
  settings: QuizSettings
  question_count: number
  total_points: number
  created_at: string
  updated_at: string
  published_at?: string | null
}

export interface QuizListResponse {
  items: Quiz[]
  total: number
  page: number
  page_size: number
}

export interface ChoiceItem {
  key: string
  text: string
  is_correct: boolean
  media?: MediaObject | null
}

export interface ReorderItem {
  id: string
  text: string
}

export interface ScoringRules {
  mode: 'all_or_nothing' | 'per_blank' | 'partial'
  partial_credit?: boolean
  partial_formula?: string | null
  penalty_wrong_choice?: number
  points_per_blank?: number | null
  word_limit?: string | null   // IELTS: "TWO WORDS AND/OR A NUMBER"
  source?: 'passage' | null    // IELTS: answer must come from passage
}

export interface SolutionData {
  steps: string[]
  explanation?: string | null
}

export interface QuizQuestion {
  id: number
  quiz_id: number
  origin_question_id?: number | null
  source_type: 'manual' | 'bank_import' | 'file_import' | 'ai_generated'
  origin_quiz_code?: string | null
  order: number
  code?: string | null
  type: QuizQuestionType
  question_text: string
  has_correct_answer: boolean
  required: boolean
  points: number
  time_limit_seconds?: number | null
  difficulty?: QuizDifficulty | null
  subject_code?: string | null
  tags: string[]
  media?: MediaObject | null
  answer?: unknown
  choices?: ChoiceItem[] | null
  items?: ReorderItem[] | null
  scoring?: ScoringRules | null
  solution?: SolutionData | null
  hint_section_id?: number | null
  hint_auto_linked: boolean
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface SkippedQuestion {
  question_id: number
  reason: 'no_access' | 'empty_text' | 'convert_error'
}

export interface ImportQuestionsResult {
  imported: QuizQuestion[]
  imported_count: number
  skipped: SkippedQuestion[]
  skipped_count: number
  total_requested: number
}

export interface QuizQuestionCreate {
  type: QuizQuestionType
  question_text: string
  order?: number
  code?: string
  has_correct_answer?: boolean
  required?: boolean
  points?: number
  time_limit_seconds?: number | null
  difficulty?: QuizDifficulty | null
  subject_code?: string | null
  tags?: string[]
  media?: MediaObject | null
  answer?: unknown
  choices?: ChoiceItem[] | null
  items?: ReorderItem[] | null
  scoring?: ScoringRules | null
  solution?: SolutionData | null
  hint_section_id?: number | null
  hint_auto_linked?: boolean
  metadata?: Record<string, unknown> | null
}

export interface TheorySection {
  id: number
  theory_id: number
  order: number
  content: string
  content_format: string
  media?: MediaObject | null
}

export interface QuizTheory {
  id: number
  quiz_id: number
  title: string
  content_type: string
  language: string
  tags: string[]
  display_order: number
  created_at: string
  sections: TheorySection[]
}

export interface QuizDeliveryQuestion {
  id: number
  order: number
  code?: string | null
  type: QuizQuestionType
  question_text: string
  required: boolean
  points: number
  time_limit_seconds?: number | null
  difficulty?: QuizDifficulty | null
  media?: MediaObject | null
  choices?: Omit<ChoiceItem, 'is_correct'>[] | null
  items?: ReorderItem[] | null
  blank_count?: number
  blank_labels?: string[] | null
  has_hint: boolean
  hint_section_id?: number | null
  scoring?: ScoringRules | null
  metadata?: Record<string, unknown> | null
}

export interface QuizDelivery {
  id: number
  code: string
  name: string
  description?: string | null
  cover_image_url?: string | null
  subject_code?: string | null
  grade?: number | null
  mode: string
  settings: QuizSettings
  question_count: number
  total_points: number
  questions: QuizDeliveryQuestion[]
  theories: QuizTheory[]
}

// ─── IELTS — grouped view over QuizDelivery ──────────────────────────────────
export type IeltsSection = 'reading' | 'listening' | 'writing'

export interface IeltsSectionGroup {
  kind: IeltsSection
  title: string
  theory?: QuizTheory | null
  audioUrl?: string | null
  questions: QuizDeliveryQuestion[]
}

export interface IeltsGroupedQuiz {
  quiz: QuizDelivery
  sections: IeltsSectionGroup[]
}

export interface QuizAttempt {
  id: number
  quiz_id: number
  student_id: number
  assignment_id?: number | null
  attempt_no: number
  status: 'in_progress' | 'completed' | 'pending_review' | 'timed_out' | 'abandoned'
  score?: number | null
  max_score?: number | null
  percentage?: number | null
  passed?: boolean | null
  total_questions: number
  correct_count: number
  time_spent_s?: number | null
  xp_earned: number
  selected_question_ids?: number[] | null
  graded_by_id?: number | null
  graded_at?: string | null
  started_at: string
  submitted_at?: string | null
  answers: QuizAnswerResult[]
}

export interface QuizAnswerResult {
  id: number
  question_id: number
  given_answer?: unknown
  is_correct?: boolean | null
  points_earned: number
  time_ms?: number | null
  hint_used: boolean
  hint_level: number
  correct_answer?: unknown
  explanation?: string | null
  teacher_comment?: string | null
}

export interface SubmitAnswerItem {
  question_id: number
  given_answer?: unknown
  time_ms?: number | null
  hint_used?: boolean
  hint_level?: number
}

export interface HintResponse {
  question_id: number
  hint_level: number
  theory_content?: string | null
  theory_title?: string | null
  solution?: SolutionData | null
  answer?: unknown
  explanation?: string | null
}

// ─── Export ───────────────────────────────────────────────────────────────────
export interface ExportRequest {
  question_ids: number[]
  format: 'docx' | 'pdf' | 'json'
}