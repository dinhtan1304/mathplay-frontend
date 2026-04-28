import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  AuthToken, LoginRequest, RegisterRequest, User,
  Subject,
  DashboardStats, ChartData, Activity,
  Question, QuestionListResponse, QuestionFilters, QuestionUpdate,
  GenerateRequest, ExamGenerateRequest, PromptGenerateRequest, GenerateResponse, GeneratedQuestion,
  GeneratorExportRequest,
  ClassRoom, ClassCreate, ClassMember,
  Assignment, AssignmentCreate,
  Submission, SubmissionCreate, StudentXP, LeaderboardEntry,
  GameSession,
  ClassAnalytics, AssignmentAnalytics, StudentDetail,
  ParseProgress,
  Exam,
  CurriculumTree,
  ChatMessageRequest, ChatMessageResponse, ChatSession as ChatSessionType, ChatSessionHistory,
  Quiz, QuizListResponse, QuizQuestion, QuizQuestionCreate, QuizTheory, QuizDelivery,
  QuizAttempt, QuizAnswerResult, SubmitAnswerItem, ImportQuestionsResult, HintResponse,
} from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_BASE = `${BASE_URL}/api/v1`

// ─── Axios instance ───────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Token injection
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─── Error helper ────────────────────────────────────────────────────────────
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.detail)) return data.detail[0]?.msg ?? 'Lỗi không xác định'
  }
  if (err instanceof Error) return err.message
  return 'Lỗi không xác định'
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthToken>('/auth/login', new URLSearchParams({
      username: data.email,
      password: data.password,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(r => r.data),

  register: (data: RegisterRequest) =>
    api.post<User>('/auth/register', data).then(r => r.data),

  me: () =>
    api.get<User>('/auth/me').then(r => r.data),

  logout: async () => {
    // Revoke token on server before clearing locally
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore errors — clear local state regardless
    }
    if (typeof window !== 'undefined') localStorage.removeItem('access_token')
  },
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () =>
    api.get<DashboardStats>('/dashboard').then(r => r.data),

  getCharts: () =>
    api.get<ChartData>('/dashboard/charts').then(r => r.data),

  getActivity: () =>
    api.get<{ activities: Activity[] }>('/dashboard/activity').then(r => r.data.activities),
}

// ─── Parser ───────────────────────────────────────────────────────────────────
export const parserApi = {
  // POST /parser/parse
  upload: (file: File, onProgress?: (pct: number) => void, subjectHint: string = 'toan') => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ job_id: number; status: string; message: string }>(
      `/parser/parse?subject_hint=${encodeURIComponent(subjectHint)}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e: { loaded: number; total?: number }) => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100))
      },
    }).then(r => r.data)
  },

  // GET /parser/status/{job_id}
  getStatus: (jobId: number) =>
    api.get<Exam>(`/parser/status/${jobId}`).then(r => r.data),

  // Request a one-time SSE token, then connect to SSE stream
  subscribeProgress: (jobId: number, onEvent: (data: ParseProgress) => void): () => void => {
    let es: EventSource | null = null
    let cancelled = false

    // Get one-time SSE token, fall back to JWT if endpoint unavailable
    const connect = async () => {
      let sseToken: string | null = null
      try {
        const res = await api.post<{ token: string }>(`/parser/stream-token/${jobId}`)
        sseToken = res.data.token
      } catch {
        // Fallback: use JWT directly (backward compatible)
        sseToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      }
      if (cancelled || !sseToken) return

      const url = `${API_BASE}/parser/stream/${jobId}?token=${sseToken}`
      es = new EventSource(url)
      es.addEventListener('progress', (e: MessageEvent) => {
        try { onEvent(JSON.parse(e.data)) } catch {}
      })
      es.addEventListener('complete', (e: MessageEvent) => {
        try { onEvent({ ...JSON.parse(e.data), stage: 'done' }) } catch {}
        es!.close()
      })
      es.addEventListener('error_event', (e: MessageEvent) => {
        try { onEvent({ ...JSON.parse(e.data), stage: 'error' }) } catch {}
        es!.close()
      })
      // stream_timeout means SSE timed out but parsing may still be running.
      // Just close the SSE connection — polling fallback will detect completion.
      es.addEventListener('stream_timeout', () => {
        es!.close()
      })
      es.onerror = () => es!.close()
    }

    connect()
    return () => { cancelled = true; es?.close() }
  },

  // GET /parser/history
  listExams: (page = 1, pageSize = 20, search?: string) =>
    api.get<{ items: Exam[]; total: number; page: number; page_size: number }>('/parser/history', {
      params: { page, page_size: pageSize, ...(search ? { search } : {}) },
    }).then(r => r.data),

  // DELETE /parser/{job_id}
  deleteExam: (jobId: number) =>
    api.delete(`/parser/${jobId}`),

  // PATCH /parser/{job_id} — rename exam
  renameExam: (jobId: number, name: string) =>
    api.patch<Exam>(`/parser/${jobId}`, { name }).then(r => r.data),

  // POST /parser/parse-ielts — upload IELTS exam, creates Quiz automatically
  uploadIelts: (
    file: File,
    onProgress?: (pct: number) => void,
    useVision = false,
  ) => {
    const form = new FormData()
    form.append('file', file)
    form.append('use_vision', String(useVision))
    return api.post<{ job_id: number; status: string; message: string }>(
      `/parser/parse-ielts?use_vision=${useVision}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e: { loaded: number; total?: number }) => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100))
      },
    }).then(r => r.data)
  },
}

