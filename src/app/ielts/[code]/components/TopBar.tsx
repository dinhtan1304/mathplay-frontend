'use client'

import { Clock, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IeltsSection } from '@/types'

interface Props {
  candidateName: string
  testName: string
  sectionKind: IeltsSection
  remainingMs: number
  flaggedCount: number
  onSubmit: () => void
}

const SECTION_LABEL: Record<IeltsSection, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
}

function formatMMSS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TopBar({
  candidateName,
  testName,
  sectionKind,
  remainingMs,
  flaggedCount,
  onSubmit,
}: Props) {
  const minutes = remainingMs / 60_000
  const timerTone =
    minutes < 5
      ? 'text-red-500 animate-pulse'
      : minutes < 10
      ? 'text-amber-400 animate-pulse'
      : 'text-text'

  return (
    <header className="sticky top-0 z-30 bg-bg-card border-b border-bg-border">
      <div className="flex items-center justify-between px-4 py-2 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-sm">
            <div className="font-semibold text-text truncate max-w-[180px]">{candidateName}</div>
            <div className="text-xs text-text-dim truncate max-w-[240px]">{testName}</div>
          </div>
          <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">
            {SECTION_LABEL[sectionKind]}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-center">
          <Clock size={18} className={cn('shrink-0', timerTone)} />
          <span className={cn('tabular-nums font-mono text-xl font-bold', timerTone)}>
            {formatMMSS(remainingMs)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {flaggedCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Flag size={14} /> {flaggedCount}
            </span>
          )}
          <button
            type="button"
            onClick={onSubmit}
            className="btn-primary px-4 py-1.5 text-sm"
          >
            Submit
          </button>
        </div>
      </div>
    </header>
  )
}
