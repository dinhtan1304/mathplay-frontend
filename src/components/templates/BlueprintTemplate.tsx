'use client'
// BLUEPRINT — Dashboard widgets: top stat bar + grid of mixed-size widgets
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, BookOpen, FileText, Clock, TrendingUp, Gamepad2, ArrowRight } from 'lucide-react'

export default function BlueprintTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0f172a', color: '#e2e8f0' }}>

      {/* ── TOP NAV BAR ── */}
      <div className="flex items-center justify-between px-8 py-4"
        style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <div className="flex items-center gap-3">
          {teacher.avatar ? (
            <img src={teacher.avatar} alt="" className="w-9 h-9 rounded-lg object-cover"
              style={{ border: `2px solid ${p}` }} />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white"
              style={{ background: p }}>{teacher.name.charAt(0)}</div>
          )}
          <div>
            <p className="font-semibold text-white text-sm">{teacher.name}</p>
            <p className="text-xs text-slate-400">{teacher.subject} · {teacher.school}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: p }}>
              <Mail className="w-3 h-3" /> Liên hệ
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600">
              <Phone className="w-3 h-3" /> {contact.phone}
            </a>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 px-8 py-6">
        {[
          { icon: <BookOpen className="w-5 h-5" />, val: courses.length, label: 'Khóa học', color: p },
          { icon: <FileText className="w-5 h-5" />, val: exams.length, label: 'Bộ đề', color: '#f59e0b' },
          { icon: <Gamepad2 className="w-5 h-5" />, val: quizzes.length, label: 'Quiz', color: '#a855f7' },
          { icon: <Clock className="w-5 h-5" />, val: schedule.length, label: 'Buổi/tuần', color: '#22d3ee' },
          { icon: <TrendingUp className="w-5 h-5" />, val: '100%', label: 'Cam kết', color: '#22c55e' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <div className="flex items-center justify-between mb-2">
              <div style={{ color: s.color }}>{s.icon}</div>
              <span className="text-xs text-slate-500 font-mono">#{i + 1}</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{s.val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── MAIN DASHBOARD GRID ── */}
      <div className="px-8 pb-8 grid grid-cols-12 gap-3">

        {/* Bio widget */}
        {teacher.bio && (
          <div className="col-span-12 sm:col-span-8 p-5 rounded-xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Về tôi</p>
            <p className="text-sm text-slate-300 leading-relaxed">{teacher.bio}</p>
            <p className="text-xs text-slate-500 mt-3 italic">&ldquo;{teacher.tagline}&rdquo;</p>
          </div>
        )}

        {/* Contact widget */}
        {sections.contact && (
          <div className="col-span-12 sm:col-span-4 p-5 rounded-xl" style={{ background: '#1e293b', border: `1px solid ${p}40` }}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Kết nối</p>
            <div className="space-y-2">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition">
                  <Mail className="w-3.5 h-3.5" style={{ color: p }} />
                  <span className="truncate">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition">
                  <Phone className="w-3.5 h-3.5" style={{ color: p }} /> {contact.phone}
                </a>
              )}
              {contact.facebook && (
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-slate-700 transition" style={{ color: p }}>
                  <ExternalLink className="w-3.5 h-3.5" /> Facebook
                </a>
              )}
            </div>
          </div>
        )}

        {/* Courses: full-width table */}
        {sections.courses && courses.length > 0 && (
          <div className="col-span-12 rounded-xl overflow-hidden" style={{ border: '1px solid #334155' }}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: p }} /> Khóa học đang mở
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: p }}>
                {courses.length} lớp
              </span>
            </div>
            <table className="w-full text-sm" style={{ background: '#0f172a' }}>
              <thead>
                <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                  {['#', 'Tên khóa học', 'Lớp', 'Lịch học', 'Mô tả'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visCourses.map((c, i) => (
                  <tr key={i} className="border-t hover:bg-white/5 transition" style={{ borderColor: '#1e293b' }}>
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: `${p}20`, color: p }}>Lớp {c.grade}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono">{c.schedule}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
          </div>
        )}

        {/* Exams: card list spans 6 */}
        {sections.exams && exams.length > 0 && (
          <div className="col-span-12 sm:col-span-6 rounded-xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: '#f59e0b' }} /> Bộ đề thi
            </p>
            <div className="space-y-2">
              {visExams.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#0f172a' }}>
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm text-white font-medium truncate">{e.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{e.date}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    e.difficulty === 'easy' ? 'bg-emerald-900/50 text-emerald-400' :
                    e.difficulty === 'hard' ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
                  }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
          </div>
        )}

        {/* Quizzes: full-width interactive widget */}
        {sections.quizzes && allQuizzes.length > 0 && (
          <div className="col-span-12 rounded-xl overflow-hidden" style={{ border: '1px solid #334155' }}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" style={{ color: '#a855f7' }} /> Quiz luyện tập
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: '#a855f7' }}>
                {quizzes.length} quiz
              </span>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ background: '#0f172a' }}>
              {quizzes.map(q => (
                <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                  className="group p-4 rounded-lg block transition hover:bg-white/5"
                  style={{ background: '#1e293b', border: `1px solid ${p}30` }}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                      style={{ background: `${p}20`, color: p }}>
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{q.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{q.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{q.question_count} câu hỏi</span>
                    <span className="flex items-center gap-1 font-bold group-hover:translate-x-0.5 transition" style={{ color: p }}>
                      Tham gia <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
          </div>
        )}

        {/* Schedule: spans 6 */}
        {sections.schedule && schedule.length > 0 && (
          <div className="col-span-12 sm:col-span-6 rounded-xl p-5" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: '#22d3ee' }} /> Lịch dạy tuần
            </p>
            <div className="space-y-2">
              {visSchedule.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: '#0f172a' }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p }} />
                  <span className="text-xs font-medium w-24 shrink-0" style={{ color: p }}>{s.day}</span>
                  <span className="text-xs text-slate-300 font-mono w-28 shrink-0">{s.time}</span>
                  <span className="text-xs text-slate-400 truncate">{s.subject}</span>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
          </div>
        )}
      </div>
    </div>
  )
}
