'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import type { User } from '@/types'
import { Check, Edit, Loader2, ShieldAlert, UserCheck, X, Search, Filter } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [skip, setSkip] = useState(0)
  const limit = 20

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setSkip(0) // restart from page 1 when searching
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const fetchUsers = () => {
    setLoading(true)
    adminApi.getUsers(skip, limit, debouncedSearch, roleFilter)
      .then(res => {
        setUsers(res.items)
        setTotal(res.total)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setSkip(0) // reset page when role filter changes
  }, [roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [skip, debouncedSearch, roleFilter])

  const toggleStatus = async (user: User) => {
    const updated = await adminApi.updateUser(user.id, { is_active: !user.is_active })
    setUsers(users.map(u => (u.id === user.id ? updated : u)))
  }

  const changeRole = async (user: User, newRole: string) => {
    if (user.role === newRole) return
    const updated = await adminApi.updateUser(user.id, { role: newRole })
    setUsers(users.map(u => (u.id === user.id ? updated : u)))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Quản lý Người dùng</h1>
          <p className="text-text-muted text-sm">Tổng cộng {total} tài khoản trên hệ thống</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/50" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm email, ID, tên..." 
              className="input pl-9 h-10 w-64 text-sm" 
            />
          </div>
          
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/50" />
            <select 
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="input pl-9 h-10 appearance-none text-sm w-40"
            >
              <option value="">Tất cả quyền</option>
              <option value="student">Học sinh</option>
              <option value="teacher">Giáo viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-bg-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-dim uppercase bg-bg-hover/50 border-b border-bg-border">
              <tr>
                <th className="px-6 py-4 font-semibold w-24">ID</th>
                <th className="px-6 py-4 font-semibold">Email / Tên</th>
                <th className="px-6 py-4 font-semibold w-40">Quyền (Role)</th>
                <th className="px-6 py-4 font-semibold w-40">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-dim">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">Không có người dùng</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-bg-hover/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-text-dim">#{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text">{u.email}</div>
                      {u.full_name && <div className="text-xs text-text-muted mt-0.5">{u.full_name}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className={`text-xs p-1.5 pr-6 rounded-lg font-medium border-none focus:ring-1 focus:ring-accent ${
                          u.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                          u.role === 'teacher' ? 'bg-purple-500/10 text-purple-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          u.is_active 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 group' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20 group'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <UserCheck size={14} className="group-hover:hidden" />
                            <ShieldAlert size={14} className="hidden group-hover:block" />
                            <span className="group-hover:hidden">Active</span>
                            <span className="hidden group-hover:block">Khóa API</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={14} className="group-hover:hidden" />
                            <UserCheck size={14} className="hidden group-hover:block" />
                            <span className="group-hover:hidden">Vô hiệu hóa</span>
                            <span className="hidden group-hover:block">Mở khóa</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {total > limit && (
          <div className="px-6 py-4 border-t border-bg-border flex items-center justify-between">
            <span className="text-sm text-text-muted">
              Hiển thị {skip + 1} - {Math.min(skip + limit, total)} trên {total}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={skip === 0} 
                onClick={() => setSkip(s => Math.max(0, s - limit))}
                className="btn-ghost px-3 py-1.5 text-sm"
              >Trước</button>
              <button 
                disabled={skip + limit >= total} 
                onClick={() => setSkip(s => s + limit)}
                className="btn-ghost px-3 py-1.5 text-sm"
              >Sau</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
