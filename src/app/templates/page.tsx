'use client'
import { useState } from 'react'
import Link from 'next/link'
import { TEMPLATES } from '@/lib/templates'
import type { TemplateMetadata } from '@/lib/templates'
import { useAuth } from '@/lib/auth'
import { Sparkles, Search, ArrowRight, Eye, Layout, LayoutGrid } from 'lucide-react'

const FILTER_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Sáng', value: 'light' },
  { label: 'Tối', value: 'dark' },
  { label: 'Màu sắc', value: 'colorful' },
]

function TemplatePreviewCard({ meta }: { meta: TemplateMetadata }) {
  return (
    <div className="group rounded-2xl overflow-hidden border-2 border-transparent hover:border-indigo-500/50 transition-all duration-300 bg-bg-card shadow-sm hover:shadow-xl hover:shadow-indigo-500/10">
      {/* Visual preview */}
      <div className="h-48 relative overflow-hidden" style={{ background: meta.previewBg }}>
        {/* Mini template mockup */}
        <div className="absolute inset-0 p-4 flex flex-col gap-2 opacity-90">
          {/* Header bar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex-shrink-0"
              style={{ background: meta.previewAccent }} />
            <div className="flex-1 space-y-1">
              <div className="h-2 rounded-full w-3/4" style={{ background: meta.previewAccent, opacity: 0.8 }} />
              <div className="h-1.5 rounded-full w-1/2" style={{ background: meta.previewAccent, opacity: 0.4 }} />
            </div>
          </div>
          {/* Content rows */}
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-10 rounded-lg" style={{ background: meta.previewAccent, opacity: 0.12 + i * 0.04 }} />
            ))}
          </div>
          <div className="space-y-1 mt-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-1.5 rounded-full" style={{ background: meta.previewAccent, opacity: 0.2, width: `${85 - i * 12}%` }} />
            ))}
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <Link href={`/templates/${meta.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition"
            style={{ background: meta.previewAccent }}>
            <Eye className="w-4 h-4" /> Xem & tùy chỉnh
          </Link>
        </div>

        {/* Theme badge */}
        <div className="absolute top-3 right-3">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: meta.theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
              color: meta.theme === 'dark' ? '#e2e8f0' : '#1e293b',
            }}>
            {meta.theme === 'light' ? '☀️ Sáng' : meta.theme === 'dark' ? '🌙 Tối' : '🌈 Màu'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-bold text-text-default">{meta.name}</h3>
          <Link href={`/templates/${meta.id}`}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-accent-primary hover:text-accent-hover">
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <p className="text-sm text-text-muted mb-3 leading-relaxed">{meta.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {meta.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-bg-hover text-text-dim">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'light' | 'dark' | 'colorful'>('all')

  const filtered = TEMPLATES.filter(t => {
    const matchTheme = filter === 'all' || t.theme === filter
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    return matchTheme && matchSearch
  })

  return (
    <div className="min-h-screen" style={{ background: '#0a0c10' }}>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 60%)',
        borderBottom: '1px solid #1c2030',
      }}>
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Sparkles className="w-4 h-4" />
            Dành riêng cho giáo viên
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text-default mb-4 leading-tight">
            Tạo trang giới thiệu<br />
            <span style={{ background: 'linear-gradient(90deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              khóa học đẹp mắt
            </span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-8">
            Chọn 1 trong 10 template đẹp, tùy chỉnh thông tin của bạn và chia sẻ link cho học sinh & phụ huynh trong vài phút.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-sm mb-6">
            {[['20', 'Template'], ['100%', 'Miễn phí'], ['∞', 'Tùy chỉnh']].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-text-default">{val}</p>
                <p className="text-text-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* My Pages CTA for logged-in users */}
          {user && (
            <Link href="/dashboard/pages"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition hover:opacity-90"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
              <LayoutGrid className="w-4 h-4" /> Quản lý trang của tôi
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="text"
              placeholder="Tìm kiếm template..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-text-default placeholder:text-text-dim focus:outline-none focus:ring-2"
              style={{ background: '#11141c', border: '1px solid #1c2030' }}
            />
          </div>

          {/* Theme filter */}
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-text-dim" />
            <div className="flex gap-1">
              {FILTER_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setFilter(opt.value as typeof filter)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  style={filter === opt.value
                    ? { background: '#6366f1', color: 'white' }
                    : { background: '#11141c', color: '#94a3b8', border: '1px solid #1c2030' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-text-dim mt-4">
          Hiển thị {filtered.length} / {TEMPLATES.length} template
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg mb-2">Không tìm thấy template phù hợp</p>
            <button onClick={() => { setSearch(''); setFilter('all') }}
              className="text-sm text-accent-primary hover:underline">Xem tất cả</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(meta => (
              <TemplatePreviewCard key={meta.id} meta={meta} />
            ))}
          </div>
        )}
      </div>

      {/* CTA bottom */}
      <div className="border-t text-center py-16 px-6" style={{ borderColor: '#1c2030' }}>
        {user ? (
          <div>
            <p className="text-text-muted text-sm mb-4">Xem và chỉnh sửa các trang bạn đã tạo</p>
            <Link href="/dashboard/pages"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
              <LayoutGrid className="w-4 h-4" /> Trang của tôi
            </Link>
          </div>
        ) : (
          <p className="text-text-muted text-sm">
            Đã có trang giới thiệu?{' '}
            <Link href="/login" className="text-accent-primary hover:underline font-medium">Đăng nhập</Link>
            {' '}để quản lý trang của bạn.
          </p>
        )}
      </div>
    </div>
  )
}
