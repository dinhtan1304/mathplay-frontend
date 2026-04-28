'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TEMPLATES, DEFAULT_CONFIG, COLOR_PRESETS } from '@/lib/templates'
import type { PageConfig, CourseItem, ExamItem, ScheduleItem, QuizDisplayInfo } from '@/lib/templates'
import { getTemplateComponent } from '@/components/templates'
import { pagesApi, quizApi, fetchQuizBatch, getErrorMessage } from '@/lib/api'
import type { Quiz } from '@/types'
import { useAuth } from '@/lib/auth'
import {
  ArrowLeft, Settings, User, BookOpen, Palette, Globe,
  Plus, Trash2, CheckCircle, Copy, ExternalLink, Loader2,
  ChevronRight, Eye, Pencil, Gamepad2, X, Save, LayoutGrid,
} from 'lucide-react'

type TabId = 'info' | 'content' | 'quizzes' | 'colors' | 'settings'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'info', label: 'Thông tin', icon: <User className="w-4 h-4" /> },
  { id: 'content', label: 'Nội dung', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'quizzes', label: 'Quiz', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'colors', label: 'Màu sắc', icon: <Palette className="w-4 h-4" /> },
  { id: 'settings', label: 'Cài đặt', icon: <Settings className="w-4 h-4" /> },
]

// ── Sub-editors ──────────────────────────────────────────────────────────────

