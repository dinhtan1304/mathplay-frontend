'use client'
// ORIGAMI — Geometric clipped panels, diagonal cuts, folded-paper aesthetic
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, ArrowRight } from 'lucide-react'

export default function OrigamiTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{ background: '#ecfdf5', color: '#064e3b' }}>

      {/* ── HERO: diagonal clip panel ── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${p} 0%, #34d399 100%)` }}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 20px)',
        }} />
        <div className="relative max-w-5xl mx-auto px-8 pt-16 pb-24 flex flex-col sm:flex-row items-center gap-8">
          {teacher.avatar ? (
            <img src={teacher.avatar} alt={teacher.name}
              className="w-28 h-28 object-cover shrink-0"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }} />
          ) : (
            <div className="w-28 h-28 flex items-center justify-center text-4xl font-extrabold text-white shrink-0"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', background: 'rgba(255,255,255,0.25)' }}>
              {teacher.name.charAt(0)}
            </div>
          )}
          <div className="text-white">
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-[0.3em] mb-1">{teacher.subject}</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-2">{teacher.name}</h1>
            <p className="text-emerald-100 text-sm mb-3">{teacher.school}</p>
            <p className="text-white/80 max-w-lg leading-relaxed">{teacher.tagline}</p>
          </div>
        </div>
        {/* Diagonal fold */}
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{
          background: '#ecfdf5',
          clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
        }} />
      </div>

      {/* ── COURSES: diamond-clipped cards ── */}
      {sections.courses && courses.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-4 h-4 rotate-45 shrink-0" style={{ background: p }} />
            <h2 className="text-2xl font-extrabold text-emerald-900">Khóa học</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visCourses.map((c, i) => (
              <div key={i} className="relative bg-white overflow-hidden"
                style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))', boxShadow: '0 4px 20px rgba(5,150,105,0.1)' }}>
                <div className="absolute top-0 right-0 w-8 h-8" style={{ background: `${p}30` }} />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 text-white"
                      style={{ background: p, clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>
                      Lớp {c.grade}
                    </span>
                  </div>
                  <h3 className="font-bold text-emerald-900 mb-1 leading-tight">{c.name}</h3>
                  <p className="text-xs mb-2" style={{ color: p }}>{c.schedule}</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
        </div>
      )}

      {/* ── EXAMS + SCHEDULE: parallelogram rows ── */}
      <div className="py-8" style={{ background: 'white' }}>
        {/* Diagonal top edge */}
        <div className="h-8 -mt-8" style={{ background: 'white', clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10">
            {sections.exams && exams.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-4 h-4 rotate-45 shrink-0" style={{ background: '#f59e0b' }} />
                  <h2 className="text-xl font-extrabold text-emerald-900">Bộ đề thi</h2>
                </div>
                <div className="space-y-2">
                  {visExams.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-3"
                      style={{ background: '#ecfdf5', clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
                      <span className={`text-xs px-2 py-0.5 font-bold shrink-0 ${
                        e.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        e.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-900 truncate">{e.title}</p>
                        <p className="text-xs text-emerald-600 truncate">{e.desc}</p>
                      </div>
                      <span className="text-xs font-mono text-emerald-500 shrink-0">{e.date}</span>
                    </div>
                  ))}
                </div>
                <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
              </div>
            )}

            {sections.schedule && schedule.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-4 h-4 rotate-45 shrink-0" style={{ background: '#a78bfa' }} />
                  <h2 className="text-xl font-extrabold text-emerald-900">Lịch dạy</h2>
                </div>
                <div className="space-y-2">
                  {visSchedule.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 p-3"
                      style={{ background: '#f5f3ff', clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}>
                      <div className="w-2 h-2 rotate-45 shrink-0" style={{ background: p }} />
                      <span className="font-bold text-sm text-emerald-900 w-20 shrink-0">{s.day}</span>
                      <span className="text-xs font-mono" style={{ color: p }}>{s.time}</span>
                      <span className="text-xs text-emerald-700 flex-1 truncate">{s.subject}</span>
                    </div>
                  ))}
                </div>
                <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
              </div>
            )}
          </div>
        </div>
        <div className="h-8 mt-8" style={{ background: '#ecfdf5', clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />
      </div>

      {/* ── QUIZZES: origami-fold cards ── */}
      {sections.quizzes && allQuizzes.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-4 h-4 rotate-45 shrink-0" style={{ background: '#f43f5e' }} />
            <h2 className="text-xl font-extrabold text-emerald-900">Quiz luyện tập</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map(q => (
              <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                className="group bg-white p-5 block hover:shadow-lg transition"
                style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 flex items-center justify-center text-white shrink-0"
                    style={{ background: p, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-emerald-900 text-sm leading-tight">{q.name}</h3>
                    <p className="text-xs text-emerald-500 font-mono mt-0.5">{q.code} · {q.question_count} câu</p>
                  </div>
                </div>
                {q.description && <p className="text-xs text-emerald-700 line-clamp-2 mb-3 leading-relaxed">{q.description}</p>}
                <span className="text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition" style={{ color: p }}>
                  Tham gia <ArrowRight className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
        </div>
      )}

      {/* ── CONTACT: angular card ── */}
      {sections.contact && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="p-8 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${p}, #34d399)`, clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)' }}>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 20px)',
            }} />
            <h2 className="text-2xl font-extrabold mb-2 relative">Đăng ký học ngay</h2>
            <p className="text-emerald-100 mb-5 relative text-sm">Liên hệ để nhận tư vấn miễn phí và xếp lớp phù hợp</p>
            <div className="flex flex-wrap gap-3 relative">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition px-4 py-2 text-white text-sm font-medium">
                  <Mail className="w-4 h-4" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition px-4 py-2 text-white text-sm font-medium">
                  <Phone className="w-4 h-4" /> {contact.phone}
                </a>
              )}
              {contact.facebook && (
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition px-4 py-2 text-white text-sm font-medium">
                  <ExternalLink className="w-4 h-4" /> Facebook
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
