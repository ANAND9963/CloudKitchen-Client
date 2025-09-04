'use client'

import { useEffect, useMemo, useState } from 'react'
import api from '@/utils/api'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export type CartDrawerProps = {
  open: boolean
  onClose: () => void
  onCountChange?: (count: number) => void
}

type CartLine = {
  menuItemId: string
  title: string
  description?: string
  price: number
  qty: number
  imageUrl?: string
}

// GET /api/cart -> { items: [{ menuItem, qty }] }
function normalizeCart(data: any): CartLine[] {
  const cart = data?.cart ?? data
  const items = Array.isArray(cart?.items) ? cart.items : []
  return items.map((it: any) => {
    const m = it?.menuItem || {}
    const populated = typeof m === 'object'
    return {
      menuItemId: populated ? (m._id || '') : String(m || ''),
      title: (populated ? m.title : it?.title) || 'Item',
      description: populated ? m.description : it?.description,
      price: Number(populated ? m.price : it?.price || 0),
      qty: Number(it?.qty ?? it?.quantity ?? 1),
      imageUrl: populated ? m.imageUrl : it?.imageUrl,
    } as CartLine
  })
}

export default function CartDrawer({ open, onClose, onCountChange }: CartDrawerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [lines, setLines] = useState<CartLine[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/cart')
      const list = normalizeCart(data)
      setLines(list)
      onCountChange?.(list.reduce((s, l) => s + (l.qty || 0), 0))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401 || status === 403) {
        toast.error('Please log in to view your cart.')
        router.push('/auth/login')
        onClose()
      } else {
        toast.error(err?.response?.data?.message || 'Failed to load cart.')
        setLines([])
        onCountChange?.(0)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open) load() }, [open]) // eslint-disable-line

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + (l.price || 0) * (l.qty || 0), 0),
    [lines]
  )

  const updateQty = async (line: CartLine, nextQty: number) => {
    if (nextQty < 0) return
    try {
      setBusyId(line.menuItemId)

      if (nextQty === 0) {
        await api.delete(`/cart/items/${line.menuItemId}`)
        const newLines = lines.filter((x) => x.menuItemId !== line.menuItemId)
        setLines(newLines)
        onCountChange?.(newLines.reduce((s, l) => s + l.qty, 0))
        return
      }

      await api.patch(`/cart/items/${line.menuItemId}`, { qty: nextQty })
      const newLines = lines.map((x) =>
        x.menuItemId === line.menuItemId ? { ...x, qty: nextQty } : x
      )
      setLines(newLines)
      onCountChange?.(newLines.reduce((s, l) => s + l.qty, 0))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not update cart.')
    } finally {
      setBusyId(null)
    }
  }

  const closeAndGoMenus = () => { onClose(); router.push('/menus') }
  const goCheckout = () => { onClose(); router.push('/checkout') }

  return (
    <div className={`fixed inset-0 z-[65] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside className={`absolute right-0 top-0 h-full w-full max-w-md transform transition-all duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
          bg-white/75 backdrop-blur-lg border-l border-white/30 shadow-2xl`}>
        <div className="flex h-14 items-center justify-between px-4 border-b border-white/40">
          <h3 className="font-semibold text-neutral-800">Your Cart</h3>
          <button onClick={onClose} className="text-sm text-neutral-600 hover:text-neutral-800">Close</button>
        </div>

        <div className="flex h-[calc(100%-3.5rem)] flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading ? (
              <div className="text-sm text-neutral-700">Loading…</div>
            ) : lines.length === 0 ? (
              <div className="text-sm text-neutral-700">
                Your cart is empty.{' '}
                <button onClick={closeAndGoMenus} className="underline underline-offset-2">Add some items</button>.
              </div>
            ) : (
              <ul className="space-y-3">
                {lines.map((l) => (
                  <li key={l.menuItemId} className="rounded-xl border border-neutral-200 bg-white/80 p-3 shadow-sm">
                    <div className="flex gap-3">
                      {l.imageUrl ? (
                        <img src={l.imageUrl} alt={l.title} className="h-16 w-16 rounded-lg object-cover border" />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-neutral-100 grid place-items-center text-neutral-400 text-xs">No image</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="truncate">
                            <div className="truncate font-medium text-neutral-900">{l.title}</div>
                            {l.description && <div className="text-xs text-neutral-600 line-clamp-2">{l.description}</div>}
                          </div>
                          <div className="text-sm font-medium text-neutral-900">${(l.price * l.qty).toFixed(2)}</div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-lg border border-neutral-300 bg-white">
                            <button onClick={() => updateQty(l, l.qty - 1)} disabled={busyId === l.menuItemId || l.qty <= 0} className="px-2 py-1 text-neutral-700 disabled:opacity-50" type="button">−</button>
                            <input
                              value={l.qty}
                              onChange={(e) => updateQty(l, Math.max(0, Number(e.target.value) || 0))}
                              className="w-10 text-center outline-none py-1" type="number" min={0}
                            />
                            <button onClick={() => updateQty(l, l.qty + 1)} disabled={busyId === l.menuItemId} className="px-2 py-1 text-neutral-700 disabled:opacity-50" type="button">+</button>
                          </div>
                          <button onClick={() => updateQty(l, 0)} disabled={busyId === l.menuItemId} className="text-sm text-rose-600 hover:underline disabled:opacity-50" type="button">Remove</button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4">
              <button onClick={closeAndGoMenus} className="w-full rounded-lg border border-neutral-300 bg-white/70 px-3 py-2 text-sm hover:bg-white">
                + Add more items
              </button>
            </div>
          </div>

          {/* Summary: Subtotal only */}
          <div className="border-t border-white/40 p-4 bg-white/70 backdrop-blur">
            <div className="flex items-center justify-between text-sm text-neutral-800">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={goCheckout}
              disabled={lines.length === 0}
              className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
