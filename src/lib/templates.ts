export interface CourseItem {
  name: string
  grade: string
  schedule: string
  desc: string
  category?: string
}

export interface ExamItem {
  title: string
  date: string
  difficulty: 'easy' | 'medium' | 'hard'
  desc: string
  category?: string
}

export const SECTION_THRESHOLDS = { courses: 4, exams: 3, quiz: 3, schedule: 6 }

export interface ScheduleItem {
  day: string
  time: string
  subject: string
}

export interface PageConfig {
  teacher: {
    name: string
    subject: string
    bio: string
    school: string
    avatar: string
    tagline: string
  }
  colors: {
    primary: string
  }
  contact: {
    email: string
    phone: string
    zalo: string
    facebook: string
  }
  sections: {
    courses: boolean
    exams: boolean
    schedule: boolean
    quizzes: boolean
    contact: boolean
  }
  courses: CourseItem[]
  exams: ExamItem[]
  schedule: ScheduleItem[]
  quiz_codes: string[]
}

export interface QuizDisplayInfo {
  code: string
  name: string
  description?: string | null
  cover_image_url?: string | null
  question_count: number
  total_points?: number
  not_found?: boolean
}

export interface TeacherPageData {
  id: number
  template_id: string
  slug: string
  title: string
  config: PageConfig
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  theme: 'light' | 'dark' | 'colorful'
  primaryColor: string
  previewBg: string
  previewAccent: string
  tags: string[]
}

