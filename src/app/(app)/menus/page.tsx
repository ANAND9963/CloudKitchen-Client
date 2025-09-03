// src/app/menus/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import api from '@/utils/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

type MenuItem = {
  _id: string
  title: string
  description?: string
  price: number
  imageUrl?: string
  category?: string
  isAvailable?: boolean
}

// Normalize common API shapes into MenuItem[]
function normalizeMenus(data: any): MenuItem[] {
  const root = data?.menus ?? data?.data ?? data
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.docs)) return root.docs
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  return []
}

export default function MenusPage() {
  const router = useRouter()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/menus', { params: { limit: 100 } })
      setItems(normalizeMenus(data))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load menus')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return items.filter((it) => {
      if (onlyAvailable && !it.isAvailable) return false
      if (!term) return true
      return (
        it.title?.toLowerCase().includes(term) ||
        it.category?.toLowerCase().includes(term) ||
        it.description?.toLowerCase().includes(term)
      )
    })
  }, [items, q, onlyAvailable])

  const addToCart = async (item: MenuItem) => {
    try {
      await api.post('/cart/items', { menuItemId: item._id, qty: 1 })
      toast.success('Added to cart')
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 403) {
        toast.error('Please log in to add items')
        router.push('/auth/login')
      } else {
        toast.error(e?.response?.data?.message || 'Could not add to cart')
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-white">
        <h1 className="text-2xl font-bold">Menus</h1>
        <Link href="/owner" className="text-sm underline underline-offset-4">
          Owner Home
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="border border-white/20 bg-white/10 text-white placeholder-white/70 rounded-lg px-3 py-2 w-64"
          placeholder="Search by title, category…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="inline-flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Only available
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-white/80">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-white/80">No items found.</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it) => (
            <li
              key={it._id}
              className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden flex flex-col text-white"
            >
              {it.imageUrl ? (
                <img src={it.imageUrl} alt={it.title} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 w-full bg-white/10 grid place-items-center text-white/70 text-sm">
                  No image
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{it.title}</h3>
                  <div className="text-sm font-medium">
                    ${Number(it.price ?? 0).toFixed(2)}
                  </div>
                </div>
                {it.category && (
                  <div className="text-xs text-white/70 mt-0.5">{it.category}</div>
                )}
                {it.description && (
                  <p className="text-sm text-white/80 mt-2 line-clamp-3">
                    {it.description}
                  </p>
                )}
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      it.isAvailable
                        ? 'bg-emerald-300/20 text-emerald-100 border border-emerald-200/30'
                        : 'bg-white/10 text-white/80 border border-white/20'
                    }`}
                  >
                    {it.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <button
                    onClick={() => addToCart(it)}
                    disabled={!it.isAvailable}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/25 border border-white/20 text-white disabled:opacity-50"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
