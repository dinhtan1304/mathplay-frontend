'use client'
// VANILLA — Sticky sidebar nav + main content stream like a reading app
import { useState, useEffect, useRef } from 'react'
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, ArrowRight, User, BookOpen, FileText, Calendar, MessageCircle } from 'lucide-react'

type SectionId = 'about' | 'courses' | 'exams' | 'quizzes' | 'schedule' | 'contact'

export default function VanillaTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes
  const [active, setActive] = useState<SectionId>('about')
  const contentRef = useRef<HTMLDivElement>(null)

  const navItems: { id: SectionId; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'about', label: 'Giới thiệu', icon: <User className="w-4 h-4" />, show: true },
    { id: 'courses', label: 'Khóa học', icon: <BookOpen className="w-4 h-4" />, show: !!(sections.courses && courses.length > 0) },
    { id: 'exams', label: 'Bộ đề', icon: <FileText className="w-4 h-4" />, show: !!(sections.exams && exams.length > 0) },
    { id: 'quizzes', label: 'Quiz', icon: <Gamepad2 className="w-4 h-4" />, show: !!(sections.quizzes && allQuizzes.length > 0) },
    { id: 'schedule', label: 'Lịch học', icon: <Calendar className="w-4 h-4" />, show: !!(sections.schedule && schedule.length > 0) },
    { id: 'contact', label: 'Liên hệ', icon: <MessageCircle className="w-4 h-4" />, show: !!sections.contact },
  ].filter(n => n.show)

  const scrollTo = (id: SectionId) => {
    setActive(id)
    const el = document.getElementById(`section-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActive(entry.target.id.replace('section-', '') as SectionId)
        }
      }
    }, { rootMargin: '-40% 0px -50% 0px' })
    navItems.forEach(n => {
      const el = document.getElementById(`section-${n.id}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen font-sans" style={{ background: '#fefce8', color: '#713f12' }}>
      <div className="max-w-5xl mx-auto flex">

        {/* ── STICKY SIDEBAR ── */}
        <aside className="hidden md:flex flex-col gap-1 sticky top-0 h-screen w-52 shrink-0 py-8 pr-4 pl-5 overflow-y-auto">
          {/* Teacher mini card */}
          <div className="mb-6 text-center">
            {teacher.avatar ? (
              <img src={teacher.avatar} alt={teacher.name}
                className="w-14 h-14 rounded-full object-cover mx-auto mb-2"
                style={{ border: `2px solid ${p}30` }} />
            ) : (
              <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-white text-lg"
                style={{ background: p }}>{teacher.name.charAt(0)}</div>
            )}
            <p className="font-bold text-amber-900 text-sm leading-tight">{teacher.name}</p>
            <p className="text-xs mt-0.5" style={{ color: p }}>{teacher.subject}</p>
          </div>

          <div className="w-full h-px bg-amber-200 mb-3" />

          {navItems.map(n => (
            <button key={n.id} onClick={() => scrollTo(n.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-medium text-left transition w-full"
              style={active === n.id
                ? { background: `${p}15`, color: p, fontWeight: 700 }
                : { color: '#92400e', background: 'transparent' }}>
              <span style={{ color: active === n.id ? p : '#d97706' }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main ref={contentRef} className="flex-1 min-w-0 px-5 sm:px-8 py-10 space-y-16">

          {/* About */}
          <section id="section-about">
            <div className="flex items-start gap-5 mb-6">
              {teacher.avatar ? (
                <img src={teacher.avatar} alt={teacher.name}
                  className="w-20 h-20 rounded-2xl object-cover md:hidden shrink-0"
                  style={{ border: `3px solid ${p}30` }} />
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white md:hidden shrink-0"
                  style={{ background: p }}>{teacher.name.charAt(0)}</div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] mb-1" style={{ color: p }}>{teacher.subject}</p>
                <h1 className="text-3xl font-extrabold text-amber-900 leading-tight">{teacher.name}</h1>
                <p className="text-amber-700 text-sm mt-1">{teacher.school}</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6" style={{ border: '1px solid #fef08a' }}>
              <p className="text-amber-800 leading-relaxed italic text-base mb-4">&ldquo;{teacher.tagline}&rdquo;</p>
              {teacher.bio && <p className="text-amber-700 leading-relaxed text-sm">{teacher.bio}</p>}
            </div>
          </section>

          {/* Courses */}
          {sections.courses && courses.length > 0 && (
            <section id="section-courses">
              <h2 className="text-xl font-extrabold text-amber-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full inline-block shrink-0" style={{ background: p }} />
                Khóa học
              </h2>
              <div className="space-y-3">
                {visCourses.map((c, i) => (
                  <div key={i} className="bg-white rounded-3xl p-5 flex gap-4"
                    style={{ border: '1px solid #fef08a' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0"
                      style={{ background: p }}>
                      {c.grade}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-amber-900 mb-1 leading-tight">{c.name}</h3>
                      <p className="text-xs mb-1.5" style={{ color: p }}>{c.schedule}</p>
                      <p className="text-xs text-amber-700 leading-relaxed">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
            </section>
          )}

          {/* Exams */}
          {sections.exams && exams.length > 0 && (
            <section id="section-exams">
              <h2 className="text-xl font-extrabold text-amber-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full inline-block shrink-0" style={{ background: '#f59e0b' }} />
                Bộ đề thi
              </h2>
              <div className="space-y-2">
                {visExams.map((e, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-4"
                    style={{ border: '1px solid #fef08a' }}>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold shrink-0 ${
                      e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-amber-900 text-sm truncate">{e.title}</p>
                      <p className="text-xs text-amber-600 truncate">{e.desc}</p>
                    </div>
                    <span className="text-xs font-mono text-amber-500 shrink-0">{e.date}</span>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
            </section>
          )}

          {/* Quizzes */}
          {sections.quizzes && allQuizzes.length > 0 && (
            <section id="section-quizzes">
              <h2 className="text-xl font-extrabold text-amber-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full inline-block shrink-0" style={{ background: '#f43f5e' }} />
                Quiz luyện tập
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {quizzes.map(q => (
                  <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                    className="group bg-white rounded-3xl p-5 hover:shadow-md transition flex flex-col"
                    style={{ border: '1px solid #fef08a' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0"
                        style={{ background: p }}>
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-amber-900 text-sm truncate">{q.name}</h3>
                        <p className="text-[10px] font-mono text-amber-500">{q.code} · {q.question_count} câu</p>
                      </div>
                    </div>
                    {q.description && <p className="text-xs text-amber-700 line-clamp-2 mb-3 leading-relaxed">{q.description}</p>}
                    <span className="text-xs font-bold flex items-center gap-1 mt-auto group-hover:translate-x-0.5 transition" style={{ color: p }}>
                      Tham gia <ArrowRight className="w-3 h-3" />
                    </span>
                  </a>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
            </section>
          )}

          {/* Schedule */}
          {sections.schedule && schedule.length > 0 && (
            <section id="section-schedule">
              <h2 className="text-xl font-extrabold text-amber-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full inline-block shrink-0" style={{ background: '#a78bfa' }} />
                Lịch dạy
              </h2>
              <div className="bg-white rounded-3xl divide-y divide-amber-100 overflow-hidden"
                style={{ border: '1px solid #fef08a' }}>
                {visSchedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-5 px-5 py-3.5">
                    <span className="font-bold text-sm text-amber-900 w-24 shrink-0">{s.day}</span>
                    <span className="text-xs font-mono shrink-0" style={{ color: p }}>{s.time}</span>
                    <span className="text-xs text-amber-700 flex-1 truncate">{s.subject}</span>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
            </section>
          )}

          {/* Contact */}
          {sections.contact && (
            <section id="section-contact">
              <h2 className="text-xl font-extrabold text-amber-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full inline-block shrink-0" style={{ background: '#22c55e' }} />
                Liên hệ đăng ký
              </h2>
              <div className="bg-white rounded-3xl p-6 space-y-3" style={{ border: '1px solid #fef08a' }}>
                <p className="text-amber-700 text-sm mb-4">Liên hệ để nhận tư vấn và xếp lớp phù hợp</p>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                    style={{ background: p }}>
                    <Mail className="w-4 h-4 shrink-0" /> {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-80"
                    style={{ background: `${p}15`, color: p }}>
                    <Phone className="w-4 h-4 shrink-0" /> {contact.phone}
                  </a>
                )}
                {contact.facebook && (
                  <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-80"
                    style={{ background: `${p}15`, color: p }}>
                    <ExternalLink className="w-4 h-4 shrink-0" /> Facebook
                  </a>
                )}
                {contact.zalo && (
                  <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-80"
                    style={{ background: `${p}15`, color: p }}>
                    <ExternalLink className="w-4 h-4 shrink-0" /> Zalo: {contact.zalo}
                  </a>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
