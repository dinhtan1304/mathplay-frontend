'use client'
// CHALK — Tabbed notebook: click-through "pages" like a physical binder
import { useState } from 'react'
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink } from 'lucide-react'

type Tab = 'profile' | 'courses' | 'exams' | 'quizzes' | 'schedule' | 'contact'

export default function ChalkTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes
  const [tab, setTab] = useState<Tab>('profile')

  const allTabs: { key: Tab; label: string; emoji: string; show: boolean }[] = [
    { key: 'profile' as Tab, label: 'Giới thiệu', emoji: '👩‍🏫', show: true },
    { key: 'courses' as Tab, label: 'Khóa học', emoji: '📚', show: !!(sections.courses && courses.length > 0) },
    { key: 'exams' as Tab, label: 'Bộ đề', emoji: '📝', show: !!(sections.exams && exams.length > 0) },
    { key: 'quizzes' as Tab, label: 'Quiz', emoji: '🎮', show: !!(sections.quizzes && allQuizzes.length > 0) },
    { key: 'schedule' as Tab, label: 'Lịch học', emoji: '🗓', show: !!(sections.schedule && schedule.length > 0) },
    { key: 'contact' as Tab, label: 'Liên hệ', emoji: '📬', show: !!sections.contact },
  ]
  const tabs = allTabs.filter(t => t.show)

  return (
    <div className="min-h-screen" style={{
      background: '#1a2e1a',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,255,255,0.04) 29px, rgba(255,255,255,0.04) 30px)',
      fontFamily: '"Courier New", "Courier", monospace',
    }}>

      {/* ── NOTEBOOK BINDING ── */}
      <div className="flex">
        {/* Spine */}
        <div className="w-8 shrink-0 flex flex-col items-center py-6 gap-4"
          style={{ background: '#111f11', borderRight: '2px solid #2d4a2d' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full"
              style={{ background: i % 3 === 0 ? p : '#2d4a2d' }} />
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          {/* ── TAB ROW ── */}
          <div className="flex items-end gap-0 pt-4 px-4 overflow-x-auto">
            {tabs.map((t, i) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-4 py-2 text-xs font-bold rounded-t-xl transition-all shrink-0 relative"
                style={{
                  marginRight: 2,
                  background: tab === t.key ? '#f5f0d8' : `rgba(245,240,216,${0.06 + i * 0.02})`,
                  color: tab === t.key ? '#1a2e1a' : `${p}90`,
                  border: `1px solid ${tab === t.key ? '#c8b88a' : 'transparent'}`,
                  borderBottom: tab === t.key ? '1px solid #f5f0d8' : `1px solid ${p}30`,
                  zIndex: tab === t.key ? 10 : 1,
                  fontFamily: 'inherit',
                }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          {/* ── PAGE CONTENT ── */}
          <div className="flex-1 mx-4 mb-4 p-6 rounded-b-2xl rounded-tr-2xl"
            style={{ background: '#f5f0d8', border: '1px solid #c8b88a', color: '#1a2e1a', minHeight: 400 }}>

            {/* Red margin line */}
            <div className="flex gap-4 h-full">
              <div className="w-px bg-red-400 shrink-0 opacity-50" />
              <div className="flex-1">

                {/* PROFILE PAGE */}
                {tab === 'profile' && (
                  <div>
                    <div className="flex items-start gap-6 mb-6">
                      {teacher.avatar ? (
                        <img src={teacher.avatar} alt={teacher.name}
                          className="w-20 h-20 rounded shrink-0"
                          style={{ border: '3px dashed #c8b88a', filter: 'sepia(10%)' }} />
                      ) : (
                        <div className="w-20 h-20 rounded flex items-center justify-center text-3xl font-bold shrink-0"
                          style={{ border: '3px dashed #c8b88a', color: '#1a2e1a', background: 'rgba(200,184,138,0.2)' }}>
                          {teacher.name.charAt(0)}
                        </div>
                      )}
                      <div className="font-mono">
                        <p className="text-xs text-amber-700 uppercase tracking-widest mb-1">{teacher.subject}</p>
                        <h1 className="text-3xl font-extrabold mb-1" style={{ color: '#1a2e1a' }}>{teacher.name}</h1>
                        <p className="text-sm text-amber-800">{teacher.school}</p>
                      </div>
                    </div>
                    <div className="border-t border-dashed border-amber-300 pt-4">
                      <p className="text-sm leading-loose text-amber-900 italic">&ldquo;{teacher.tagline}&rdquo;</p>
                      {teacher.bio && <p className="text-sm leading-loose text-amber-800 mt-3">{teacher.bio}</p>}
                    </div>
                    <div className="mt-6 text-xs text-amber-600">
                      <p>— Trang 1 / {tabs.length} —</p>
                    </div>
                  </div>
                )}

                {/* COURSES PAGE */}
                {tab === 'courses' && (
                  <div>
                    <h2 className="text-lg font-extrabold mb-4 underline decoration-dashed decoration-amber-400" style={{ color: '#1a2e1a' }}>
                      📚 Danh sách khóa học
                    </h2>
                    <div className="space-y-3">
                      {visCourses.map((c, i) => (
                        <div key={i} className="flex gap-4 leading-loose border-b border-dashed border-amber-200 pb-3">
                          <span className="text-amber-500 font-bold w-6 shrink-0">{i + 1}.</span>
                          <div>
                            <p className="font-bold">{c.name} <span className="font-normal text-amber-700">(Lớp {c.grade})</span></p>
                            <p className="text-sm text-amber-800">{c.schedule}</p>
                            <p className="text-xs text-amber-700 italic">{c.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
                  </div>
                )}

                {/* EXAMS PAGE */}
                {tab === 'exams' && (
                  <div>
                    <h2 className="text-lg font-extrabold mb-4 underline decoration-dashed decoration-amber-400" style={{ color: '#1a2e1a' }}>
                      📝 Bộ đề thi
                    </h2>
                    <div className="space-y-3">
                      {visExams.map((e, i) => (
                        <div key={i} className="flex gap-4 leading-loose border-b border-dashed border-amber-200 pb-3">
                          <span className="text-amber-500 font-bold w-6 shrink-0">✎</span>
                          <div className="flex-1">
                            <p className="font-bold">{e.title}</p>
                            <p className="text-xs text-amber-700 italic">{e.desc}</p>
                            <div className="flex gap-3 mt-1 text-xs">
                              <span className={`font-bold ${
                                e.difficulty === 'easy' ? 'text-green-700' :
                                e.difficulty === 'hard' ? 'text-red-700' : 'text-amber-700'
                              }`}>[{DIFFICULTY_LABEL[e.difficulty]}]</span>
                              <span className="text-amber-600">{e.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
                  </div>
                )}

                {/* QUIZZES PAGE */}
                {tab === 'quizzes' && (
                  <div>
                    <h2 className="text-lg font-extrabold mb-4 underline decoration-dashed decoration-amber-400" style={{ color: '#1a2e1a' }}>
                      🎮 Quiz luyện tập
                    </h2>
                    <div className="space-y-3">
                      {quizzes.map((q, i) => (
                        <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                          className="flex gap-4 leading-loose border-b border-dashed border-amber-200 pb-3 hover:bg-amber-50 transition rounded">
                          <span className="text-amber-500 font-bold w-6 shrink-0">{i + 1}.</span>
                          <div className="flex-1">
                            <p className="font-bold underline decoration-amber-400">{q.name}</p>
                            {q.description && <p className="text-xs text-amber-700 italic">{q.description}</p>}
                            <div className="flex gap-3 mt-1 text-xs">
                              <span className="font-bold text-amber-800">[{q.question_count} câu]</span>
                              <span className="text-amber-600 font-mono">mã: {q.code}</span>
                              <span className="text-amber-700 font-bold ml-auto">→ Tham gia</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                    <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
                  </div>
                )}

                {/* SCHEDULE PAGE */}
                {tab === 'schedule' && (
                  <div>
                    <h2 className="text-lg font-extrabold mb-4 underline decoration-dashed decoration-amber-400" style={{ color: '#1a2e1a' }}>
                      🗓 Thời khoá biểu
                    </h2>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-amber-300">
                          <th className="text-left pb-2 font-bold text-amber-800">Thứ</th>
                          <th className="text-left pb-2 font-bold text-amber-800">Giờ học</th>
                          <th className="text-left pb-2 font-bold text-amber-800">Môn học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visSchedule.map((s, i) => (
                          <tr key={i} className="border-b border-dashed border-amber-200">
                            <td className="py-2 font-bold" style={{ color: '#5c3d11' }}>{s.day}</td>
                            <td className="py-2 font-mono text-amber-800">{s.time}</td>
                            <td className="py-2 text-amber-900">{s.subject}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
                  </div>
                )}

                {/* CONTACT PAGE */}
                {tab === 'contact' && (
                  <div>
                    <h2 className="text-lg font-extrabold mb-6 underline decoration-dashed decoration-amber-400" style={{ color: '#1a2e1a' }}>
                      📬 Liên hệ đăng ký
                    </h2>
                    <div className="space-y-4 text-sm leading-loose">
                      {contact.email && (
                        <div className="flex items-center gap-3">
                          <span className="text-amber-500 font-bold w-20 shrink-0">✉ Email:</span>
                          <a href={`mailto:${contact.email}`} className="underline text-amber-900">{contact.email}</a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-3">
                          <span className="text-amber-500 font-bold w-20 shrink-0">☎ ĐT:</span>
                          <a href={`tel:${contact.phone}`} className="underline text-amber-900">{contact.phone}</a>
                        </div>
                      )}
                      {contact.facebook && (
                        <div className="flex items-center gap-3">
                          <span className="text-amber-500 font-bold w-20 shrink-0">🌐 FB:</span>
                          <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="underline text-amber-900">
                            {contact.facebook}
                          </a>
                        </div>
                      )}
                      {contact.zalo && (
                        <div className="flex items-center gap-3">
                          <span className="text-amber-500 font-bold w-20 shrink-0">💬 Zalo:</span>
                          <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer" className="underline text-amber-900">
                            {contact.zalo}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="mt-8 p-4 rounded" style={{ border: '2px dashed #c8b88a', background: 'rgba(200,184,138,0.15)' }}>
                      <p className="text-xs text-amber-700 font-bold">Ghi chú:</p>
                      <p className="text-xs text-amber-600 mt-1 italic">Vui lòng liên hệ trước ít nhất 1 tuần để đăng ký lớp học. Ưu tiên học sinh đã có nền tảng tốt.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