// ─── Questions ───────────────────────────────────────────────────────────────
export const questionsApi = {
  list: (params: {
    page?: number; page_size?: number
    subject?: string
    type?: string; difficulty?: string
    grade?: number | string; chapter?: string; keyword?: string; exam_id?: number
    my_only?: boolean; visibility?: 'public' | 'private'
    sort_by?: 'created_at' | 'difficulty' | 'question_type'
    sort_order?: 'asc' | 'desc'
  }) => api.get<QuestionListResponse>('/questions', { params }).then(r => r.data),

  getFilters: () =>
    api.get<QuestionFilters>('/questions/filters').then(r => r.data),

  get: (id: number) =>
    api.get<Question>(`/questions/${id}`).then(r => r.data),

  update: (id: number, data: QuestionUpdate) =>
    api.put<Question>(`/questions/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/questions/${id}`),

  bulkCreate: (questions: Partial<Question>[]) =>
    api.post<{ saved: number; skipped: number }>('/questions/bulk', { questions }).then(r => r.data),

  bulkVisibility: (questionIds: number[], isPublic: boolean) =>
    api.patch<{ detail: string; updated: number; skipped_no_answer: number; is_public: boolean }>('/questions/bulk-visibility', {
      question_ids: questionIds,
      is_public: isPublic,
    }).then(r => r.data),

  report: (questionId: number, reason: string, detail?: string) =>
    api.post<{ detail: string }>(`/questions/${questionId}/report`, { reason, detail }).then(r => r.data),

  generateSimilar: (questionIds: number[], count: number) =>
    api.post<GeneratedQuestion[]>('/questions/generate-similar', { question_ids: questionIds, count }).then(r => r.data),

  solve: (questionId: number) =>
    api.post<{ answer: string; solution_steps: string[] }>(`/questions/${questionId}/solve`, {}, { timeout: 120000 }).then(r => r.data),

  findDuplicates: (threshold = 0.85) =>
    api.get<{
      groups: Array<{
        questions: Array<{
          id: number; question_text: string; question_type: string
          difficulty?: string; topic?: string; chapter?: string
          grade?: number; answer?: string; created_at: string; exam_id?: number
        }>
        max_score: number
        is_exact?: boolean
      }>
      total_groups: number
      message?: string
      embedding_status?: { total_questions: number; embedded: number }
    }>('/questions/duplicates', { params: { threshold } }).then(r => r.data),

  bulkDelete: (questionIds: number[]) =>
    api.post<{ detail: string; deleted: number }>('/questions/bulk-delete', { question_ids: questionIds }).then(r => r.data),
}

