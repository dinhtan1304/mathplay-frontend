'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { pagesApi, getErrorMessage } from '@/lib/api'
import { TEMPLATES } from '@/lib/templates'
import type { TeacherPageData } from '@/lib/templates'
import {
  Plus, Globe, GlobeLock, Pencil, Trash2, ExternalLink,
  Copy, CheckCircle, Eye, LayoutGrid, AlertCircle, Loader2,
} from 'lucide-react'

function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-sm">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-text text-sm text-center mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-text-muted hover:bg-bg-hover transition border border-bg-border">
            Hủy
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition">
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

function PageCard({ page, onDelete, onTogglePublish }: {
  page: TeacherPageData
  onDelete: (id: number) => void
  onTogglePublish: (id: number, current: boolean) => void
}) {
  const [copied, setCopied] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const meta = TEMPLATES.find(t => t.id === page.template_id)
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/page/${page.slug}`

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggle = async () => {
    setToggling(true)
    try { await onTogglePublish(page.id, page.is_published) }
    finally { setToggling(false) }
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          message={`Xóa trang "${page.slug}"? Hành động này không thể hoàn tác.`}
          onConfirm={() => { setConfirmDelete(false); onDelete(page.id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <div className="card overflow-hidden group hover:border-accent/30 transition-all duration-200">
        {/* Preview strip */}
        <div className="h-24 relative overflow-hidden" style={{ background: meta?.previewBg ?? '#1e2030' }}>
          <div className="absolute inset-0 p-3 flex flex-col gap-1.5 opacity-80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full shrink-0" style={{ background: meta?.previewAccent ?? '#6366f1' }} />
              <div className="space-y-1 flex-1">
                <div className="h-1.5 rounded-full w-3/4" style={{ background: meta?.previewAccent ?? '#6366f1', opacity: 0.7 }} />
                <div className="h-1 rounded-full w-1/2" style={{ background: meta?.previewAccent ?? '#6366f1', opacity: 0.3 }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-6 rounded" style={{ background: meta?.previewAccent ?? '#6366f1', opacity: 0.08 + i * 0.04 }} />
              ))}
            </div>
          </div>

          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              page.is_published
                ? 'bg-emerald-400/15 text-emerald-400'
                : 'bg-slate-500/20 text-slate-400'
            }`}>
              {page.is_published
                ? <><Globe className="w-2.5 h-2.5" /> Published</>
                : <><GlobeLock className="w-2.5 h-2.5" /> Ẩn</>}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text text-sm truncate">{page.config.teacher.name}</h3>
              <p className="text-xs text-text-muted truncate">{page.config.teacher.subject}</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent shrink-0 font-medium">
              {meta?.name ?? page.template_id}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 mb-1">
            <span className="text-[10px] font-mono text-text-dim truncate flex-1">/page/{page.slug}</span>
            <span className="text-[10px] text-text-dim flex items-center gap-1 shrink-0">
              <Eye className="w-3 h-3" /> {page.view_count}
            </span>
          </div>
          <p className="text-[10px] text-text-dim mb-3">Cập nhật: {fmt(page.updated_at)}</p>

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <Link
              href={`/templates/${page.template_id}?pageId=${page.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white flex-1 justify-center transition hover:opacity-90 bg-accent"
            >
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </Link>

            {page.is_published && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs transition hover:bg-bg-hover border border-bg-border text-text-muted">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button onClick={copyLink}
              className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs transition hover:bg-bg-hover border border-bg-border"
              style={{ color: copied ? '#34d399' : undefined }}>
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button onClick={handleToggle} disabled={toggling}
              className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs transition hover:bg-bg-hover border border-bg-border disabled:opacity-50"
              style={{ color: page.is_published ? '#f59e0b' : '#34d399' }}
              title={page.is_published ? 'Ẩn trang' : 'Publish trang'}>
              {toggling
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : page.is_published ? <GlobeLock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            </button>

            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs transition hover:bg-red-400/10 border border-bg-border text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function DashboardPagesPage() {
  const [pages, setPages] = useState<TeacherPageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    pagesApi.listMy()
      .then((data: TeacherPageData[]) => setPages(data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await pagesApi.delete(id)
      setPages(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  const handleTogglePublish = async (id: number, current: boolean) => {
    try {
      const updated = await pagesApi.update(id, { is_published: !current }) as TeacherPageData
      setPages(prev => prev.map(p => p.id === id ? { ...p, is_published: updated.is_published } : p))
    } catch (err) {
      alert(getErrorMessage(err))
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Trang giáo viên</h1>
          <p className="text-text-dim text-sm mt-1">Quản lý các trang giới thiệu khóa học</p>
        </div>
        <Link
          href="/templates"
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={14} /> Tạo trang mới
        </Link>
      </div>

      {/* Stats row */}
      {!loading && pages.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Tổng trang', value: pages.length, color: 'text-accent' },
            { label: 'Đang publish', value: pages.filter(p => p.is_published).length, color: 'text-emerald-400' },
            { label: 'Lượt xem', value: pages.reduce((s, p) => s + p.view_count, 0), color: 'text-sky-400' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
              <div className="text-sm text-text-muted font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-52 skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3 opacity-60" />
          <p className="text-text-muted text-sm">{error}</p>
        </div>
      ) : pages.length === 0 ? (
        /* Empty state */
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <LayoutGrid size={28} className="text-accent opacity-70" />
          </div>
          <h2 className="text-base font-bold text-text mb-2">Chưa có trang nào</h2>
          <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">
            Tạo trang giới thiệu khóa học với template đẹp và chia sẻ link cho học sinh & phụ huynh.
          </p>
          <Link
            href="/templates"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> Chọn template
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <PageCard
              key={page.id}
              page={page}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </div>
      )}
    </div>
  )
}
