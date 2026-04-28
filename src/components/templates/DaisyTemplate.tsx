'use client'
// DAISY — Vertical timeline diary: date markers on the left rail, content cards on the right
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, BookOpen, FileText, Calendar, Heart } from 'lucide-react'

function TimelineDot({ color }: { color: string }) {
  return (
    <div className="relative shrink-0">
      <div className="w-4 h-4 rounded-full ring-4 ring-yellow-50" style={{ background: color }} />
      <div className="absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-30" style={{ background: color }} />
    </div>
  )
}

export default function DaisyTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{ background: '#fffbeb', color: '#451a03' }}>

      {/* ── HERO: gentle paper card ── */}
      <div className="px-6 pt-12 pb-8 max-w-3xl mx-auto text-center">
        {teacher.avatar ? (
          <img src={teacher.avatar} alt={teacher.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-5"
            style={{ border: `4px solid ${p}40`, boxShadow: `0 8px 24px ${p}20` }} />
        ) : (
          <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${p}, #fbbf24)`, boxShadow: `0 8px 24px ${p}20` }}>
            {teacher.name.charAt(0)}
          </div>
        )}
        <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2" style={{ color: p }}>{teacher.subject}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-900 mb-2">{teacher.name}</h1>
        <p className="text-amber-700 text-sm mb-3">{teacher.school}</p>
        <p className="text-amber-800 italic max-w-md mx-auto leading-relaxed">&ldquo;{teacher.tagline}&rdquo;</p>
        {teacher.bio && <p className="text-xs text-amber-700/80 mt-3 max-w-md mx-auto leading-relaxed">{teacher.bio}</p>}
      </div>

      {/* ── TIMELINE ── */}
      <div className="max-w-3xl mx-auto px-6 pb-16 relative">
        {/* Vertical rail */}
        <div className="absolute left-9 sm:left-12 top-0 bottom-0 w-0.5"
          style={{ background: `linear-gradient(180deg, ${p}40 0%, ${p}20 50%, transparent 100%)` }} />

        <div className="space-y-10">
          {/* Courses entry */}
          {sections.courses && courses.length > 0 && (
            <div className="flex gap-5 sm:gap-7 relative">
              <TimelineDot color={p} />
              <div className="flex-1 -mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4" style={{ color: p }} />
                  <h2 className="text-lg font-bold text-amber-900">Khóa học của tôi</h2>
                </div>
                <div className="space-y-3">
                  {visCourses.map((c, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm"
                      style={{ border: '1px solid #fef3c7' }}>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-bold text-amber-900 text-sm">{c.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0"
                          style={{ background: `${p}15`, color: p }}>Lớp {c.grade}</span>
                      </div>
                      <p className="text-xs mb-1" style={{ color: p }}>{c.schedule}</p>
                      <p className="text-xs text-amber-700 leading-relaxed">{c.desc}</p>
                    </div>
                  ))}
                </div>
                <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
              </div>
            </div>
          )}

          {/* Exams entry */}
          {sections.exams && exams.length > 0 && (
            <div className="flex gap-5 sm:gap-7 relative">
              <TimelineDot color="#fb923c" />
              <div className="flex-1 -mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <h2 className="text-lg font-bold text-amber-900">Bộ đề mới</h2>
                </div>
                <div className="space-y-2">
                  {visExams.map((e, i) => (
                    <div key={i} className="bg-white rounded-2xl p-3 flex items-center gap-3"
                      style={{ border: '1px solid #fef3c7' }}>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-900 truncate">{e.title}</p>
                        <p className="text-xs text-amber-600 truncate">{e.desc}</p>
                      </div>
                      <span className="text-xs text-amber-500 font-mono shrink-0">{e.date}</span>
                    </div>
                  ))}
                </div>
                <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
              </div>
            </div>
          )}

          {/* Quizzes entry */}
          {sections.quizzes && allQuizzes.length > 0 && (
            <div className="flex gap-5 sm:gap-7 relative">
              <TimelineDot color="#f43f5e" />
              <div className="flex-1 -mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <Gamepad2 className="w-4 h-4 text-rose-500" />
                  <h2 className="text-lg font-bold text-amber-900">Quiz để luyện tập</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {quizzes.map(q => (
                    <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                      className="bg-white rounded-2xl p-4 hover:shadow-md transition flex flex-col"
                      style={{ border: '1px solid #fef3c7' }}>
                      <h3 className="font-bold text-amber-900 text-sm mb-1 leading-tight">{q.name}</h3>
                      <p className="text-xs text-amber-500 font-mono mb-2">#{q.code} · {q.question_count} câu</p>
                      {q.description && <p className="text-xs text-amber-700 leading-relaxed line-clamp-2 mb-2">{q.description}</p>}
                      <span className="text-xs font-bold mt-auto" style={{ color: p }}>Bấm để chơi →</span>
                    </a>
                  ))}
                </div>
                <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
              </div>
            </div>
          )}

          {/* Schedule entry */}
          {sections.schedule && schedule.length > 0 && (
            <div className="flex gap-5 sm:gap-7 relative">
              <TimelineDot color="#22c55e" />
              <div className="flex-1 -mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <h2 className="text-lg font-bold text-amber-900">Lịch dạy trong tuần</h2>
                </div>
                <div className="bg-white rounded-2xl divide-y divide-amber-50 overflow-hidden"
                  style={{ border: '1px solid #fef3c7' }}>
                  {visSchedule.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-2.5">
                      <span className="text-xs font-bold text-amber-900 w-20 shrink-0">{s.day}</span>
                      <span className="text-xs font-mono shrink-0" style={{ color: p }}>{s.time}</span>
                      <span className="text-xs text-amber-700 flex-1 truncate">{s.subject}</span>
                    </div>
                  ))}
                </div>
                <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
              </div>
            </div>
          )}

          {/* Contact entry */}
          {sections.contact && (
            <div className="flex gap-5 sm:gap-7 relative">
              <TimelineDot color="#a855f7" />
              <div className="flex-1 -mt-1">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-purple-500" />
                  <h2 className="text-lg font-bold text-amber-900">Cùng đồng hành nhé</h2>
                </div>
                <div className="bg-white rounded-2xl p-5 space-y-2"
                  style={{ border: '1px solid #fef3c7' }}>
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-sm text-amber-800 hover:text-amber-900">
                      <Mail className="w-4 h-4" style={{ color: p }} /> {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-sm text-amber-800">
                      <Phone className="w-4 h-4" style={{ color: p }} /> {contact.phone}
                    </a>
                  )}
                  {contact.facebook && (
                    <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:underline" style={{ color: p }}>
                      <ExternalLink className="w-4 h-4" /> Facebook
                    </a>
                  )}
                  {contact.zalo && (
                    <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:underline" style={{ color: p }}>
                      <ExternalLink className="w-4 h-4" /> Zalo
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* End marker */}
        <div className="flex gap-5 sm:gap-7 mt-10 relative">
          <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-white text-[8px]"
            style={{ background: p }}>♥</div>
          <p className="text-xs text-amber-600 italic">Cảm ơn bạn đã ghé thăm trang của tôi.</p>
        </div>
      </div>
    </div>
  )
}
