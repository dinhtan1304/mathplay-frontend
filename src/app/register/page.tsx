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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.05)_0%,transparent_50%)]" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-500 items-center justify-center mb-5 shadow-glow">
            <Sigma size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text tracking-tight">Tạo tài khoản giáo viên</h1>
          <p className="text-text-dim text-sm mt-2">Miễn phí, không cần thẻ tín dụng</p>
        </div>

        <div className="card p-7 animate-slide-up">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-text-muted mb-2 block uppercase tracking-wider">Họ và tên</label>
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-2 block uppercase tracking-wider">Email *</label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="teacher@school.edu.vn"
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-2 block uppercase tracking-wider">Mật khẩu *</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Ít nhất 8 ký tự, có chữ và số"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2.5 flex gap-3">
                  {[
                    { label: '8+ ký tự', ok: form.password.length >= 8 },
                    { label: 'Chữ cái', ok: /[A-Za-z]/.test(form.password) },
                    { label: 'Số', ok: /[0-9]/.test(form.password) },
                  ].map(c => (
                    <div key={c.label} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${c.ok ? 'text-emerald-400' : 'text-text-dim/50'}`}>
                      {c.ok ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-text-dim/30" />}
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-2 block uppercase tracking-wider">Xác nhận mật khẩu *</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Nhập lại mật khẩu"
                className="input"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 px-3.5 py-2.5 rounded-xl">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-text-dim">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
