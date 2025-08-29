'use client'
import { useEffect, useState } from 'react'
import api from '@/utils/api'
import Protected from '@/components/Protected'

type CartItem = { menuItem: { _id:string, title:string, price:number, imageUrl?:string, isAvailable:boolean }, qty: number }
type Cart = { items: CartItem[] }

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCart = async () => {
    setLoading(true)
    try {
      const res = await api.get('/cart')
      setCart(res.data)
    } finally {
      setLoading(false)
    }
  }
  useEffect(()=>{ fetchCart() }, [])

  const updateQty = async (id: string, qty: number) => {
    await api.patch(`/cart/items/${id}`, { qty })
    fetchCart()
  }
  const remove = async (id: string) => {
    await api.delete(`/cart/items/${id}`)
    fetchCart()
  }

  const total = cart?.items?.reduce((s, it) => s + (it.menuItem?.price || 0) * it.qty, 0) ?? 0

  return (
    <Protected>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Your Cart</h1>
        {loading ? <div>Loading…</div> : (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-xl border bg-white">
              {(!cart || cart.items.length === 0) && <div className="p-4 text-neutral-500">Cart is empty</div>}
              {cart?.items.map(ci => (
                <div key={ci.menuItem._id} className="flex items-center gap-3 p-3 border-t first:border-t-0">
                  {ci.menuItem.imageUrl && <img src={ci.menuItem.imageUrl} className="h-16 w-16 object-cover rounded" />}
                  <div className="flex-1">
                    <div className="font-medium">{ci.menuItem.title}</div>
                    <div className="text-xs text-neutral-500">${ci.menuItem.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>updateQty(ci.menuItem._id, Math.max(0, ci.qty-1))} className="px-2 py-1 border rounded">-</button>
                    <span className="w-6 text-center">{ci.qty}</span>
                    <button onClick={()=>updateQty(ci.menuItem._id, ci.qty+1)} className="px-2 py-1 border rounded">+</button>
                    <button onClick={()=>remove(ci.menuItem._id)} className="px-2 py-1 rounded bg-rose-600 text-white">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span>Subtotal</span><span className="font-semibold">${total.toFixed(2)}</span>
              </div>
              <button className="w-full rounded bg-indigo-600 text-white px-3 py-2">Checkout (mock)</button>
            </div>
          </div>
        )}
      </div>
    </Protected>
  )
}
