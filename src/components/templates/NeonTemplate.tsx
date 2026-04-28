'use client'
// NEON — Terminal / console aesthetic: monospace, command-line UI, tabbed sections
import { useState } from 'react'
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Terminal, ChevronRight } from 'lucide-react'

type SectionKey = 'courses' | 'exams' | 'quizzes' | 'schedule' | 'contact'

export default function NeonTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes
  const [activeTab, setActiveTab] = useState<SectionKey>('courses')

  const tabs: { key: SectionKey; label: string; cmd: string }[] = [
    sections.courses && courses.length > 0 && { key: 'courses' as const, label: 'courses/', cmd: 'ls courses/' },
    sections.exams && exams.length > 0 && { key: 'exams' as const, label: 'exams/', cmd: 'cat exams.txt' },
    sections.quizzes && allQuizzes.length > 0 && { key: 'quizzes' as const, label: 'quizzes/', cmd: 'play --list' },
    sections.schedule && schedule.length > 0 && { key: 'schedule' as const, label: 'schedule/', cmd: 'cat schedule.json' },
    sections.contact && { key: 'contact' as const, label: 'contact/', cmd: 'whoami' },
  ].filter(Boolean) as { key: SectionKey; label: string; cmd: string }[]

  return (
    <div className="min-h-screen" style={{ background: '#030712', fontFamily: '"JetBrains Mono", "Courier New", monospace', color: '#22d3ee' }}>

      {/* ── TERMINAL HEADER ── */}
      <div style={{ background: '#0d1117', borderBottom: `1px solid ${p}40` }}>
        {/* Titlebar */}
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #1e293b' }}>
          <div className="flex gap-1.5">
            {['#ef4444', '#fbbf24', '#22c55e'].map(c => (
              <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-slate-400 font-mono">edu-smart — teacher_profile.sh — 80×24</span>
          </div>
          <Terminal className="w-4 h-4 text-slate-500" />
        </div>

        {/* Profile block */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            {teacher.avatar ? (
              <img src={teacher.avatar} alt="" className="w-16 h-16 rounded shrink-0"
                style={{ border: `1px solid ${p}50`, filter: 'grayscale(20%)' }} />
            ) : (
              <div className="w-16 h-16 rounded flex items-center justify-center text-2xl font-bold shrink-0"
                style={{ border: `1px solid ${p}50`, color: p, background: `${p}10` }}>
                {teacher.name.charAt(0)}
              </div>
            )}
            <div className="space-y-1 text-sm">
              <p><span className="text-slate-500">$</span> <span style={{ color: p }}>whoami</span></p>
              <p className="text-white font-bold text-lg">{teacher.name}</p>
              <p><span className="text-slate-500">$</span> <span style={{ color: p }}>echo $SUBJECT</span></p>
              <p className="text-green-400">{teacher.subject}</p>
              <p><span className="text-slate-500">$</span> <span style={{ color: p }}>cat bio.txt</span></p>
              <p className="text-slate-300 text-xs max-w-lg leading-relaxed">{teacher.bio || teacher.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS (like terminal tabs) ── */}
      <div className="flex border-b" style={{ background: '#0d1117', borderColor: `${p}30` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="px-4 py-2.5 text-xs font-mono transition"
            style={activeTab === t.key
              ? { color: p, borderBottom: `2px solid ${p}`, background: `${p}08` }
              : { color: '#64748b', borderBottom: '2px solid transparent' }}>
            <span className="text-slate-600 mr-1">~/</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── TERMINAL CONTENT ── */}
      <div className="px-6 py-6 min-h-[400px]" style={{ background: '#030712' }}>

        {/* Prompt line */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-green-400 font-bold">user@edu-smart</span>
          <span className="text-slate-500">:</span>
          <span style={{ color: p }}>~/{tabs.find(t => t.key === activeTab)?.label ?? ''}</span>
          <span className="text-slate-500">$</span>
          <span className="text-white">{tabs.find(t => t.key === activeTab)?.cmd}</span>
        </div>

        {/* COURSES output */}
        {activeTab === 'courses' && (
          <div className="space-y-1 text-sm font-mono">
            <p className="text-slate-500 text-xs mb-3">total {courses.length} items</p>
            {visCourses.map((c, i) => (
              <div key={i} className="group">
                <div className="flex items-start gap-3 py-2 px-3 rounded hover:bg-white/5 transition">
                  <ChevronRight className="w-3 h-3 mt-1 shrink-0" style={{ color: p }} />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-white font-bold">{c.name}</span>
                      <span className="text-xs" style={{ color: `${p}aa` }}>[lớp {c.grade}]</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{c.schedule} — {c.desc}</p>
                  </div>
                </div>
                {i < visCourses.length - 1 && <div className="border-b mx-3" style={{ borderColor: '#1e293b' }} />}
              </div>
            ))}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span>$</span>
              <span className="inline-block w-2 h-3 animate-pulse" style={{ background: p }} />
            </div>
            <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
          </div>
        )}

        {/* EXAMS output */}
        {activeTab === 'exams' && (
          <div className="font-mono text-sm">
            <p className="text-slate-500 text-xs mb-3"># Danh sách bộ đề — {exams.length} files</p>
            <div className="space-y-3">
              {visExams.map((e, i) => (
                <div key={i} className="p-3 rounded" style={{ background: '#0d1117', border: `1px solid ${p}25` }}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-slate-500">{String(i + 1).padStart(2, '0')}.</span>
                    <span className="text-white">{e.title}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded font-bold ${
                      e.difficulty === 'easy' ? 'text-green-400' :
                      e.difficulty === 'hard' ? 'text-red-400' : 'text-yellow-400'
                    }`} style={{ border: '1px solid currentColor' }}>{DIFFICULTY_LABEL[e.difficulty].toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-6"># {e.desc}</p>
                  <p className="text-xs pl-6 mt-0.5" style={{ color: `${p}80` }}>date: {e.date}</p>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
          </div>
        )}

        {/* QUIZZES output */}
        {activeTab === 'quizzes' && (
          <div className="font-mono text-sm">
            <p className="text-slate-500 text-xs mb-3"># {allQuizzes.length} quiz available — click to play</p>
            <div className="space-y-3">
              {quizzes.map((q, i) => (
                <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                  className="block p-3 rounded transition hover:bg-white/5"
                  style={{ background: '#0d1117', border: `1px solid ${p}25` }}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-slate-500">{String(i + 1).padStart(2, '0')}.</span>
                    <span className="text-white">{q.name}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded font-bold" style={{ color: p, border: `1px solid ${p}` }}>
                      {q.question_count} Q
                    </span>
                  </div>
                  {q.description && <p className="text-xs text-slate-500 pl-6"># {q.description}</p>}
                  <div className="pl-6 mt-1 flex items-center gap-2 text-xs">
                    <span style={{ color: `${p}80` }}>code:</span>
                    <span className="text-green-400">{q.code}</span>
                    <span className="text-slate-500">→</span>
                    <span style={{ color: p }}>./play.sh --start</span>
                  </div>
                </a>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
          </div>
        )}

        {/* SCHEDULE output */}
        {activeTab === 'schedule' && (
          <div className="font-mono text-sm">
            <p className="text-slate-500 text-xs mb-3">&#123;</p>
            <div className="pl-4 space-y-1">
              {visSchedule.map((s, i) => (
                <div key={i}>
                  <span className="text-yellow-300">&quot;{s.day}&quot;</span>
                  <span className="text-white">: &#123;</span>
                  <p className="pl-6 text-xs">
                    <span className="text-blue-300">&quot;time&quot;</span>
                    <span className="text-white">: </span>
                    <span className="text-green-300">&quot;{s.time}&quot;</span>
                    <span className="text-slate-500">,</span>
                  </p>
                  <p className="pl-6 text-xs">
                    <span className="text-blue-300">&quot;subject&quot;</span>
                    <span className="text-white">: </span>
                    <span className="text-green-300">&quot;{s.subject}&quot;</span>
                  </p>
                  <span className="text-white">&#125;{i < visSchedule.length - 1 ? ',' : ''}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-500">&#125;</p>
            <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
          </div>
        )}

        {/* CONTACT output */}
        {activeTab === 'contact' && (
          <div className="font-mono text-sm space-y-2">
            {[
              contact.email && ['EMAIL', contact.email, `mailto:${contact.email}`],
              contact.phone && ['PHONE', contact.phone, `tel:${contact.phone}`],
              contact.facebook && ['FACEBOOK', contact.facebook, contact.facebook],
              contact.zalo && ['ZALO', contact.zalo, `https://zalo.me/${contact.zalo}`],
            ].filter(Boolean).map((row) => row && (
              <div key={row[0]} className="flex items-center gap-4">
                <span className="text-xs w-20 shrink-0" style={{ color: `${p}80` }}>{row[0]}:</span>
                <a href={row[2]} target="_blank" rel="noopener noreferrer"
                  className="text-white hover:underline flex items-center gap-1">
                  {row[1]}
                </a>
              </div>
            ))}
            <div className="mt-6">
              <a href={contact.email ? `mailto:${contact.email}` : '#'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-bold transition"
                style={{ border: `1px solid ${p}`, color: p, background: `${p}15` }}>
                <span style={{ color: p }}>$</span> send_message --to=teacher
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
