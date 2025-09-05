'use client'

import { useEffect, useMemo, useState } from 'react'
import api from '@/utils/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type Category = {
  _id: string
  name: string
  slug: string
  order: number
  isActive: boolean
}

export default function CategoriesPage() {
  const router = useRouter()
  const [list, setList] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/menu-categories')
      setList(data?.categories || [])
    } catch (e: any) {
      const s = e?.response?.status
      if (s === 401 || s === 403) router.replace('/auth/login')
      toast.error(e?.response?.data?.message || 'Failed to load categories')
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Name is required')
    try {
      setSaving(true)
      await api.post('/menu-categories', { name: name.trim(), isActive })
      setName('')
      setIsActive(true)
      await load()
      toast.success('Category added')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (cat: Category) => {
    try {
      await api.put(`/menu-categories/${cat._id}`, { isActive: !cat.isActive })
      setList((arr) => arr.map((c) => c._id === cat._id ? { ...c, isActive: !c.isActive } : c))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Update failed')
    }
  }

  const rename = async (cat: Category, nextName: string) => {
    if (!nextName.trim() || nextName.trim() === cat.name) return
    try {
      await api.put(`/menu-categories/${cat._id}`, { name: nextName.trim() })
      setList((arr) => arr.map((c) => c._id === cat._id ? { ...c, name: nextName.trim() } : c))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Rename failed')
    }
  }

  const remove = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"?`)) return
    try {
      await api.delete(`/menu-categories/${cat._id}`)
      setList((arr) => arr.filter((c) => c._id !== cat._id))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Delete failed')
    }
  }

  const move = async (cat: Category, dir: -1 | 1) => {
    const idx = list.findIndex((c) => c._id === cat._id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= list.length) return
    const clone = [...list]
    const a = clone[idx], b = clone[swapIdx]
    ;[clone[idx], clone[swapIdx]] = [b, a]
    // assign new order
    const ordered = clone.map((c, i) => ({ ...c, order: i }))
    setList(ordered)
    try {
      await api.post('/menu-categories/reorder', {
        order: ordered.map((c) => ({ _id: c._id, order: c.order }))
      })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Reorder failed')
      load()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-neutral-900">
        <h1 className="text-2xl font-bold">Menu Categories</h1>
      </div>

      <div className="bg-white backdrop-blur-md rounded-2xl border border-neutral-200 shadow-xl p-4 text-neutral-900">
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <div className="mb-1 opacity-90">Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg bg-white text-black px-3 py-2"
              placeholder="e.g., Soups"
              required
            />
          </label>

          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-neutral-900 hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add category'}
          </button>
        </form>
      </div>

      <div className="bg-white backdrop-blur-md rounded-2xl border border-neutral-200 shadow-xl overflow-x-auto">
        {loading ? (
          <div className="p-4 text-sm text-neutral-900/85">Loading…</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-white text-neutral-900/90">
              <tr>
                <th className="px-3 py-2 text-left">Order</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Slug</th>
                <th className="px-3 py-2 text-left">Active</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => (
                <tr key={c._id} className="border-t border-white/10 text-neutral-900/90">
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => move(c, -1)}
                        className="px-2 py-1 rounded border border-white/30 bg-white hover:bg-white/20"
                        disabled={i === 0}
                        type="button"
                      >↑</button>
                      <button
                        onClick={() => move(c, +1)}
                        className="px-2 py-1 rounded border border-white/30 bg-white hover:bg-white/20"
                        disabled={i === list.length - 1}
                        type="button"
                      >↓</button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      defaultValue={c.name}
                      onBlur={(e) => rename(c, e.target.value)}
                      className="rounded-md bg-white/80 text-black px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">{c.slug}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`px-2 py-1 rounded border ${c.isActive
                        ? 'bg-emerald-300/20 border-emerald-200/30 text-emerald-100'
                        : 'bg-white border-neutral-200 text-neutral-900/80'}`}
                      type="button"
                    >
                      {c.isActive ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => remove(c)}
                      className="px-2 py-1 rounded border border-rose-300/40 bg-rose-500/20 text-rose-50 hover:bg-rose-500/25"
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-neutral-900/80">No categories.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
