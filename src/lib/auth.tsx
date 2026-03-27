'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authApi, getErrorMessage } from '@/lib/api'
import type { User } from '@/types'

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      document.cookie = 'has_token=; path=/; max-age=0'
      setLoading(false)
      return
    }
    authApi.me()
      .then((u) => {
        setUser(u)
        document.cookie = 'has_token=1; path=/; max-age=691200; SameSite=Lax'
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        document.cookie = 'has_token=; path=/; max-age=0'
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const token = await authApi.login({ email, password })
    localStorage.setItem('access_token', token.access_token)
    // Set cookie flag so server-side middleware can detect auth
    document.cookie = 'has_token=1; path=/; max-age=691200; SameSite=Lax'
    const me = await authApi.me()
    setUser(me)
  }

  const logout = async () => {
    await authApi.logout()
    document.cookie = 'has_token=; path=/; max-age=0'
    setUser(null)
    window.location.href = '/login'
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
