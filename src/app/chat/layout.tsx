'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Upload, BookOpen, Wand2, Users, MessageCircle,
  BarChart3, LogOut, Menu, X, ChevronRight, Sigma,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'Chính' },
  { href: '/upload', icon: Upload, label: 'Upload PDF', section: 'Chính' },
  { href: '/bank', icon: BookOpen, label: 'Ngân hàng đề', section: 'Quản lý' },
  { href: '/generate', icon: Wand2, label: 'Sinh đề AI', section: 'Quản lý' },
  { href: '/classes', icon: Users, label: 'Lớp học', section: 'Quản lý' },
  { href: '/chat', icon: MessageCircle, label: 'Gia sư AI', section: 'Quản lý' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 text-text-muted">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        Đang tải...
      </div>
    </div>
  )

  if (!user) return null

  const sections = NAV.reduce<Record<string, typeof NAV>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {})

  const initials = (user.full_name || user.email).slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-bg-card border-r border-bg-border z-50',
        'flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-bg-border">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-lg">
            <Sigma size={20} />
          </div>
          <div>
            <div className="font-bold text-text text-base leading-tight">MathPlay</div>
            <div className="text-xs text-text-dim">Teacher Dashboard</div>
          </div>
          <button
            className="ml-auto lg:hidden text-text-dim hover:text-text"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-b border-bg-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text truncate">{user.full_name || user.email}</div>
              <div className="text-xs text-text-dim">Giáo viên</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <div className="text-xs font-semibold text-text-dim uppercase tracking-wider px-3 mb-1.5">
                {section}
              </div>
              <div className="space-y-0.5">
                {items.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn('nav-link', active && 'active')}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon size={16} />
                      {item.label}
                      {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-bg-border">
          <button
            onClick={logout}
            className="nav-link w-full hover:text-red-400 hover:bg-red-400/10"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-bg-card border-b border-bg-border sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-muted hover:text-text"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
              <Sigma size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm">MathPlay</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
