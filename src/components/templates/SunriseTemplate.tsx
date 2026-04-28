'use client'
// SUNRISE — Magazine editorial: large typography hero, featured card, asymmetric columns
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, ArrowRight, Gamepad2 } from 'lucide-react'

export default function SunriseTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const otherCourses = slug ? courses.slice(1, SECTION_THRESHOLDS.courses) : courses.slice(1)
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{ background: '#fff7ed', color: '#431407' }}>

      {/* ── EDITORIAL HERO ── */}
      <div className="relative overflow-hidden">
        {/* Background gradient strip */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${p} 0%, #fbbf24 100%)`, opacity: 0.12 }} />
        <div className="relative max-w-6xl mx-auto px-8 pt-16 pb-12">
          {/* Tag line */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-0.5" style={{ background: p }} />
            <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: p }}>{teacher.subject}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-end">
            <div>
              <h1 className="text-6xl sm:text-7xl font-black leading-none mb-4" style={{
                letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${p} 0%, #b45309 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{teacher.name}</h1>
              <p className="text-xl text-orange-800 font-light mb-6 max-w-md">{teacher.tagline}</p>
              <div className="flex items-center gap-3">
                {teacher.avatar ? (
                  <img src={teacher.avatar} alt={teacher.name} className="w-12 h-12 rounded-full object-cover shadow" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow"
                    style={{ background: p }}>{teacher.name.charAt(0)}</div>
                )}
                <div>
                  <p className="text-sm font-semibold text-orange-900">{teacher.school}</p>
                  <p className="text-xs text-orange-600">Giáo viên {teacher.subject}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-orange-700 leading-relaxed border-l-4 pl-4"
                style={{ borderColor: p }}>{teacher.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURED COURSE (first course, large card) ── */}
      {sections.courses && courses.length > 0 && (
        <div className="max-w-6xl mx-auto px-8 py-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: p }}>Khóa học nổi bật</span>
            <div className="flex-1 h-px bg-orange-200" />
          </div>

          {/* Featured first course */}
          <div className="grid lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-3 p-8 rounded-2xl text-white"
              style={{ background: `linear-gradient(135deg, ${p}, #fbbf24)` }}>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">Lớp {courses[0].grade} · Khóa học</span>
              <h2 className="text-2xl font-extrabold mt-4 mb-2">{courses[0].name}</h2>
              <p className="text-white/80 text-sm mb-4">{courses[0].desc}</p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-white/20 px-3 py-1.5 rounded-full">{courses[0].schedule}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Other courses: vertical list */}
            <div className="lg:col-span-2 space-y-3">
              {otherCourses.map((c, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition flex items-center gap-4 group"
                  style={{ border: `2px solid ${p}15` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${p}80, #fbbf2480)` }}>
                    {c.grade || (i + 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-orange-900 text-sm truncate">{c.name}</h3>
                    <p className="text-xs text-orange-500">{c.schedule}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-orange-300 group-hover:text-orange-500 transition shrink-0" />
                </div>
              ))}
            </div>
          </div>
          <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
        </div>
      )}

      {/* ── EXAMS + SCHEDULE: side by side magazine columns ── */}
      <div className="max-w-6xl mx-auto px-8 pb-10">
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Exams */}
          {sections.exams && exams.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="text-2xl font-black text-orange-200">01</div>
                <div>
                  <p className="text-xs text-orange-400 uppercase tracking-widest">Tài liệu</p>
                  <h2 className="text-xl font-bold text-orange-900">Bộ đề thi</h2>
                </div>
              </div>
              <div className="space-y-3">
                {visExams.map((e, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white shadow-sm"
                    style={{ border: `2px solid ${p}10`, borderLeftColor: p, borderLeftWidth: 4 }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-orange-900 text-sm">{e.title}</h3>
                        <p className="text-xs text-orange-600 mt-0.5">{e.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                        <p className="text-xs text-orange-400 mt-1">{e.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
            </div>
          )}

          {/* Schedule */}
          {sections.schedule && schedule.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="text-2xl font-black text-orange-200">02</div>
                <div>
                  <p className="text-xs text-orange-400 uppercase tracking-widest">Thời gian</p>
                  <h2 className="text-xl font-bold text-orange-900">Lịch dạy</h2>
                </div>
              </div>
              <div className="space-y-2">
                {visSchedule.map((s, i) => (
                  <div key={i} className="flex items-center p-3 rounded-xl bg-white shadow-sm"
                    style={{ border: '2px solid #fed7aa' }}>
                    <div className="w-3 h-3 rounded-full mr-3 shrink-0" style={{ background: p }} />
                    <span className="text-sm font-semibold text-orange-900 w-28 shrink-0">{s.day}</span>
                    <span className="text-sm text-orange-600 flex-1">{s.subject}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: p }}>{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── QUIZZES: editorial card row ── */}
      {sections.quizzes && allQuizzes.length > 0 && (
        <div className="max-w-6xl mx-auto px-8 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-2xl font-black text-orange-200">03</div>
            <div>
              <p className="text-xs text-orange-400 uppercase tracking-widest">Luyện tập</p>
              <h2 className="text-xl font-bold text-orange-900">Quiz tương tác</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map(q => (
              <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                className="group p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition flex flex-col"
                style={{ border: `2px solid ${p}10`, borderTopColor: p, borderTopWidth: 4 }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${p}, #fbbf24)` }}>
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-orange-900 text-sm leading-tight">{q.name}</h3>
                    <p className="text-xs text-orange-500 font-mono mt-0.5">{q.code}</p>
                  </div>
                </div>
                {q.description && <p className="text-xs text-orange-700 line-clamp-2 mb-3">{q.description}</p>}
                <div className="flex items-center justify-between text-xs mt-auto pt-2 border-t border-orange-100">
                  <span className="text-orange-600">{q.question_count} câu hỏi</span>
                  <span className="font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition" style={{ color: p }}>
                    Tham gia <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
        </div>
      )}

      {/* ── CONTACT: full-width warm banner ── */}
      {sections.contact && (
        <div style={{ background: `linear-gradient(90deg, ${p} 0%, #fbbf24 100%)` }}>
          <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h2 className="text-2xl font-extrabold mb-1">Bắt đầu hành trình học tập</h2>
              <p className="text-white/80 text-sm">Liên hệ ngay để nhận tư vấn và chọn lớp phù hợp</p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sm font-bold"
                  style={{ color: p }}>
                  <Mail className="w-4 h-4" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30">
                  <Phone className="w-4 h-4" /> {contact.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
