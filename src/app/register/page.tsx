'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi, getErrorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Sigma, Eye, EyeOff, Loader2, Check } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Vui lòng nhập đầy đủ thông tin'); return }
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    if (form.password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return }
    if (!/[A-Za-z]/.test(form.password)) { setError('Mật khẩu phải có ít nhất 1 chữ cái'); return }
    if (!/[0-9]/.test(form.password)) { setError('Mật khẩu phải có ít nhất 1 chữ số'); return }
    setLoading(true)
    setError('')
    try {
      await authApi.register({ email: form.email, password: form.password, full_name: form.full_name || undefined, role: 'teacher' })
      await login(form.email, form.password)
      router.push('/dashboard')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = form.password.length >= 8 && /[A-Za-z]/.test(form.password) && /[0-9]/.test(form.password)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-accent items-center justify-center mb-4">
            <Sigma size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">Tạo tài khoản giáo viên</h1>
          <p className="text-text-muted text-sm mt-1">Miễn phí · Không cần thẻ tín dụng</p>
        </div>

        <div className="card p-6 animate-slide-up">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm text-text-muted mb-1.5 block">Họ và tên</label>
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1.5 block">Email *</label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="teacher@school.edu.vn"
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1.5 block">Mật khẩu *</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Ít nhất 8 ký tự, có chữ và số"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex gap-2">
                  {[
                    { label: '8+ ký tự', ok: form.password.length >= 8 },
                    { label: 'Chữ cái', ok: /[A-Za-z]/.test(form.password) },
                    { label: 'Số', ok: /[0-9]/.test(form.password) },
                  ].map(c => (
                    <div key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-green-400' : 'text-text-dim'}`}>
                      {c.ok ? <Check size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-text-dim" />}
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1.5 block">Xác nhận mật khẩu *</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Nhập lại mật khẩu"
                className="input"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-text-muted">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
