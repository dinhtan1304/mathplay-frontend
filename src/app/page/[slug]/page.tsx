'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { pagesApi, fetchQuizBatch, getErrorMessage } from '@/lib/api'
import { getTemplateComponent } from '@/components/templates'
import type { TeacherPageData, QuizDisplayInfo } from '@/lib/templates'
import { Copy, CheckCircle, Share2, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

function ShareBar({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const zaloUrl = `https://zalo.me/share/link?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-xl text-sm"
        style={{ background: 'rgba(17,20,28,0.95)', border: '1px solid #1c2030', backdropFilter: 'blur(8px)' }}>
        <Share2 className="w-4 h-4 text-text-muted" />
        <span className="text-text-dim text-xs hidden sm:inline">Chia sẻ:</span>

        <button onClick={copy}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition"
          style={{ background: copied ? 'rgba(5,150,105,0.2)' : 'rgba(99,102,241,0.2)', color: copied ? '#34d399' : '#818cf8' }}>
          {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Đã copy' : 'Copy link'}
        </button>

        <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
          className="px-2 py-1 rounded-lg text-xs font-medium transition hover:opacity-80"
          style={{ background: 'rgba(24,119,242,0.2)', color: '#6899f4' }}>
          Facebook
        </a>

        <a href={zaloUrl} target="_blank" rel="noopener noreferrer"
          className="px-2 py-1 rounded-lg text-xs font-medium transition hover:opacity-80"
          style={{ background: 'rgba(0,107,201,0.2)', color: '#60a5fa' }}>
          Zalo
        </a>
      </div>
    </div>
  )
}

export default function PublicPage() {
  const params = useParams<{ slug: string }>()
  const [page, setPage] = useState<TeacherPageData | null>(null)
  const [quizInfo, setQuizInfo] = useState<QuizDisplayInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    pagesApi.getPublic(params.slug)
      .then(async data => {
        setPage(data)
        const codes = data.config.quiz_codes ?? []
        if (codes.length > 0) {
          try {
            const infos = await fetchQuizBatch(codes)
            setQuizInfo(infos)
          } catch {/* ignore */}
        }
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [params.slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0c10' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary mx-auto mb-3" />
          <p className="text-text-muted text-sm">Đang tải trang...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0c10' }}>
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-danger-red mx-auto mb-4 opacity-60" />
          <h1 className="text-xl font-bold text-text-default mb-2">Trang không tồn tại</h1>
          <p className="text-text-muted text-sm mb-6">
            {error || 'Trang này chưa được publish hoặc địa chỉ không chính xác.'}
          </p>
          <a href="/templates"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: '#6366f1' }}>
            <ExternalLink className="w-4 h-4" /> Tạo trang của bạn
          </a>
        </div>
      </div>
    )
  }

  const TemplateComponent = getTemplateComponent(page.template_id)
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const pageTitle = `${page.config.teacher.name} — ${page.config.teacher.subject}`

  return (
    <>
      <TemplateComponent config={page.config} quizInfo={quizInfo} isPreview={false} slug={params.slug} />
      <ShareBar title={pageTitle} url={pageUrl} />
    </>
  )
}
