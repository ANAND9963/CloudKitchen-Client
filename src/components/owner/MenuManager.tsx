"use client";


import { useEffect, useMemo, useState } from 'react'
import api from '@/utils/api'
import toast from 'react-hot-toast'

type MenuItem = {
  _id: string
  title: string
  description?: string
  price: number
  imageUrl?: string
  category?: string   // label name
  isAvailable?: boolean
}

type Category = {
  _id: string
  name: string
  order: number
  isActive: boolean
}

const emptyItem: Partial<MenuItem> = {
  title: '',
  description: '',
  price: 0,
  category: '',
  isAvailable: true,
  imageUrl: '',
}

function normalizeMenus(data: any): MenuItem[] {
  const root = data?.menus ?? data?.data ?? data
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.docs)) return root.docs
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  return []
}

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const [cats, setCats] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(true)

  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form, setForm] = useState<Partial<MenuItem>>(emptyItem)
  const [imgPreview, setImgPreview] = useState<string>('')

  const [filterCat, setFilterCat] = useState<string>('')

  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/menus', { params: { limit: 200 } })
      const list = normalizeMenus(data)
      setItems(list)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load menus')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCats = async () => {
    try {
      setCatLoading(true)
      const { data } = await api.get('/menu-categories')
      setCats((data?.categories || []).filter((c: Category) => c.isActive))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load categories')
      setCats([])
    } finally {
      setCatLoading(false)
    }
  }

  useEffect(() => {
    fetchCats()
    fetchItems()
  }, [])

  const onChange = (k: keyof MenuItem, v: any) =>
    setForm((s) => ({ ...s, [k]: v }))

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const okTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!okTypes.includes(file.type)) return toast.error('Use PNG/JPG/WEBP')
    if (file.size > 2 * 1024 * 1024) return toast.error('Image too large (max 2MB)')
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = String(reader.result || '')
      setImgPreview(base64)
      onChange('imageUrl', base64)
    }
    reader.readAsDataURL(file)
  }

  const openNew = () => {
    setEditing(null)
    setForm(emptyItem)
    setImgPreview('')
    setOpenForm(true)
  }

  const openEdit = (it: MenuItem) => {
    setEditing(it)
    setForm(it)
    setImgPreview(it.imageUrl || '')
    setOpenForm(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = String(form.title || '').trim()
    const priceNum = Number(form.price)
    if (!title || isNaN(priceNum)) return toast.error('Title and price required')
    const payload = {
      title,
      description: form.description ?? '',
      price: priceNum,
      imageUrl: form.imageUrl || '',
      category: form.category || '',   // ← label name
      isAvailable: !!form.isAvailable,
    }
    try {
      if (editing) {
        await api.patch(`/menus/${editing._id}`, payload)
        toast.success('Menu updated')
      } else {
        await api.post('/menus', payload)
        toast.success('Menu created')
      }
      setOpenForm(false)
      await fetchItems()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this menu item?')) return
    try {
      await api.delete(`/menus/${id}`)
      toast.success('Menu deleted')
      setItems((arr) => arr.filter((x) => x._id !== id))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Delete failed')
    }
  }

  // Inline: quick create a label
  const [addingLabel, setAddingLabel] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const createLabel = async () => {
    const name = newLabel.trim()
    if (!name) return
    try {
      const { data } = await api.post('/menu-categories', { name })
      const cat = data?.category
      setCats((prev) => [...prev, cat].sort((a,b)=>a.order-b.order))
      setForm((s) => ({ ...s, category: cat?.name }))
      setNewLabel('')
      setAddingLabel(false)
      toast.success('Label added')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not add label')
    }
  }

  const list = useMemo(() => {
    if (!filterCat) return items
    return items.filter((it) => (it.category || '') === filterCat)
  }, [items, filterCat])

  return (
    <div className="bg-white backdrop-blur-md rounded-2xl border border-neutral-200 shadow-xl text-white">
      <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h2 className="font-semibold">Menus</h2>
        <div className="flex items-center gap-3">
          {/* Category filter */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-lg bg-white text-black px-3 py-1.5"
          >
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={openNew}
            className="rounded-lg bg-white/20 hover:bg-white/25 text-white px-3 py-1.5 border border-neutral-200"
          >
            + Add Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-neutral-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white">
              <tr className="text-white/90">
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Available</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((it) => (
                <tr key={it._id} className="border-t border-white/10">
                  <td className="px-3 py-2">
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs text-white/70">{it.description}</div>
                  </td>
                  <td className="px-3 py-2 text-white/90">{it.category || '-'}</td>
                  <td className="px-3 py-2 text-white/90">${Number(it.price ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      it.isAvailable ? 'bg-emerald-300/20 text-emerald-100 border border-emerald-200/30' : 'bg-white text-neutral-600 border border-neutral-200'
                    }`}>{it.isAvailable ? 'Yes' : 'No'}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => openEdit(it)} className="px-2 py-1 underline">Edit</button>
                    <button onClick={() => remove(it._id)} className="ml-2 px-2 py-1 text-rose-200 underline">Delete</button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-neutral-600">
                    No items in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {openForm && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
          <div className="w-full max-w-lg bg-white/95 rounded-2xl border shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-neutral-900">{editing ? 'Edit item' : 'Add item'}</h3>
              <button onClick={() => setOpenForm(false)} className="text-sm text-neutral-600">Close</button>
            </div>

            <form onSubmit={save} className="grid gap-3">
              <label className="text-sm text-neutral-700">
                <div className="mb-1">Title</div>
                <input
                  value={form.title || ''}
                  onChange={(e) => onChange('title', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
                  required
                />
              </label>

              <label className="text-sm text-neutral-700">
                <div className="mb-1">Description</div>
                <input
                  value={form.description || ''}
                  onChange={(e) => onChange('description', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-neutral-700">
                  <div className="mb-1">Price</div>
                  <input
                    type="number"
                    min={0} step="0.01"
                    value={form.price ?? 0}
                    onChange={(e) => onChange('price', Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2"
                    required
                  />
                </label>

                {/* Category dropdown + inline add */}
                <div className="text-sm text-neutral-700">
                  <div className="mb-1">Category</div>
                  <div className="flex gap-2">
                    <select
                      value={form.category || ''}
                      onChange={(e) => onChange('category', e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2"
                    >
                      <option value="">— Select —</option>
                      {cats.map((c) => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setAddingLabel((v) => !v)}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2"
                    >
                      + Label
                    </button>
                  </div>
                  {addingLabel && (
                    <div className="mt-2 flex gap-2">
                      <input
                        placeholder="New label"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2"
                      />
                      <button type="button" onClick={createLabel}
                        className="rounded-lg bg-indigo-600 text-white px-3 py-2">
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-neutral-700">
                <div className="mb-1">Image</div>
                <input type="file" accept="image/*" onChange={onFileChange} />
                {imgPreview && (
                  <img src={imgPreview} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded border" />
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={!!form.isAvailable}
                  onChange={(e) => onChange('isAvailable', e.target.checked)}
                />
                Available
              </label>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpenForm(false)} className="rounded-lg border px-3 py-2">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-indigo-600 text-white px-4 py-2">
                  Save
                </button>
              </div>
            </form>

            <div className="mt-3 text-xs text-neutral-500">
              Tip: Manage full list of labels on <a href="/categories" className="underline">Categories</a>.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
