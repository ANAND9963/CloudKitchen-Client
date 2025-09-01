'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/utils/api'

type MenuItem = { _id:string; title:string; description?:string; imageUrl?:string; price:number; category?:string }

export default function Home() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get('/menus', { params: { limit: 6 } })
        setItems(res.data?.items || [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">CloudKitchen</h1>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Menu</h2>
        <Link className="text-sm text-indigo-600 hover:underline" href="/menu">Browse all</Link>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(m => (
            <Link key={m._id} href="/menu" className="rounded-xl border bg-white overflow-hidden hover:shadow">
              {m.imageUrl && <img src={m.imageUrl} alt={m.title} className="h-40 w-full object-cover" />}
              <div className="p-3">
                <div className="font-semibold">{m.title}</div>
                <div className="text-xs text-neutral-500">{m.category}</div>
                <div className="mt-2 font-medium">${m.price.toFixed(2)}</div>
              </div>
            </Link>
          ))}
          {items.length === 0 && <div className="text-neutral-500">No menu items yet</div>}
        </div>
      )}
    </div>
  )
}
