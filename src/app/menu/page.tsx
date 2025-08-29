'use client'
import { useEffect, useState } from 'react'
import api from '@/utils/api'

type MenuItem = { _id:string, title:string, description?:string, imageUrl?:string, price:number, category?:string, isAvailable:boolean }

export default function MenuBrowse() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await api.get('/menus', { params: { q, category } })
      setItems(res.data.items || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(()=>{ fetchList() }, [q, category])

  const addToCart = async (id: string) => {
    await api.post('/cart/items', { menuItemId: id, qty: 1 })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Menu</h1>
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…"
          className="rounded-lg border px-3 py-2 bg-white" />
        <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category"
          className="rounded-lg border px-3 py-2 bg-white" />
      </div>

      {loading ? <div>Loading…</div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(m => (
            <div key={m._id} className="rounded-xl border bg-white overflow-hidden">
              {m.imageUrl && <img src={m.imageUrl} alt={m.title} className="h-40 w-full object-cover" />}
              <div className="p-3">
                <div className="font-semibold">{m.title}</div>
                <div className="text-xs text-neutral-500">{m.category}</div>
                <p className="text-sm mt-1">{m.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-semibold">${m.price.toFixed(2)}</span>
                  <button onClick={()=>addToCart(m._id)} className="px-3 py-1 rounded bg-neutral-900 text-white">Add</button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-neutral-500">No menu items</div>}
        </div>
      )}
    </div>
  )
}