function CourseEditor({ courses, onChange, allCategories }: { courses: CourseItem[]; onChange: (v: CourseItem[]) => void; allCategories: string[] }) {
  const update = (i: number, field: keyof CourseItem, val: string) => {
    const next = courses.map((c, idx) => idx === i ? { ...c, [field]: val } : c)
    onChange(next)
  }
  return (
    <div className="space-y-3">
      {courses.map((c, i) => (
        <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: '#181c28', border: '1px solid #1c2030' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-dim">Khóa học #{i + 1}</span>
            <button onClick={() => onChange(courses.filter((_, idx) => idx !== i))}
              className="text-danger-red hover:opacity-80 transition"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          {([['name', 'Tên khóa học'], ['grade', 'Lớp/Cấp'], ['schedule', 'Lịch học'], ['desc', 'Mô tả']] as [keyof CourseItem, string][]).map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs text-text-dim mb-1">{label}</label>
              <input value={c[field] ?? ''} onChange={e => update(i, field, e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-sm text-text-default focus:outline-none focus:ring-1"
                style={{ background: '#0a0c10', border: '1px solid #1c2030' }} />
            </div>
          ))}
          <div>
            <label className="block text-xs text-text-dim mb-1">Danh mục (tuỳ chọn)</label>
            <input value={c.category ?? ''} onChange={e => update(i, 'category', e.target.value)}
              list={`course-cats-${i}`} placeholder="Vd: Lớp 12, Toán đại số..."
              className="w-full px-3 py-1.5 rounded-lg text-sm text-text-default focus:outline-none focus:ring-1"
              style={{ background: '#0a0c10', border: '1px solid #1c2030' }} />
            <datalist id={`course-cats-${i}`}>
              {allCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...courses, { name: 'Lớp mới', grade: '', schedule: '', desc: '' }])}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-accent-primary transition hover:bg-bg-hover"
        style={{ border: '1px dashed #6366f150' }}>
        <Plus className="w-4 h-4" /> Thêm khóa học
      </button>
    </div>
  )
}

function ExamEditor({ exams, onChange, allCategories }: { exams: ExamItem[]; onChange: (v: ExamItem[]) => void; allCategories: string[] }) {
  const update = (i: number, field: keyof ExamItem, val: string) => {
    const next = exams.map((e, idx) => idx === i ? { ...e, [field]: val } : e)
    onChange(next)
  }
  return (
    <div className="space-y-3">
      {exams.map((e, i) => (
        <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: '#181c28', border: '1px solid #1c2030' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-dim">Bộ đề #{i + 1}</span>
            <button onClick={() => onChange(exams.filter((_, idx) => idx !== i))}
              className="text-danger-red hover:opacity-80 transition"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          {([['title', 'Tên bộ đề'], ['date', 'Ngày'], ['desc', 'Mô tả']] as [keyof ExamItem, string][]).map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs text-text-dim mb-1">{label}</label>
              <input value={e[field] ?? ''} onChange={ev => update(i, field as keyof ExamItem, ev.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-sm text-text-default focus:outline-none focus:ring-1"
                style={{ background: '#0a0c10', border: '1px solid #1c2030' }} />
            </div>
          ))}
          <div>
            <label className="block text-xs text-text-dim mb-1">Độ khó</label>
            <select value={e.difficulty} onChange={ev => update(i, 'difficulty', ev.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-sm text-text-default focus:outline-none"
              style={{ background: '#0a0c10', border: '1px solid #1c2030' }}>
              <option value="easy">Cơ bản</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Nâng cao</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-dim mb-1">Danh mục (tuỳ chọn)</label>
            <input value={e.category ?? ''} onChange={ev => update(i, 'category', ev.target.value)}
              list={`exam-cats-${i}`} placeholder="Vd: Giữa kỳ, Luyện thi ĐH..."
              className="w-full px-3 py-1.5 rounded-lg text-sm text-text-default focus:outline-none focus:ring-1"
              style={{ background: '#0a0c10', border: '1px solid #1c2030' }} />
            <datalist id={`exam-cats-${i}`}>
              {allCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...exams, { title: 'Bộ đề mới', date: '', difficulty: 'medium', desc: '' }])}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-accent-primary hover:bg-bg-hover transition"
        style={{ border: '1px dashed #6366f150' }}>
        <Plus className="w-4 h-4" /> Thêm bộ đề
      </button>
    </div>
  )
}

function ScheduleEditor({ schedule, onChange }: { schedule: ScheduleItem[]; onChange: (v: ScheduleItem[]) => void }) {
  const update = (i: number, field: keyof ScheduleItem, val: string) => {
    const next = schedule.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {schedule.map((s, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#181c28', border: '1px solid #1c2030' }}>
          <div className="flex-1 grid grid-cols-3 gap-2">
            {(['day', 'time', 'subject'] as (keyof ScheduleItem)[]).map((field) => (
              <input key={field} value={s[field]} onChange={e => update(i, field, e.target.value)}
                placeholder={field === 'day' ? 'Thứ' : field === 'time' ? 'Giờ' : 'Môn'}
                className="px-2 py-1 rounded text-xs text-text-default focus:outline-none"
                style={{ background: '#0a0c10', border: '1px solid #1c2030' }} />
            ))}
          </div>
          <button onClick={() => onChange(schedule.filter((_, idx) => idx !== i))}
            className="text-danger-red hover:opacity-80 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...schedule, { day: '', time: '', subject: '' }])}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-accent-primary hover:bg-bg-hover transition"
        style={{ border: '1px dashed #6366f150' }}>
        <Plus className="w-4 h-4" /> Thêm lịch
      </button>
    </div>
  )
}

function QuizPicker({
  selectedCodes, onChange, isLoggedIn,
}: {
  selectedCodes: string[]
  onChange: (codes: string[]) => void
  isLoggedIn: boolean
}) {
  const [myQuizzes, setMyQuizzes] = useState<Quiz[] | null>(null)
  const [loadingMine, setLoadingMine] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [manualPreviews, setManualPreviews] = useState<QuizDisplayInfo[]>([])

  useEffect(() => {
    if (!isLoggedIn) return
    setLoadingMine(true)
    quizApi.list({ status: 'published', page_size: 100 })
      .then(r => setMyQuizzes(r.items))
      .catch(() => setMyQuizzes([]))
      .finally(() => setLoadingMine(false))
  }, [isLoggedIn])

  // Fetch info for codes that aren't in user's own list (e.g. added manually)
  useEffect(() => {
    const ownCodes = new Set((myQuizzes ?? []).map(q => q.code))
    const orphan = selectedCodes.filter(c => !ownCodes.has(c) && !manualPreviews.some(p => p.code === c))
    if (orphan.length === 0) return
    fetchQuizBatch(orphan).then(infos => {
      setManualPreviews(prev => {
        const merged = [...prev]
        infos.forEach(info => {
          if (!merged.some(m => m.code === info.code)) merged.push(info)
        })
        return merged
      })
    })
  }, [selectedCodes, myQuizzes, manualPreviews])

  const toggle = (code: string) => {
    if (selectedCodes.includes(code)) {
      onChange(selectedCodes.filter(c => c !== code))
    } else {
      onChange([...selectedCodes, code])
    }
  }

  const addManual = async () => {
    const code = manualCode.trim()
    if (!code) return
    if (selectedCodes.includes(code)) { setAddError('Quiz này đã được thêm'); return }
    setAdding(true)
    setAddError('')
    try {
      const q = await quizApi.getByCode(code)
      onChange([...selectedCodes, q.code])
      setManualPreviews(prev => prev.some(p => p.code === q.code) ? prev : [...prev, {
        code: q.code, name: q.name, description: q.description,
        cover_image_url: q.cover_image_url, question_count: q.question_count,
        total_points: q.total_points,
      }])
      setManualCode('')
    } catch {
      setAddError('Không tìm thấy quiz hoặc quiz chưa publish')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Manually added / orphan quizzes (shown for logged-in too if codes from elsewhere) */}
      {selectedCodes.filter(c => !(myQuizzes ?? []).some(q => q.code === c)).length > 0 && (
        <section>
          <p className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Quiz đã thêm bằng mã</p>
          <div className="space-y-2">
            {selectedCodes
              .filter(c => !(myQuizzes ?? []).some(q => q.code === c))
              .map(code => {
                const info = manualPreviews.find(p => p.code === code)
                return (
                  <div key={code} className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: '#181c28', border: '1px solid #1c2030' }}>
                    <Gamepad2 className="w-4 h-4 text-accent-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{info?.name ?? code}</p>
                      <p className="text-xs text-text-dim font-mono">{code}{info?.not_found ? ' · không tìm thấy' : ''}</p>
                    </div>
                    <button onClick={() => toggle(code)} className="text-danger-red hover:opacity-80 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* Manual code input */}
      <section>
        <p className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
          {isLoggedIn ? 'Thêm quiz bằng mã' : 'Nhập mã quiz để hiển thị'}
        </p>
        <div className="flex gap-2">
          <input value={manualCode}
            onChange={e => { setManualCode(e.target.value); setAddError('') }}
            onKeyDown={e => { if (e.key === 'Enter') addManual() }}
            placeholder="VD: ABCD1234"
            className="flex-1 px-3 py-2 rounded-xl text-sm font-mono text-text-default focus:outline-none"
            style={{ background: '#11141c', border: '1px solid #1c2030' }} />
          <button onClick={addManual} disabled={adding || !manualCode.trim()}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition disabled:opacity-50"
            style={{ background: '#6366f1' }}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Thêm'}
          </button>
        </div>
        {addError && <p className="text-xs text-danger-red mt-1">{addError}</p>}
      </section>

      {/* My published quizzes (logged in only) */}
      {isLoggedIn && (
        <section className="pt-4 border-t" style={{ borderColor: '#1c2030' }}>
          <p className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Quiz của tôi (đã publish)</p>
          {loadingMine ? (
            <div className="flex items-center gap-2 text-sm text-text-dim">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
            </div>
          ) : !myQuizzes || myQuizzes.length === 0 ? (
            <div className="p-4 rounded-xl text-center" style={{ background: '#181c28', border: '1px dashed #1c2030' }}>
              <p className="text-xs text-text-dim mb-2">Bạn chưa có quiz nào đã publish</p>
              <Link href="/quizzes" className="text-xs text-accent-primary hover:underline">Tạo quiz mới →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myQuizzes.map(q => {
                const checked = selectedCodes.includes(q.code)
                return (
                  <label key={q.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-bg-hover transition"
                    style={{ background: '#181c28', border: `1px solid ${checked ? '#6366f1' : '#1c2030'}` }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(q.code)}
                      className="w-4 h-4 accent-accent-primary shrink-0" />
                    {q.cover_image_url ? (
                      <img src={q.cover_image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: '#0a0c10' }}>
                        <Gamepad2 className="w-4 h-4 text-text-dim" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{q.name}</p>
                      <p className="text-xs text-text-dim font-mono">{q.code} · {q.question_count} câu</p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomizePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const templateId = params.id
  const pageIdParam = searchParams?.get('pageId')
  const editingPageId = pageIdParam ? parseInt(pageIdParam, 10) : null

  const meta = TEMPLATES.find(t => t.id === templateId)
  const TemplateComponent = getTemplateComponent(templateId)

  const [config, setConfig] = useState<PageConfig>(() => ({
    ...DEFAULT_CONFIG,
    colors: { primary: meta?.previewAccent ?? DEFAULT_CONFIG.colors.primary },
  }))
  const [tab, setTab] = useState<TabId>('info')
  const [slug, setSlug] = useState('')
  const [originalSlug, setOriginalSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [slugError, setSlugError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingPage, setLoadingPage] = useState(!!editingPageId)
  const [published, setPublished] = useState<{ slug: string } | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [quizInfo, setQuizInfo] = useState<QuizDisplayInfo[]>([])
  const slugTimer = useRef<ReturnType<typeof setTimeout>>()
  const quizFetchTimer = useRef<ReturnType<typeof setTimeout>>()

  // Redirect to not found if template doesn't exist
  useEffect(() => {
    if (!meta) router.replace('/templates')
  }, [meta, router])

  // Load existing page when editing
  useEffect(() => {
    if (!editingPageId) return
    setLoadingPage(true)
    pagesApi.listMy()
      .then((pages: import('@/lib/templates').TeacherPageData[]) => {
        const page = pages.find(p => p.id === editingPageId)
        if (!page) { router.replace('/templates/my-pages'); return }
        setConfig(page.config)
        setSlug(page.slug)
        setOriginalSlug(page.slug)
        setSlugStatus('ok')
        if (page.is_published) setPublished({ slug: page.slug })
      })
      .catch(() => router.replace('/templates/my-pages'))
      .finally(() => setLoadingPage(false))
  }, [editingPageId])

  // Debounced fetch of quiz info for live preview
  useEffect(() => {
    clearTimeout(quizFetchTimer.current)
    if (config.quiz_codes.length === 0) {
      setQuizInfo([])
      return
    }
    quizFetchTimer.current = setTimeout(() => {
      fetchQuizBatch(config.quiz_codes).then(setQuizInfo).catch(() => setQuizInfo([]))
    }, 400)
    return () => clearTimeout(quizFetchTimer.current)
  }, [config.quiz_codes])

  // Slug check debounce
  const checkSlug = useCallback(async (val: string) => {
    if (!val || val.length < 3) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    try {
      const res = await pagesApi.checkSlug(val)
      setSlugStatus(res.available ? 'ok' : 'error')
      setSlugError(res.available ? '' : 'Slug này đã được sử dụng')
    } catch {
      setSlugStatus('idle')
    }
  }, [])

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    setSlug(clean)
    setSlugError('')
    // If editing and slug reverted to original, mark ok without API call
    if (editingPageId && clean === originalSlug) {
      setSlugStatus('ok')
      clearTimeout(slugTimer.current)
      return
    }
    setSlugStatus('idle')
    clearTimeout(slugTimer.current)
    slugTimer.current = setTimeout(() => checkSlug(clean), 600)
  }

  const updateConfig = (patch: Partial<PageConfig>) => setConfig(prev => ({ ...prev, ...patch }))

  const handleSave = async () => {
    if (!user) { router.push('/login'); return }
    if (!slug) { alert('Vui lòng nhập slug cho trang của bạn'); return }
    if (slugStatus === 'error') return

    setSaving(true)
    try {
      const title = config.teacher.name + ' — ' + config.teacher.subject
      if (editingPageId) {
        await pagesApi.update(editingPageId, { template_id: templateId, slug, title, config, is_published: true })
        setOriginalSlug(slug)
        setPublished({ slug })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const page = await pagesApi.create({ template_id: templateId, slug, title, config })
        setPublished({ slug: page.slug })
      }
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const publicUrl = published ? `${window.location.origin}/page/${published.slug}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!meta) return null

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0a0c10' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary mx-auto mb-3" />
          <p className="text-text-muted text-sm">Đang tải trang...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0a0c10', color: '#f1f5f9' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: '#11141c', borderBottom: '1px solid #1c2030' }}>
        <div className="flex items-center gap-3">
          <Link href={editingPageId ? '/dashboard/pages' : '/templates'}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-default transition">
            <ArrowLeft className="w-4 h-4" />
            {editingPageId ? 'Trang GV' : 'Quay lại'}
          </Link>
          <ChevronRight className="w-4 h-4 text-text-dim" />
          <span className="text-sm font-medium">{meta.name}</span>
          {editingPageId && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
              Đang chỉnh sửa
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile: toggle preview */}
          <button onClick={() => setShowPreview(v => !v)}
            className="lg:hidden flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition"
            style={{ background: showPreview ? '#6366f1' : '#181c28', color: showPreview ? 'white' : '#94a3b8' }}>
            {showPreview ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Sửa' : 'Xem'}
          </button>

          {/* Edit mode: always show save + view buttons */}
          {editingPageId ? (
            <div className="flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-success-green">
                  <CheckCircle className="w-4 h-4" /> Đã lưu
                </span>
              )}
              {published && (
                <>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition hover:opacity-80"
                    style={{ background: '#181c28', color: '#94a3b8', border: '1px solid #1c2030' }}>
                    <ExternalLink className="w-4 h-4" /> Xem
                  </a>
                  <button onClick={copyLink}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition hover:opacity-80"
                    style={{ background: '#181c28', color: copied ? '#34d399' : '#94a3b8', border: '1px solid #1c2030' }}>
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </>
              )}
              <button onClick={handleSave} disabled={saving || slugStatus === 'error' || !slug}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-medium text-white transition disabled:opacity-60"
                style={{ background: '#6366f1' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          ) : published ? (
            <div className="flex items-center gap-2">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-white"
                style={{ background: '#059669' }}>
                <ExternalLink className="w-4 h-4" /> Xem trang
              </a>
              <button onClick={copyLink}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-white"
                style={{ background: copied ? '#059669' : '#6366f1' }}>
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Đã copy!' : 'Copy link'}
              </button>
            </div>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-medium text-white transition disabled:opacity-60"
              style={{ background: '#6366f1' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              {user ? 'Publish & lấy link' : 'Đăng nhập để publish'}
            </button>
          )}
        </div>
      </div>

      {/* Body: panel + preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Customize Panel */}
        <div className={`w-full lg:w-[400px] shrink-0 flex flex-col overflow-hidden ${showPreview ? 'hidden lg:flex' : 'flex'}`}
          style={{ borderRight: '1px solid #1c2030' }}>

          {/* Tabs */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid #1c2030', background: '#11141c' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition"
                style={tab === t.id
                  ? { color: '#818cf8', borderBottom: '2px solid #6366f1' }
                  : { color: '#64748b', borderBottom: '2px solid transparent' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Info tab */}
            {tab === 'info' && (
              <>
                {[
                  ['name', 'Họ tên giáo viên', 'text'],
                  ['subject', 'Môn / Bộ môn', 'text'],
                  ['school', 'Tên trường', 'text'],
                  ['tagline', 'Khẩu hiệu', 'text'],
                  ['avatar', 'URL ảnh đại diện', 'url'],
                ].map(([field, label, type]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
                    <input type={type} value={(config.teacher as Record<string, string>)[field]}
                      onChange={e => updateConfig({ teacher: { ...config.teacher, [field]: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl text-sm text-text-default focus:outline-none focus:ring-1 focus:ring-accent-primary"
                      style={{ background: '#11141c', border: '1px solid #1c2030' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Giới thiệu bản thân</label>
                  <textarea value={config.teacher.bio} rows={3}
                    onChange={e => updateConfig({ teacher: { ...config.teacher, bio: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl text-sm text-text-default focus:outline-none resize-none"
                    style={{ background: '#11141c', border: '1px solid #1c2030' }} />
                </div>

                <div className="pt-2 border-t" style={{ borderColor: '#1c2030' }}>
                  <p className="text-xs font-bold text-text-muted mb-3">Thông tin liên hệ</p>
                  {[['email', 'Email'], ['phone', 'Điện thoại'], ['zalo', 'Zalo (số điện thoại)'], ['facebook', 'Facebook URL']].map(([field, label]) => (
                    <div key={field} className="mb-3">
                      <label className="block text-xs text-text-dim mb-1">{label}</label>
                      <input value={(config.contact as Record<string, string>)[field]}
                        onChange={e => updateConfig({ contact: { ...config.contact, [field]: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl text-sm text-text-default focus:outline-none"
                        style={{ background: '#11141c', border: '1px solid #1c2030' }} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Content tab */}
            {tab === 'content' && (
              <>
                <section>
                  <h3 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Khóa học</h3>
                  <CourseEditor courses={config.courses} onChange={v => updateConfig({ courses: v })}
                    allCategories={[...new Set([...config.courses.map(c => c.category), ...config.exams.map(e => e.category)].filter(Boolean) as string[])]} />
                </section>
                <section className="pt-4 border-t" style={{ borderColor: '#1c2030' }}>
                  <h3 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Bộ đề thi</h3>
                  <ExamEditor exams={config.exams} onChange={v => updateConfig({ exams: v })}
                    allCategories={[...new Set([...config.courses.map(c => c.category), ...config.exams.map(e => e.category)].filter(Boolean) as string[])]} />
                </section>
                <section className="pt-4 border-t" style={{ borderColor: '#1c2030' }}>
                  <h3 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Lịch dạy</h3>
                  <ScheduleEditor schedule={config.schedule} onChange={v => updateConfig({ schedule: v })} />
                </section>
              </>
            )}

            {/* Quiz tab */}
            {tab === 'quizzes' && (
              <>
                <p className="text-xs text-text-dim mb-2">
                  Chọn các quiz để hiển thị trên trang. Học sinh có thể click vào card để vào làm quiz ngay.
                </p>
                <QuizPicker
                  selectedCodes={config.quiz_codes}
                  onChange={codes => updateConfig({ quiz_codes: codes })}
                  isLoggedIn={!!user}
                />
              </>
            )}

            {/* Colors tab */}
            {tab === 'colors' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-3">Màu chủ đạo</label>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_PRESETS.map(c => (
                      <button key={c.value} onClick={() => updateConfig({ colors: { primary: c.value } })}
                        title={c.label}
                        className="w-full aspect-square rounded-xl transition hover:scale-110 relative"
                        style={{ background: c.value, boxShadow: config.colors.primary === c.value ? `0 0 0 3px white, 0 0 0 5px ${c.value}` : 'none' }}>
                        {config.colors.primary === c.value && (
                          <CheckCircle className="w-3 h-3 text-white absolute inset-0 m-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-2">Màu tùy chỉnh</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={config.colors.primary}
                      onChange={e => updateConfig({ colors: { primary: e.target.value } })}
                      className="w-12 h-10 rounded-lg cursor-pointer border-0 p-1"
                      style={{ background: '#11141c' }} />
                    <input type="text" value={config.colors.primary}
                      onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) updateConfig({ colors: { primary: e.target.value } }) }}
                      className="flex-1 px-3 py-2 rounded-xl text-sm font-mono text-text-default focus:outline-none"
                      style={{ background: '#11141c', border: '1px solid #1c2030' }} />
                  </div>
                </div>
              </>
            )}

            {/* Settings tab */}
            {tab === 'settings' && (
              <>
                {/* Section toggles */}
                <div>
                  <p className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Hiển thị phần</p>
                  <div className="space-y-2">
                    {([['courses', 'Khóa học'], ['exams', 'Bộ đề thi'], ['schedule', 'Lịch dạy'], ['quizzes', 'Quiz luyện tập'], ['contact', 'Liên hệ']] as [keyof PageConfig['sections'], string][]).map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-bg-hover transition"
                        style={{ background: '#11141c', border: '1px solid #1c2030' }}>
                        <span className="text-sm">{label}</span>
                        <div className="relative w-10 h-5">
                          <input type="checkbox" className="sr-only"
                            checked={config.sections[key]}
                            onChange={e => updateConfig({ sections: { ...config.sections, [key]: e.target.checked } })} />
                          <div className="w-10 h-5 rounded-full transition"
                            style={{ background: config.sections[key] ? '#6366f1' : '#334155' }}>
                            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                              style={{ left: config.sections[key] ? '1.25rem' : '0.125rem' }} />
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Slug */}
                <div className="pt-4 border-t" style={{ borderColor: '#1c2030' }}>
                  <p className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">Link trang</p>
                  <div className="flex items-center gap-0 rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${slugStatus === 'ok' ? '#059669' : slugStatus === 'error' ? '#ef4444' : '#1c2030'}` }}>
                    <span className="px-3 py-2 text-xs text-text-dim shrink-0" style={{ background: '#11141c', borderRight: '1px solid #1c2030' }}>
                      /page/
                    </span>
                    <input value={slug} onChange={e => handleSlugChange(e.target.value)}
                      placeholder="ten-giao-vien"
                      className="flex-1 px-3 py-2 text-sm text-text-default focus:outline-none"
                      style={{ background: '#11141c' }} />
                    {slugStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-text-dim mr-2" />}
                    {slugStatus === 'ok' && <CheckCircle className="w-4 h-4 text-success-green mr-2" />}
                  </div>
                  {slugError && <p className="text-xs text-danger-red mt-1">{slugError}</p>}
                  {slugStatus === 'ok' && !slugError && <p className="text-xs text-success-green mt-1">✓ Slug khả dụng</p>}
                  <p className="text-xs text-text-dim mt-1">Chỉ dùng chữ thường, số, dấu gạch ngang. Ví dụ: nguyen-van-a-toan</p>
                </div>

                {/* Save / Publish button */}
                <button onClick={handleSave} disabled={saving || slugStatus === 'error' || !slug}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition disabled:opacity-50"
                  style={{ background: '#6366f1' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingPageId ? <Save className="w-4 h-4" /> : <Globe className="w-4 h-4" />)}
                  {editingPageId
                    ? (user ? 'Lưu thay đổi' : 'Đăng nhập để lưu')
                    : (user ? 'Publish & tạo link chia sẻ' : 'Đăng nhập để publish')}
                </button>

                {/* My Pages link */}
                {user && (
                  <Link href="/dashboard/pages"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-default transition"
                    style={{ border: '1px solid #1c2030' }}>
                    <LayoutGrid className="w-4 h-4" /> Xem tất cả trang của tôi
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Live Preview */}
        <div className={`flex-1 overflow-hidden flex flex-col ${showPreview ? 'flex' : 'hidden lg:flex'}`}
          style={{ background: '#060810' }}>
          <div className="px-4 py-2 flex items-center gap-2 shrink-0"
            style={{ background: '#11141c', borderBottom: '1px solid #1c2030' }}>
            <Eye className="w-3.5 h-3.5 text-text-dim" />
            <span className="text-xs text-text-dim">Live preview</span>
            <div className="flex gap-1 ml-auto">
              {['#ef4444', '#fbbf24', '#22c55e'].map(c => (
                <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="origin-top min-h-full">
              <TemplateComponent config={config} quizInfo={quizInfo} isPreview={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
