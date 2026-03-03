'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { classesApi, getErrorMessage } from '@/lib/api'
import type { ClassRoom, ClassCreate } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import {
  Users, Plus, X, Loader2, Copy, Check, BookOpen,
  ChevronRight, GraduationCap, ClipboardList,
} from 'lucide-react'

function CreateModal({ onCreated, onClose }: {
  onCreated: (cls: ClassRoom) => void; onClose: () => void
}) {
  const [form, setForm] = useState<ClassCreate>({ name: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!form.name.trim()) { setError('Tên lớp không được trống'); return }
    setSaving(true)
    try {
      const cls = await classesApi.create(form)
      onCreated(cls)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-bg-border flex items-center justify-between">
          <h3 className="font-semibold text-text">Tạo lớp học mới</h3>
          <button onClick={onClose}><X size={18} className="text-text-dim hover:text-text" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Tên lớp *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="VD: Toán 10A1"
              className="input"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Môn học</label>
              <input value={form.subject || ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Toán" className="input" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Khối lớp</label>
              <select value={form.grade || ''} onChange={e => setForm(f => ({ ...f, grade: Number(e.target.value) || undefined }))} className="input">
                <option value="">Chọn lớp</option>
                {[6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Mô tả</label>
            <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none h-20" placeholder="Mô tả về lớp học..." />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>
        <div className="px-5 py-4 border-t border-bg-border flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost">Hủy</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Tạo lớp
          </button>
        </div>
      </div>
    </div>
  )
}

function ClassCard({ cls }: { cls: ClassRoom }) {
  const [copied, setCopied] = useState(false)

  const copyCode = (e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard.writeText(cls.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Link href={`/classes/${cls.id}`} className="card p-5 block hover:border-accent/40 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <GraduationCap size={20} className="text-accent" />
        </div>
        <ChevronRight size={16} className="text-text-dim group-hover:text-accent transition-colors" />
      </div>
      <div className="mb-3">
        <div className="font-semibold text-text">{cls.name}</div>
        {cls.subject && <div className="text-sm text-text-muted mt-0.5">{cls.subject}{cls.grade ? ` • Lớp ${cls.grade}` : ''}</div>}
        {cls.description && <div className="text-xs text-text-dim mt-1 line-clamp-2">{cls.description}</div>}
      </div>
      <div className="flex items-center gap-4 text-xs text-text-muted border-t border-bg-border pt-3">
        <div className="flex items-center gap-1">
          <Users size={12} />
          {cls.member_count} học sinh
        </div>
        <div className="flex items-center gap-1">
          <ClipboardList size={12} />
          {cls.assignment_count} bài tập
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="font-mono bg-bg-hover px-2 py-0.5 rounded text-accent text-[11px] tracking-wider">{cls.code}</span>
          <button onClick={copyCode} className="w-6 h-6 rounded flex items-center justify-center hover:bg-bg-hover transition-colors">
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} className="text-text-dim" />}
          </button>
        </div>
      </div>
    </Link>
  )
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    classesApi.list()
      .then(setClasses)
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showCreate && (
        <CreateModal
          onCreated={cls => { setClasses(prev => [cls, ...prev]); setShowCreate(false) }}
          onClose={() => setShowCreate(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Lớp học</h1>
          <p className="text-text-muted text-sm mt-1">{classes.length} lớp đang quản lý</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={16} /> Tạo lớp mới
        </button>
      </div>

      {error && <div className="card p-4 text-red-400 text-sm">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-44 skeleton" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="card py-20 flex flex-col items-center justify-center text-center">
          <BookOpen size={40} className="text-text-dim mb-3" />
          <div className="text-text-muted mb-1">Bạn chưa có lớp học nào</div>
          <div className="text-text-dim text-sm mb-4">Tạo lớp học để bắt đầu giao bài tập cho học sinh</div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={16} /> Tạo lớp đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => <ClassCard key={cls.id} cls={cls} />)}
        </div>
      )}
    </div>
  )
}
