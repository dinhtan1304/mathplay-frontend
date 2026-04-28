'use client'
// HONEY — Hexagonal honeycomb grid layout
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, ArrowRight } from 'lucide-react'

function Hex({ size = 80, color, children, className = '' }: {
  size?: number; color: string; children?: React.ReactNode; className?: string
}) {
  const w = size
  const h = size * 1.155
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: w, height: h,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        background: color,
      }}>
      {children}
    </div>
  )
}

export default function HoneyTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  const tints = [`${p}`, `${p}cc`, `${p}99`, `${p}77`, `${p}55`, `${p}44`]

  return (
    <div className="min-h-screen font-sans" style={{ background: '#fffbeb', color: '#451a03' }}>

      {/* ── HERO: honeycomb cluster ── */}
      <div className="relative overflow-hidden pt-10 pb-8" style={{ background: 'linear-gradient(180deg, #fef3c7 0%, #fffbeb 100%)' }}>
        {/* Decorative hex background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="absolute" style={{
              width: 60, height: 69,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: p,
              left: `${(i % 4) * 25 + (Math.floor(i / 4) % 2 === 0 ? 0 : 12)}%`,
              top: `${Math.floor(i / 4) * 35}%`,
            }} />
          ))}
        </div>

        <div className="relative max-w-4xl mx-auto px-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Hex avatar */}
            <div className="shrink-0">
              {teacher.avatar ? (
                <div style={{
                  width: 120, height: 138,
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: `${p}20`,
                }}>
                  <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover"
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                </div>
              ) : (
                <div style={{
                  width: 120, height: 138,
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: `linear-gradient(135deg, ${p}, #fbbf24)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 40, fontWeight: 800, color: 'white',
                }}>
                  {teacher.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2" style={{ color: p }}>{teacher.subject}</p>
              <h1 className="text-4xl font-extrabold text-amber-900 mb-2">{teacher.name}</h1>
              <p className="text-amber-700 text-sm mb-3">{teacher.school}</p>
              <p className="text-amber-800 max-w-lg leading-relaxed">{teacher.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── COURSES: hex card row ── */}
      {sections.courses && courses.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-6">
            <Hex size={28} color={p}><span className="text-white text-[10px] font-bold">↓</span></Hex>
            <h2 className="text-xl font-extrabold text-amber-900">Khóa học</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visCourses.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden"
                style={{ border: `2px solid ${tints[i % tints.length]}40`, boxShadow: '0 4px 16px rgba(217,119,6,0.08)' }}>
                <div className="h-2" style={{ background: tints[i % tints.length] }} />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Hex size={28} color={tints[i % tints.length]}>
                      <span className="text-white text-[9px] font-black">{c.grade}</span>
                    </Hex>
                    <h3 className="font-bold text-amber-900 text-sm leading-tight flex-1">{c.name}</h3>
                  </div>
                  <p className="text-xs mb-2" style={{ color: p }}>{c.schedule}</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
        </div>
      )}

      {/* ── EXAMS + SCHEDULE: two columns ── */}
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {sections.exams && exams.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Hex size={28} color="#f59e0b"><span className="text-white text-[10px] font-bold">✎</span></Hex>
                <h2 className="text-xl font-extrabold text-amber-900">Bộ đề thi</h2>
              </div>
              <div className="space-y-2">
                {visExams.map((e, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 flex gap-3"
                    style={{ border: '1px solid #fef3c7' }}>
                    <Hex size={20} color={e.difficulty === 'easy' ? '#22c55e' : e.difficulty === 'hard' ? '#ef4444' : p} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-amber-900 truncate">{e.title}</p>
                      <p className="text-xs text-amber-600 truncate">{e.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                      <p className="text-[10px] text-amber-500 font-mono mt-1">{e.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
            </div>
          )}

          {sections.schedule && schedule.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Hex size={28} color="#a78bfa"><span className="text-white text-[10px] font-bold">◷</span></Hex>
                <h2 className="text-xl font-extrabold text-amber-900">Lịch dạy</h2>
              </div>
              <div className="space-y-2">
                {visSchedule.map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3"
                    style={{ border: '1px solid #fef3c7' }}>
                    <Hex size={20} color={tints[i % tints.length]} />
                    <span className="font-bold text-sm text-amber-900 w-24 shrink-0">{s.day}</span>
                    <span className="text-xs font-mono shrink-0" style={{ color: p }}>{s.time}</span>
                    <span className="text-xs text-amber-700 flex-1 truncate">{s.subject}</span>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
            </div>
          )}
        </div>
      </div>

      {/* ── QUIZZES: hex button grid ── */}
      {sections.quizzes && allQuizzes.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pb-10">
          <div className="flex items-center gap-3 mb-5">
            <Hex size={28} color="#f43f5e"><span className="text-white text-[10px] font-bold">▶</span></Hex>
            <h2 className="text-xl font-extrabold text-amber-900">Quiz luyện tập</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((q, i) => (
              <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                className="bg-white rounded-2xl p-5 hover:shadow-md transition flex flex-col"
                style={{ border: `2px solid ${tints[i % tints.length]}40` }}>
                <div className="flex items-center gap-3 mb-3">
                  <Hex size={36} color={tints[i % tints.length]}>
                    <Gamepad2 className="w-4 h-4 text-white" />
                  </Hex>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-amber-900 text-sm truncate">{q.name}</h3>
                    <p className="text-[10px] text-amber-500 font-mono">{q.code} · {q.question_count} câu</p>
                  </div>
                </div>
                {q.description && <p className="text-xs text-amber-700 leading-relaxed line-clamp-2 mb-3">{q.description}</p>}
                <span className="text-xs font-bold flex items-center gap-1 mt-auto" style={{ color: p }}>
                  Tham gia <ArrowRight className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>
          <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
        </div>
      )}

      {/* ── CONTACT: hex cluster CTA ── */}
      {sections.contact && (
        <div className="max-w-5xl mx-auto px-6 pb-16">
          <div className="rounded-3xl p-8 text-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${p}15, #fef3c7)`, border: `2px solid ${p}20` }}>
            <div className="absolute inset-0 pointer-events-none opacity-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="absolute" style={{
                  width: 80, height: 92,
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: p, right: `${i * 14}%`, bottom: -20,
                }} />
              ))}
            </div>
            <h2 className="text-2xl font-extrabold text-amber-900 mb-2">Đăng ký học</h2>
            <p className="text-amber-700 mb-6 text-sm">Liên hệ để nhận tư vấn và xếp lớp phù hợp với bạn</p>
            <div className="flex flex-wrap justify-center gap-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: p }}>
                  <Mail className="w-4 h-4" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition hover:opacity-80"
                  style={{ background: `${p}20`, color: p }}>
                  <Phone className="w-4 h-4" /> {contact.phone}
                </a>
              )}
              {contact.facebook && (
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition hover:opacity-80"
                  style={{ background: `${p}20`, color: p }}>
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
