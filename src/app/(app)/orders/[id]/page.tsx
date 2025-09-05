'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/utils/api'
import toast from 'react-hot-toast'

type Order = {
  _id: string
  status: 'pending' | 'placed' | 'accepted' | 'prepping' | 'ready' | 'completed' | 'cancelled'
  paymentStatus: 'unpaid' | 'authorized' | 'paid' | 'refunded' | 'failed'
  method: 'delivery' | 'pickup'
  address?: {
    label?: string
    fullName?: string
    phone?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
  }
  items: { menuItemId: string; title: string; price: number; qty: number; imageUrl?: string }[]
  subtotal: number
  deliveryFee: number
  serviceFee: number
  tax: number
  discount: number
  total: number
  createdAt: string
}

const canCancel = (s: Order['status']) => ['pending','placed','accepted'].includes(s)

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const dtf = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone: 'America/Chicago',
      }),
    []
  )

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/orders/${id}`)
        setOrder(data?.order)
      } catch (e: any) {
        const s = e?.response?.status
        if (s === 401 || s === 403) {
          router.replace('/auth/login')
        } else {
          toast.error(e?.response?.data?.message || 'Failed to load order')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [id, router])

  const doCancel = async () => {
    if (!order || !canCancel(order.status)) return
    if (!confirm('Cancel this order?')) return
    try {
      setBusy(true)
      await api.post(`/orders/${order._id}/cancel`)
      setOrder({ ...order, status: 'cancelled' })
      toast.success('Order cancelled')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Cancel failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="text-white/90">Loading…</div>
  if (!order) return <div className="text-white/90">Order not found.</div>

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white backdrop-blur-md rounded-2xl border border-neutral-200 shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Order #{order._id.slice(-6)}</h1>
            <div className="text-sm space-x-2">
              <span className="rounded border border-white/30 px-2 py-0.5">Status: {order.status}</span>
              <span className="rounded border border-white/30 px-2 py-0.5">Payment: {order.paymentStatus}</span>
            </div>
          </div>

          <div className="text-sm text-neutral-600 mt-1">Placed: {dtf.format(new Date(order.createdAt))}</div>

          {/* User cancel button when allowed */}
          {canCancel(order.status) && (
            <div className="mt-3">
              <button
                onClick={doCancel}
                disabled={busy}
                className="rounded-lg bg-rose-500/20 border border-rose-300/40 px-3 py-1.5 text-rose-50 hover:bg-rose-500/25 disabled:opacity-50"
              >
                {busy ? 'Cancelling…' : 'Cancel order'}
              </button>
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-semibold">Items</h3>
            <ul className="mt-2 divide-y divide-white/10">
              {order.items.map((it) => (
                <li key={it.menuItemId} className="py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium">{it.title}</div>
                    <div className="text-xs text-white/70">Qty {it.qty}</div>
                  </div>
                  <div className="text-sm font-medium">
                    ${(it.price * it.qty).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {order.method === 'delivery' ? (
          <div className="bg-white backdrop-blur-md rounded-2xl border border-neutral-200 shadow-xl p-6 text-white">
            <h3 className="font-semibold mb-2">Delivery address</h3>
            <div className="text-white/85 text-sm">
              {order.address?.label ? <div>{order.address.label}</div> : null}
              <div>{order.address?.fullName} • {order.address?.phone}</div>
              <div>
                {order.address?.line1}
                {order.address?.line2 ? `, ${order.address.line2}` : ''},{' '}
                {order.address?.city}, {order.address?.state} {order.address?.postalCode}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white backdrop-blur-md rounded-2xl border border-neutral-200 shadow-xl p-6 text-white">
            <h3 className="font-semibold mb-2">Pickup</h3>
            <div className="text-white/85 text-sm">
              CloudKitchen – Main Kitchen, 123 Kitchen Street, Your City 000000
            </div>
          </div>
        )}
      </div>

      <aside className="bg-white backdrop-blur-md rounded-2xl border border-neutral-200 shadow-xl p-6 text-white h-max">
        <h3 className="font-semibold mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Delivery Fee</span><span>${order.deliveryFee.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Service Fee</span><span>${order.serviceFee.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>−${order.discount.toFixed(2)}</span></div>
          <hr className="border-white/30" />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span><span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4">
          <a href="/orders" className="underline underline-offset-4">Back to orders</a>
        </div>
      </aside>
    </div>
  )
}
