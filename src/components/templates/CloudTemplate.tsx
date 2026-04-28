'use client'
// CLOUD — Accordion FAQ layout: click to expand each section, floating sky aesthetic
import { useState } from 'react'
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2, ChevronDown, BookOpen, FileText, Calendar, Wifi, ArrowRight } from 'lucide-react'

function AccordionItem({
  icon, title, count, accent, defaultOpen = false, children,
}: {
  icon: React.ReactNode; title: string; count?: number; accent: string;
  defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-sm"
      style={{ border: `1px solid ${accent}30` }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-sky-50/50 transition">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sky-900 text-base">{title}</h2>
          {count != null && <p className="text-xs text-sky-500 mt-0.5">{count} mục</p>}
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`}
          style={{ color: accent }} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[2000px]' : 'max-h-0'}`}>
        <div className="px-6 pb-6 pt-1 border-t border-dashed" style={{ borderColor: `${accent}20` }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function CloudTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{
      background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 30%, #f0f9ff 100%)',
      color: '#0c4a6e',
    }}>
      {/* Clouds decoration */}
      <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden pointer-events-none">
        {[
          { w: 180, t: 30, l: '5%', op: 0.15 },
          { w: 120, t: 60, l: '30%', op: 0.1 },
          { w: 200, t: 20, l: '65%', op: 0.12 },
          { w: 140, t: 80, l: '82%', op: 0.08 },
        ].map((c, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ width: c.w, height: c.w * 0.55, top: c.t, left: c.l, background: 'white', opacity: c.op, filter: 'blur(8px)' }} />
        ))}
      </div>

      {/* ── HERO ── */}
      <div className="relative max-w-2xl mx-auto px-6 pt-14 pb-10 text-center">
        {teacher.avatar ? (
          <img src={teacher.avatar} alt={teacher.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-5"
            style={{ border: `4px solid white`, boxShadow: `0 8px 32px ${p}30` }} />
        ) : (
          <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${p}, #38bdf8)`, boxShadow: `0 8px 32px ${p}30` }}>
            {teacher.name.charAt(0)}
          </div>
        )}
        <p className="text-xs font-bold uppercase tracking-[0.3em] mb-1.5" style={{ color: p }}>{teacher.subject}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-sky-900 mb-2">{teacher.name}</h1>
        <p className="text-sky-600 text-sm mb-4">{teacher.school}</p>
        <div className="max-w-sm mx-auto bg-white rounded-3xl px-6 py-3 shadow-sm"
          style={{ border: `1px solid ${p}20` }}>
          <p className="text-sky-800 leading-relaxed text-sm italic">&ldquo;{teacher.tagline}&rdquo;</p>
        </div>
      </div>

      {/* ── ACCORDION SECTIONS ── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 space-y-3">

        {sections.courses && courses.length > 0 && (
          <AccordionItem icon={<BookOpen className="w-5 h-5" />} title="Khóa học" count={courses.length} accent={p} defaultOpen>
            <div className="space-y-3 mt-3">
              {visCourses.map((c, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: `${p}08`, border: `1px solid ${p}15` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold text-white" style={{ background: p }}>Lớp {c.grade}</span>
                    <h3 className="font-bold text-sky-900 text-sm">{c.name}</h3>
                  </div>
                  <p className="text-xs mb-1.5" style={{ color: p }}>{c.schedule}</p>
                  <p className="text-xs text-sky-700 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
          </AccordionItem>
        )}

        {sections.exams && exams.length > 0 && (
          <AccordionItem icon={<FileText className="w-5 h-5" />} title="Bộ đề thi" count={exams.length} accent="#0ea5e9">
            <div className="space-y-2 mt-3">
              {visExams.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)' }}>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold shrink-0 ${
                    e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'
                  }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sky-900 truncate">{e.title}</p>
                    <p className="text-xs text-sky-600 truncate">{e.desc}</p>
                  </div>
                  <span className="text-[10px] text-sky-400 font-mono shrink-0">{e.date}</span>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color="#0ea5e9" />
          </AccordionItem>
        )}

        {sections.quizzes && allQuizzes.length > 0 && (
          <AccordionItem icon={<Gamepad2 className="w-5 h-5" />} title="Quiz luyện tập" count={allQuizzes.length} accent="#0284c7">
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {quizzes.map(q => (
                <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                  className="group rounded-2xl p-4 hover:shadow-md transition flex flex-col"
                  style={{ background: 'rgba(2,132,199,0.06)', border: '1px solid rgba(2,132,199,0.15)' }}>
                  <h3 className="font-bold text-sky-900 text-sm leading-tight mb-1">{q.name}</h3>
                  <p className="text-[10px] text-sky-500 font-mono mb-2">{q.code} · {q.question_count} câu</p>
                  {q.description && <p className="text-xs text-sky-700 leading-relaxed line-clamp-2 mb-2 flex-1">{q.description}</p>}
                  <span className="text-xs font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition" style={{ color: p }}>
                    Tham gia <ArrowRight className="w-3 h-3" />
                  </span>
                </a>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color="#0284c7" />
          </AccordionItem>
        )}

        {sections.schedule && schedule.length > 0 && (
          <AccordionItem icon={<Calendar className="w-5 h-5" />} title="Lịch dạy" count={schedule.length} accent="#0369a1">
            <div className="grid sm:grid-cols-2 gap-2 mt-3">
              {visSchedule.map((s, i) => (
                <div key={i} className="rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ background: 'rgba(3,105,161,0.05)', border: '1px solid rgba(3,105,161,0.12)' }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p }} />
                  <div>
                    <p className="text-xs font-bold text-sky-900">{s.day}</p>
                    <p className="text-[10px] font-mono" style={{ color: p }}>{s.time}</p>
                    <p className="text-[10px] text-sky-600 mt-0.5">{s.subject}</p>
                  </div>
                </div>
              ))}
            </div>
            <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color="#0369a1" />
          </AccordionItem>
        )}

        {sections.contact && (
          <AccordionItem icon={<Wifi className="w-5 h-5" />} title="Liên hệ đăng ký" accent="#0c4a6e" defaultOpen>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 rounded-2xl p-4 transition hover:shadow-md text-white"
                  style={{ background: `linear-gradient(135deg, ${p}, #38bdf8)` }}>
                  <Mail className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium truncate">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-3 rounded-2xl p-4 transition hover:shadow-md"
                  style={{ background: `${p}10`, color: p, border: `1px solid ${p}20` }}>
                  <Phone className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{contact.phone}</span>
                </a>
              )}
              {contact.facebook && (
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl p-4 transition hover:shadow-md"
                  style={{ background: `${p}10`, color: p, border: `1px solid ${p}20` }}>
                  <ExternalLink className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">Facebook</span>
                </a>
              )}
              {contact.zalo && (
                <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl p-4 transition hover:shadow-md"
                  style={{ background: `${p}10`, color: p, border: `1px solid ${p}20` }}>
                  <ExternalLink className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">Zalo: {contact.zalo}</span>
                </a>
              )}
            </div>
          </AccordionItem>
        )}
      </div>
    </div>
  )
}
