'use client'
import { useEffect, useState, useRef } from 'react'
import { chatApi, getErrorMessage } from '@/lib/api'
import type { ChatMessageResponse, ChatContextQuestion } from '@/types'
import { DIFFICULTY_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Send, Loader2, Plus, Trash2, MessageCircle, BookOpen, ChevronDown, GraduationCap,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  context_questions?: ChatContextQuestion[]
}

interface Session {
  id: number
  title: string
  updated_at: string
  message_count: number
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [grade, setGrade] = useState<number | null>(null)
  const [detectedGrade, setDetectedGrade] = useState<number | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    try {
      const list = await chatApi.listSessions()
      setSessions(list)
    } catch {}
  }

  const loadSession = async (sessionId: number) => {
    try {
      const data = await chatApi.getSession(sessionId)
      setActiveSessionId(sessionId)
      setMessages(data.messages.map(m => ({ role: m.role, content: m.content })))
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  const startNewSession = () => {
    setActiveSessionId(null)
    setMessages([])
    setDetectedGrade(null)
    setError('')
  }

  const deleteSession = async (sessionId: number) => {
    try {
      await chatApi.deleteSession(sessionId)
      setSessions(s => s.filter(x => x.id !== sessionId))
      if (activeSessionId === sessionId) startNewSession()
    } catch {}
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    setInput('')
    setError('')
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setSending(true)

    try {
      const res: ChatMessageResponse = await chatApi.sendMessage({
        message: text,
        session_id: activeSessionId,
        grade: grade,
      })

      setActiveSessionId(res.session_id)
      if (res.detected_grade) setDetectedGrade(res.detected_grade)

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.answer,
        context_questions: res.context_questions,
      }
      setMessages(prev => [...prev, assistantMsg])

      // Refresh sessions list
      loadSessions()
    } catch (e) {
      setError(getErrorMessage(e))
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen">
      {/* Session sidebar */}
      <div className={cn(
        'w-72 bg-bg-card border-r border-bg-border flex flex-col flex-shrink-0 transition-all',
        showSidebar ? '' : 'hidden lg:flex'
      )}>
        <div className="p-3 border-b border-bg-border">
          <button onClick={startNewSession}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            <Plus size={14} /> Cuộc trò chuyện mới
          </button>
        </div>

        {/* Grade selector */}
        <div className="px-3 py-2 border-b border-bg-border">
          <div className="text-[10px] uppercase text-text-dim font-semibold mb-1.5">Lớp học sinh</div>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setGrade(null)}
              className={cn('px-2 py-1 rounded text-[11px] font-medium transition-colors',
                !grade ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
              Tự động
            </button>
            {[6,7,8,9,10,11,12].map(g => (
              <button key={g} onClick={() => setGrade(g)}
                className={cn('w-7 h-7 rounded text-[11px] font-medium transition-colors',
                  grade === g ? 'bg-accent text-white' : 'bg-bg-hover text-text-muted hover:text-text')}>
                {g}
              </button>
            ))}
          </div>
          {detectedGrade && !grade && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-accent">
              <GraduationCap size={10} /> Nhận diện: Lớp {detectedGrade}
            </div>
          )}
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-text-dim text-xs">Chưa có cuộc trò chuyện</div>
          ) : sessions.map(s => (
            <div key={s.id}
              className={cn(
                'group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-bg-border/50 transition-colors',
                activeSessionId === s.id ? 'bg-accent/10' : 'hover:bg-bg-hover'
              )}
              onClick={() => loadSession(s.id)}>
              <MessageCircle size={13} className="text-text-dim flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-text truncate">{s.title}</div>
                <div className="text-[10px] text-text-dim">{s.message_count} tin nhắn</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }}
                className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-red-400 transition-all p-1">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={28} className="text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-text mb-1">Gia sư Toán AI</h2>
                <p className="text-text-muted text-sm max-w-md">
                  Hỏi bất kỳ bài toán nào — AI sẽ tìm câu tương tự trong ngân hàng và giải thích từng bước.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {['Giải phương trình bậc hai', 'Tính đạo hàm', 'Chứng minh tam giác đồng dạng'].map(hint => (
                    <button key={hint} onClick={() => setInput(hint)}
                      className="px-3 py-1.5 rounded-full text-xs bg-bg-hover text-text-muted hover:text-text hover:bg-accent/10 transition-colors">
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : '')}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={14} className="text-accent" />
                </div>
              )}
              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-accent text-white rounded-tr-sm'
                  : 'bg-bg-card border border-bg-border rounded-tl-sm'
              )}>
                <div className={cn(
                  'text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user' ? 'text-white' : 'text-text'
                )}>
                  {msg.content}
                </div>

                {/* Context questions */}
                {msg.context_questions && msg.context_questions.length > 0 && (
                  <ContextQuestions questions={msg.context_questions} />
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={14} className="text-accent" />
              </div>
              <div className="bg-bg-card border border-bg-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Đang suy nghĩ...
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center text-red-400 text-sm py-2">{error}</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-bg-border p-4">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi bài toán... (Enter để gửi, Shift+Enter xuống dòng)"
              rows={1}
              className="input flex-1 text-sm resize-none py-3 min-h-[44px] max-h-32"
              style={{ height: 'auto', overflow: 'hidden' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 128) + 'px'
              }}
            />
            <button onClick={handleSend} disabled={sending || !input.trim()}
              className="btn-primary px-4 flex items-center gap-1.5 self-end">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContextQuestions({ questions }: { questions: ChatContextQuestion[] }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="mt-3 pt-2 border-t border-bg-border/30">
      <button onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1 text-[11px] text-text-dim hover:text-accent transition-colors">
        <BookOpen size={10} />
        {questions.length} câu tham khảo từ ngân hàng
        <ChevronDown size={10} className={cn('transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 animate-slide-up">
          {questions.map(q => (
            <div key={q.id} className="text-[11px] bg-bg-hover/50 rounded-lg px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                {q.grade && <span className="text-accent font-medium">Lớp {q.grade}</span>}
                {q.topic && <span className="text-text-dim">{q.topic}</span>}
                {q.difficulty && (
                  <span className="text-text-dim">· {DIFFICULTY_LABELS[q.difficulty] || q.difficulty}</span>
                )}
              </div>
              <div className="text-text-muted line-clamp-2">{q.question_text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}