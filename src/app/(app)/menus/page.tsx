'use client'

import { useEffect, useMemo, useState } from 'react'
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

type Category = {
  _id: string
  name: string
  order: number
  isActive: boolean
}

function normalizeMenus(data: any): MenuItem[] {
  const root = data?.menus ?? data?.data ?? data
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.docs)) return root.docs
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  return []
}

export default function UserMenusPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCats, setLoadingCats] = useState(true)

  // UI state
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<string>('') // category name
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  // fetch categories (active only, ordered)
  const loadCats = async () => {
    try {
      setLoadingCats(true)
      const { data } = await api.get('/menu-categories')
      const list: Category[] = (data?.categories || []).filter((c: Category) => c.isActive)
      list.sort((a, b) => a.order - b.order)
      setCats(list)
    } catch (e: any) {
      setCats([])
    } finally {
      setLoadingCats(false)
    }
  }

  // fetch menus
  const loadMenus = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/menus', { params: { limit: 1000 } })
      const list = normalizeMenus(data).filter((x) => x.isAvailable !== false)
      setItems(list)
      // default qty = 1
      const map: Record<string, number> = {}
      list.forEach((i) => { if (i._id) map[i._id] = 1 })
      setQtyMap(map)
    } catch (e: any) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCats(); loadMenus() }, [])

  // search + category filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (activeCat && (it.category || '') !== activeCat) return false
      if (!q) return true
      return (
        it.title?.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q) ||
        (it.category || '').toLowerCase().includes(q)
      )
    })
  }, [items, query, activeCat])

  // group by category (keep category order; put uncategorized at end)
  const groups = useMemo(() => {
    const byCat: Record<string, MenuItem[]> = {}
    filtered.forEach((it) => {
      const key = it.category || 'Other'
      if (!byCat[key]) byCat[key] = []
      byCat[key].push(it)
    })
    const orderedNames = [
      ...cats.map((c) => c.name),
      ...Object.keys(byCat).filter((n) => !cats.some((c) => c.name === n)),
    ]
    return orderedNames
      .filter((name) => byCat[name]?.length)
      .map((name) => ({ name, items: byCat[name]!.slice() }))
  }, [filtered, cats])

  const setQty = (id: string, next: number) => {
    setQtyMap((m) => ({ ...m, [id]: Math.max(1, Math.min(99, Number(next) || 1)) }))
  }

  const addToCart = async (it: MenuItem) => {
    try {
      setBusyId(it._id)
      const qty = qtyMap[it._id] || 1
      await api.post('/cart/items', { menuItemId: it._id, qty })
      toast.success(`Added ${qty} × ${it.title} to cart`)
      // optional: ping cart listeners (badge refresh) if you add a listener in navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ck-cart-changed'))
      }
    } catch (e: any) {
      const s = e?.response?.status
      if (s === 401 || s === 403) {
        toast.error('Please log in to add items.')
      } else {
        toast.error(e?.response?.data?.message || 'Could not add to cart.')
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Hero / controls */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-4 text-white">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Menu</h1>
            <p className="text-white/80 text-sm">Order your favorites by category.</p>
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              className="w-72 rounded-lg bg-white text-black px-3 py-2"
            />
            <select
              value={activeCat}
              onChange={(e) => setActiveCat(e.target.value)}
              className="rounded-lg bg-white text-black px-3 py-2"
            >
              <option value="">All categories</option>
              {cats.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* category chips */}
        {!loadingCats && cats.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCat('')}
              className={`px-3 py-1.5 rounded-full border ${activeCat === '' ? 'bg-white/25 border-white/40' : 'bg-white/10 border-white/20'}`}
            >
              All
            </button>
            {cats.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveCat(c.name)}
                className={`px-3 py-1.5 rounded-full border ${activeCat === c.name ? 'bg-white/25 border-white/40' : 'bg-white/10 border-white/20'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Groups */}
      {loading ? (
        <div className="text-white/85">Loading…</div>
      ) : groups.length === 0 ? (
        <div className="text-white/85">No items found.</div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.name}>
              <h2 className="text-white text-lg font-semibold mb-3">{g.name}</h2>

              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((it) => (
                  <li key={it._id} className="rounded-2xl bg-white/15 backdrop-blur border border-white/25 overflow-hidden shadow-xl">
                    <div className="h-40 bg-neutral-200 overflow-hidden">
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt={it.title} className="h-40 w-full object-cover" />
                      ) : (
                        <div className="h-40 w-full grid place-items-center text-neutral-500 text-sm">No image</div>
                      )}
                    </div>

                    <div className="p-3 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{it.title}</div>
                          {it.description && (
                            <div className="text-xs text-white/80 line-clamp-2">{it.description}</div>
                          )}
                        </div>
                        <div className="font-semibold whitespace-nowrap">${Number(it.price || 0).toFixed(2)}</div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-lg border border-white/30 bg-white/10">
                          <button
                            type="button"
                            onClick={() => setQty(it._id, (qtyMap[it._id] || 1) - 1)}
                            className="px-2 py-1"
                          >
                            −
                          </button>
                          <input
                            className="w-10 text-center bg-transparent outline-none py-1"
                            value={qtyMap[it._id] || 1}
                            onChange={(e) => setQty(it._id, Number(e.target.value))}
                            min={1}
                            max={99}
                            type="number"
                          />
                          <button
                            type="button"
                            onClick={() => setQty(it._id, (qtyMap[it._id] || 1) + 1)}
                            className="px-2 py-1"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => addToCart(it)}
                          disabled={busyId === it._id}
                          className="rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                          type="button"
                        >
                          {busyId === it._id ? 'Adding…' : 'Add to cart'}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
