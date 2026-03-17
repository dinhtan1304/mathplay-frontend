/**
 * MathText — render LaTeX inline ($...$, $$...$$) dùng KaTeX.
 * Dùng cho question_text, options, answer, solution_steps.
 */
'use client'
import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Split text thành mảng: string thường và LaTeX block
function tokenize(text: string): { type: 'text' | 'display' | 'inline'; content: string }[] {
  const tokens: { type: 'text' | 'display' | 'inline'; content: string }[] = []
  // Match $$...$$ trước, rồi $...$
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      tokens.push({ type: 'text', content: text.slice(last, m.index) })
    }
    const raw = m[0]
    if (raw.startsWith('$$')) {
      tokens.push({ type: 'display', content: raw.slice(2, -2) })
    } else {
      tokens.push({ type: 'inline', content: raw.slice(1, -1) })
    }
    last = m.index + raw.length
  }
  if (last < text.length) {
    tokens.push({ type: 'text', content: text.slice(last) })
  }
  return tokens
}

function renderLatex(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      trust: false,
    })
  } catch {
    return tex
  }
}

interface MathTextProps {
  text?: string | null
  className?: string
  block?: boolean // true = dùng div thay span (cho solution steps)
}

export function MathText({ text, className, block = false }: MathTextProps) {
  const html = useMemo(() => {
    if (!text) return ''
    const tokens = tokenize(text)
    return tokens.map(t => {
      if (t.type === 'text') {
        const escaped = t.content
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return escaped
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-[0.9em] font-mono">$1</code>')
          .replace(/\n/g, '<br>')
      }
      if (t.type === 'display') return renderLatex(t.content, true)
      return renderLatex(t.content, false)
    }).join('')
  }, [text])

  if (!text) return null
  const Tag = block ? 'div' : 'span'
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
}