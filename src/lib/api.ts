import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  AuthToken, LoginRequest, RegisterRequest, User,
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
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ job_id: number; status: string; message: string }>('/parser/parse', form, {
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
}

// ─── Questions ───────────────────────────────────────────────────────────────
export const questionsApi = {
  list: (params: {
    page?: number; page_size?: number
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
    api.post<{ answer: string; solution_steps: string[] }>(`/questions/${questionId}/solve`).then(r => r.data),

  findDuplicates: (threshold = 0.92) =>
    api.get<{
      groups: Array<{
        questions: Array<{
          id: number; question_text: string; question_type: string
          difficulty?: string; topic?: string; chapter?: string
          grade?: number; answer?: string; created_at: string
        }>
        max_score: number
      }>
      total_groups: number
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

// ─── Curriculum ───────────────────────────────────────────────────────────────
export const curriculumApi = {
  getTree: () =>
    api.get<CurriculumTree>('/curriculum/tree').then(r => r.data),
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
  getStats: () => api.get<{ total_users: number; total_questions: number; total_exams: number; active_users: number }>('/admin/stats').then(r => r.data),
  getUsers: (skip = 0, limit = 20, search?: string, role?: string) => api.get<{ total: number; items: User[] }>('/admin/users', { params: { skip, limit, ...(search ? { search } : {}), ...(role ? { role } : {}) } }).then(r => r.data),
  updateUser: (id: number, data: { role?: string; is_active?: boolean }) => api.patch<User>(`/admin/users/${id}`, data).then(r => r.data),
  getQuestions: (page = 1, pageSize = 20, search?: string) => api.get<{ total: number; items: Question[] }>('/admin/questions', { params: { page, page_size: pageSize, ...(search ? { search } : {}) } }).then(r => r.data),
  updateQuestion: (id: number, data: QuestionUpdate) => api.put<Question>(`/admin/questions/${id}`, data).then(r => r.data),
  deleteQuestion: (id: number) => api.delete(`/admin/questions/${id}`).then(r => r.data),
  bulkVisibility: (ids: number[], isPublic: boolean) => api.patch('/admin/questions/bulk-visibility', { question_ids: ids, is_public: isPublic }).then(r => r.data),
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

export default api