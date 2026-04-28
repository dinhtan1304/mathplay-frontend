'use client'
// PEARL — Masonry pinterest-style layout: variable-height cards arranged in columns
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, ArrowRight } from 'lucide-react'

export default function PearlTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  const cardBase = 'bg-white rounded-3xl overflow-hidden break-inside-avoid mb-4'
  const softBorder = `border border-slate-100`

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f8fafc', color: '#0f172a' }}>

      {/* ── HERO: full-width banner ── */}
      <div className="relative overflow-hidden px-8 pt-12 pb-16 mb-4"
        style={{ background: `linear-gradient(135deg, ${p}12, #f1f5f9)` }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative max-w-4xl mx-auto flex flex-col sm:flex-row items-start gap-8">
          {teacher.avatar ? (
            <img src={teacher.avatar} alt={teacher.name}
              className="w-20 h-20 rounded-2xl object-cover shrink-0"
              style={{ border: `3px solid ${p}30`, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ background: p, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              {teacher.name.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.3em] mb-1.5" style={{ color: p }}>{teacher.subject}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">{teacher.name}</h1>
            <p className="text-slate-500 text-sm mb-3">{teacher.school}</p>
            <p className="text-slate-700 leading-relaxed max-w-lg">{teacher.tagline}</p>
            {teacher.bio && <p className="text-slate-500 text-sm mt-2 max-w-lg leading-relaxed">{teacher.bio}</p>}
          </div>
        </div>
      </div>

      {/* ── MASONRY GRID ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">

          {/* Contact card — top of first column */}
          {sections.contact && (
            <div className={`${cardBase} ${softBorder} p-5 shadow-sm`}
              style={{ borderTop: `4px solid ${p}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: p }}>Liên hệ</p>
              <div className="space-y-2">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: p }} /> {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-slate-700">
                    <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: p }} /> {contact.phone}
                  </a>
                )}
                {contact.facebook && (
                  <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs hover:underline" style={{ color: p }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Facebook
                  </a>
                )}
                {contact.zalo && (
                  <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs hover:underline" style={{ color: p }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Zalo
                  </a>
                )}
              </div>
              <a href={contact.email ? `mailto:${contact.email}` : '#'}
                className="mt-4 block text-center py-2 rounded-2xl text-xs font-bold text-white transition hover:opacity-90"
                style={{ background: p }}>Đăng ký ngay</a>
            </div>
          )}

          {/* Course cards — one card per course */}
          {sections.courses && visCourses.map((c, i) => (
            <div key={i} className={`${cardBase} ${softBorder} shadow-sm`}>
              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${p}, ${p}60)` }} />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold text-white" style={{ background: p }}>Lớp {c.grade}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5 leading-tight">{c.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{c.schedule}</p>
                <p className="text-xs text-slate-700 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}

          {/* Courses see more */}
          {sections.courses && courses.length > SECTION_THRESHOLDS.courses && slug && (
            <div className={`${cardBase} p-4 shadow-sm`} style={{ border: '1px solid #e2e8f0' }}>
              <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
            </div>
          )}

          {/* Exams card — grouped */}
          {sections.exams && exams.length > 0 && (
            <div className={`${cardBase} ${softBorder} p-5 shadow-sm`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Bộ đề thi</h2>
              </div>
              <div className="space-y-3">
                {visExams.map((e, i) => (
                  <div key={i} className="pb-3 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{e.date}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{e.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{e.desc}</p>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
            </div>
          )}

          {/* Quiz cards — one per quiz */}
          {sections.quizzes && quizzes.map((q, i) => (
            <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
              className={`${cardBase} ${softBorder} p-5 shadow-sm hover:shadow-md transition group block`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0"
                  style={{ background: p }}>
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{q.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{q.code} · {q.question_count} câu</p>
                </div>
              </div>
              {q.description && <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-3">{q.description}</p>}
              <span className="text-xs font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition" style={{ color: p }}>
                Tham gia <ArrowRight className="w-3 h-3" />
              </span>
            </a>
          ))}

          {/* Quiz see more */}
          {sections.quizzes && allQuizzes.length > SECTION_THRESHOLDS.quiz && slug && (
            <div className={`${cardBase} p-4 shadow-sm`} style={{ border: '1px solid #e2e8f0' }}>
              <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
            </div>
          )}

          {/* Schedule card */}
          {sections.schedule && schedule.length > 0 && (
            <div className={`${cardBase} ${softBorder} p-5 shadow-sm`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Lịch dạy</h2>
              </div>
              <div className="space-y-2">
                {visSchedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: `${p}08` }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p }} />
                    <span className="text-xs font-semibold text-slate-800 w-20 shrink-0">{s.day}</span>
                    <span className="text-xs font-mono shrink-0" style={{ color: p }}>{s.time}</span>
                    <span className="text-xs text-slate-600 flex-1 truncate">{s.subject}</span>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
            </div>
          )}

          {/* Tagline card */}
          <div className={`${cardBase} p-6 shadow-sm`}
            style={{ background: `linear-gradient(135deg, ${p}12, ${p}05)`, border: `1px solid ${p}20` }}>
            <p className="text-2xl font-black leading-tight" style={{ color: p }}>&ldquo;</p>
            <p className="text-sm text-slate-700 leading-relaxed italic">{teacher.tagline}</p>
            <p className="text-2xl font-black text-right leading-none mt-1" style={{ color: p }}>&rdquo;</p>
            <p className="text-xs text-slate-500 text-right mt-2">— {teacher.name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
