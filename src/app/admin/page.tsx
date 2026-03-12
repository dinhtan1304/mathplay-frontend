'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { Users, Database, FileText, Activity, ShieldCheck } from 'lucide-react'

interface Stats {
  total_users: number
  total_questions: number
  total_exams: number
  active_users: number
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string; value: string | number; icon: any; color: string; bg: string }) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-2xl p-6 shadow-sm flex items-center gap-4 group hover:border-accent/40 transition-colors">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={28} className={color} />
      </div>
      <div>
        <h3 className="text-3xl font-bold font-space text-text group-hover:text-accent transition-colors">{value.toLocaleString()}</h3>
        <p className="text-sm text-text-muted mt-1 uppercase tracking-wider font-semibold">{title}</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text mb-2">Tổng quan</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-bg-card border border-bg-border rounded-2xl p-6 h-28 skeleton" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={24} className="text-accent" />
          <h1 className="text-3xl font-bold text-text">Tổng quan Hệ thống</h1>
        </div>
        <p className="text-text-muted text-sm">Quản lý thống kê và tình trạng hoạt động của nền tảng MathPlay.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Người dùng"
          value={stats.total_users}
          icon={Users}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <StatCard
          title="Người dùng Active"
          value={stats.active_users}
          icon={Activity}
          color="text-green-500"
          bg="bg-green-500/10"
        />
        <StatCard
          title="Câu hỏi (Bank)"
          value={stats.total_questions}
          icon={Database}
          color="text-purple-500"
          bg="bg-purple-500/10"
        />
        <StatCard
          title="Lượt Parse Đề"
          value={stats.total_exams}
          icon={FileText}
          color="text-orange-500"
          bg="bg-orange-500/10"
        />
      </div>

      <div className="bg-bg-card border border-bg-border rounded-2xl p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
        <h2 className="text-xl font-bold text-text mb-4 relative z-10">Chào mừng Admin!</h2>
        <p className="text-text-dim max-w-2xl relative z-10 leading-relaxed">
          Sử dụng sidebar bên trái để truy cập quản lý người dùng, phân quyền (Teacher/Student) hoặc vô hiệu hóa tài khoản vi phạm.
          Bạn cũng có thể xem và kiểm duyệt toàn bộ ngân hàng câu hỏi trên hệ thống.
        </p>
      </div>
    </div>
  )
}
