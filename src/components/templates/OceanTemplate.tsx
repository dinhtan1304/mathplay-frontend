'use client'
// OCEAN — Full-bleed stacked sections with SVG wave dividers
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, ArrowRight } from 'lucide-react'

const WaveTop = ({ fill, bg }: { fill: string; bg: string }) => (
  <div style={{ background: bg }}>
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: 'block', height: 60, width: '100%' }}>
      <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 Z" fill={fill} />
    </svg>
  </div>
)

export default function OceanTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{ color: '#fff' }}>

      {/* ── SECTION 1: HERO ── */}
      <div className="relative overflow-hidden px-6 pt-20 pb-4 text-center"
        style={{ background: `linear-gradient(180deg, #042f2e 0%, #0d4a47 100%)` }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(20,184,166,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.3) 0%, transparent 50%)',
        }} />
        <div className="relative max-w-3xl mx-auto">
          {teacher.avatar ? (
            <img src={teacher.avatar} alt={teacher.name}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-6 shadow-2xl"
              style={{ border: `3px solid ${p}`, boxShadow: `0 0 40px ${p}40` }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6"
              style={{ background: `linear-gradient(135deg, ${p}, #0d9488)`, boxShadow: `0 0 40px ${p}40` }}>
              {teacher.name.charAt(0)}
            </div>
          )}
          <p className="text-teal-300 text-xs font-bold uppercase tracking-[0.3em] mb-2">{teacher.subject}</p>
          <h1 className="text-5xl font-extrabold text-white mb-3 leading-tight">{teacher.name}</h1>
          <p className="text-teal-200 text-sm mb-4">{teacher.school}</p>
          <p className="text-teal-100/80 max-w-lg mx-auto leading-relaxed">{teacher.tagline}</p>
          {teacher.bio && <p className="text-teal-200/60 text-sm mt-3 max-w-md mx-auto leading-relaxed">{teacher.bio}</p>}
        </div>
        <div className="h-12" />
      </div>

      {/* ── SECTION 2: COURSES ── */}
      {sections.courses && courses.length > 0 && (
        <>
          <WaveTop fill="#0f4f4b" bg="#0d4a47" />
          <div className="px-8 py-14" style={{ background: '#0f4f4b' }}>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-extrabold text-white mb-2">Khóa học</h2>
              <div className="w-12 h-1 rounded mb-8" style={{ background: p }} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visCourses.map((c, i) => (
                  <div key={i} className="rounded-2xl p-6 hover:scale-[1.02] transition-transform"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${p}40` }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{ background: `${p}25`, color: p }}>L{c.grade}</div>
                      <div>
                        <h3 className="font-bold text-white text-sm leading-tight">{c.name}</h3>
                      </div>
                    </div>
                    <p className="text-xs mb-2" style={{ color: p }}>{c.schedule}</p>
                    <p className="text-teal-200/70 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
            </div>
          </div>
        </>
      )}

      {/* ── SECTION 3: EXAMS + SCHEDULE ── */}
      {(sections.exams && exams.length > 0) || (sections.schedule && schedule.length > 0) ? (
        <>
          <WaveTop fill="#134e4a" bg="#0f4f4b" />
          <div className="px-8 py-14" style={{ background: '#134e4a' }}>
            <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-10">

              {/* Exams */}
              {sections.exams && exams.length > 0 && (
                <div>
                  <h2 className="text-2xl font-extrabold text-white mb-2">Bộ đề thi</h2>
                  <div className="w-10 h-1 rounded mb-6" style={{ background: p }} />
                  <div className="space-y-3">
                    {visExams.map((e, i) => (
                      <div key={i} className="p-4 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${p}30` }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm">{e.title}</h3>
                            <p className="text-xs text-teal-300 mt-0.5">{e.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              e.difficulty === 'easy' ? 'bg-green-900/50 text-green-300' :
                              e.difficulty === 'hard' ? 'bg-red-900/50 text-red-300' : 'bg-teal-900/50 text-teal-300'
                            }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                            <p className="text-xs text-teal-500 mt-1">{e.date}</p>
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
                  <h2 className="text-2xl font-extrabold text-white mb-2">Lịch dạy</h2>
                  <div className="w-10 h-1 rounded mb-6" style={{ background: p }} />
                  <div className="space-y-2">
                    {visSchedule.map((s, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${p}20` }}>
                        <div className="w-1 h-10 rounded-full shrink-0" style={{ background: p }} />
                        <div>
                          <p className="text-sm font-bold text-white">{s.day}</p>
                          <p className="text-xs text-teal-300">{s.time} · {s.subject}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {/* ── SECTION 3.5: QUIZZES ── */}
      {sections.quizzes && allQuizzes.length > 0 && (
        <>
          <WaveTop fill="#0d4a47" bg="#134e4a" />
          <div className="px-8 py-14" style={{ background: '#0d4a47' }}>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-extrabold text-white mb-2">Quiz luyện tập</h2>
              <div className="w-12 h-1 rounded mb-8" style={{ background: p }} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {quizzes.map(q => (
                  <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                    className="group rounded-2xl p-6 hover:scale-[1.02] transition-transform block"
                    style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${p}40` }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${p}25`, color: p }}>
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm leading-tight">{q.name}</h3>
                        <p className="text-xs text-teal-300 font-mono">{q.code}</p>
                      </div>
                    </div>
                    {q.description && <p className="text-teal-200/70 text-xs leading-relaxed mb-3 line-clamp-2">{q.description}</p>}
                    <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: `${p}30` }}>
                      <span className="text-teal-300">{q.question_count} câu</span>
                      <span className="font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition" style={{ color: p }}>
                        Tham gia <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
              <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
            </div>
          </div>
        </>
      )}

      {/* ── SECTION 4: CONTACT ── */}
      {sections.contact && (
        <>
          <WaveTop fill="#042f2e" bg={sections.quizzes && quizzes.length > 0 ? '#0d4a47' : '#134e4a'} />
          <div className="px-8 py-16 text-center" style={{ background: '#042f2e' }}>
            <div className="max-w-lg mx-auto">
              <h2 className="text-3xl font-extrabold text-white mb-3">Đăng ký học</h2>
              <p className="text-teal-300 mb-8">Liên hệ để nhận tư vấn miễn phí và đăng ký lớp</p>
              <div className="flex flex-wrap justify-center gap-3">
                {contact.email && (
                  <a href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium"
                    style={{ background: p }}>
                    <Mail className="w-4 h-4" /> {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                    <Phone className="w-4 h-4" /> {contact.phone}
                  </a>
                )}
                {contact.facebook && (
                  <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                    <ExternalLink className="w-4 h-4" /> Facebook
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
