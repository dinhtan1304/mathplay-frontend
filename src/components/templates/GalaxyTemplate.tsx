'use client'
// GALAXY — Fixed sticky sidebar + scrollable main content
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Star, BookOpen, FileText, Calendar, User, Gamepad2, ArrowRight } from 'lucide-react'

export default function GalaxyTemplate({ config, quizInfo, isPreview, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  const navItems = [
    sections.courses && courses.length > 0 && { label: 'Khóa học', icon: <BookOpen className="w-3.5 h-3.5" />, href: '#courses' },
    sections.exams && exams.length > 0 && { label: 'Bộ đề', icon: <FileText className="w-3.5 h-3.5" />, href: '#exams' },
    sections.quizzes && allQuizzes.length > 0 && { label: 'Quiz', icon: <Gamepad2 className="w-3.5 h-3.5" />, href: '#quizzes' },
    sections.schedule && schedule.length > 0 && { label: 'Lịch dạy', icon: <Calendar className="w-3.5 h-3.5" />, href: '#schedule' },
    sections.contact && { label: 'Liên hệ', icon: <User className="w-3.5 h-3.5" />, href: '#contact' },
  ].filter(Boolean)

  return (
    <div className="flex min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0f0a2e 0%, #1a0845 100%)', color: '#e2e8f0', fontFamily: 'sans-serif' }}>

      {/* ── STICKY SIDEBAR ── */}
      <aside className={`${isPreview ? 'w-56' : 'w-72'} shrink-0 flex flex-col`}
        style={{
          position: isPreview ? 'relative' : 'sticky',
          top: 0, height: isPreview ? 'auto' : '100vh',
          background: 'rgba(255,255,255,0.04)',
          borderRight: `1px solid ${p}25`,
          backdropFilter: 'blur(12px)',
        }}>

        {/* Profile area */}
        <div className="p-6 flex flex-col items-center text-center border-b" style={{ borderColor: `${p}25` }}>
          {teacher.avatar ? (
            <img src={teacher.avatar} alt={teacher.name}
              className="w-20 h-20 rounded-full object-cover mb-4"
              style={{ boxShadow: `0 0 30px ${p}50`, border: `2px solid ${p}` }} />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4"
              style={{ background: `linear-gradient(135deg, ${p}, #6d28d9)`, boxShadow: `0 0 30px ${p}50` }}>
              {teacher.name.charAt(0)}
            </div>
          )}
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3" style={{ color: p }} fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: p }}>{teacher.subject}</span>
          </div>
          <h1 className="text-lg font-extrabold text-white mb-1">{teacher.name}</h1>
          <p className="text-xs text-purple-300 mb-3">{teacher.school}</p>
          <p className="text-xs text-purple-200/70 leading-relaxed">{teacher.tagline}</p>
        </div>

        {/* Nav */}
        {navItems.length > 0 && (
          <nav className="p-4 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 px-2">Nội dung</p>
            {navItems.map((item) => item && (
              <a key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-200 hover:text-white transition mb-1"
                style={{ ':hover': { background: `${p}20` } } as React.CSSProperties}
                onMouseEnter={e => (e.currentTarget.style.background = `${p}20`)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ color: p }}>{item.icon}</span> {item.label}
              </a>
            ))}
          </nav>
        )}

        {/* Contact in sidebar */}
        <div className="p-4 border-t" style={{ borderColor: `${p}25` }}>
          <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">Liên hệ</p>
          <div className="space-y-2">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-purple-200 hover:text-white truncate">
                <Mail className="w-3 h-3 shrink-0" style={{ color: p }} />
                <span className="truncate">{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-purple-200 hover:text-white">
                <Phone className="w-3 h-3 shrink-0" style={{ color: p }} /> {contact.phone}
              </a>
            )}
            {contact.facebook && (
              <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs hover:text-white" style={{ color: p }}>
                <ExternalLink className="w-3 h-3" /> Facebook
              </a>
            )}
            {contact.zalo && (
              <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs hover:text-white" style={{ color: p }}>
                <ExternalLink className="w-3 h-3" /> Zalo
              </a>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto">
        {/* Bio banner */}
        {teacher.bio && (
          <div className="px-10 py-8 border-b" style={{ borderColor: `${p}20`, background: `${p}08` }}>
            <p className="text-purple-200 text-sm leading-relaxed max-w-2xl">{teacher.bio}</p>
          </div>
        )}

        <div className="px-10 py-8 space-y-14">
          {/* Courses: grid */}
          {sections.courses && courses.length > 0 && (
            <section id="courses">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: p }}>/ Khóa học</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {visCourses.map((c, i) => (
                  <div key={i} className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${p}30`, backdropFilter: 'blur(8px)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{ background: `${p}25`, color: p }}>L{c.grade}</div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{c.name}</h3>
                        <p className="text-xs text-purple-300">{c.schedule}</p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-200/70">{c.desc}</p>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
            </section>
          )}

          {/* Exams: timeline */}
          {sections.exams && exams.length > 0 && (
            <section id="exams">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: p }}>/ Bộ đề thi</h2>
              <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: `${p}40` }} />
                {visExams.map((e, i) => (
                  <div key={i} className="relative mb-5 pl-6">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2"
                      style={{ background: '#0f0a2e', borderColor: p }} />
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${p}20` }}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white text-sm">{e.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          e.difficulty === 'easy' ? 'bg-green-900/50 text-green-300' :
                          e.difficulty === 'hard' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'
                        }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                      </div>
                      <p className="text-xs text-purple-300">{e.desc}</p>
                      <p className="text-xs text-purple-500 mt-1">{e.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
            </section>
          )}

          {/* Quizzes: glowing card grid */}
          {sections.quizzes && allQuizzes.length > 0 && (
            <section id="quizzes">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: p }}>/ Quiz luyện tập</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {quizzes.map(q => (
                  <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                    className="group p-5 rounded-2xl block transition hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${p}40`, backdropFilter: 'blur(8px)', boxShadow: `0 0 0 0 ${p}50`, transition: 'all 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 24px ${p}40`)}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 0 0 ${p}50`)}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${p}25`, color: p }}>
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">{q.name}</h3>
                        <p className="text-xs text-purple-300 font-mono">{q.code} · {q.question_count} câu</p>
                      </div>
                    </div>
                    {q.description && <p className="text-xs text-purple-200/70 mb-3 line-clamp-2">{q.description}</p>}
                    <div className="flex items-center gap-1 text-xs font-bold" style={{ color: p }}>
                      Tham gia ngay <ArrowRight className="w-3 h-3" />
                    </div>
                  </a>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
            </section>
          )}

          {/* Schedule: week grid */}
          {sections.schedule && schedule.length > 0 && (
            <section id="schedule">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: p }}>/ Lịch dạy</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {visSchedule.map((s, i) => (
                  <div key={i} className="p-4 rounded-xl text-center"
                    style={{ background: `${p}12`, border: `1px solid ${p}30` }}>
                    <p className="text-xs font-bold mb-1" style={{ color: p }}>{s.day}</p>
                    <p className="text-xs font-mono text-white mb-1">{s.time}</p>
                    <p className="text-xs text-purple-300">{s.subject}</p>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
