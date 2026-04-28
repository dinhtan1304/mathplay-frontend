'use client'
// SAKURA — Centered hero + horizontal scroll courses + zigzag exam timeline + week calendar
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, ArrowRight } from 'lucide-react'

const DAYS_ORDER = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']

export default function SakuraTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(160deg, #fff0f6 0%, #fce7f3 50%, #fff5f7 100%)', color: '#3b0764' }}>

      {/* ── HERO: large centered with decorative petal ring ── */}
      <div className="relative text-center px-6 pt-20 pb-12 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${p} 0%, transparent 70%)` }} />
        </div>
        <div className="relative">
          {teacher.avatar ? (
            <img src={teacher.avatar} alt={teacher.name}
              className="w-28 h-28 rounded-full object-cover mx-auto mb-5 shadow-xl ring-4 ring-white"
              style={{ boxShadow: `0 0 0 8px ${p}20, 0 8px 30px ${p}30` }} />
          ) : (
            <div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white mx-auto mb-5 shadow-xl"
              style={{ background: `linear-gradient(135deg, ${p}, #fb7185)`, boxShadow: `0 0 0 8px ${p}15` }}>
              {teacher.name.charAt(0)}
            </div>
          )}
          <h1 className="text-4xl font-extrabold mb-2" style={{ color: '#3b0764' }}>{teacher.name}</h1>
          <p className="text-sm font-semibold mb-1" style={{ color: p }}>{teacher.subject}</p>
          <p className="text-xs text-purple-500 mb-4">{teacher.school}</p>
          <p className="text-sm text-purple-700 max-w-lg mx-auto leading-relaxed italic">&ldquo;{teacher.tagline}&rdquo;</p>
          {teacher.bio && <p className="text-xs text-purple-600 max-w-md mx-auto mt-3 leading-relaxed">{teacher.bio}</p>}
        </div>
      </div>

      {/* ── COURSES: horizontal scroll cards ── */}
      {sections.courses && courses.length > 0 && (
        <div className="py-10">
          <div className="px-8 mb-5 flex items-center gap-3">
            <div className="w-6 h-0.5 rounded-full" style={{ background: p }} />
            <h2 className="text-lg font-bold" style={{ color: '#3b0764' }}>Khóa học</h2>
            <div className="flex-1 h-0.5 rounded-full opacity-20" style={{ background: p }} />
          </div>
          <div className="flex gap-4 overflow-x-auto px-8 pb-4" style={{ scrollbarWidth: 'none' }}>
            {courses.map((c, i) => (
              <div key={i} className="shrink-0 w-64 rounded-3xl p-5 bg-white shadow-md"
                style={{ border: `2px solid ${p}20` }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white mb-4"
                  style={{ background: `linear-gradient(135deg, ${p}, #fb7185)` }}>
                  {c.grade || (i + 1)}
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: '#3b0764' }}>{c.name}</h3>
                <p className="text-xs mb-3" style={{ color: p }}>{c.schedule}</p>
                <p className="text-xs text-purple-600 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXAMS: zigzag timeline ── */}
      {sections.exams && exams.length > 0 && (
        <div className="px-8 py-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-0.5 rounded-full" style={{ background: p }} />
            <h2 className="text-lg font-bold" style={{ color: '#3b0764' }}>Bộ đề thi</h2>
            <div className="flex-1 h-0.5 rounded-full opacity-20" style={{ background: p }} />
          </div>
          <div className="relative max-w-2xl mx-auto">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 opacity-20" style={{ background: p }} />
            {visExams.map((e, i) => (
              <div key={i} className={`flex items-center gap-6 mb-6 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="flex-1">
                  <div className={`p-4 rounded-2xl bg-white shadow-sm ${i % 2 === 0 ? 'mr-4' : 'ml-4'}`}
                    style={{ border: `1.5px solid ${p}20` }}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm" style={{ color: '#3b0764' }}>{e.title}</h3>
                    </div>
                    <p className="text-xs text-purple-600">{e.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-pink-100 text-pink-700'
                      }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                      <span className="text-xs text-purple-400">{e.date}</span>
                    </div>
                  </div>
                </div>
                {/* Center dot */}
                <div className="w-5 h-5 rounded-full border-2 bg-white shrink-0 z-10"
                  style={{ borderColor: p, boxShadow: `0 0 0 4px ${p}20` }} />
                <div className="flex-1" />
              </div>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
        </div>
      )}

      {/* ── SCHEDULE: week calendar grid ── */}
      {sections.schedule && schedule.length > 0 && (
        <div className="px-8 py-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-0.5 rounded-full" style={{ background: p }} />
            <h2 className="text-lg font-bold" style={{ color: '#3b0764' }}>Lịch dạy trong tuần</h2>
            <div className="flex-1 h-0.5 rounded-full opacity-20" style={{ background: p }} />
          </div>
          <div className="grid grid-cols-7 gap-2 max-w-3xl mx-auto">
            {DAYS_ORDER.map(day => {
              const item = schedule.find(s => s.day === day)
              return (
                <div key={day} className={`rounded-2xl p-3 text-center ${item ? 'bg-white shadow-sm' : 'bg-white/40'}`}
                  style={{ border: item ? `2px solid ${p}30` : '2px solid transparent' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: item ? p : '#c084fc' }}>
                    {day.replace('Thứ ', 'T').replace('Chủ Nhật', 'CN')}
                  </p>
                  {item ? (
                    <>
                      <p className="text-xs font-semibold" style={{ color: '#3b0764' }}>{item.time}</p>
                      <p className="text-xs text-purple-600 mt-1 leading-tight">{item.subject}</p>
                    </>
                  ) : (
                    <p className="text-xs text-purple-200">—</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── QUIZZES: rounded card grid ── */}
      {sections.quizzes && allQuizzes.length > 0 && (
        <div className="px-8 py-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-0.5 rounded-full" style={{ background: p }} />
            <h2 className="text-lg font-bold" style={{ color: '#3b0764' }}>Quiz luyện tập</h2>
            <div className="flex-1 h-0.5 rounded-full opacity-20" style={{ background: p }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {quizzes.map(q => (
              <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                className="group rounded-3xl p-5 bg-white shadow-md hover:shadow-lg transition flex items-center gap-4"
                style={{ border: `2px solid ${p}20` }}>
                {q.cover_image_url ? (
                  <img src={q.cover_image_url} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${p}, #fb7185)` }}>
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm" style={{ color: '#3b0764' }}>{q.name}</h3>
                  {q.description && <p className="text-xs text-purple-600 line-clamp-1 mt-0.5">{q.description}</p>}
                  <p className="text-xs mt-1" style={{ color: p }}>🎯 {q.question_count} câu hỏi</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition shrink-0" style={{ color: p }} />
              </a>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
        </div>
      )}

      {/* ── CONTACT: floating card ── */}
      {sections.contact && (
        <div className="px-8 py-12">
          <div className="max-w-lg mx-auto rounded-3xl p-8 text-center bg-white shadow-xl"
            style={{ border: `2px solid ${p}20` }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-xl"
              style={{ background: `${p}15` }}>💌</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#3b0764' }}>Đăng ký học</h2>
            <p className="text-sm text-purple-600 mb-6">Liên hệ ngay để nhận tư vấn và đăng ký lớp học</p>
            <div className="flex flex-col gap-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`}
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-medium text-white transition"
                  style={{ background: `linear-gradient(90deg, ${p}, #fb7185)` }}>
                  <Mail className="w-4 h-4" /> {contact.email}
                </a>
              )}
              <div className="flex gap-3">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition"
                    style={{ background: `${p}10`, color: p }}>
                    <Phone className="w-4 h-4" /> {contact.phone}
                  </a>
                )}
                {contact.facebook && (
                  <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition"
                    style={{ background: `${p}10`, color: p }}>
                    <ExternalLink className="w-4 h-4" /> Facebook
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