// ─── Generator ───────────────────────────────────────────────────────────────
export const generatorApi = {
  // Single mode: POST /api/v1/generate
  generate: (data: GenerateRequest) =>
    api.post<GenerateResponse>('/generate', data).then(r => r.data),

  // Exam mode: POST /api/v1/generate/exam
  generateExam: (data: ExamGenerateRequest) =>
    api.post<GenerateResponse>('/generate/exam', data).then(r => r.data),

  // RAG prompt mode: POST /api/v1/generate/from-prompt
  generateFromPrompt: (data: PromptGenerateRequest) =>
    api.post<GenerateResponse>('/generate/from-prompt', data).then(r => r.data),

  // Save AI-generated questions as an Exam record: POST /api/v1/generate/save-as-exam
  saveAsExam: (title: string, questions: GeneratedQuestion[]) =>
    api.post<{ exam_id: number; question_count: number }>('/generate/save-as-exam', { title, questions }).then(r => r.data),
}

// ─── Subjects ────────────────────────────────────────────────────────────────
export const subjectsApi = {
  list: (grade?: number) =>
    api.get<Subject[]>('/subjects', { params: grade ? { grade } : {} }).then(r => r.data),
}

// ─── Curriculum ───────────────────────────────────────────────────────────────
export const curriculumApi = {
  getTree: (subjectCode: string = 'toan') =>
    api.get<CurriculumTree>('/curriculum/tree', { params: { subject_code: subjectCode } }).then(r => r.data),
}

// ─── Generator Export ─────────────────────────────────────────────────────────
export const generatorExportApi = {
  docx: async (payload: GeneratorExportRequest): Promise<void> => {
    const res = await api.post('/export/docx', payload, { responseType: 'blob' })
    _downloadBlob(res, 'de-thi.docx')
  },

  pdf: async (payload: GeneratorExportRequest): Promise<string> => {
    const res = await api.post<string>('/export/pdf', payload)
    return res.data
  },

  latex: async (payload: GeneratorExportRequest): Promise<void> => {
    const res = await api.post('/export/latex', payload, { responseType: 'blob' })
    _downloadBlob(res, 'de-thi.tex')
  },
}