export const TEMPLATES: TemplateMetadata[] = [
  {
    id: 'horizon',
    name: 'Horizon',
    description: 'Tối giản, sáng sủa — phù hợp mọi môn học',
    theme: 'light',
    primaryColor: '#3b82f6',
    previewBg: '#f8fafc',
    previewAccent: '#3b82f6',
    tags: ['Tối giản', 'Sáng'],
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    description: 'Tối sang trọng với hiệu ứng kính mờ — ấn tượng và cao cấp',
    theme: 'dark',
    primaryColor: '#818cf8',
    previewBg: '#0f0a2e',
    previewAccent: '#818cf8',
    tags: ['Tối', 'Cao cấp', 'Glassmorphism'],
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: 'Pastel hồng nhẹ nhàng — dịu dàng và thân thiện',
    theme: 'light',
    primaryColor: '#f472b6',
    previewBg: '#fff0f6',
    previewAccent: '#f472b6',
    tags: ['Pastel', 'Nhẹ nhàng', 'Sáng'],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Xanh thiên nhiên — gần gũi, bình tĩnh, tin cậy',
    theme: 'light',
    primaryColor: '#16a34a',
    previewBg: '#f0fdf4',
    previewAccent: '#16a34a',
    tags: ['Xanh', 'Tự nhiên', 'Sáng'],
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Cyberpunk tối với viền phát sáng — cá tính và năng động',
    theme: 'dark',
    primaryColor: '#22d3ee',
    previewBg: '#030712',
    previewAccent: '#22d3ee',
    tags: ['Neon', 'Tối', 'Cá tính'],
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Xanh navy chuyên nghiệp — phong cách doanh nghiệp',
    theme: 'dark',
    primaryColor: '#60a5fa',
    previewBg: '#0f172a',
    previewAccent: '#60a5fa',
    tags: ['Chuyên nghiệp', 'Tối', 'Navy'],
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    description: 'Cam ấm rực rỡ — năng lượng và sáng tạo',
    theme: 'light',
    primaryColor: '#f97316',
    previewBg: '#fff7ed',
    previewAccent: '#f97316',
    tags: ['Cam', 'Ấm', 'Năng động'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Xanh teal sâu lắng — bình yên và chuyên nghiệp',
    theme: 'dark',
    primaryColor: '#14b8a6',
    previewBg: '#042f2e',
    previewAccent: '#14b8a6',
    tags: ['Teal', 'Tối', 'Bình yên'],
  },
  {
    id: 'chalk',
    name: 'Chalk',
    description: 'Bảng phấn cổ điển — gợi nhớ không gian lớp học truyền thống',
    theme: 'dark',
    primaryColor: '#fef9c3',
    previewBg: '#1a2e1a',
    previewAccent: '#fef9c3',
    tags: ['Cổ điển', 'Tối', 'Giáo dục'],
  },
  {
    id: 'prism',
    name: 'Prism',
    description: 'Gradient nhiều màu sắc — hiện đại, trẻ trung và sáng tạo',
    theme: 'colorful',
    primaryColor: '#a855f7',
    previewBg: '#faf5ff',
    previewAccent: '#a855f7',
    tags: ['Gradient', 'Màu sắc', 'Hiện đại'],
  },
  {
    id: 'daisy',
    name: 'Daisy',
    description: 'Dòng thời gian dọc nhẹ nhàng — như cuốn nhật ký dạy học',
    theme: 'light',
    primaryColor: '#f59e0b',
    previewBg: '#fffbeb',
    previewAccent: '#f59e0b',
    tags: ['Timeline', 'Nhật ký', 'Vàng'],
  },
  {
    id: 'marshmallow',
    name: 'Marshmallow',
    description: 'Bong bóng hội thoại pastel — gần gũi như chat với học trò',
    theme: 'light',
    primaryColor: '#fb7185',
    previewBg: '#fff1f2',
    previewAccent: '#fb7185',
    tags: ['Chat bubble', 'Pastel', 'Thân thiện'],
  },
  {
    id: 'linen',
    name: 'Linen',
    description: 'Trang sách mở đôi — nội dung dàn trải như tạp chí giáo dục',
    theme: 'light',
    primaryColor: '#b45309',
    previewBg: '#fef3c7',
    previewAccent: '#b45309',
    tags: ['Sách', 'Tạp chí', 'Be ấm'],
  },
  {
    id: 'origami',
    name: 'Origami',
    description: 'Hình học giấy gấp — các panel cắt vát hiện đại',
    theme: 'light',
    primaryColor: '#10b981',
    previewBg: '#ecfdf5',
    previewAccent: '#10b981',
    tags: ['Hình học', 'Mint', 'Sáng tạo'],
  },
  {
    id: 'lullaby',
    name: 'Lullaby',
    description: 'Carousel ngang kiểu story — nhẹ nhàng và dễ lướt',
    theme: 'light',
    primaryColor: '#a78bfa',
    previewBg: '#f5f3ff',
    previewAccent: '#a78bfa',
    tags: ['Story', 'Lavender', 'Carousel'],
  },
  {
    id: 'honey',
    name: 'Honey',
    description: 'Tổ ong lục giác — bố cục độc đáo và gọn gàng',
    theme: 'light',
    primaryColor: '#d97706',
    previewBg: '#fffbeb',
    previewAccent: '#d97706',
    tags: ['Hexagon', 'Honeycomb', 'Ấm áp'],
  },
  {
    id: 'petal',
    name: 'Petal',
    description: 'Polaroid scrapbook xoay nhẹ — như album kỷ niệm lớp học',
    theme: 'light',
    primaryColor: '#f472b6',
    previewBg: '#fdf2f8',
    previewAccent: '#f472b6',
    tags: ['Polaroid', 'Scrapbook', 'Hồng'],
  },
  {
    id: 'cloud',
    name: 'Cloud',
    description: 'Accordion mở rộng — gọn gàng, trên trời mây nhẹ',
    theme: 'light',
    primaryColor: '#38bdf8',
    previewBg: '#f0f9ff',
    previewAccent: '#38bdf8',
    tags: ['Accordion', 'Sky', 'Tối giản'],
  },
  {
    id: 'vanilla',
    name: 'Vanilla',
    description: 'Sidebar dọc + dòng nội dung — như app đọc nhẹ nhàng',
    theme: 'light',
    primaryColor: '#ca8a04',
    previewBg: '#fefce8',
    previewAccent: '#ca8a04',
    tags: ['Sidebar', 'Vàng kem', 'App'],
  },
  {
    id: 'pearl',
    name: 'Pearl',
    description: 'Masonry pinterest — các thẻ chiều cao khác nhau xếp tự nhiên',
    theme: 'light',
    primaryColor: '#64748b',
    previewBg: '#f8fafc',
    previewAccent: '#64748b',
    tags: ['Masonry', 'Pinterest', 'Tinh tế'],
  },
]

export const DEFAULT_CONFIG: PageConfig = {
  teacher: {
    name: 'Nguyễn Văn A',
    subject: 'Toán học',
    bio: 'Giáo viên với hơn 10 năm kinh nghiệm giảng dạy, chuyên luyện thi THPT Quốc gia và thi học sinh giỏi.',
    school: 'Trường THPT Nguyễn Trãi',
    avatar: '',
    tagline: 'Học tập hiệu quả — Thành công bền vững',
  },
  colors: {
    primary: '#6366f1',
  },
  contact: {
    email: 'giaovien@email.com',
    phone: '0912 345 678',
    zalo: '',
    facebook: '',
  },
  sections: {
    courses: true,
    exams: true,
    schedule: true,
    quizzes: true,
    contact: true,
  },
  courses: [
    { name: 'Lớp Toán 12 luyện thi ĐH', grade: '12', schedule: 'T2, T4, T6 — 19:00-21:00', desc: 'Ôn luyện toàn diện kiến thức Toán 12, luyện đề thi thử.' },
    { name: 'Lớp Toán 11 nâng cao', grade: '11', schedule: 'T3, T5 — 19:00-21:00', desc: 'Nâng cao tư duy toán học, chuẩn bị cho kỳ thi HSG.' },
    { name: 'Lớp Toán 10 cơ bản', grade: '10', schedule: 'T7, CN — 08:00-10:00', desc: 'Xây dựng nền tảng vững chắc cho học sinh lớp 10.' },
  ],
  exams: [
    { title: 'Đề thi thử THPT 2025 — Đợt 1', date: '2025-03-15', difficulty: 'medium', desc: 'Bộ đề bám sát cấu trúc đề thi chính thức Bộ GD&ĐT.' },
    { title: 'Đề HSG cấp tỉnh — Toán 11', date: '2025-04-01', difficulty: 'hard', desc: 'Tổng hợp đề thi học sinh giỏi các tỉnh thành.' },
    { title: 'Kiểm tra giữa kỳ 2 — Toán 12', date: '2025-04-20', difficulty: 'easy', desc: 'Đề kiểm tra 45 phút theo chương trình GDPT 2018.' },
  ],
  schedule: [
    { day: 'Thứ Hai', time: '19:00 - 21:00', subject: 'Toán 12 luyện thi ĐH' },
    { day: 'Thứ Ba', time: '19:00 - 21:00', subject: 'Toán 11 nâng cao' },
    { day: 'Thứ Tư', time: '19:00 - 21:00', subject: 'Toán 12 luyện thi ĐH' },
    { day: 'Thứ Năm', time: '19:00 - 21:00', subject: 'Toán 11 nâng cao' },
    { day: 'Thứ Sáu', time: '19:00 - 21:00', subject: 'Toán 12 luyện thi ĐH' },
    { day: 'Thứ Bảy', time: '08:00 - 10:00', subject: 'Toán 10 cơ bản' },
  ],
  quiz_codes: [],
}

export const COLOR_PRESETS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Pink', value: '#f472b6' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Cyan', value: '#22d3ee' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Sky', value: '#0ea5e9' },
]
