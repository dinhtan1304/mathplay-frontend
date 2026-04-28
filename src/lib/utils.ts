import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  NB: 'Nhận biết', TH: 'Thông hiểu', VD: 'Vận dụng', VDC: 'Vận dụng cao',
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  NB: 'text-green-400 bg-green-400/10',
  TH: 'text-blue-400 bg-blue-400/10',
  VD: 'text-yellow-400 bg-yellow-400/10',
  VDC: 'text-red-400 bg-red-400/10',
}

export const TYPE_LABELS: Record<string, string> = {
  TN: 'Trắc nghiệm', TL: 'Tự luận',
}

export const SUBJECT_LABELS: Record<string, string> = {
  'toan': 'Toán', 'tieng-viet': 'Tiếng Việt', 'ngu-van': 'Ngữ văn', 'tieng-anh': 'Tiếng Anh',
  'tnxh': 'TN&XH', 'khoa-hoc': 'Khoa học', 'khtn': 'KHTN',
  'vat-li': 'Vật lí', 'hoa-hoc': 'Hóa học', 'sinh-hoc': 'Sinh học',
  'ls-dl': 'LS&ĐL', 'lich-su': 'Lịch sử', 'dia-li': 'Địa lí',
  'dao-duc': 'Đạo đức', 'gdcd': 'GDCD', 'gdktpl': 'KT&PL',
  'tin-hoc': 'Tin học', 'cong-nghe': 'Công nghệ',
  'gdtc': 'GDTC', 'am-nhac': 'Âm nhạc', 'my-thuat': 'Mỹ thuật',
  'hdtn': 'HĐTN', 'gdqpan': 'QP-AN',
  'ielts': 'IELTS',
}

export const GAME_MODE_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  drag_drop: 'Kéo thả',
  fill_blank: 'Điền chỗ trống',
  order_steps: 'Sắp xếp bước',
  find_error: 'Tìm lỗi',
  flashcard: 'Flashcard',
}

export function getLevelTitle(level: number): string {
  const titles = ['', 'Mới bắt đầu', 'Học sinh', 'Tiến bộ', 'Giỏi', 'Xuất sắc',
    'Siêu sao', 'Thần đồng', 'Huyền thoại', 'Bất khả chiến bại', 'Thiên tài']
  return titles[Math.min(level, titles.length - 1)] || `Cấp ${level}`
}

export function getScoreColor(score?: number | null): string {
  if (!score) return 'text-text-muted'
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}
