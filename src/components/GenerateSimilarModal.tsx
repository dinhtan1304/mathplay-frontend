'use client'
import { useEffect, useState } from 'react'
import { questionsApi, generatorExportApi, classesApi, assignmentsApi, generatorApi } from '@/lib/api'
import type { GeneratedQuestion, ClassRoom } from '@/types'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, TYPE_LABELS, cn } from '@/lib/utils'
import { MathText } from '@/lib/math'
import {
  X, Loader2, Sparkles, Plus, Minus, CheckSquare, Square, Pencil, Check,
  ChevronDown, Send, BookmarkPlus, FileDown,
} from 'lucide-react'

export default function GenerateSimilarModal({
  selectedIds, onClose, onSaved,
}: {
  selectedIds: number[]
  onClose: () => void
  onSaved: () => void
}) {
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([])
  const [selectedGen, setSelectedGen] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  // Expand / edit per card
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set())
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<GeneratedQuestion | null>(null)

  // Preview
  const [previewAnswers, setPreviewAnswers] = useState(true)
  const [previewSolutions, setPreviewSolutions] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState<string | null>(null)

  // Send to class
  const [sendOpen, setSendOpen] = useState(false)
  const [sendTitle, setSendTitle] = useState('Đề luyện tập')
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [sendClassId, setSendClassId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [sentMsg, setSentMsg] = useState('')

  const handleGenerate = async () => {
    setGenerating(true); setError(null); setGenerated([]); setSelectedGen(new Set())
    setExpandedSet(new Set()); setEditingIdx(null); setPreviewHtml(''); setPreviewError(null)
    try {
      const result = await questionsApi.generateSimilar(selectedIds, count)
      setGenerated(result)
      setSelectedGen(new Set(result.map((_, i) => i)))
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Không thể sinh câu hỏi. Thử lại sau.')
    } finally {
      setGenerating(false)
    }
  }

  const toggleSelect = (i: number) => {
    setSelectedGen(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })
  }

  const toggleExpand = (i: number) => {
    setExpandedSet(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })
  }

  const startEdit = (i: number) => {
    setEditDraft({ ...generated[i] })
    setEditingIdx(i)
    setExpandedSet(prev => { const s = new Set(prev); s.add(i); return s })
  }

  const cancelEdit = () => { setEditingIdx(null); setEditDraft(null) }

  const saveEdit = (i: number) => {
    if (!editDraft) return
    const next = [...generated]; next[i] = editDraft
    setGenerated(next); setEditingIdx(null); setEditDraft(null)
  }

  const handleSave = async () => {
    const toSave = generated.filter((_, i) => selectedGen.has(i))
    if (!toSave.length) return
    setSaving(true)
    try {
      const qs = toSave.map(q => ({
        question_text: q.question, question_type: q.type, difficulty: q.difficulty,
        grade: q.grade, chapter: q.chapter, lesson_title: q.lesson_title,
        answer: q.answer, solution_steps: JSON.stringify(q.solution_steps || []), is_public: false,
      }))
      const res = await questionsApi.bulkCreate(qs as any)
      setSavedMsg(`✓ Đã lưu ${(res as any).count ?? toSave.length} câu vào ngân hàng`)
      onSaved()
    } catch { setError('Lưu thất bại. Thử lại.') }
    finally { setSaving(false) }
  }

  const buildPayload = (incA = previewAnswers, incS = previewSolutions) => ({
    questions: generated.map(q => ({
      question: q.question || '', type: q.type || 'TN',
      topic: q.topic || q.chapter || '', difficulty: q.difficulty || 'TH',
      answer: q.answer || '', solution_steps: (q.solution_steps || []).map(s => String(s)),
    })),
    title: 'ĐỀ LUYỆN TẬP', subtitle: generated[0]?.chapter || '',
    include_answers: incA, include_solutions: incS, group_by_diff: true,
  })


  const refreshPreview = async (qs = generated, incA = previewAnswers, incS = previewSolutions) => {
    if (!qs.length) return
    setPreviewLoading(true); setPreviewError(null)
    try {
      const payload = {
        questions: qs.map(q => ({
          question: q.question || '', type: q.type || 'TN',
          topic: q.topic || q.chapter || '', difficulty: q.difficulty || 'TH',
          answer: q.answer || '', solution_steps: (q.solution_steps || []).map(s => String(s)),
        })),
        title: 'ĐỀ LUYỆN TẬP', subtitle: qs[0]?.chapter || '',
        include_answers: incA, include_solutions: incS, group_by_diff: true,
      }
      const html = await generatorExportApi.pdf(payload)
      setPreviewHtml(
        html
          .replace(/<div class="print-toolbar">[\s\S]*?<\/div>/, '')
          .replace('</style>', '\n.exam-container{margin:0 auto;padding:24px 28px;}body{background:#fff;}\n</style>')
      )
    } catch (e: any) {
      setPreviewError(e?.response?.data?.detail || e?.message || 'Không thể tải xem trước')
    } finally { setPreviewLoading(false) }
  }

  useEffect(() => {
    if (generated.length) refreshPreview(generated, previewAnswers, previewSolutions)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewAnswers, previewSolutions, generated])

  const handleExport = async (format: 'docx' | 'pdf' | 'latex') => {
    if (!generated.length) return
    setExportLoading(format)
    try {
      if (format === 'pdf') {
        const html = await generatorExportApi.pdf(buildPayload(true, true))
        const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close() }
      } else if (format === 'docx') {
        await generatorExportApi.docx(buildPayload())
      } else {
        await generatorExportApi.latex(buildPayload())
      }
    } catch (e: any) { setError(e?.message || 'Xuất thất bại') }
    finally { setExportLoading(null) }
  }

  const openSend = async () => {
    setSentMsg(''); setSendClassId(null); setSendOpen(true); setClassesLoading(true)
    try { setClasses(await classesApi.list()) } catch { setClasses([]) } finally { setClassesLoading(false) }
  }

  const handleSendToClass = async () => {
    if (!generated.length || !sendClassId) return
    setSending(true)
    try {
      const sanitized = generated.map(q => ({
        ...q,
        question: q.question || '',
        type: q.type || 'TN',
        topic: q.topic || q.chapter || '',
        difficulty: q.difficulty || 'TH',
        chapter: q.chapter || '',
        lesson_title: q.lesson_title || '',
        answer: q.answer || '',
        solution_steps: (q.solution_steps || []).map(s => String(s)),
      }))
      const { exam_id } = await generatorApi.saveAsExam(sendTitle.trim() || 'Đề luyện tập', sanitized)
      await assignmentsApi.create({ class_id: sendClassId, exam_id, title: sendTitle.trim() || 'Đề luyện tập' })
      setSentMsg('✓ Đã gửi vào lớp thành công!')
      setTimeout(() => setSendOpen(false), 1500)
    } catch (e: any) {
      setSentMsg(`⚠ ${e?.response?.data?.detail || 'Gửi thất bại'}`)
    } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <div className="bg-bg-card border border-bg-border rounded-2xl w-full h-full max-w-[1400px] max-h-[95vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-bg-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent" />
            <h2 className="text-base font-semibold text-text">Sinh câu hỏi tương tự</h2>
            <span className="text-xs text-text-dim bg-bg-hover px-2 py-0.5 rounded-full">{selectedIds.length} câu mẫu</span>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text p-1"><X size={18} /></button>
        </div>

        {/* Config */}
        {!generated.length && !generating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            <div className="text-center">
              <p className="text-text-muted text-sm mb-1">Số câu hỏi muốn sinh</p>
              <div className="flex items-center gap-4 justify-center mt-3">
                <button onClick={() => setCount(c => Math.max(1, c - 1))}
                  className="w-10 h-10 rounded-full border border-bg-border flex items-center justify-center hover:bg-bg-hover text-text-dim hover:text-text">
                  <Minus size={16} />
                </button>
                <span className="text-5xl font-bold text-accent w-16 text-center">{count}</span>
                <button onClick={() => setCount(c => Math.min(20, c + 1))}
                  className="w-10 h-10 rounded-full border border-bg-border flex items-center justify-center hover:bg-bg-hover text-text-dim hover:text-text">
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-text-dim text-xs mt-3">Tối đa 20 câu</p>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleGenerate}
              className="flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-xl font-medium text-base hover:bg-accent/90 transition-colors">
              <Sparkles size={16} /> Tạo câu hỏi
            </button>
          </div>
        )}

        {/* Generating */}
        {generating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <Loader2 size={36} className="text-accent animate-spin" />
            <p className="text-text-muted">AI đang sinh {count} câu hỏi tương tự...</p>
            <p className="text-text-dim text-sm">Có thể mất 20-40 giây</p>
          </div>
        )}

        {/* Results */}
        {generated.length > 0 && !generating && (
          <>
            <div className="flex items-center justify-between px-6 py-2 border-b border-bg-border flex-shrink-0">
              <span className="text-sm text-text-muted">
                {generated.length} câu — <span className="text-accent font-medium">{selectedGen.size} đã chọn</span>
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedGen(new Set(generated.map((_, i) => i)))} className="text-xs text-text-dim hover:text-text">Chọn hết</button>
                <button onClick={() => setSelectedGen(new Set())} className="text-xs text-text-dim hover:text-text">Bỏ hết</button>
                <button onClick={() => setExpandedSet(new Set(generated.map((_, i) => i)))} className="text-xs text-text-dim hover:text-text">Mở hết</button>
                <button onClick={() => setExpandedSet(new Set())} className="text-xs text-text-dim hover:text-text">Đóng hết</button>
                <button onClick={() => { setGenerated([]); setError(null); setSavedMsg(null); setPreviewHtml(''); setPreviewError(null) }}
                  className="text-xs text-accent hover:text-accent/80 flex items-center gap-1">
                  <Sparkles size={11} />Tạo lại
                </button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 divide-x divide-bg-border">
              {/* Left: question list */}
              <div className="w-[55%] overflow-y-auto p-3 space-y-2">
                {generated.map((q, i) => {
                  const isEditing = editingIdx === i
                  const isExpanded = expandedSet.has(i)
                  const isSelected = selectedGen.has(i)
                  const draft = isEditing ? editDraft! : q
                  return (
                    <div key={i} className={cn('rounded-xl border transition-colors',
                      isSelected ? 'border-accent' : 'border-bg-border')}>
                      <div className="flex items-start gap-2.5 p-3">
                        <button onClick={() => toggleSelect(i)} className="shrink-0 mt-0.5">
                          {isSelected ? <CheckSquare size={16} className="text-accent" /> : <Square size={16} className="text-text-dim hover:text-text" />}
                        </button>
                        <span className="shrink-0 text-xs font-bold text-text-dim w-5 mt-0.5">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-1.5 mb-1.5 flex-wrap">
                            {isEditing ? (
                              <>
                                <select value={draft.type || 'TN'} onChange={e => setEditDraft(d => d ? { ...d, type: e.target.value } : d)}
                                  className="text-[10px] bg-bg-hover border border-bg-border rounded px-1.5 py-0.5 text-accent">
                                  <option value="TN">TN</option><option value="TL">TL</option>
                                </select>
                                <select value={draft.difficulty || 'TH'} onChange={e => setEditDraft(d => d ? { ...d, difficulty: e.target.value } : d)}
                                  className="text-[10px] bg-bg-hover border border-bg-border rounded px-1.5 py-0.5 text-text-muted">
                                  {['NB','TH','VD','VDC'].map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
                                </select>
                              </>
                            ) : (
                              <>
                                {q.type && <span className="badge bg-accent/10 text-accent text-[10px]">{TYPE_LABELS[q.type] || q.type}</span>}
                                {q.difficulty && <span className={cn('badge text-[10px]', DIFFICULTY_COLORS[q.difficulty])}>{DIFFICULTY_LABELS[q.difficulty] || q.difficulty}</span>}
                                {q.grade && <span className="badge bg-bg-hover text-text-dim text-[10px]">Lớp {q.grade}</span>}
                                {q.chapter && <span className="badge bg-bg-hover text-text-dim text-[10px] max-w-[200px] truncate">{q.chapter}</span>}
                              </>
                            )}
                          </div>
                          {isEditing ? (
                            <textarea value={draft.question} rows={4} className="input text-sm w-full resize-y font-mono"
                              placeholder="Nội dung câu hỏi (dùng $...$ cho LaTeX)"
                              onChange={e => setEditDraft(d => d ? { ...d, question: e.target.value } : d)} />
                          ) : (
                            <div className={cn('text-sm text-text leading-relaxed cursor-pointer', !isExpanded && 'line-clamp-2')}
                              onClick={() => toggleExpand(i)}>
                              <MathText text={q.question} />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(i)} title="Lưu"
                                className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"><Check size={13} /></button>
                              <button onClick={cancelEdit} title="Hủy"
                                className="p-1.5 rounded-lg bg-bg-hover text-text-dim hover:text-text transition-colors"><X size={13} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(i)} title="Chỉnh sửa"
                                className="p-1.5 rounded-lg hover:bg-bg-hover text-text-dim hover:text-accent transition-colors"><Pencil size={13} /></button>
                              <button onClick={() => toggleExpand(i)} title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                                className="p-1.5 rounded-lg hover:bg-bg-hover text-text-dim hover:text-text transition-colors">
                                <ChevronDown size={13} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {(isExpanded || isEditing) && (
                        <div className="px-3 pb-3 space-y-2.5 border-t border-bg-border/50 pt-2.5 ml-[52px]">
                          <div>
                            <div className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1">Đáp án</div>
                            {isEditing ? (
                              <input value={draft.answer || ''} className="input text-sm w-full font-mono"
                                placeholder="Đáp án (dùng $...$ cho LaTeX)"
                                onChange={e => setEditDraft(d => d ? { ...d, answer: e.target.value } : d)} />
                            ) : (
                              <div className="text-sm text-green-400 leading-relaxed"><MathText text={q.answer || '—'} /></div>
                            )}
                          </div>
                          {(isEditing || (q.solution_steps && q.solution_steps.length > 0)) && (
                            <div>
                              <div className="text-[10px] font-semibold text-text-dim uppercase tracking-wider mb-1">Hướng dẫn giải</div>
                              {isEditing ? (
                                <textarea value={(draft.solution_steps || []).join('\n')} rows={5}
                                  className="input text-sm w-full resize-y font-mono"
                                  placeholder="Mỗi bước 1 dòng. Dùng $...$ cho LaTeX"
                                  onChange={e => setEditDraft(d => d ? { ...d, solution_steps: e.target.value.split('\n') } : d)} />
                              ) : (
                                <ol className="space-y-1 list-none">
                                  {q.solution_steps.map((step, si) => (
                                    <li key={si} className="text-sm text-text-muted leading-relaxed flex gap-2">
                                      <span className="text-accent font-bold shrink-0 text-xs mt-0.5">{si + 1}.</span>
                                      <MathText text={step} block />
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Right: PDF preview */}
              <div className="w-[45%] flex flex-col min-h-0">
                <div className="flex items-center gap-3 px-4 py-2 border-b border-bg-border flex-shrink-0">
                  <span className="text-xs font-medium text-text-muted">Xem trước PDF</span>
                  <label className="flex items-center gap-1 text-xs text-text-muted cursor-pointer ml-auto">
                    <input type="checkbox" checked={previewAnswers} onChange={e => setPreviewAnswers(e.target.checked)} className="accent-accent" />Đáp án
                  </label>
                  <label className="flex items-center gap-1 text-xs text-text-muted cursor-pointer">
                    <input type="checkbox" checked={previewSolutions} onChange={e => setPreviewSolutions(e.target.checked)} className="accent-accent" />Lời giải
                  </label>
                </div>
                <div className="flex-1 min-h-0 relative">
                  {previewLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-bg-card/80 z-10">
                      <div className="text-center space-y-2">
                        <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
                        <p className="text-text-dim text-xs">Đang tạo xem trước...</p>
                      </div>
                    </div>
                  )}
                  {previewError && !previewLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                      <p className="text-red-400 text-sm text-center">{previewError}</p>
                      <button onClick={() => refreshPreview()} className="text-xs text-accent hover:underline">Thử lại</button>
                    </div>
                  )}
                  {previewHtml && !previewError
                    ? <iframe srcDoc={previewHtml} className="absolute inset-0 w-full h-full border-0" title="Preview" />
                    : !previewLoading && !previewError && <div className="absolute inset-0 flex items-center justify-center text-text-dim text-sm">Chưa có xem trước</div>
                  }
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-bg-border flex-shrink-0">
              {(error || savedMsg) && (
                <div className={cn('text-xs mb-2 px-3 py-1.5 rounded-lg',
                  error ? 'bg-red-400/10 text-red-400' : 'bg-green-400/10 text-green-400')}>
                  {error || savedMsg}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button onClick={onClose} className="px-3 py-1.5 text-sm text-text-dim hover:text-text border border-bg-border rounded-xl transition-colors">Đóng</button>
                {(['docx','pdf','latex'] as const).map(fmt => (
                  <button key={fmt} onClick={() => handleExport(fmt)} disabled={!!exportLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-bg-border rounded-xl text-text-muted hover:text-text hover:border-accent/50 transition-colors disabled:opacity-50">
                    {exportLoading === fmt ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                    {fmt.toUpperCase()}
                  </button>
                ))}
                <button onClick={openSend}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-accent/10 text-accent border border-accent/30 rounded-xl hover:bg-accent/20 transition-colors">
                  <Send size={13} /> Gửi vào lớp
                </button>
                <button onClick={handleSave} disabled={saving || selectedGen.size === 0 || !!savedMsg}
                  className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <BookmarkPlus size={14} />}
                  Lưu {selectedGen.size} câu
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Send to class sub-dialog */}
      {sendOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setSendOpen(false)}>
          <div className="bg-bg-card border border-bg-border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text">Gửi vào lớp</h3>
              <button onClick={() => setSendOpen(false)} className="text-text-dim hover:text-text"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-dim mb-1 block">Tên bài tập</label>
                <input value={sendTitle} onChange={e => setSendTitle(e.target.value)}
                  placeholder="VD: Đề luyện tập chương 2" className="input text-sm w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-text-dim mb-1 block">Chọn lớp</label>
                {classesLoading
                  ? <div className="text-center py-4"><Loader2 size={18} className="animate-spin text-accent mx-auto" /></div>
                  : classes.length === 0
                    ? <p className="text-sm text-text-muted text-center py-3">Chưa có lớp nào</p>
                    : <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {classes.map(cls => (
                          <button key={cls.id} onClick={() => setSendClassId(cls.id)}
                            className={cn('w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors',
                              sendClassId === cls.id ? 'border-accent bg-accent/10 text-text' : 'border-bg-border bg-bg-hover text-text-muted hover:text-text')}>
                            <div className="font-medium">{cls.name}</div>
                            {(cls.subject || cls.grade) && <div className="text-xs text-text-dim">{cls.subject}{cls.grade ? ` · Lớp ${cls.grade}` : ''}</div>}
                          </button>
                        ))}
                      </div>
                }
              </div>
              {sentMsg && (
                <div className={cn('text-sm px-3 py-2 rounded-lg', sentMsg.startsWith('✓') ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400')}>
                  {sentMsg}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setSendOpen(false)} className="flex-1 py-2 text-sm border border-bg-border rounded-xl text-text-dim hover:text-text transition-colors">Hủy</button>
                <button onClick={handleSendToClass} disabled={sending || !sendClassId || !sendTitle.trim()}
                  className="flex-1 py-2 text-sm bg-accent text-white rounded-xl font-medium flex items-center justify-center gap-1.5 hover:bg-accent/90 disabled:opacity-50 transition-colors">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
