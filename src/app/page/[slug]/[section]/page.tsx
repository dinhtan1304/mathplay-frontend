'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { pagesApi, fetchQuizBatch, getErrorMessage } from '@/lib/api'
import type { TeacherPageData, PageConfig, QuizDisplayInfo } from '@/lib/templates'
import { getTemplateComponent } from '@/components/templates'
import { Loader2, AlertCircle } from 'lucide-react'

type SectionKey = 'courses' | 'exams' | 'quiz' | 'schedule'

export default function SubPage() {
  const params = useParams<{ slug: string; section: string }>()
  const slug = params.slug
  const section = params.section as SectionKey

  const [page, setPage] = useState<TeacherPageData | null>(null)
  const [quizInfo, setQuizInfo] = useState<QuizDisplayInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    pagesApi.getPublic(slug)
      .then(async data => {
        setPage(data)
        const codes = data.config.quiz_codes ?? []
        if (codes.length > 0) {
          try { setQuizInfo(await fetchQuizBatch(codes)) } catch { /* ignore */ }
        }
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [slug, section])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  const validSections: SectionKey[] = ['courses', 'exams', 'quiz', 'schedule']
  if (error || !page || !validSections.includes(section)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4 opacity-60" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy trang</h1>
          <p className="text-gray-500 text-sm mb-6">{error || 'Trang này không tồn tại.'}</p>
          <Link href={`/page/${slug}`} className="text-indigo-600 text-sm hover:underline">← Về trang chính</Link>
        </div>
      </div>
    )
  }

  const { config } = page
  const allQuizzes = quizInfo.filter(q => !q.not_found)

  const modifiedConfig: PageConfig = {
    ...config,
    sections: {
      courses: section === 'courses',
      exams: section === 'exams',
      quizzes: section === 'quiz',
      schedule: section === 'schedule',
      contact: false,
    },
  }

  const TemplateComponent = getTemplateComponent(page.template_id)

  return (
    <TemplateComponent
      config={modifiedConfig}
      quizInfo={allQuizzes}
      isPreview={false}
    />
  )
}
