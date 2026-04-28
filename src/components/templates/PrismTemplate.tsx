'use client'
// PRISM — Portfolio mosaic: irregular-sized overlapping cards, floating elements
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Sparkles, Gamepad2, ArrowRight } from 'lucide-react'

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #fce7f3, #ede9fe)',
  'linear-gradient(135deg, #eff6ff, #dbeafe)',
  'linear-gradient(135deg, #f0fdf4, #dcfce7)',
  'linear-gradient(135deg, #fff7ed, #fef9c3)',
  'linear-gradient(135deg, #fdf4ff, #f3e8ff)',
  'linear-gradient(135deg, #ecfeff, #cffafe)',
]

export default function PrismTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{
      background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 40%, #f0fdf4 70%, #fff7ed 100%)',
      color: '#1e1b4b',
    }}>
      {/* ── GRADIENT HEADER BAR ── */}
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #f43f5e, #a855f7, #3b82f6, #10b981, #f59e0b, #f43f5e)', backgroundSize: '200%' }} />

      {/* ── HERO: floating card layout ── */}
      <div className="relative px-6 pt-12 pb-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Large name card */}
          <div className="flex-1 rounded-3xl p-8" style={{
            background: `linear-gradient(135deg, ${p}15, ${p}05)`,
            border: `2px solid ${p}30`,
          }}>
            <div className="flex items-start gap-5 mb-4">
              {teacher.avatar ? (
                <img src={teacher.avatar} alt={teacher.name}
                  className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-lg"
                  style={{ boxShadow: `0 8px 24px ${p}30` }} />
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white shrink-0 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${p}, #3b82f6)`, boxShadow: `0 8px 24px ${p}30` }}>
                  {teacher.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4" style={{ color: p }} />
                  <span className="text-sm font-semibold" style={{ color: p }}>{teacher.subject}</span>
                </div>
                <h1 className="text-3xl font-extrabold leading-tight" style={{ color: '#1e1b4b' }}>{teacher.name}</h1>
                <p className="text-sm text-purple-600 mt-0.5">{teacher.school}</p>
              </div>
            </div>
            <p className="text-sm text-indigo-700 leading-relaxed">{teacher.tagline}</p>
            {teacher.bio && <p className="text-xs text-indigo-600 mt-2 leading-relaxed opacity-80">{teacher.bio}</p>}
          </div>

          {/* Contact floating card */}
          {sections.contact && (
            <div className="sm:w-56 rounded-3xl p-5 shadow-lg" style={{ background: 'white', border: `2px solid ${p}20` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: p }}>Liên hệ</p>
              <div className="space-y-2.5">
                {contact.email && (
                  <a href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-xs text-indigo-700 hover:text-indigo-900 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: p }} />
                    <span className="truncate">{contact.email}</span>
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-indigo-700">
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
                className="mt-4 w-full block text-center py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: `linear-gradient(90deg, ${p}, #3b82f6)` }}>
                Đăng ký ngay
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── COURSES: mosaic cards ── */}
      {sections.courses && courses.length > 0 && (
        <div className="px-6 pb-6 max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: p }}>Khóa học</p>
          <div className="grid grid-cols-12 gap-3">
            {visCourses.map((c, i) => {
              const spans = [
                'col-span-12 sm:col-span-8',
                'col-span-12 sm:col-span-4',
                'col-span-6 sm:col-span-4',
                'col-span-6 sm:col-span-4',
                'col-span-12 sm:col-span-4',
              ]
              return (
                <div key={i} className={`${spans[i % spans.length] ?? 'col-span-6 sm:col-span-4'} rounded-3xl p-5`}
                  style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length], border: `1.5px solid ${p}15` }}>
                  <div className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3 text-white"
                    style={{ background: `linear-gradient(90deg, ${p}, #3b82f6)` }}>Lớp {c.grade}</div>
                  <h3 className="font-bold text-indigo-900 mb-1 leading-tight">{c.name}</h3>
                  <p className="text-xs mb-2" style={{ color: p }}>{c.schedule}</p>
                  <p className="text-xs text-indigo-700 leading-relaxed">{c.desc}</p>
                </div>
              )
            })}
          </div>
          <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
        </div>
      )}

      {/* ── EXAMS: horizontal overflow pills ── */}
      {sections.exams && exams.length > 0 && (
        <div className="px-6 pb-6 max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: p }}>Bộ đề thi</p>
          <div className="space-y-2">
            {visExams.map((e, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm"
                style={{ border: '1.5px solid rgba(168,85,247,0.15)' }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{
                  background: e.difficulty === 'easy' ? '#22c55e' : e.difficulty === 'hard' ? '#ef4444' : p
                }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-indigo-900 truncate">{e.title}</p>
                  <p className="text-xs text-purple-500 truncate">{e.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                  }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                  <span className="text-xs text-purple-400">{e.date}</span>
                </div>
              </div>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
        </div>
      )}

      {/* ── QUIZZES: colorful gradient cards ── */}
      {sections.quizzes && allQuizzes.length > 0 && (
        <div className="px-6 pb-6 max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: p }}>Quiz luyện tập</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {quizzes.map((q, i) => (
              <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                className="group rounded-3xl p-5 block transition hover:-translate-y-0.5"
                style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length], border: `1.5px solid ${p}15` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${p}, #3b82f6)` }}>
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-indigo-900 text-sm leading-tight truncate">{q.name}</h3>
                    <p className="text-xs text-indigo-500 font-mono">{q.code} · {q.question_count} câu</p>
                  </div>
                </div>
                {q.description && <p className="text-xs text-indigo-700 leading-relaxed mb-3 line-clamp-2">{q.description}</p>}
                <div className="text-xs font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition" style={{ color: p }}>
                  Tham gia ngay <ArrowRight className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
        </div>
      )}

      {/* ── SCHEDULE: colorful chip grid ── */}
      {sections.schedule && schedule.length > 0 && (
        <div className="px-6 pb-12 max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: p }}>Lịch dạy</p>
          <div className="flex flex-wrap gap-2">
            {visSchedule.map((s, i) => (
              <div key={i} className="rounded-2xl px-4 py-3"
                style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length], border: `1.5px solid ${p}15` }}>
                <p className="text-xs font-bold" style={{ color: p }}>{s.day}</p>
                <p className="text-xs font-mono font-semibold text-indigo-800">{s.time}</p>
                <p className="text-xs text-indigo-600 mt-0.5">{s.subject}</p>
              </div>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
        </div>
      )}
    </div>
  )
}
