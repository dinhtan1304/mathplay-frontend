'use client'
// MARSHMALLOW — Chat-style speech bubbles, alternating left/right like a friendly conversation
import type { TemplateProps } from './types'
import { DIFFICULTY_LABEL } from './types'
import { SeeMoreLink } from './SeeMoreLink'
import { SECTION_THRESHOLDS } from '@/lib/templates'
import { Mail, Phone, ExternalLink, Gamepad2 } from 'lucide-react'

function Bubble({
  side, color, children,
}: { side: 'left' | 'right'; color?: string; children: React.ReactNode }) {
  const isLeft = side === 'left'
  const bg = color ?? (isLeft ? '#fff' : '#fce7f3')
  return (
    <div className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[85%] sm:max-w-[80%] relative ${isLeft ? 'ml-2' : 'mr-2'}`}>
        <div className="rounded-3xl px-5 py-4 shadow-sm"
          style={{
            background: bg,
            border: '1px solid #fce7f3',
            borderTopLeftRadius: isLeft ? 8 : 24,
            borderTopRightRadius: isLeft ? 24 : 8,
          }}>
          {children}
        </div>
        {/* tail */}
        <div className={`absolute top-0 w-3 h-3 ${isLeft ? '-left-1' : '-right-1'}`}
          style={{
            background: bg,
            borderLeft: isLeft ? '1px solid #fce7f3' : 'none',
            borderRight: isLeft ? 'none' : '1px solid #fce7f3',
            borderTop: '1px solid #fce7f3',
            clipPath: isLeft ? 'polygon(100% 0, 0 0, 100% 100%)' : 'polygon(0 0, 100% 0, 0 100%)',
          }} />
      </div>
    </div>
  )
}

function ChatRow({
  side, avatar, name, color, children,
}: { side: 'left' | 'right'; avatar?: string; name?: string; color?: string; children: React.ReactNode }) {
  const isLeft = side === 'left'
  const initial = name?.charAt(0) ?? 'T'
  return (
    <div className={`flex items-end gap-2 ${isLeft ? '' : 'flex-row-reverse'}`}>
      {avatar ? (
        <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: color ?? '#fb7185' }}>{initial}</div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export default function MarshmallowTemplate({ config, quizInfo, slug }: TemplateProps) {
  const { teacher, colors, contact, sections, courses, exams, schedule } = config
  const p = colors.primary
  const allQuizzes = (quizInfo ?? []).filter(q => !q.not_found)
  const visCourses = slug ? courses.slice(0, SECTION_THRESHOLDS.courses) : courses
  const visExams = slug ? exams.slice(0, SECTION_THRESHOLDS.exams) : exams
  const visSchedule = slug ? schedule.slice(0, SECTION_THRESHOLDS.schedule) : schedule
  const quizzes = slug ? allQuizzes.slice(0, SECTION_THRESHOLDS.quiz) : allQuizzes

  return (
    <div className="min-h-screen font-sans" style={{
      background: 'linear-gradient(180deg, #fff1f2 0%, #fdf2f8 100%)',
      color: '#500724',
    }}>

      {/* Header bar like a chat app */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-pink-100 px-5 py-3 flex items-center gap-3">
        {teacher.avatar ? (
          <img src={teacher.avatar} alt={teacher.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: p }}>{teacher.name.charAt(0)}</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-rose-900 text-sm leading-tight truncate">{teacher.name}</p>
          <p className="text-xs text-rose-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Đang online · {teacher.subject}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Intro bubbles */}
        <ChatRow side="left" avatar={teacher.avatar} name={teacher.name} color={p}>
          <Bubble side="left">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: p }}>{teacher.subject}</p>
            <p className="text-sm font-bold text-rose-900 mb-1">Xin chào! Tôi là {teacher.name} 👋</p>
            <p className="text-xs text-rose-700">Đang dạy tại {teacher.school}</p>
          </Bubble>
        </ChatRow>

        <ChatRow side="left" avatar={teacher.avatar} name={teacher.name} color={p}>
          <Bubble side="left">
            <p className="text-sm text-rose-900 leading-relaxed">{teacher.tagline}</p>
            {teacher.bio && <p className="text-xs text-rose-700 mt-2 leading-relaxed">{teacher.bio}</p>}
          </Bubble>
        </ChatRow>

        {/* Courses bubbles */}
        {sections.courses && courses.length > 0 && (
          <>
            <p className="text-center text-xs text-rose-400 my-3">— Khóa học hiện có —</p>
            {visCourses.map((c, i) => (
              <ChatRow key={i} side={i % 2 === 0 ? 'left' : 'right'} avatar={teacher.avatar} name={teacher.name} color={p}>
                <Bubble side={i % 2 === 0 ? 'left' : 'right'} color={i % 2 === 0 ? '#fff' : `${p}15`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                      style={{ background: p }}>Lớp {c.grade}</span>
                    <p className="font-bold text-rose-900 text-sm">{c.name}</p>
                  </div>
                  <p className="text-xs mb-1" style={{ color: p }}>{c.schedule}</p>
                  <p className="text-xs text-rose-700 leading-relaxed">{c.desc}</p>
                </Bubble>
              </ChatRow>
            ))}
            <SeeMoreLink slug={slug} section="courses" total={courses.length} threshold={SECTION_THRESHOLDS.courses} color={p} />
          </>
        )}

        {/* Exams bubble */}
        {sections.exams && exams.length > 0 && (
          <>
            <p className="text-center text-xs text-rose-400 my-3">— Bộ đề mới —</p>
            <ChatRow side="left" avatar={teacher.avatar} name={teacher.name} color={p}>
              <Bubble side="left">
                <p className="text-xs font-bold text-rose-900 mb-2">📝 Tài liệu cho học sinh</p>
                <div className="space-y-2">
                  {visExams.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        e.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        e.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-pink-100 text-pink-700'
                      }`}>{DIFFICULTY_LABEL[e.difficulty]}</span>
                      <span className="text-rose-900 font-medium truncate flex-1">{e.title}</span>
                      <span className="text-rose-400 font-mono">{e.date}</span>
                    </div>
                  ))}
                </div>
              </Bubble>
            </ChatRow>
            <SeeMoreLink slug={slug} section="exams" total={exams.length} threshold={SECTION_THRESHOLDS.exams} color={p} />
          </>
        )}

        {/* Quizzes — sent as "stickers" */}
        {sections.quizzes && allQuizzes.length > 0 && (
          <>
            <p className="text-center text-xs text-rose-400 my-3">— Quiz luyện tập —</p>
            <ChatRow side="left" avatar={teacher.avatar} name={teacher.name} color={p}>
              <Bubble side="left" color="transparent">
                <div className="grid sm:grid-cols-2 gap-2 -m-1">
                  {quizzes.map(q => (
                    <a key={q.code} href={`/play?code=${q.code}`} target="_blank" rel="noopener noreferrer"
                      className="rounded-2xl p-3 transition hover:scale-[1.02]"
                      style={{ background: 'white', border: `2px solid ${p}30` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ background: p }}>
                          <Gamepad2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-rose-900 text-xs truncate">{q.name}</p>
                          <p className="text-[10px] text-rose-500 font-mono">{q.code}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-rose-600">{q.question_count} câu · Bấm để chơi 🎮</p>
                    </a>
                  ))}
                </div>
              </Bubble>
            </ChatRow>
            <SeeMoreLink slug={slug} section="quiz" total={allQuizzes.length} threshold={SECTION_THRESHOLDS.quiz} color={p} />
          </>
        )}

        {/* Schedule */}
        {sections.schedule && schedule.length > 0 && (
          <>
            <p className="text-center text-xs text-rose-400 my-3">— Lịch dạy —</p>
            <ChatRow side="left" avatar={teacher.avatar} name={teacher.name} color={p}>
              <Bubble side="left">
                <p className="text-xs font-bold text-rose-900 mb-2">🗓 Tuần này tôi dạy</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {visSchedule.map((s, i) => (
                    <div key={i} className="bg-pink-50 rounded-lg px-2 py-1.5">
                      <p className="font-bold text-rose-900">{s.day}</p>
                      <p className="text-rose-600 font-mono">{s.time}</p>
                    </div>
                  ))}
                </div>
              </Bubble>
            </ChatRow>
            <SeeMoreLink slug={slug} section="schedule" total={schedule.length} threshold={SECTION_THRESHOLDS.schedule} color={p} />
          </>
        )}

        {/* Contact CTA bubble */}
        {sections.contact && (
          <>
            <p className="text-center text-xs text-rose-400 my-3">— Đăng ký lớp —</p>
            <ChatRow side="right" name="Bạn">
              <Bubble side="right" color={p}>
                <p className="text-xs text-white/80 mb-2 font-medium">Liên hệ với tôi qua:</p>
                <div className="flex flex-wrap gap-2">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`}
                      className="bg-white/20 hover:bg-white/30 transition rounded-full px-3 py-1.5 text-xs text-white font-medium flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> Email
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`}
                      className="bg-white/20 hover:bg-white/30 transition rounded-full px-3 py-1.5 text-xs text-white font-medium flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> {contact.phone}
                    </a>
                  )}
                  {contact.facebook && (
                    <a href={contact.facebook} target="_blank" rel="noopener noreferrer"
                      className="bg-white/20 hover:bg-white/30 transition rounded-full px-3 py-1.5 text-xs text-white font-medium flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3" /> Facebook
                    </a>
                  )}
                  {contact.zalo && (
                    <a href={`https://zalo.me/${contact.zalo}`} target="_blank" rel="noopener noreferrer"
                      className="bg-white/20 hover:bg-white/30 transition rounded-full px-3 py-1.5 text-xs text-white font-medium flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3" /> Zalo
                    </a>
                  )}
                </div>
              </Bubble>
            </ChatRow>
          </>
        )}
      </div>
    </div>
  )
}
