'use client'
// LINEN — Open-book magazine spread: left/right pages with gutter binding, warm beige paper
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, ArrowRight } from 'lucide-react'

export default function LinenTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  const paper = '#fef3c7'
  const paperSoft = '#fef9e7'
  const ink = '#451a03'
  const gutter = '#fde68a'

  return (
    <div className="min-h-screen font-serif" style={{
      background: `linear-gradient(180deg, #fef3c7 0%, #fffbeb 100%)`,
      color: ink,
      backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(180,83,9,0.04) 0%, transparent 50%)',
    }}>

      {/* ── TOP: Title plate ── */}
      <div className="px-6 pt-10 pb-6 max-w-5xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-amber-700 mb-2">— Chapter I —</p>
        <h1 className="text-5xl sm:text-6xl font-black leading-none mb-3" style={{ color: ink, fontFamily: 'Georgia, serif' }}>
          {teacher.name}
        </h1>
        <p className="italic text-amber-800 text-lg mb-2">{teacher.tagline}</p>
        <div className="flex items-center justify-center gap-3 text-sm text-amber-700">
          <span>{teacher.subject}</span>
          <span className="w-1 h-1 rounded-full bg-amber-600" />
          <span>{teacher.school}</span>
        </div>
      </div>

      {/* ── BOOK SPREAD ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="relative rounded-lg overflow-hidden shadow-2xl" style={{
          background: paper,
          boxShadow: '0 30px 60px -20px rgba(120,53,15,0.25), 0 10px 20px rgba(120,53,15,0.1)',
        }}>
          {/* Gutter (center binding) */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 w-6 -translate-x-1/2 pointer-events-none z-10"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${gutter}80 20%, ${gutter} 50%, ${gutter}80 80%, transparent 100%)`,
              boxShadow: 'inset 2px 0 4px rgba(120,53,15,0.15), inset -2px 0 4px rgba(120,53,15,0.15)',
            }} />

          <div className="grid lg:grid-cols-2 relative">

            {/* ─── LEFT PAGE ─── */}
            <div className="px-8 py-10 lg:pr-10" style={{
              borderRight: '1px solid rgba(180,83,9,0.15)',
              backgroundImage: `radial-gradient(circle at 100% 50%, rgba(120,53,15,0.06), transparent 30%)`,
            }}>
              {/* Drop cap + bio */}
              <div className="flex items-start gap-4 mb-8">
                {teacher.avatar ? (
                  <img src={teacher.avatar} alt={teacher.name}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                    style={{ border: `3px double ${p}` }} />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                    style={{ background: p, border: `3px double ${p}` }}>{teacher.name.charAt(0)}</div>
                )}
                <p className="text-sm leading-relaxed text-amber-900">
                  <span className="float-left text-5xl font-black leading-none mr-2 mt-1" style={{ color: p, fontFamily: 'Georgia, serif' }}>
                    {teacher.bio?.charAt(0) ?? 'T'}
                  </span>
                  {teacher.bio?.slice(1) ?? 'Giáo viên tận tâm với nhiều năm kinh nghiệm giảng dạy và truyền cảm hứng cho học sinh.'}
                </p>
              </div>

              {/* Courses as book index */}
              {sections.courses && courses.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-amber-600/30" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: p }}>Khóa học</h2>
                    <div className="flex-1 h-px bg-amber-600/30" />
                  </div>
                  <div className="space-y-2.5">
                    {visCourses.map((c, i) => (
                      <div key={i} className="flex items-baseline gap-2 text-sm">
                        <span className="font-black text-amber-700 w-6">{String(i + 1).padStart(2, '0')}</span>
                        <span className="font-bold text-amber-900">{c.name}</span>
                        <span className="flex-1 border-b border-dotted border-amber-500/50 relative bottom-1" />
                        <span className="text-xs text-amber-700 font-mono">Lớp {c.grade}</span>
                      </div>
                    ))}
                  </div>
                  <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
                  {courses[0] && (
                    <p className="text-xs italic text-amber-700 mt-4 leading-relaxed border-l-2 pl-3"
                      style={{ borderColor: p }}>
                      &ldquo;{courses[0].desc}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Schedule as calendar page */}
              {sections.schedule && schedule.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-amber-600/30" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: p }}>Lịch dạy</h2>
                    <div className="flex-1 h-px bg-amber-600/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {visSchedule.map((s, i) => (
                      <div key={i} className="p-2" style={{ background: paperSoft, border: '1px solid rgba(180,83,9,0.2)' }}>
                        <p className="text-xs font-bold text-amber-900">{s.day}</p>
                        <p className="text-xs font-mono text-amber-700">{s.time}</p>
                        <p className="text-xs text-amber-600 mt-0.5 truncate">{s.subject}</p>
                      </div>
                    ))}
                  </div>
                  <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
                </div>
              )}

              <p className="text-center text-xs text-amber-600 mt-10 italic">— trang I —</p>
            </div>

            {/* ─── RIGHT PAGE ─── */}
            <div className="px-8 py-10 lg:pl-10" style={{
              backgroundImage: `radial-gradient(circle at 0% 50%, rgba(120,53,15,0.06), transparent 30%)`,
            }}>

              {/* Exams as numbered pull quotes */}
              {sections.exams && exams.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-amber-600/30" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: p }}>Bộ đề thi</h2>
                    <div className="flex-1 h-px bg-amber-600/30" />
                  </div>
                  <div className="space-y-3">
                    {visExams.map((e, i) => (
                      <div key={i} className="pl-4 relative" style={{ borderLeft: `3px solid ${p}40` }}>
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xs font-black w-5" style={{ color: p }}>§ {i + 1}</span>
                          <h3 className="font-bold text-amber-900 text-sm flex-1">{e.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            e.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            e.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 'bg-amber-200 text-amber-800'
                          }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                        </div>
                        <p className="text-xs text-amber-700 italic ml-7">{e.desc}</p>
                        <p className="text-[10px] text-amber-600 font-mono ml-7 mt-1">{e.date}</p>
                      </div>
                    ))}
                  </div>
                  <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
                </div>
              )}

              {/* Quizzes as marginalia */}
              {sections.quizzes && allQuizzes.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-amber-600/30" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: p }}>Quiz luyện tập</h2>
                    <div className="flex-1 h-px bg-amber-600/30" />
                  </div>
                  <div className="space-y-2">
                    {quizzes.map(q => (
                      <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                        className="block p-3 transition hover:bg-amber-100/50"
                        style={{ background: paperSoft, border: '1px dashed rgba(180,83,9,0.3)' }}>
                        <div className="flex items-center gap-3">
                          <Gamepad2 className="w-4 h-4 shrink-0" style={{ color: p }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-amber-900 truncate">{q.name}</p>
                            <p className="text-[10px] text-amber-600 font-mono">mã: {q.code} · {q.question_count} câu</p>
                          </div>
                          <ArrowRight className="w-4 h-4 shrink-0" style={{ color: p }} />
                        </div>
                      </a>
                    ))}
                  </div>
                  <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
                </div>
              )}

              {/* Contact as postal card footer */}
              {sections.contact && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-amber-600/30" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: p }}>Thư liên hệ</h2>
                    <div className="flex-1 h-px bg-amber-600/30" />
                  </div>
                  <div className="p-5 relative" style={{
                    background: paperSoft,
                    border: '2px solid rgba(180,83,9,0.3)',
                    boxShadow: 'inset 0 0 20px rgba(180,83,9,0.05)',
                  }}>
                    <div className="absolute -top-1 -right-1 w-12 h-14 flex items-center justify-center text-white text-[10px] font-bold rotate-6"
                      style={{ background: p, clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)' }}>
                      POST
                    </div>
                    <div className="space-y-2 text-sm font-serif">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-amber-900 hover:underline">
                          <Mail className="w-3.5 h-3.5" style={{ color: p }} /> {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-amber-900">
                          <Phone className="w-3.5 h-3.5" style={{ color: p }} /> {contact.phone}
                        </a>
                      )}
                      {contact.facebook && (
                        <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-amber-900 hover:underline">
                          <ExternalLink className="w-3.5 h-3.5" style={{ color: p }} /> Facebook
                        </a>
                      )}
                      {contact.zalo && (
                        <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-amber-900 hover:underline">
                          <ExternalLink className="w-3.5 h-3.5" style={{ color: p }} /> Zalo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-amber-600 mt-10 italic">— trang II —</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
