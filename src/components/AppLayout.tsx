'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Upload, BookOpen, Wand2, Users, MessageCircle,
  LogOut, Menu, X, ChevronRight, ChevronLeft, Sigma, FileText,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',     section: 'Chính' },
  { href: '/upload',    icon: Upload,          label: 'Upload PDF',    section: 'Chính' },
  { href: '/exams',     icon: FileText,        label: 'Đề thi',        section: 'Quản lý' },
  { href: '/bank',      icon: BookOpen,        label: 'Ngân hàng đề', section: 'Quản lý' },
  { href: '/generate',  icon: Wand2,           label: 'Sinh đề AI',   section: 'Quản lý' },
  { href: '/classes',   icon: Users,           label: 'Lớp học',      section: 'Quản lý' },
  { href: '/chat',      icon: MessageCircle,   label: 'Gia sư AI',    section: 'Quản lý' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sidebar-collapsed') === 'true'
    return false
  })

  const toggleCollapsed = () => setCollapsed(c => {
    const next = !c
    localStorage.setItem('sidebar-collapsed', String(next))
    return next
  })

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
        'fixed top-0 left-0 h-screen bg-bg-card border-r border-bg-border z-50',
        'flex flex-col transition-[width] duration-200 ease-in-out overflow-hidden',
        'lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0 lg:shrink-0',
        collapsed ? 'w-14' : 'w-56',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Brand */}
        <div className={cn(
          'flex items-center border-b border-bg-border h-14 shrink-0 px-3 gap-3',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shrink-0">
            <Sigma size={16} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="font-bold text-text text-sm leading-tight whitespace-nowrap">MathPlay</div>
              <div className="text-[10px] text-text-dim whitespace-nowrap">Teacher Dashboard</div>
            </div>
          )}
          <button className="lg:hidden text-text-dim hover:text-text ml-auto shrink-0" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User */}
        <div className={cn(
          'border-b border-bg-border shrink-0 h-12 flex items-center px-3 gap-3',
          collapsed && 'justify-center'
        )}>
          <div
            className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold shrink-0"
            title={collapsed ? (user.full_name || user.email) : undefined}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <div className="text-xs font-semibold text-text truncate whitespace-nowrap">{user.full_name || user.email}</div>
              <div className="text-[10px] text-text-dim whitespace-nowrap">Giáo viên</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
          {Object.entries(sections).map(([section, items]) => (
            <div key={section} className="mb-4">
              {!collapsed && (
                <div className="text-[10px] font-semibold text-text-dim uppercase tracking-wider px-2 mb-1.5 whitespace-nowrap">
                  {section}
                </div>
              )}
              {collapsed && <div className="border-t border-bg-border mb-2 opacity-20" />}
              <div className="space-y-0.5">
                {items.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn('nav-link', active && 'active', collapsed && '!px-0 justify-center')}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon size={16} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && active && <ChevronRight size={12} className="ml-auto shrink-0 opacity-50" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-bg-border shrink-0 p-2">
          <button
            onClick={logout}
            title={collapsed ? 'Đăng xuất' : undefined}
            className={cn('nav-link w-full hover:text-red-400 hover:bg-red-400/10', collapsed && '!px-0 justify-center')}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span className="truncate">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Desktop collapse toggle tab */}
      <button
        onClick={toggleCollapsed}
        title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        className={cn(
          'hidden lg:flex fixed top-1/2 -translate-y-1/2 z-50',
          'w-4 h-10 items-center justify-center',
          'bg-bg-card border border-bg-border rounded-r-lg',
          'text-text-dim hover:text-accent hover:border-accent/50 transition-all duration-200',
          collapsed ? 'left-14' : 'left-56'
        )}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-bg-card border-b border-bg-border sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-text-muted hover:text-text">
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
