// src/components/owner/MenuManager.tsx
'use client'

import { useEffect, useState } from 'react'
import api from '@/utils/api'
import toast from 'react-hot-toast'

type MenuItem = {
    _id: string
    title: string
    description?: string
    price: number
    imageUrl?: string
    category?: string
    isAvailable?: boolean
}

const emptyItem: Partial<MenuItem> = {
    title: '',
    description: '',
    price: 0,
    category: '',
    isAvailable: true,
    imageUrl: '',
}

// Normalize various possible API shapes into MenuItem[]
function normalizeMenus(data: any): MenuItem[] {
    // common shapes:
    // { menus: [...] }
    // { menus: { docs: [...] } }  // paginate
    // { data: [...] }
    // [ ... ]
    // { items: [...] }
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
    const [openForm, setOpenForm] = useState(false)
    const [editing, setEditing] = useState<MenuItem | null>(null)
    const [form, setForm] = useState<Partial<MenuItem>>(emptyItem)
    const [imgPreview, setImgPreview] = useState<string>('')

    const fetchItems = async () => {
        try {
            setLoading(true)
            const { data } = await api.get('/menus', { params: { limit: 100 } })
            const list = normalizeMenus(data)
            setItems(list)
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to load menus')
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const onChange = (k: keyof MenuItem, v: any) => {
        setForm((s) => ({ ...s, [k]: v }))
    }

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const okTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if (!okTypes.includes(file.type)) {
            toast.error('Please choose a PNG/JPG/WEBP image.')
            return
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB guard
            toast.error('Image too large (max 2MB).')
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            const base64 = String(reader.result || '')
            setImgPreview(base64)
            onChange('imageUrl', base64) // store base64 as imageUrl for now
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
        if (!title || isNaN(priceNum)) {
            toast.error('Title and price are required.')
            return
        }
        const payload = {
            title,
            description: form.description ?? '',
            price: priceNum,
            imageUrl: form.imageUrl || '', // base64 or a URL
            category: form.category ?? '',
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

    const list = Array.isArray(items) ? items : []

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl text-white">
            <div className="p-4 flex items-center justify-between">
                <h2 className="font-semibold">Menus</h2>
                <button
                    onClick={openNew}
                    className="rounded-lg bg-white/20 hover:bg-white/25 text-white px-3 py-1.5 border border-white/20"
                >
                    + Add Item
                </button>
            </div>

            {loading ? (
                <div className="p-4 text-sm text-white/80">Loading…</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white/10">
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
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs ${it.isAvailable
                                                    ? 'bg-emerald-300/20 text-emerald-100 border border-emerald-200/30'
                                                    : 'bg-white/10 text-white/80 border border-white/20'
                                                }`}
                                        >
                                            {it.isAvailable ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <button
                                            onClick={() => openEdit(it)}
                                            className="px-2 py-1 text-indigo-50 underline-offset-4 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => remove(it._id)}
                                            className="ml-2 px-2 py-1 text-rose-200 underline-offset-4 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {list.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-6 text-center text-white/80">
                                        No items yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Compact modal (small form) */}
            {openForm && (
                <div className="fixed inset-0 bg-black/50 grid place-items-center z-[55]">
                    <div className="w-full max-w-sm bg-white/80 backdrop-blur rounded-2xl border border-neutral-200 shadow-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-neutral-800">
                                {editing ? 'Edit Menu Item' : 'Add Menu Item'}
                            </h3>
                            <button
                                onClick={() => setOpenForm(false)}
                                className="text-sm text-neutral-500 hover:text-neutral-700"
                            >
                                Close
                            </button>
                        </div>

                        <form onSubmit={save} className="grid grid-cols-1 gap-3">
                            <label className="flex flex-col gap-1 text-sm text-neutral-700">
                                Title
                                <input
                                    className="border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 bg-white"
                                    value={form.title || ''}
                                    onChange={(e) => onChange('title', e.target.value)}
                                    required
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-sm text-neutral-700">
                                Category
                                <input
                                    className="border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 bg-white"
                                    value={form.category || ''}
                                    onChange={(e) => onChange('category', e.target.value)}
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-sm text-neutral-700">
                                Price ($)
                                <input
                                    type="number"
                                    step="0.01"
                                    className="border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 bg-white"
                                    value={form.price ?? 0}
                                    onChange={(e) => onChange('price', Number(e.target.value))}
                                    required
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-sm text-neutral-700">
                                Description
                                <textarea
                                    className="border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 bg-white"
                                    value={form.description || ''}
                                    onChange={(e) => onChange('description', e.target.value)}
                                    rows={3}
                                />
                            </label>

                            {/* Image upload */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex flex-col gap-1 text-sm text-neutral-700">
                                    Image
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        onChange={onFileChange}
                                        className="border border-neutral-300 rounded-lg px-3 py-2 bg-white"
                                    />
                                </label>
                                {(imgPreview || form.imageUrl) && (
                                    <div className="flex items-end">
                                        <img
                                            src={imgPreview || (form.imageUrl as string)}
                                            alt="preview"
                                            className="h-20 w-20 object-cover rounded-lg border border-neutral-300"
                                        />
                                    </div>
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

                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpenForm(false)}
                                    className="px-3 py-1.5 rounded-lg border border-neutral-300 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                                >
                                    {editing ? 'Save changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
