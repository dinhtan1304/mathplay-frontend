'use client'
// PETAL — Polaroid scrapbook: rotated cards with tape strips, hand-written aesthetic
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2 } from 'lucide-react'

const ROTATIONS = [-3, 2, -1.5, 3, -2, 1, -2.5, 2.5]
const TAPE_COLORS = ['#fde047', '#86efac', '#93c5fd', '#f9a8d4', '#c4b5fd']

function Polaroid({
  rotation = 0, tape = '#fde047', children, className = '',
}: { rotation?: number; tape?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white p-3 pb-8 relative ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        boxShadow: '0 6px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        transformOrigin: 'center top',
      }}>
      {/* Tape strip */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 opacity-80"
        style={{ background: tape, clipPath: 'polygon(5% 0, 95% 0, 90% 100%, 10% 100%)' }} />
      {children}
    </div>
  )
}

export default function PetalTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{
      background: 'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 40%, #fff1f2 100%)',
      color: '#500724',
      backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(244,114,182,0.08), transparent 40%), radial-gradient(circle at 80% 20%, rgba(251,113,133,0.06), transparent 40%)',
    }}>

      {/* ── HERO POLAROID ── */}
      <div className="pt-16 pb-8 px-6 flex justify-center">
        <div style={{ transform: 'rotate(-2deg)' }}>
          <div className="bg-white p-4 pb-12 relative"
            style={{ boxShadow: '0 12px 40px rgba(244,114,182,0.2), 0 4px 12px rgba(0,0,0,0.1)', maxWidth: 320 }}>
            {/* Tape */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-7 opacity-80"
              style={{ background: TAPE_COLORS[0], clipPath: 'polygon(5% 0, 95% 0, 90% 100%, 10% 100%)' }} />

            {/* Photo area */}
            <div className="w-full aspect-square mb-3 rounded flex items-center justify-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${p}20, ${p}10)` }}>
              {teacher.avatar ? (
                <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg, ${p}, #fb7185)` }}>
                  {teacher.name.charAt(0)}
                </div>
              )}
              {/* Film grain overlay */}
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
            </div>

            {/* Caption */}
            <div className="text-center" style={{ fontFamily: '"Courier New", monospace' }}>
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: p }}>{teacher.subject}</p>
              <p className="font-bold text-lg text-pink-900 leading-tight">{teacher.name}</p>
              <p className="text-xs text-pink-600 mt-0.5">{teacher.school}</p>
              <p className="text-xs text-pink-700 mt-2 italic leading-relaxed">&ldquo;{teacher.tagline}&rdquo;</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16">

        {/* ── COURSES: polaroid grid ── */}
        {sections.courses && courses.length > 0 && (
          <div className="mb-14">
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: p }}>Khóa học của tôi</p>
              <div className="w-12 h-px mx-auto mt-2" style={{ background: `${p}40` }} />
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {visCourses.map((c, i) => (
                <Polaroid key={i} rotation={ROTATIONS[i % ROTATIONS.length]} tape={TAPE_COLORS[(i + 1) % TAPE_COLORS.length]}
                  className="w-44">
                  <div className="bg-pink-50 aspect-square flex flex-col items-center justify-center p-3 rounded mb-2">
                    <span className="text-3xl font-black mb-1" style={{ color: p }}>{c.grade}</span>
                    <span className="text-[10px] text-pink-600 uppercase font-bold">Lớp</span>
                  </div>
                  <div style={{ fontFamily: '"Courier New", monospace' }}>
                    <p className="font-bold text-pink-900 text-xs leading-tight text-center">{c.name}</p>
                    <p className="text-[9px] text-pink-500 text-center mt-1">{c.schedule}</p>
                  </div>
                </Polaroid>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
          </div>
        )}

        {/* ── EXAMS: tilted list ── */}
        {sections.exams && exams.length > 0 && (
          <div className="mb-14">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: p }}>Bộ đề thi</p>
              <div className="w-12 h-px mx-auto mt-2" style={{ background: `${p}40` }} />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visExams.map((e, i) => (
                <Polaroid key={i} rotation={ROTATIONS[(i + 3) % ROTATIONS.length]} tape={TAPE_COLORS[(i + 2) % TAPE_COLORS.length]}>
                  <div className="bg-amber-50 p-3 rounded mb-2 min-h-[80px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                    </div>
                    <p className="text-xs font-bold text-pink-900 leading-tight">{e.title}</p>
                    <p className="text-[9px] text-pink-600 mt-1 italic">{e.desc}</p>
                  </div>
                  <p className="text-[9px] text-pink-400 text-center font-mono">{e.date}</p>
                </Polaroid>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
          </div>
        )}

        {/* ── QUIZZES: game polaroids ── */}
        {sections.quizzes && allQuizzes.length > 0 && (
          <div className="mb-14">
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: p }}>Quiz luyện tập</p>
              <div className="w-12 h-px mx-auto mt-2" style={{ background: `${p}40` }} />
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {quizzes.map((q, i) => (
                <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform duration-200" style={{ transformOrigin: 'center' }}>
                  <Polaroid rotation={ROTATIONS[(i + 1) % ROTATIONS.length]} tape={TAPE_COLORS[i % TAPE_COLORS.length]}
                    className="w-40">
                    <div className="aspect-square flex flex-col items-center justify-center gap-2 rounded mb-2"
                      style={{ background: `linear-gradient(135deg, ${p}20, ${p}10)` }}>
                      <Gamepad2 className="w-8 h-8" style={{ color: p }} />
                      <p className="text-[9px] font-mono text-pink-500">{q.code}</p>
                    </div>
                    <div style={{ fontFamily: '"Courier New", monospace' }}>
                      <p className="text-[10px] font-bold text-pink-900 text-center leading-tight">{q.name}</p>
                      <p className="text-[9px] text-pink-500 text-center mt-1">{q.question_count} câu ▶</p>
                    </div>
                  </Polaroid>
                </a>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
          </div>
        )}

        {/* ── SCHEDULE + CONTACT: sticky note style ── */}
        <div className="flex flex-wrap justify-center gap-6">
          {sections.schedule && schedule.length > 0 && (
            <div className="bg-yellow-100 p-5 shadow-md" style={{
              transform: 'rotate(1deg)', minWidth: 220, maxWidth: 280,
              boxShadow: '4px 4px 16px rgba(0,0,0,0.12)',
            }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: p, fontFamily: 'Courier New, monospace' }}>
                📌 Lịch dạy
              </p>
              <div className="space-y-1.5" style={{ fontFamily: 'Courier New, monospace' }}>
                {visSchedule.map((s, i) => (
                  <div key={i} className="text-[11px] text-amber-900">
                    <span className="font-bold">{s.day}</span>: {s.time}
                    <div className="text-amber-700 pl-2">{s.subject}</div>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
            </div>
          )}

          {sections.contact && (
            <div className="bg-pink-100 p-5 shadow-md" style={{
              transform: 'rotate(-1.5deg)', minWidth: 220, maxWidth: 280,
              boxShadow: '4px 4px 16px rgba(0,0,0,0.12)',
            }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: p, fontFamily: 'Courier New, monospace' }}>
                📌 Liên hệ
              </p>
              <div className="space-y-2" style={{ fontFamily: 'Courier New, monospace' }}>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-[11px] text-pink-900 hover:underline">
                    <Mail className="w-3 h-3 shrink-0" style={{ color: p }} /> {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-[11px] text-pink-900">
                    <Phone className="w-3 h-3 shrink-0" style={{ color: p }} /> {contact.phone}
                  </a>
                )}
                {contact.facebook && (
                  <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] hover:underline" style={{ color: p }}>
                    <ExternalLink className="w-3 h-3 shrink-0" /> Facebook
                  </a>
                )}
                {contact.zalo && (
                  <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] hover:underline" style={{ color: p }}>
                    <ExternalLink className="w-3 h-3 shrink-0" /> Zalo
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
