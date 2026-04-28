'use client'
import { useCallback, useEffect, useState } from 'react'
import { quizApi, getErrorMessage } from '@/lib/api'
import type { Quiz } from '@/types'
import { cn, formatDateTime } from '@/lib/utils'
import {
  Plus, Search, Loader2, Trash2, Pencil, Eye, Send,
  ChevronLeft, ChevronRight, BookOpen, BarChart3,
  Globe, Lock, Archive, FileText, AlertTriangle, X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp', published: 'Đã xuất bản', archived: 'Lưu trữ',
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'text-yellow-400 bg-yellow-400/10',
  published: 'text-green-400 bg-green-400/10',
  archived: 'text-text-dim bg-bg-hover',
}

const QUIZ_DIFFICULTY: Record<string, string> = {
  easy: 'Dễ', medium: 'Trung bình', hard: 'Khó', expert: 'Chuyên gia',
}

const QUIZ_TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm', checkbox: 'Nhiều đáp án',
  fill_blank: 'Điền chỗ trống', reorder: 'Sắp xếp',
  true_false: 'Đúng/Sai', essay: 'Tự luận',
}

export default function QuizzesPage() {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [creating, setCreating] = useState(false)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{ quiz_name: string; question_count: number; theory_count: number; attempt_count: number; assignment_count: number } | null>(null)
  const [loadingDeleteInfo, setLoadingDeleteInfo] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const pageSize = 12

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await quizApi.list({
        page,
        page_size: pageSize,
        status: statusFilter || undefined,
        search: search || undefined,
      })
      setQuizzes(res.items)
      setTotal(res.total)
    } catch (e) {
      console.error('Load quizzes failed:', e)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => { load() }, [load])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const quiz = await quizApi.create({ name: 'Quiz mới' })
      router.push(`/quizzes/${quiz.id}/edit`)
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setCreating(false)
    }
  }

  const openDeleteModal = async (quiz: Quiz) => {
    setDeleteTarget(quiz)
    setDeleteConfirmText('')
    setDeleteInfo(null)
    setLoadingDeleteInfo(true)
    try {
      const info = await quizApi.getDeleteInfo(quiz.id)
      setDeleteInfo(info)
    } catch (e) {
      setDeleteInfo({ quiz_name: quiz.name, question_count: quiz.question_count, theory_count: 0, attempt_count: 0, assignment_count: 0 })
    } finally {
      setLoadingDeleteInfo(false)
    }
  }

  const closeDeleteModal = () => {
    setDeleteTarget(null)
    setDeleteInfo(null)
    setDeleteConfirmText('')
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await quizApi.delete(deleteTarget.id)
      setQuizzes(prev => prev.filter(q => q.id !== deleteTarget.id))
      setTotal(prev => prev - 1)
      closeDeleteModal()
    } catch (e) {
      alert(getErrorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  const handlePublish = async (quiz: Quiz) => {
    const newStatus = quiz.status === 'published' ? 'draft' : 'published'
    try {
      const updated = await quizApi.update(quiz.id, { status: newStatus } as Partial<Quiz>)
      setQuizzes(prev => prev.map(q => q.id === quiz.id ? updated : q))
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-bg p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Quiz</h1>
            <p className="text-sm text-text-dim mt-1">{total} bộ quiz</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/quizzes/import"
              className="btn-ghost flex items-center gap-2 border border-bg-border text-sm"
            >
              <FileText size={16} /> Import JSON
            </Link>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary flex items-center gap-2"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Tạo Quiz
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm quiz..."
              className="input w-full pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['', 'draft', 'published', 'archived'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm transition-colors',
                  statusFilter === s
                    ? 'bg-primary text-white'
                    : 'bg-bg-card text-text-dim hover:bg-bg-hover border border-bg-border'
                )}
              >
                {s ? STATUS_LABELS[s] : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {/* Quiz Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto text-text-dim mb-4" />
            <p className="text-text-dim">Chưa có quiz nào</p>
            <button onClick={handleCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /> Tạo Quiz đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map(quiz => (
              <div
                key={quiz.id}
                className="bg-bg-card border border-bg-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors group"
              >
                {/* Card Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[quiz.status] || 'text-text-dim bg-bg-hover')}>
                      {STATUS_LABELS[quiz.status] || quiz.status}
                    </span>
                    <span className="text-xs text-text-dim font-mono">{quiz.code}</span>
                  </div>
                  <Link href={`/quizzes/${quiz.id}/edit`} className="block">
                    <h3 className="font-semibold text-text group-hover:text-primary transition-colors line-clamp-2">
                      {quiz.name}
                    </h3>
                  </Link>
                  {quiz.description && (
                    <p className="text-xs text-text-dim mt-1 line-clamp-2">{quiz.description}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="px-4 pb-3 flex items-center gap-4 text-xs text-text-dim">
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {quiz.question_count} câu
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 size={12} />
                    {quiz.total_points} điểm
                  </span>
                  {quiz.visibility === 'public' ? (
                    <span className="flex items-center gap-1"><Globe size={12} /> Công khai</span>
                  ) : (
                    <span className="flex items-center gap-1"><Lock size={12} /> Riêng tư</span>
                  )}
                </div>

                {/* Tags */}
                {quiz.tags.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-1">
                    {quiz.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {tag}
                      </span>
                    ))}
                    {quiz.tags.length > 3 && (
                      <span className="text-[10px] text-text-dim">+{quiz.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-3 border-t border-bg-border flex items-center justify-between">
                  <span className="text-[11px] text-text-dim">{formatDateTime(quiz.created_at)}</span>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/quizzes/${quiz.id}/edit`}
                      className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-text transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Pencil size={13} />
                    </Link>
                    {quiz.status === 'published' ? (
                      <Link
                        href={`/quizzes/${quiz.id}/play`}
                        className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-green-400 transition-colors"
                        title="Xem trước"
                      >
                        <Eye size={13} />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePublish(quiz)}
                        className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim hover:text-green-400 transition-colors"
                        title="Xuất bản"
                      >
                        <Send size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteModal(quiz)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-bg-hover text-text-dim hover:text-red-400"
                      title="Xóa"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-text-dim">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost p-2 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDeleteModal} />
          <div className="relative bg-bg-card border border-bg-border rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text">Xóa quiz</h3>
                  <p className="text-xs text-text-dim mt-0.5 line-clamp-1">{deleteTarget.name}</p>
                </div>
              </div>
              <button onClick={closeDeleteModal} className="w-7 h-7 rounded-lg hover:bg-bg-hover flex items-center justify-center text-text-dim">
                <X size={14} />
              </button>
            </div>

            {loadingDeleteInfo ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-text-dim" />
              </div>
            ) : deleteInfo && (
              <div className="space-y-3">
                <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-3 space-y-1.5 text-sm">
                  <p className="text-text">Hành động này sẽ xóa vĩnh viễn:</p>
                  <ul className="space-y-1 text-text-dim">
                    {deleteInfo.question_count > 0 && (
                      <li className="flex items-center gap-2">
                        <FileText size={12} className="text-red-400 shrink-0" />
                        <span><span className="font-medium text-text">{deleteInfo.question_count}</span> câu hỏi</span>
                      </li>
                    )}
                    {deleteInfo.theory_count > 0 && (
                      <li className="flex items-center gap-2">
                        <BookOpen size={12} className="text-red-400 shrink-0" />
                        <span><span className="font-medium text-text">{deleteInfo.theory_count}</span> bài lý thuyết</span>
                      </li>
                    )}
                    {deleteInfo.attempt_count > 0 && (
                      <li className="flex items-center gap-2">
                        <BarChart3 size={12} className="text-red-400 shrink-0" />
                        <span><span className="font-medium text-text">{deleteInfo.attempt_count}</span> lượt làm bài của học sinh</span>
                      </li>
                    )}
                    {deleteInfo.assignment_count > 0 && (
                      <li className="flex items-center gap-2">
                        <Send size={12} className="text-red-400 shrink-0" />
                        <span><span className="font-medium text-text">{deleteInfo.assignment_count}</span> bài tập sẽ mất liên kết</span>
                      </li>
                    )}
                  </ul>
                </div>

                {deleteInfo.attempt_count > 0 && (
                  <div>
                    <label className="text-xs text-text-dim mb-1.5 block">
                      Gõ <span className="font-semibold text-text">{deleteTarget.name}</span> để xác nhận
                    </label>
                    <input
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      className="input w-full text-sm"
                      placeholder={deleteTarget.name}
                      autoFocus
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={closeDeleteModal} className="btn-ghost text-sm">
                    Hủy
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting || (deleteInfo.attempt_count > 0 && deleteConfirmText !== deleteTarget.name)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                  >
                    {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Xóa vĩnh viễn
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