function _downloadBlob(res: { data: BlobPart; headers: Record<string, unknown> }, fallbackName: string) {
  const blob = new Blob([res.data])
  const cd = String(res.headers['content-disposition'] || '')
  const match = cd.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : fallbackName
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Bank Export ─────────────────────────────────────────────────────────────
// POST /export/bank/{format} — export filtered questions from bank
export const bankExportApi = {
  docx: async (params: {
    topic?: string; difficulty?: string; question_type?: string
    keyword?: string; limit?: number
  }): Promise<void> => {
    const payload = {
      ...params, limit: params.limit ?? 200,
      title: 'NGÂN HÀNG CÂU HỎI',
      subtitle: params.topic || 'Toán học',
      include_answers: true, include_solutions: true, group_by_diff: true,
    }
    const res = await api.post('/export/bank/docx', payload, { responseType: 'blob' })
    _downloadBlob(res, 'ngan-hang.docx')
  },

  pdf: async (params: {
    topic?: string; difficulty?: string; question_type?: string
    keyword?: string; limit?: number
  }): Promise<string> => {
    const payload = {
      ...params, limit: params.limit ?? 200,
      title: 'NGÂN HÀNG CÂU HỎI',
      subtitle: params.topic || 'Toán học',
      include_answers: true, include_solutions: true, group_by_diff: true,
    }
    const res = await api.post<string>('/export/bank/pdf', payload)
    return res.data
  },

  latex: async (params: {
    topic?: string; difficulty?: string; question_type?: string
    keyword?: string; limit?: number
  }): Promise<void> => {
    const payload = {
      ...params, limit: params.limit ?? 200,
      title: 'NGÂN HÀNG CÂU HỎI',
      subtitle: params.topic || 'Toán học',
      include_answers: true, include_solutions: true, group_by_diff: true,
    }
    const res = await api.post('/export/bank/latex', payload, { responseType: 'blob' })
    _downloadBlob(res, 'ngan-hang.tex')
  },
}

// ─── Classes ─────────────────────────────────────────────────────────────────
export const classesApi = {
  list: () =>
    api.get<ClassRoom[]>('/classes').then(r => r.data),

  create: (data: ClassCreate) =>
    api.post<ClassRoom>('/classes', data).then(r => r.data),

  get: (id: number) =>
    api.get<ClassRoom>(`/classes/${id}`).then(r => r.data),

  update: (id: number, data: Partial<ClassCreate>) =>
    api.patch<ClassRoom>(`/classes/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/classes/${id}`),

  getMembers: (id: number) =>
    api.get<ClassMember[]>(`/classes/${id}/members`).then(r => r.data),

  removeMember: (classId: number, studentId: number) =>
    api.delete(`/classes/${classId}/members/${studentId}`),

  join: (code: string) =>
    api.post<{ message: string }>('/classes/join', { code }).then(r => r.data),

  getLeaderboard: (classId: number) =>
    api.get<LeaderboardEntry[]>(`/submissions/leaderboard/${classId}`).then(r => r.data),
}

// ─── Assignments ─────────────────────────────────────────────────────────────
export const assignmentsApi = {
  list: (classId?: number) =>
    api.get<Assignment[]>('/assignments', { params: classId ? { class_id: classId } : {} }).then(r => r.data),

  create: (data: AssignmentCreate) =>
    api.post<Assignment>('/assignments', data).then(r => r.data),

  get: (id: number) =>
    api.get<Assignment>(`/assignments/${id}`).then(r => r.data),

  update: (id: number, data: Partial<AssignmentCreate>) =>
    api.put<Assignment>(`/assignments/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/assignments/${id}`),

  getSubmissions: (id: number) =>
    api.get<Submission[]>(`/assignments/${id}/submissions`).then(r => r.data),
}

// ─── Submissions ─────────────────────────────────────────────────────────────
export const submissionsApi = {
  submit: (data: SubmissionCreate) =>
    api.post<Submission>('/submissions', data).then(r => r.data),

  getMyXP: () =>
    api.get<StudentXP>('/submissions/my-xp').then(r => r.data),

  getHistory: () =>
    api.get<Submission[]>('/submissions/my-history').then(r => r.data),
}

// ─── Game ─────────────────────────────────────────────────────────────────────
export const gameApi = {
  startSession: (assignmentId: number, gameMode?: string) =>
    api.post<GameSession>('/game/session', {
      assignment_id: assignmentId,
      game_mode: gameMode,
    }).then(r => r.data),
}


// ─── Admin CMS ──────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get<{ total_users: number; total_questions: number; total_exams: number; active_users: number; duplicate_questions: number }>('/admin/stats').then(r => r.data),
  getUsers: (skip = 0, limit = 20, search?: string, role?: string) => api.get<{ total: number; items: User[] }>('/admin/users', { params: { skip, limit, ...(search ? { search } : {}), ...(role ? { role } : {}) } }).then(r => r.data),
  updateUser: (id: number, data: { role?: string; is_active?: boolean }) => api.patch<User>(`/admin/users/${id}`, data).then(r => r.data),
  getQuestions: (page = 1, pageSize = 20, search?: string) => api.get<{ total: number; items: Question[] }>('/admin/questions', { params: { page, page_size: pageSize, ...(search ? { search } : {}) } }).then(r => r.data),
  updateQuestion: (id: number, data: QuestionUpdate) => api.put<Question>(`/admin/questions/${id}`, data).then(r => r.data),
  deleteQuestion: (id: number) => api.delete(`/admin/questions/${id}`).then(r => r.data),
  bulkVisibility: (ids: number[], isPublic: boolean) => api.patch('/admin/questions/bulk-visibility', { question_ids: ids, is_public: isPublic }).then(r => r.data),

  findDuplicates: (threshold = 0.85) =>
    api.get<{
      groups: Array<{
        questions: Array<{
          id: number; question_text: string; question_type: string
          difficulty?: string; topic?: string; chapter?: string
          grade?: number; answer?: string; created_at: string; exam_id?: number
          author_email?: string
        }>
        max_score: number
        is_exact?: boolean
      }>
      total_groups: number
      message?: string
      embedding_status?: { total_questions: number; embedded: number }
    }>('/admin/questions/duplicates', { params: { threshold } }).then(r => r.data),

  bulkDelete: (questionIds: number[]) =>
    api.post<{ detail: string; deleted: number }>('/admin/questions/bulk-delete', { question_ids: questionIds }).then(r => r.data),
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  getClass: (classId: number) =>
    api.get<ClassAnalytics>(`/analytics/class/${classId}`).then(r => r.data),

  getAssignment: (assignmentId: number) =>
    api.get<AssignmentAnalytics>(`/analytics/assignment/${assignmentId}`).then(r => r.data),

  getStudent: (studentId: number, classId: number) =>
    api.get<StudentDetail>(`/analytics/student/${studentId}/in-class/${classId}`).then(r => r.data),
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export const chatApi = {
  sendMessage: (data: ChatMessageRequest) =>
    api.post<ChatMessageResponse>('/chat/message', data).then(r => r.data),

  listSessions: () =>
    api.get<ChatSessionType[]>('/chat/sessions').then(r => r.data),

  getSession: (sessionId: number) =>
    api.get<ChatSessionHistory>(`/chat/sessions/${sessionId}`).then(r => r.data),

  deleteSession: (sessionId: number) =>
    api.delete(`/chat/sessions/${sessionId}`),
}

// ─── Quiz ───────────────────────────────────────────────────────────────────
export const quizApi = {
  // CRUD
  create: (data: { name: string; description?: string; subject_code?: string; grade?: number; mode?: string; visibility?: string; tags?: string[]; settings?: Record<string, unknown> }) =>
    api.post<Quiz>('/quizzes', data).then(r => r.data),

  list: (params?: { page?: number; page_size?: number; status?: string; search?: string }) =>
    api.get<QuizListResponse>('/quizzes', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<Quiz>(`/quizzes/${id}`).then(r => r.data),

  update: (id: number, data: Partial<Quiz>) =>
    api.patch<Quiz>(`/quizzes/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/quizzes/${id}`),

  getDeleteInfo: (id: number) =>
    api.get<{ quiz_name: string; question_count: number; theory_count: number; attempt_count: number; assignment_count: number }>(`/quizzes/${id}/delete-info`).then(r => r.data),

  // Questions
  addQuestion: (quizId: number, data: QuizQuestionCreate) =>
    api.post<QuizQuestion>(`/quizzes/${quizId}/questions`, data).then(r => r.data),

  listQuestions: (quizId: number) =>
    api.get<QuizQuestion[]>(`/quizzes/${quizId}/questions`).then(r => r.data),

  updateQuestion: (quizId: number, questionId: number, data: Partial<QuizQuestionCreate>) =>
    api.patch<QuizQuestion>(`/quizzes/${quizId}/questions/${questionId}`, data).then(r => r.data),

  deleteQuestion: (quizId: number, questionId: number) =>
    api.delete(`/quizzes/${quizId}/questions/${questionId}`),

  // Batch create (JSON file import) — returns { data, skipped }
  batchCreateQuestions: (quizId: number, questions: QuizQuestionCreate[], sourceType: string = 'file_import') =>
    api.post<QuizQuestion[]>(`/quizzes/${quizId}/batch-questions`, {
      questions, source_type: sourceType,
    }).then(r => ({
      data: r.data,
      skipped: parseInt(r.headers['x-skipped-duplicates'] || '0', 10),
    })),

  // Import from bank
  importQuestions: (quizId: number, questionIds: number[], sourceType: string = 'bank_import', targetType?: string) =>
    api.post<ImportQuestionsResult>(`/quizzes/${quizId}/import-questions`, {
      question_ids: questionIds,
      source_type: sourceType,
      ...(targetType ? { target_type: targetType } : {}),
    }).then(r => r.data),

  // Theories
  addTheory: (quizId: number, data: { title: string; content_type?: string; tags?: string[]; display_order?: number; sections: { order: number; content: string; content_format?: string; media?: Record<string, unknown> | null }[] }) =>
    api.post<QuizTheory>(`/quizzes/${quizId}/theories`, data).then(r => r.data),

  batchCreateTheories: (quizId: number, theories: { title: string; content_type?: string; tags?: string[]; display_order?: number; sections: { order: number; content: string; content_format?: string; media?: Record<string, unknown> | null }[] }[]) =>
    api.post<QuizTheory[]>(`/quizzes/${quizId}/batch-theories`, theories).then(r => r.data),

  listTheories: (quizId: number) =>
    api.get<QuizTheory[]>(`/quizzes/${quizId}/theories`).then(r => r.data),

  deleteTheory: (quizId: number, theoryId: number) =>
    api.delete(`/quizzes/${quizId}/theories/${theoryId}`),

  // Delivery (student view)
  deliver: (quizId: number) =>
    api.get<QuizDelivery>(`/quizzes/${quizId}/deliver`).then(r => r.data),

  // Lookup by code
  getByCode: (code: string) =>
    api.get<QuizDelivery>(`/quizzes/by-code/${code}`).then(r => r.data),

  // Export quiz to JSON
  export: (quizId: number) =>
    api.get(`/quizzes/${quizId}/export`).then(r => r.data),
}

// Batch fetch quiz info by codes (for template public/preview rendering).
// Swallows 404 / errors per code → returns { code, not_found: true }.
export async function fetchQuizBatch(codes: string[]): Promise<import('@/lib/templates').QuizDisplayInfo[]> {
  if (!codes || codes.length === 0) return []
  const unique = Array.from(new Set(codes.map(c => c.trim()).filter(Boolean)))
  const results = await Promise.all(unique.map(async (code): Promise<import('@/lib/templates').QuizDisplayInfo> => {
    try {
      const q = await quizApi.getByCode(code)
      return {
        code: q.code,
        name: q.name,
        description: q.description,
        cover_image_url: q.cover_image_url,
        question_count: q.question_count,
        total_points: q.total_points,
      }
    } catch {
      return { code, name: code, question_count: 0, not_found: true }
    }
  }))
  return results
}

// ─── Quiz Attempts ──────────────────────────────────────────────────────────
export const quizAttemptApi = {
  start: (quizId: number, assignmentId?: number) =>
    api.post<QuizAttempt>('/quiz-attempts/start', {
      quiz_id: quizId,
      assignment_id: assignmentId,
    }).then(r => r.data),

  submit: (attemptId: number, answers: SubmitAnswerItem[]) =>
    api.post<QuizAttempt>(`/quiz-attempts/${attemptId}/submit`, { answers }).then(r => r.data),

  get: (attemptId: number) =>
    api.get<QuizAttempt>(`/quiz-attempts/${attemptId}`).then(r => r.data),

  myAttempts: (quizId: number) =>
    api.get<QuizAttempt[]>(`/quiz-attempts/quiz/${quizId}/my-attempts`).then(r => r.data),

  getHint: (attemptId: number, questionId: number, level: number) =>
    api.get<HintResponse>(`/quiz-attempts/${attemptId}/hint/${questionId}`, { params: { level } })
      .then(r => r.data),

  // Teacher grading
  getPendingReview: (quizId: number) =>
    api.get<QuizAttempt[]>(`/quiz-attempts/quiz/${quizId}/pending-review`).then(r => r.data),

  gradeAnswer: (attemptId: number, answerId: number, data: {
    points_earned: number; is_correct?: boolean | null; teacher_comment?: string | null
  }) =>
    api.patch<QuizAnswerResult>(`/quiz-attempts/${attemptId}/answers/${answerId}/grade`, data)
      .then(r => r.data),

  finalizeGrading: (attemptId: number, data?: { passed?: boolean | null }) =>
    api.post<QuizAttempt>(`/quiz-attempts/${attemptId}/finalize-grading`, data || {}).then(r => r.data),
}

// ─── Media Upload ───────────────────────────────────────────────────────────
export const mediaApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ url: string; type: 'image' | 'audio' }>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}

// ─── Teacher Pages ───────────────────────────────────────────────────────────
export const pagesApi = {
  checkSlug: (slug: string) =>
    api.get<{ available: boolean; reason?: string }>(`/pages/check-slug/${slug}`).then(r => r.data),

  getPublic: (slug: string) =>
    api.get(`/pages/public/${slug}`).then(r => r.data),

  listMy: () =>
    api.get(`/pages/my`).then(r => r.data),

  create: (data: { template_id: string; slug: string; title: string; config: object }) =>
    api.post(`/pages`, data).then(r => r.data),

  update: (id: number, data: Partial<{ template_id: string; slug: string; title: string; config: object; is_published: boolean }>) =>
    api.patch(`/pages/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/pages/${id}`),
}

export default api