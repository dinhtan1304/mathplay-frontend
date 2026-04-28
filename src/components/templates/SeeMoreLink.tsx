import Link from 'next/link'

export function SeeMoreLink({ slug, section, total, threshold, color }: {
  slug?: string
  section: string
  total: number
  threshold: number
  color?: string
}) {
  if (!slug || total <= threshold) return null
  return (
    <div className="mt-4 text-center">
      <Link
        href={`/page/${slug}/${section}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-100"
        style={{ color: color ?? '#6366f1', opacity: 0.75 }}
      >
        Xem tất cả {total} mục →
      </Link>
    </div>
  )
}
