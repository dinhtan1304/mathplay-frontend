'use client'
// HORIZON — Classic editorial: large hero, full-bleed sections, clean typography
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Clock, BookMarked, Gamepad2, ArrowRight } from 'lucide-react'

export default function HorizonTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="font-sans bg-white text-gray-900 min-h-screen">

      {/* ── HERO: split left/right ── */}
      <div className="grid lg:grid-cols-2 min-h-[420px]">
        {/* Left: solid color */}
        <div className="flex flex-col justify-center px-12 py-16" style={{ background: p }}>
          <p className="text-white/70 text-xs font-bold uppercase tracking-[0.3em] mb-4">{teacher.school}</p>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">{teacher.name}</h1>
          <div className="w-16 h-1 bg-white/40 mb-4" />
          <p className="text-white/90 text-xl font-light mb-6">{teacher.subject}</p>
          <p className="text-white/70 text-sm max-w-sm leading-relaxed">{teacher.tagline}</p>
        </div>
        {/* Right: light bg + avatar + stats */}
        <div className="flex flex-col justify-center px-12 py-16 bg-gray-50">
          <div className="flex items-start gap-6 mb-8">
            {teacher.avatar ? (
              <img src={teacher.avatar} alt={teacher.name} className="w-20 h-20 rounded-full object-cover shrink-0 shadow" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow"
                style={{ background: p }}>{teacher.name.charAt(0)}</div>
            )}
            <div>
              <p className="text-gray-500 text-sm leading-relaxed">{teacher.bio}</p>
            </div>
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              [courses.length, 'Khóa học', <BookMarked className="w-4 h-4" key="b" />],
              [exams.length, 'Bộ đề', <BookMarked className="w-4 h-4" key="e" />],
              [schedule.length, 'Buổi/tuần', <Clock className="w-4 h-4" key="c" />],
            ].map(([val, label, icon]) => (
              <div key={label as string} className="text-center p-3 rounded-xl bg-white shadow-sm">
                <p className="text-2xl font-bold" style={{ color: p }}>{val as number}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label as string}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── COURSES: horizontal cards with left-border accent ── */}
      {sections.courses && courses.length > 0 && (
        <div className="px-12 py-14 bg-white">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: p }}>Danh sách</p>
              <h2 className="text-3xl font-extrabold text-gray-900">Khóa học</h2>
            </div>
            <div className="text-right text-sm text-gray-400">{courses.length} khóa đang mở</div>
          </div>
          <div className="space-y-3">
            {visCourses.map((c, i) => (
              <div key={i} className="flex items-center gap-6 p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition group"
                style={{ borderLeft: `4px solid ${p}` }}>
                <div className="text-3xl font-black text-gray-200 group-hover:text-gray-300 transition w-8 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  <p className="text-sm text-gray-500">{c.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-medium px-2 py-1 rounded-full text-white" style={{ background: p }}>Lớp {c.grade}</span>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{c.schedule}</p>
                </div>
              </div>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
        </div>
      )}

      {/* ── EXAMS + SCHEDULE: side by side ── */}
      <div className="grid lg:grid-cols-2 gap-0" style={{ background: '#f8fafc' }}>
        {sections.exams && exams.length > 0 && (
          <div className="px-12 py-14 border-r border-gray-200">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: p }}>Tài liệu</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Bộ đề thi</h2>
            <div className="space-y-4">
              {visExams.map((e, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: e.difficulty === 'hard' ? '#ef4444' : e.difficulty === 'easy' ? '#22c55e' : p }}>
                    {DIFFICULTY_LABEL[e.difficulty].charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{e.title}</h3>
                    <p className="text-xs text-gray-500">{e.desc} · {e.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
          </div>
        )}

        {sections.schedule && schedule.length > 0 && (
          <div className="px-12 py-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: p }}>Thời gian</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Lịch dạy</h2>
            <div className="space-y-2">
              {visSchedule.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-700">{s.day}</span>
                  <span className="text-xs text-gray-400 mx-2">·</span>
                  <span className="text-sm text-gray-600 flex-1">{s.subject}</span>
                  <span className="text-xs font-mono font-medium" style={{ color: p }}>{s.time}</span>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
          </div>
        )}
      </div>

      {/* ── QUIZZES: prominent CTA cards ── */}
      {sections.quizzes && allQuizzes.length > 0 && (
        <div className="px-12 py-14 bg-white">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: p }}>Luyện tập trực tuyến</p>
              <h2 className="text-3xl font-extrabold text-gray-900">Quiz</h2>
            </div>
            <div className="text-right text-sm text-gray-400">{quizzes.length} quiz đang mở</div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {quizzes.map(q => (
              <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-4 p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                style={{ borderLeft: `4px solid ${p}` }}>
                {q.cover_image_url ? (
                  <img src={q.cover_image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white"
                    style={{ background: p }}>
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{q.name}</h3>
                  {q.description && <p className="text-xs text-gray-500 line-clamp-1">{q.description}</p>}
                  <p className="text-xs text-gray-400 mt-1 font-mono">{q.code} · {q.question_count} câu</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium shrink-0 group-hover:translate-x-1 transition" style={{ color: p }}>
                  Tham gia <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
        </div>
      )}

      {/* ── CONTACT: full-width dark band ── */}
      {sections.contact && (
        <div className="px-12 py-12" style={{ background: '#111827' }}>
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Đăng ký học ngay</h2>
              <p className="text-gray-400 text-sm">Liên hệ để nhận thêm thông tin và đăng ký</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: p }}>
                  <Mail className="w-4 h-4" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20">
                  <Phone className="w-4 h-4" /> {contact.phone}
                </a>
              )}
              {contact.facebook && (
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20">
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
