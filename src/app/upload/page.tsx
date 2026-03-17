'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { parserApi, questionsApi, classesApi, assignmentsApi, getErrorMessage } from '@/lib/api'
import type { Question, ClassRoom } from '@/types'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, TYPE_LABELS, cn } from '@/lib/utils'
import { Upload, CheckCircle, XCircle, Loader2, BookmarkPlus, ChevronDown, Send, X, Sparkles } from 'lucide-react'
import { MathText } from '@/lib/math'
import GenerateSimilarModal from '@/components/GenerateSimilarModal'

type Stage = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

interface ProgressState {
  percent: number
  message: string
  questions_found?: number
}

export default function UploadPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [uploadPct, setUploadPct] = useState(0)
  const [progress, setProgress] = useState<ProgressState>({ percent: 0, message: '' })
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [jobId, setJobId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')
  const [showSimilarModal, setShowSimilarModal] = useState(false)
  // Send to class dialog
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [sendTitle, setSendTitle] = useState('')
  const [sendClasses, setSendClasses] = useState<ClassRoom[]>([])
  const [sendClassId, setSendClassId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [sentMsg, setSentMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const unsubRef = useRef<(() => void) | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup on unmount
  useEffect(() => () => {
    unsubRef.current?.()
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  // Load questions from DB after processing completes (paginate if >100)
  const loadQuestions = useCallback(async (jobId: number) => {
    try {
      const allQuestions: Question[] = []
      let page = 1
      let total = Infinity
      while (allQuestions.length < total) {
        const res = await questionsApi.list({ exam_id: jobId, page_size: 100, page })
        allQuestions.push(...(res.items || []))
        total = res.total
        if (allQuestions.length >= total) break
        page++
      }
      setQuestions(allQuestions)
      setSelectedIds(new Set(allQuestions.map((q: Question) => q.id)))
      setStage('done')
    } catch (e) {
      setError(getErrorMessage(e))
      setStage('error')
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
      setError('Chỉ hỗ trợ file PDF, DOCX, DOC'); return
    }
    // Reset state
    setError(''); setStage('uploading'); setUploadPct(0)
    setQuestions([]); setSelectedIds(new Set()); setSavedMsg(''); setJobId(null)
    setProgress({ percent: 0, message: 'Đang tải lên...' })
    unsubRef.current?.()
    if (pollRef.current) clearInterval(pollRef.current)

    try {
      const { job_id } = await parserApi.upload(file, setUploadPct)
      setJobId(job_id)
      setStage('processing')
      setProgress({ percent: 5, message: 'Đang khởi tạo...' })

      let completed = false

      // SSE stream for real-time progress
      unsubRef.current = parserApi.subscribeProgress(job_id, async (data) => {
        if (completed) return

        // progress event: { percent, message }
        if (data.percent !== undefined || data.message) {
          setProgress({
            percent: data.percent ?? 0,
            message: data.message ?? '',
            questions_found: data.questions_found,
          })
        }

        // complete event (stage = 'done' added by subscribeProgress wrapper)
        if (data.stage === 'done') {
          completed = true
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          setProgress({ percent: 100, message: 'Hoàn tất! Đang tải kết quả...' })
          await loadQuestions(job_id)
          return
        }

        // error event
        if (data.stage === 'error') {
          completed = true
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
          setStage('error')
          setError(data.message || 'Xử lý thất bại')
        }
      })

      // Polling fallback — check status every 3s in case SSE fails
      pollRef.current = setInterval(async () => {
        if (completed) { clearInterval(pollRef.current!); return }
        try {
          const exam = await parserApi.getStatus(job_id)
          if (exam.status === 'completed') {
            completed = true
            clearInterval(pollRef.current!)
            unsubRef.current?.()
            setProgress({ percent: 100, message: 'Hoàn tất!' })
            await loadQuestions(job_id)
          } else if (exam.status === 'failed') {
            completed = true
            clearInterval(pollRef.current!)
            unsubRef.current?.()
            setStage('error')
            setError(exam.error_message || 'Xử lý thất bại')
          }
        } catch {}
      }, 3000)

    } catch (e) {
      setStage('error')
      setError(getErrorMessage(e))
    }
  }, [loadQuestions])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const saveSelected = async () => {
    const toSave = questions.filter(q => selectedIds.has(q.id))
    if (!toSave.length) return
    setSaving(true)
    try {
      const { saved, skipped } = await questionsApi.bulkCreate(toSave)
      setSavedMsg(`✓ Đã lưu thêm ${saved} câu${skipped ? `, bỏ qua ${skipped} trùng` : ''}`)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const openSendDialog = async () => {
    setSendTitle('Bài tập từ đề thi')
    setSendClassId(null)
    setSentMsg('')
    setSendDialogOpen(true)
    try {
      setSendClasses(await classesApi.list())
    } catch { setSendClasses([]) }
  }

  const handleSendToClass = async () => {
    if (!jobId || !sendClassId) return
    setSending(true)
    try {
      await assignmentsApi.create({ class_id: sendClassId, exam_id: jobId, title: sendTitle.trim() || 'Bài tập' })
      setSentMsg('✓ Đã gửi vào lớp thành công!')
      setTimeout(() => setSendDialogOpen(false), 1500)
    } catch (e) {
      setSentMsg(`⚠ ${getErrorMessage(e)}`)
    } finally {
      setSending(false)
    }
  }

  // Step indicators based on percent
  const steps = ['Đọc file', 'Phân tích AI', 'Trích xuất', 'Lưu trữ']
  const stepThresholds = [10, 40, 80, 100]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text">Upload Đề Thi</h1>
        <p className="text-text-muted text-sm mt-1">Tải lên PDF hoặc DOCX — AI sẽ tự động trích xuất câu hỏi</p>
      </div>

      {/* Upload zone */}
      {(stage === 'idle' || stage === 'error') && (
        <div
          className={cn(
            'card border-2 border-dashed p-12 text-center cursor-pointer transition-colors duration-150',
            dragOver ? 'border-accent bg-accent/5' : 'border-bg-border hover:border-accent/50'
          )}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
        >
          <input
            ref={fileInput} type="file" accept=".pdf,.docx,.doc" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-accent" />
          </div>
          <div className="text-lg font-semibold text-text mb-1">
            {dragOver ? 'Thả file vào đây' : 'Kéo thả hoặc nhấn để chọn file'}
          </div>
          <div className="text-sm text-text-muted">Hỗ trợ PDF, DOCX, DOC — tối đa 20MB</div>
          {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
        </div>
      )}

      {/* Upload progress */}
      {stage === 'uploading' && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 size={18} className="text-accent animate-spin" />
            <span className="font-medium text-text">Đang tải lên...</span>
            <span className="ml-auto text-accent font-bold">{uploadPct}%</span>
          </div>
          <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${uploadPct}%` }} />
          </div>
        </div>
      )}

      {/* Processing progress */}
      {stage === 'processing' && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 size={18} className="text-accent animate-spin" />
            <div>
              <div className="font-medium text-text">{progress.message || 'Đang xử lý...'}</div>
              {progress.questions_found != null && (
                <div className="text-xs text-text-muted mt-0.5">Đã tìm thấy {progress.questions_found} câu hỏi</div>
              )}
            </div>
            <span className="ml-auto text-accent font-bold">{progress.percent}%</span>
          </div>
          <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {steps.map((step, i) => {
              const pct = progress.percent
              const done = pct >= stepThresholds[i]
              const active = !done && (i === 0 || pct >= stepThresholds[i - 1])
              return (
                <div key={step} className={cn(
                  'text-center text-xs p-2 rounded-lg',
                  done ? 'text-green-400 bg-green-400/10' : active ? 'text-accent bg-accent/10' : 'text-text-dim bg-bg-hover'
                )}>
                  {done ? '✓' : active ? '…' : '○'} {step}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {stage === 'done' && questions.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <div className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <div className="font-semibold text-text">Trích xuất thành công!</div>
              <div className="text-sm text-text-muted">
                {questions.length} câu hỏi đã lưu vào ngân hàng • {selectedIds.size} đã chọn
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {savedMsg && <span className="text-sm text-green-400">{savedMsg}</span>}
              <button
                onClick={() => setSelectedIds(new Set(questions.map(q => q.id)))}
                className="btn-ghost text-sm py-1.5"
              >
                Chọn tất cả
              </button>
              <button
                onClick={saveSelected}
                disabled={saving || selectedIds.size === 0}
                className="btn-ghost text-sm py-1.5 flex items-center gap-1.5"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <BookmarkPlus size={14} />}
                Lưu lại ({selectedIds.size})
              </button>
              <button
                onClick={() => setShowSimilarModal(true)}
                disabled={selectedIds.size === 0}
                className="btn-ghost text-sm py-1.5 flex items-center gap-1.5 text-accent hover:text-accent"
              >
                <Sparkles size={14} /> Sinh đề tương tự
              </button>
              <button
                onClick={openSendDialog}
                className="btn-primary text-sm py-1.5 flex items-center gap-1.5"
              >
                <Send size={14} /> Gửi vào lớp
              </button>
            </div>
          </div>

          {/* Upload another file */}
          <div
            className={cn(
              'card border-2 border-dashed p-6 text-center cursor-pointer transition-colors duration-150',
              dragOver ? 'border-accent bg-accent/5' : 'border-bg-border hover:border-accent/50'
            )}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInput.current?.click()}
          >
            <input
              ref={fileInput} type="file" accept=".pdf,.docx,.doc" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
            />
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Upload size={18} className="text-accent" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-text">Upload thêm đề thi</div>
                <div className="text-xs text-text-muted">Kéo thả hoặc nhấn để chọn file PDF, DOCX</div>
              </div>
            </div>
          </div>

          <div className="card divide-y divide-bg-border">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(q.id)}
                    onChange={() => toggleSelect(q.id)}
                    className="mt-0.5 w-4 h-4 accent-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs text-text-dim font-mono">#{idx + 1}</span>
                      {q.question_type && (
                        <span className="badge bg-accent/10 text-accent">
                          {TYPE_LABELS[q.question_type] || q.question_type}
                        </span>
                      )}
                      {q.difficulty && (
                        <span className={`badge ${DIFFICULTY_COLORS[q.difficulty]}`}>
                          {DIFFICULTY_LABELS[q.difficulty]}
                        </span>
                      )}
                      {q.topic && <span className="badge bg-bg-hover text-text-muted">{q.topic}</span>}
                    </div>
                    <div className="text-sm text-text leading-relaxed"><MathText text={q.question_text} /></div>
                    {expandedId === q.id && (
                      <div className="mt-3 space-y-2">
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-1">
                            {q.options.map((opt, i) => (
                              <div key={i} className={cn(
                                'text-xs px-3 py-1.5 rounded-lg',
                                q.answer === opt || q.answer === String.fromCharCode(65 + i)
                                  ? 'bg-green-400/10 text-green-400'
                                  : 'bg-bg-hover text-text-muted'
                              )}>
                                {String.fromCharCode(65 + i)}. <MathText text={opt} />
                              </div>
                            ))}
                          </div>
                        )}
                        {q.answer && (
                          <div className="text-xs bg-green-400/10 text-green-400 px-3 py-2 rounded-lg">
                            <span className="font-medium">Đáp án: </span><MathText text={q.answer} />
                          </div>
                        )}
                        {q.solution_steps && q.solution_steps.length > 0 && (
                          <div className="text-xs bg-bg-hover rounded-lg p-3 space-y-1">
                            <div className="font-medium text-text-muted mb-1">Hướng dẫn giải:</div>
                            {q.solution_steps.map((s, si) => (
                              <div key={si} className="text-text-muted">
                                <span className="text-text-dim">{si + 1}.</span> <MathText text={s} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                    className="text-text-dim hover:text-accent transition-colors flex-shrink-0"
                  >
                    <ChevronDown size={16} className={cn('transition-transform', expandedId === q.id && 'rotate-180')} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done but no questions */}
      {stage === 'done' && questions.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-text-muted">AI không tìm được câu hỏi nào trong file này.</div>
          <button onClick={() => setStage('idle')} className="btn-ghost mt-4 text-sm">Thử file khác</button>
        </div>
      )}

      {/* Error state */}
      {stage === 'error' && (
        <div className="card p-6 flex items-center gap-3 text-red-400">
          <XCircle size={20} />
          <div>
            <div className="font-medium">Xử lý thất bại</div>
            <div className="text-sm text-red-400/70 mt-0.5">{error}</div>
          </div>
          <button
            onClick={() => { setStage('idle'); setError('') }}
            className="ml-auto btn-ghost text-sm"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Generate similar modal */}
      {showSimilarModal && (
        <GenerateSimilarModal
          selectedIds={Array.from(selectedIds)}
          onClose={() => setShowSimilarModal(false)}
          onSaved={() => setShowSimilarModal(false)}
        />
      )}

      {/* Send to class dialog */}
      {sendDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-bg-card border border-bg-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">Gửi vào lớp</h2>
              <button onClick={() => setSendDialogOpen(false)} className="text-text-dim hover:text-text">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-dim mb-1.5 block">Tên bài tập *</label>
                <input
                  value={sendTitle}
                  onChange={e => setSendTitle(e.target.value)}
                  placeholder="VD: Bài tập kiểm tra 45 phút"
                  className="input text-sm w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-dim mb-1.5 block">Chọn lớp *</label>
                {sendClasses.length === 0 ? (
                  <div className="text-sm text-text-muted text-center py-4">
                    Bạn chưa có lớp nào. Tạo lớp trong mục Quản lý lớp trước.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {sendClasses.map(cls => (
                      <button key={cls.id} onClick={() => setSendClassId(cls.id)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                          sendClassId === cls.id
                            ? 'border-accent bg-accent/10 text-text'
                            : 'border-bg-border bg-bg-hover text-text-muted hover:text-text'
                        )}>
                        <div className="font-medium">{cls.name}</div>
                        {(cls.subject || cls.grade) && (
                          <div className="text-xs text-text-dim mt-0.5">
                            {cls.subject}{cls.grade ? ` · Lớp ${cls.grade}` : ''}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {sentMsg && (
                <div className={cn('text-sm px-3 py-2 rounded-lg',
                  sentMsg.startsWith('✓') ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400')}>
                  {sentMsg}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setSendDialogOpen(false)} className="btn-ghost flex-1 py-2 text-sm">Hủy</button>
                <button
                  onClick={handleSendToClass}
                  disabled={sending || !sendClassId || !sendTitle.trim()}
                  className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1.5">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Gửi bài tập
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}