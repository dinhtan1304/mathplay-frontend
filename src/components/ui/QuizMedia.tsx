'use client'
import type { MediaObject } from '@/types'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/** Domains that need proxying (CORS / redirect issues with <audio>/<img>) */
const PROXY_DOMAINS = [
  'drive.google.com',
  'drive.usercontent.google.com',
  'docs.google.com',
  'dropbox.com',
  'www.dropbox.com',
  'dl.dropboxusercontent.com',
]

function needsProxy(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return PROXY_DOMAINS.some(d => host === d || host.endsWith('.' + d))
  } catch {
    return false
  }
}

function resolveUrl(url: string): string {
  if (url.startsWith('/media/')) return `${API_URL}${url}`
  if (needsProxy(url)) {
    return `${API_URL}/api/v1/media/proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

interface QuizMediaProps {
  media: MediaObject | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

export function QuizMedia({ media, size = 'md', className }: QuizMediaProps) {
  if (!media) return null

  // Normalise: backend returns plain JSON object, not a class instance
  const type = (media as { type?: string }).type
  const url = (media as { url?: string }).url
  const alt = (media as { alt?: string }).alt

  if (!url || !type) return null

  const src = resolveUrl(url)

  if (type === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        className={cn(
          'rounded-lg border border-bg-border object-contain',
          size === 'sm' ? 'max-h-24' : 'max-h-64',
          className,
        )}
      />
    )
  }

  if (type === 'audio') {
    return (
      <div className={cn('w-full max-w-md', className)}>
        <audio
          controls
          preload="metadata"
          src={src}
          className="w-full"
        />
      </div>
    )
  }

  return null
}
