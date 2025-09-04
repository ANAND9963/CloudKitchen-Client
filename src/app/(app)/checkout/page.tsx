// src/app/(app)/checkout/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import toast from 'react-hot-toast'
import AddressForm, { Address as AddressType } from '@/components/addresses/AddressForm'

type CartLine = {
  menuItemId: string
  title: string
  description?: string
  price: number
  qty: number
  imageUrl?: string
}

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

export default function CheckoutPage() {
  const router = useRouter()

  // cart
  const [lines, setLines] = useState<CartLine[]>([])
  const [loadingCart, setLoadingCart] = useState(true)

  // fulfillment
  const [method, setMethod] = useState<'delivery' | 'pickup'>('delivery')

  // addresses
  const [addresses, setAddresses] = useState<AddressType[]>([])
  const [loadingAddr, setLoadingAddr] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [savingNew, setSavingNew] = useState(false)

  // constants (server mirrors these today)
  const DELIVERY_FEE_FLAT = 4.99
  const SERVICE_FEE_RATE = 0.05
  const TAX_RATE = 0.08
  const DISCOUNT = 0

  // load cart
  useEffect(() => {
    ;(async () => {
      try {
        setLoadingCart(true)
        const { data } = await api.get('/cart')
        setLines(normalizeCart(data))
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Could not load cart.')
        setLines([])
      } finally {
        setLoadingCart(false)
      }
    })()
  }, [])

  // load addresses and select default
  const loadAddresses = async () => {
    try {
      setLoadingAddr(true)
      const { data } = await api.get('/addresses')
      const list: AddressType[] = data?.addresses || []
      setAddresses(list)
      const def = list.find((a) => a.isDefault)
      setSelectedId(def?._id || list[0]?._id || null)
    } catch (e: any) {
      const s = e?.response?.status
      if (s === 401 || s === 403) {
        router.replace('/auth/login')
      } else {
        toast.error(e?.response?.data?.message || 'Failed to load addresses')
      }
      setAddresses([])
      setSelectedId(null)
    } finally {
      setLoadingAddr(false)
    }
  }

  useEffect(() => {
    if (method === 'delivery') loadAddresses()
  }, [method]) // eslint-disable-line

  // totals
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + (l.price || 0) * (l.qty || 0), 0),
    [lines]
  )
  const deliveryFee = useMemo(() => (method === 'pickup' ? 0 : DELIVERY_FEE_FLAT), [method])
  const feesAndTax = useMemo(() => subtotal * (SERVICE_FEE_RATE + TAX_RATE), [subtotal])
  const total = useMemo(() => Math.max(0, subtotal + deliveryFee + feesAndTax - DISCOUNT), [subtotal, deliveryFee, feesAndTax])

  // add new address (inline form)
  const handleAddNew = async (data: AddressType) => {
    try {
      setSavingNew(true)
      const payload = { ...data, isDefault: !!data.isDefault }
      const { data: res } = await api.post('/addresses', payload)
      toast.success('Address added')
      setAddingNew(false)
      await loadAddresses()
      const id = res?.address?._id
      if (id) setSelectedId(id)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally {
      setSavingNew(false)
    }
  }

  const onContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lines.length === 0) {
      toast.error('Your cart is empty.')
      return
    }
    if (method === 'delivery') {
      if (!selectedId) {
        toast.error('Please select an address or add a new one.')
        return
      }
    }

    // Persist choice for next step (payments/review coming next)
    localStorage.setItem(
      'ck_checkout',
      JSON.stringify({
        method,
        addressId: method === 'delivery' ? selectedId : undefined,
        pricing: {
          subtotal,
          deliveryFee,
          feesAndTax,
          discount: DISCOUNT,
          total,
        },
      })
    )
    toast.success('Saved. Proceeding to payment soon.')
    // router.push('/checkout/review') // enable when you add the payment step
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* LEFT: choices & addresses */}
      <form onSubmit={onContinue} className="lg:col-span-2 space-y-4">
        {/* Fulfillment */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">How would you like to get your order?</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className={`flex items-center gap-2 rounded-xl border px-4 py-3 cursor-pointer ${method === 'delivery' ? 'bg-white/20 border-white/40' : 'bg-white/10 border-white/20'}`}>
              <input type="radio" name="method" value="delivery" checked={method === 'delivery'} onChange={() => setMethod('delivery')} />
              Delivery to address
            </label>
            <label className={`flex items-center gap-2 rounded-xl border px-4 py-3 cursor-pointer ${method === 'pickup' ? 'bg-white/20 border-white/40' : 'bg-white/10 border-white/20'}`}>
              <input type="radio" name="method" value="pickup" checked={method === 'pickup'} onChange={() => setMethod('pickup')} />
              Pickup at location
            </label>
          </div>
        </div>

        {/* Address section */}
        {method === 'delivery' ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6 text-white">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Saved addresses</h3>
              <button
                type="button"
                onClick={() => setAddingNew((v) => !v)}
                className="rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-white hover:bg-white/25"
              >
                {addingNew ? 'Close' : '+ Add new'}
              </button>
            </div>

            {loadingAddr ? (
              <div className="text-sm text-white/85">Loading…</div>
            ) : addresses.length === 0 && !addingNew ? (
              <div className="text-sm text-white/85">
                No addresses yet. Click <span className="underline">Add new</span> to create one.
              </div>
            ) : (
              <>
                {/* list of saved */}
                {addresses.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {addresses.map((a) => (
                      <li key={a._id} className={`rounded-xl border p-3 bg-white/10 ${selectedId === a._id ? 'border-white/60' : 'border-white/25'}`}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="address"
                            checked={selectedId === a._id}
                            onChange={() => setSelectedId(a._id!)}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium truncate">{a.label || 'Address'}</div>
                              {a.isDefault && (
                                <span className="text-[10px] rounded border border-emerald-200/40 bg-emerald-300/20 text-emerald-100 px-1.5 py-[1px]">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-white/80">
                              {a.fullName} • {a.phone}
                            </div>
                            <div className="text-sm text-white/80 truncate">
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}
                            </div>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}

                {/* add new inline */}
                {addingNew && (
                  <div className="rounded-2xl border border-white/30 bg-white/15 p-4">
                    <h4 className="font-medium mb-2">Add new address</h4>
                    <AddressForm
                      initial={{ label: 'Home' }}
                      onSubmit={handleAddNew}
                      onCancel={() => setAddingNew(false)}
                      saving={savingNew}
                      showDefaultToggle
                    />
                  </div>
                )}

                <div className="mt-2 text-xs text-white/75">
                  Want to manage all addresses?{' '}
                  <a href="/addresses" className="underline underline-offset-2">Open Address Book</a>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6 text-white">
            <h3 className="font-semibold mb-2">Pickup location</h3>
            <p className="text-white/85">
              CloudKitchen – Main Kitchen<br />
              123 Kitchen Street, Your City 000000
            </p>
            <p className="text-sm text-white/75 mt-2">
              You’ll receive a ready time after we confirm your order. No delivery fee for pickup.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loadingCart || (method === 'delivery' && (loadingAddr || (!selectedId && !addingNew))) || lines.length === 0}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </form>

      {/* RIGHT: summary */}
      <aside className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6 text-white h-max">
        <h3 className="font-semibold mb-3">Summary</h3>

        {loadingCart ? (
          <div className="text-sm text-white/85">Loading…</div>
        ) : lines.length === 0 ? (
          <div className="text-sm text-white/85">Your cart is empty.</div>
        ) : (
          <>
            <ul className="space-y-3 mb-4">
              {lines.map((l) => (
                <li key={l.menuItemId} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.title}</div>
                    <div className="text-xs text-white/80">Qty {l.qty}</div>
                  </div>
                  <div className="text-sm font-medium">${(l.price * l.qty).toFixed(2)}</div>
                </li>
              ))}
            </ul>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery Fee</span><span>${deliveryFee.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Fee & estimated Tax</span><span>${feesAndTax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>−${DISCOUNT.toFixed(2)}</span></div>
              <hr className="border-white/30" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
