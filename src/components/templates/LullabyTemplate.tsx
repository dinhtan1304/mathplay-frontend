'use client'
// LULLABY — Horizontal story carousel: snap-scroll cards like Instagram stories
import { useState } from 'react'
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react'

type StoryCard = { id: string; title: string; content: React.ReactNode; accent: string }

export default function LullabyTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes
  const [activeCard, setActiveCard] = useState(0)

  const accentPalette = [p, '#f472b6', '#a78bfa', '#34d399', '#fb923c', '#60a5fa']

  const cards: StoryCard[] = [
    {
      id: 'profile',
      title: 'Giới thiệu',
      accent: p,
      content: (
        <div className="flex flex-col items-center text-center h-full justify-center px-6">
          {teacher.avatar ? (
            <img src={teacher.avatar} alt={teacher.name}
              className="w-24 h-24 rounded-full object-cover mb-4"
              style={{ border: `4px solid ${p}50`, boxShadow: `0 8px 24px ${p}30` }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4"
              style={{ background: `linear-gradient(135deg, ${p}, #c4b5fd)`, boxShadow: `0 8px 24px ${p}30` }}>
              {teacher.name.charAt(0)}
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2 opacity-70">{teacher.subject}</p>
          <h2 className="text-2xl font-extrabold mb-1 leading-tight">{teacher.name}</h2>
          <p className="text-xs opacity-70 mb-4">{teacher.school}</p>
          <p className="text-sm leading-relaxed opacity-85 italic">&ldquo;{teacher.tagline}&rdquo;</p>
        </div>
      ),
    },
    ...(sections.courses && courses.length > 0 ? visCourses.map((c, i) => ({
      id: `course-${i}`,
      title: c.name,
      accent: accentPalette[i % accentPalette.length],
      content: (
        <div className="flex flex-col h-full px-7 py-8 justify-between">
          <div>
            <span className="text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block"
              style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}>
              📚 Lớp {c.grade}
            </span>
            <h2 className="text-xl font-extrabold leading-tight mb-3">{c.name}</h2>
            <p className="text-sm opacity-90 leading-relaxed">{c.desc}</p>
          </div>
          <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
            <p className="text-xs font-bold opacity-70 mb-1">Lịch học</p>
            <p className="text-sm font-semibold">{c.schedule}</p>
          </div>
        </div>
      ),
    })) : []),
    ...(sections.exams && exams.length > 0 ? [{
      id: 'exams',
      title: 'Bộ đề thi',
      accent: '#fb923c',
      content: (
        <div className="flex flex-col h-full px-7 py-8">
          <h2 className="text-xl font-extrabold mb-4">📝 Bộ đề</h2>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {visExams.map((e, i) => (
              <div key={i} className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    e.difficulty === 'easy' ? 'bg-green-400/30 text-green-100' :
                    e.difficulty === 'hard' ? 'bg-red-400/30 text-red-100' : 'bg-white/30 text-white'
                  }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                  <span className="text-[10px] opacity-70 font-mono">{e.date}</span>
                </div>
                <p className="text-sm font-semibold leading-tight">{e.title}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    }] : []),
    ...(sections.quizzes && allQuizzes.length > 0 ? quizzes.map((q, i) => ({
      id: `quiz-${q.code}`,
      title: q.name,
      accent: accentPalette[(i + 2) % accentPalette.length],
      content: (
        <a href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
          className="flex flex-col h-full px-7 py-8 justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/25 mb-4">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold leading-tight mb-3">{q.name}</h2>
            {q.description && <p className="text-sm opacity-85 leading-relaxed line-clamp-3">{q.description}</p>}
          </div>
          <div className="bg-white/25 rounded-2xl px-5 py-3 text-center font-bold text-sm backdrop-blur-sm">
            🎮 {q.question_count} câu · Tham gia ngay →
          </div>
        </a>
      ),
    })) : []),
    ...(sections.schedule && schedule.length > 0 ? [{
      id: 'schedule',
      title: 'Lịch dạy',
      accent: '#34d399',
      content: (
        <div className="flex flex-col h-full px-7 py-8">
          <h2 className="text-xl font-extrabold mb-4">🗓 Lịch tuần</h2>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {visSchedule.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/20 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                <div className="text-xs font-bold w-20 shrink-0">{s.day}</div>
                <div className="text-xs font-mono opacity-80">{s.time}</div>
                <div className="text-xs flex-1 truncate opacity-90">{s.subject}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    }] : []),
    ...(sections.contact ? [{
      id: 'contact',
      title: 'Liên hệ',
      accent: '#60a5fa',
      content: (
        <div className="flex flex-col h-full px-7 py-8 justify-center items-center text-center">
          <h2 className="text-xl font-extrabold mb-2">Đăng ký học</h2>
          <p className="text-sm opacity-75 mb-6">Liên hệ ngay để xếp lớp phù hợp</p>
          <div className="space-y-3 w-full max-w-xs">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center justify-center gap-2 bg-white/25 hover:bg-white/35 transition rounded-2xl py-3 text-sm font-medium backdrop-blur-sm">
                <Mail className="w-4 h-4" /> {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center justify-center gap-2 bg-white/25 hover:bg-white/35 transition rounded-2xl py-3 text-sm font-medium backdrop-blur-sm">
                <Phone className="w-4 h-4" /> {contact.phone}
              </a>
            )}
            {contact.facebook && (
              <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white/25 hover:bg-white/35 transition rounded-2xl py-3 text-sm font-medium backdrop-blur-sm">
                <ExternalLink className="w-4 h-4" /> Facebook
              </a>
            )}
            {contact.zalo && (
              <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white/25 hover:bg-white/35 transition rounded-2xl py-3 text-sm font-medium backdrop-blur-sm">
                <ExternalLink className="w-4 h-4" /> Zalo
              </a>
            )}
          </div>
        </div>
      ),
    }] : []),
  ]

  const cur = cards[activeCard]

  return (
    <div className="min-h-screen font-sans flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>

      {/* Story player */}
      <div className="w-full max-w-sm mx-auto px-4 py-8">

        {/* Progress bars */}
        <div className="flex gap-1 mb-3">
          {cards.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full overflow-hidden bg-white/40 cursor-pointer" onClick={() => setActiveCard(i)}>
              <div className="h-full transition-all duration-300 rounded-full"
                style={{ width: i <= activeCard ? '100%' : '0%', background: cur.accent }} />
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden text-white"
          style={{
            minHeight: 480,
            background: `linear-gradient(135deg, ${cur.accent}ee 0%, ${cur.accent}99 100%)`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 24px 64px ${cur.accent}40`,
          }}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.4) 0%, transparent 50%)',
          }} />
          <div className="relative h-full" style={{ minHeight: 480 }}>
            {cur.content}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-5">
          <button onClick={() => setActiveCard(i => Math.max(0, i - 1))}
            disabled={activeCard === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition disabled:opacity-30"
            style={{ background: `${p}20`, color: p }}>
            <ChevronLeft className="w-4 h-4" /> Trước
          </button>
          <span className="text-xs font-mono text-purple-500">{activeCard + 1} / {cards.length}</span>
          <button onClick={() => setActiveCard(i => Math.min(cards.length - 1, i + 1))}
            disabled={activeCard === cards.length - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition disabled:opacity-30"
            style={{ background: `${p}20`, color: p }}>
            Tiếp <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {cards.map((card, i) => (
            <button key={card.id} onClick={() => setActiveCard(i)}
              className="shrink-0 w-12 h-12 rounded-xl overflow-hidden transition"
              style={{
                background: `linear-gradient(135deg, ${card.accent}cc, ${card.accent}88)`,
                ring: i === activeCard ? `2px solid ${card.accent}` : 'none',
                opacity: i === activeCard ? 1 : 0.6,
                transform: i === activeCard ? 'scale(1.1)' : 'scale(1)',
              }}>
              <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold px-1 text-center leading-tight">
                {card.title.slice(0, 6)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* See more links for truncated sections */}
      {slug && (
        <div className="max-w-sm mx-auto px-4 pb-8 space-y-1">
          <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
          <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
          <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
          <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
        </div>
      )}
    </div>
  )
}
