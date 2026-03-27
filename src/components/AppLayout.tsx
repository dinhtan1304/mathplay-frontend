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
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',     section: 'Tổng quan' },
  { href: '/upload',    icon: Upload,          label: 'Upload PDF',    section: 'Tổng quan' },
  { href: '/exams',     icon: FileText,        label: 'Đề thi',        section: 'Quản lý' },
  { href: '/bank',      icon: BookOpen,        label: 'Ngân hàng đề', section: 'Quản lý' },
  { href: '/generate',  icon: Wand2,           label: 'Sinh đề AI',   section: 'Quản lý' },
  { href: '/classes',   icon: Users,           label: 'Lớp học',      section: 'Lớp học' },
  { href: '/chat',      icon: MessageCircle,   label: 'Gia sư AI',    section: 'Lớp học' },
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
      <div className="flex flex-col items-center gap-4 text-text-muted">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-glow">
          <Sigma size={20} className="text-white" />
        </div>
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-screen z-50',
        'flex flex-col transition-[width] duration-200 ease-in-out overflow-hidden',
        'bg-bg-card border-r border-bg-border',
        'lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0 lg:shrink-0',
        collapsed ? 'w-[60px]' : 'w-[220px]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Brand */}
        <div className={cn(
          'flex items-center h-14 shrink-0 px-3.5 gap-3',
          collapsed && 'justify-center px-0'
        )}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_2px_8px_rgba(99,102,241,0.3)]">
            <Sigma size={15} strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="font-bold text-text text-sm leading-tight whitespace-nowrap tracking-tight">MathPlay</div>
              <div className="text-[10px] text-text-dim whitespace-nowrap font-medium">Teacher Dashboard</div>
            </div>
          )}
          <button className="lg:hidden text-text-dim hover:text-text ml-auto shrink-0 p-1" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-bg-border" />

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-1.5' : 'px-2.5')}>
          {Object.entries(sections).map(([section, items]) => (
            <div key={section} className="mb-3">
              {!collapsed && (
                <div className="text-[10px] font-bold text-text-dim/70 uppercase tracking-[0.08em] px-2.5 mb-1.5 whitespace-nowrap">
                  {section}
                </div>
              )}
              {collapsed && <div className="border-t border-bg-border/50 mb-2 mx-1" />}
              <div className="space-y-0.5">
                {items.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'nav-link group',
                        active && 'active',
                        collapsed && '!px-0 justify-center'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon size={16} className={cn('shrink-0 transition-colors', active ? 'text-accent' : 'text-text-dim group-hover:text-text-muted')} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-bg-border shrink-0 p-2.5">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 overflow-hidden">
                <div className="text-xs font-semibold text-text truncate whitespace-nowrap">{user.full_name || user.email}</div>
                <div className="text-[10px] text-text-dim whitespace-nowrap capitalize">{user.role || 'Teacher'}</div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            title={collapsed ? 'Đăng xuất' : undefined}
            className={cn(
              'nav-link w-full hover:text-red-400 hover:bg-red-400/8',
              collapsed && '!px-0 justify-center'
            )}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span className="truncate">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Desktop collapse toggle */}
      <button
        onClick={toggleCollapsed}
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        className={cn(
          'hidden lg:flex fixed top-1/2 -translate-y-1/2 z-50',
          'w-4 h-8 items-center justify-center',
          'bg-bg-card border border-bg-border rounded-r-lg',
          'text-text-dim hover:text-accent hover:border-accent/40 transition-all duration-200',
          collapsed ? 'left-[60px]' : 'left-[220px]'
        )}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-bg-card border-b border-bg-border shrink-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-text-dim hover:text-text transition-colors p-1 -ml-1">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-sm">
              <Sigma size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm tracking-tight">MathPlay</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  )
}
