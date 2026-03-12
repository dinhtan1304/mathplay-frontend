'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import type { User } from '@/types'
import {
  Users, Database, LayoutDashboard, Settings,
  LogOut, ShieldCheck, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    authApi.me()
      .then(u => {
        if (u.role !== 'admin') {
          router.replace('/dashboard')
        } else {
          setUser(u)
        }
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center font-mono text-sm">
        Đang xác thực quyền Admin...
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  const navs = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Quản lý Người dùng', href: '/admin/users', icon: Users },
    { name: 'Ngân hàng Đề chung', href: '/admin/questions', icon: Database },
  ]

  return (
    <div className="flex h-screen bg-bg text-text font-space overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-bg-card border-r border-bg-border flex flex-col z-20 shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-bg-border">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center mr-3 shadow-lg shadow-accent/20">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight">MathPlay Admin</h1>
            <p className="text-[10px] text-accent font-medium uppercase mt-0.5">Hệ thống Quản trị</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Quản lý</p>
          {navs.map(nav => {
            const active = pathname === nav.href
            const Icon = nav.icon
            return (
              <Link key={nav.name} href={nav.href}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-dim hover:text-text hover:bg-bg-hover'
                )}
              >
                <Icon size={18} className={active ? 'text-accent' : 'text-text-muted group-hover:text-text'} />
                {nav.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-bg-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.full_name || 'Admin'}</p>
              <p className="text-xs text-text-dim truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-text-dim hover:bg-red-400/10 hover:text-red-400 rounded-lg transition-colors">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-bg relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  )
}
