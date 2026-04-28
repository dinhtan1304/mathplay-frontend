'use client'
// FOREST — Bento grid layout: asymmetric mosaic of different-sized cards
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Leaf, Gamepad2, ArrowRight } from 'lucide-react'

export default function ForestTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans p-4 sm:p-6" style={{ background: '#f0fdf4' }}>

      {/* ── BENTO GRID ── */}
      <div className="max-w-5xl mx-auto grid grid-cols-12 gap-3 auto-rows-auto">

        {/* Card 1: Hero (large, spans 8 cols) */}
        <div className="col-span-12 sm:col-span-8 rounded-3xl p-8 flex flex-col justify-between min-h-[220px]"
          style={{ background: p }}>
          <div className="flex items-start gap-5">
            {teacher.avatar ? (
              <img src={teacher.avatar} alt={teacher.name}
                className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white bg-white/20 shrink-0">
                {teacher.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{teacher.subject}</p>
              <h1 className="text-3xl font-extrabold text-white leading-tight">{teacher.name}</h1>
              <p className="text-white/70 text-sm mt-1">{teacher.school}</p>
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm mt-4 leading-relaxed">{teacher.tagline}</p>
            {teacher.bio && <p className="text-white/60 text-xs mt-2 leading-relaxed">{teacher.bio}</p>}
          </div>
        </div>

        {/* Card 2: Quick contact (spans 4 cols) */}
        <div className="col-span-12 sm:col-span-4 rounded-3xl p-6 flex flex-col justify-between bg-white shadow-sm"
          style={{ border: `2px solid ${p}20` }}>
          <div>
            <Leaf className="w-5 h-5 mb-3" style={{ color: p }} />
            <h3 className="font-bold text-green-900 mb-1">Liên hệ</h3>
            <div className="space-y-2 mt-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-green-700 hover:underline">
                  <Mail className="w-3 h-3 shrink-0" style={{ color: p }} />
                  <span className="truncate">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-green-700 hover:underline">
                  <Phone className="w-3 h-3 shrink-0" style={{ color: p }} /> {contact.phone}
                </a>
              )}
              {contact.facebook && (
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs hover:underline" style={{ color: p }}>
                  <ExternalLink className="w-3 h-3" /> Facebook
                </a>
              )}
            </div>
          </div>
          <button className="mt-4 w-full py-2 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: p }}>
            Đăng ký ngay
          </button>
        </div>

        {/* Cards 3+: Courses (each spans 4 cols) */}
        {sections.courses && courses.slice(0, 3).map((c, i) => (
          <div key={i} className="col-span-6 sm:col-span-4 rounded-3xl p-5 bg-white shadow-sm hover:shadow-md transition"
            style={{ border: `2px solid ${p}15` }}>
            <div className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-3 text-white"
              style={{ background: p }}>Lớp {c.grade}</div>
            <h3 className="font-bold text-green-900 text-sm mb-1">{c.name}</h3>
            <p className="text-xs text-green-600 mb-2">{c.schedule}</p>
            <p className="text-xs text-green-700 leading-relaxed">{c.desc}</p>
          </div>
        ))}
        {sections.courses && courses.length > 3 && courses.slice(3).map((c, i) => (
          <div key={i + 3} className="col-span-6 sm:col-span-3 rounded-3xl p-4 bg-white shadow-sm"
            style={{ border: `2px solid ${p}15` }}>
            <div className="text-xs font-bold mb-2" style={{ color: p }}>Lớp {c.grade}</div>
            <h3 className="font-semibold text-green-900 text-xs">{c.name}</h3>
            <p className="text-xs text-green-600 mt-1">{c.schedule}</p>
          </div>
        ))}

        {/* Exams: wide card spans 12 */}
        {sections.exams && exams.length > 0 && (
          <div className="col-span-12 rounded-3xl p-6 bg-white shadow-sm" style={{ border: `2px solid ${p}15` }}>
            <h2 className="font-bold text-green-900 mb-4">📝 Bộ đề thi</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visExams.map((e, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-2xl"
                  style={{ background: '#f0fdf4', border: `1px solid ${p}20` }}>
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                    e.difficulty === 'easy' ? 'bg-green-500' : e.difficulty === 'hard' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-green-900">{e.title}</p>
                    <p className="text-xs text-green-600 mt-0.5">{DIFFICULTY_LABEL[e.difficulty]} · {e.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
          </div>
        )}

        {/* Quizzes: spans 12 with bento sub-grid */}
        {sections.quizzes && allQuizzes.length > 0 && (
          <div className="col-span-12 rounded-3xl p-6 bg-white shadow-sm" style={{ border: `2px solid ${p}15` }}>
            <h2 className="font-bold text-green-900 mb-4 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" style={{ color: p }} /> Quiz luyện tập
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quizzes.map(q => (
                <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                  className="group p-4 rounded-2xl flex flex-col justify-between transition hover:-translate-y-0.5"
                  style={{ background: '#f0fdf4', border: `1px solid ${p}30` }}>
                  <div>
                    <p className="text-sm font-semibold text-green-900 line-clamp-2">{q.name}</p>
                    {q.description && <p className="text-xs text-green-600 mt-1 line-clamp-2">{q.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: `${p}20` }}>
                    <span className="text-xs text-green-700 font-mono">{q.question_count} câu</span>
                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: p }}>
                      Tham gia <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
          </div>
        )}

        {/* Schedule: spans 6 + Contact CTA spans 6 */}
        {sections.schedule && schedule.length > 0 && (
          <div className="col-span-12 sm:col-span-7 rounded-3xl p-6 bg-white shadow-sm" style={{ border: `2px solid ${p}15` }}>
            <h2 className="font-bold text-green-900 mb-4">🗓 Lịch dạy</h2>
            <div className="space-y-2">
              {visSchedule.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="font-semibold w-28 shrink-0" style={{ color: p }}>{s.day}</span>
                  <span className="font-mono text-green-700 text-xs w-32 shrink-0">{s.time}</span>
                  <span className="text-green-600 text-xs">{s.subject}</span>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
          </div>
        )}

        {/* CTA block */}
        {sections.contact && (
          <div className="col-span-12 sm:col-span-5 rounded-3xl p-6 flex flex-col items-center justify-center text-center"
            style={{ background: `linear-gradient(135deg, ${p}20, ${p}05)`, border: `2px solid ${p}30` }}>
            <p className="text-2xl mb-2">🌱</p>
            <h3 className="font-bold text-green-900 mb-1">Sẵn sàng tham gia?</h3>
            <p className="text-xs text-green-700 mb-4">Liên hệ ngay để đặt lịch tư vấn miễn phí</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {contact.phone && (
                <a href={`tel:${contact.phone}`}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: p }}>
                  {contact.phone}
                </a>
              )}
              {contact.zalo && (
                <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-500">
                  Zalo
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
