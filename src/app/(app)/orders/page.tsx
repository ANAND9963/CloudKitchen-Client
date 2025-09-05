'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import toast from 'react-hot-toast'

type Role = 'user' | 'admin' | 'owner'

type Order = {
  _id: string
  user?: any
  status: 'pending' | 'placed' | 'accepted' | 'prepping' | 'ready' | 'completed' | 'cancelled'
  paymentStatus: 'unpaid' | 'authorized' | 'paid' | 'refunded' | 'failed'
  method: 'delivery' | 'pickup'
  items: { menuItemId: string; title: string; price: number; qty: number }[]
  total: number
  createdAt: string
}

const STATUSES = ['pending','placed','accepted','prepping','ready','completed','cancelled'] as const

export default function OrdersPage() {
  const router = useRouter()

  const [role, setRole] = useState<Role>('user')
  const [loadingRole, setLoadingRole] = useState(true)

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)

  const [status, setStatus] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  const [busyId, setBusyId] = useState<string | null>(null)

  // Stable date formatter to avoid hydration mismatches
  const dtf = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago',
      }),
    []
  )
  const fmtDate = (iso: string) => dtf.format(new Date(iso))

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/users/me')
        const r = (data?.user || data)?.role ?? 'user'
        setRole(r)
      } catch {
        router.replace('/auth/login')
      } finally {
        setLoadingRole(false)
      }
    })()
  }, [router])

  const load = async (resetPage = false) => {
    try {
      setLoading(true)
      const q: Record<string, string> = {
        page: String(resetPage ? 1 : page),
        limit: String(limit),
      }
      if (status) q.status = status
      if (from) q.from = new Date(from).toISOString()
      if (to) q.to = new Date(to).toISOString()

      const { data } = await api.get('/orders', { params: q })
      setOrders(resetPage ? (data?.orders || []) : [...orders, ...(data?.orders || [])])
      setTotal(Number(data?.total || 0))
      if (resetPage) setPage(1)
    } catch (e: any) {
      const s = e?.response?.status
      if (s === 401 || s === 403) {
        router.replace('/auth/login')
      } else {
        toast.error(e?.response?.data?.message || 'Failed to load orders')
      }
      setOrders([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(true) }, []) // eslint-disable-line
  useEffect(() => { if (page > 1) load(false) }, [page]) // eslint-disable-line

  const canSeePlacedBy = role === 'owner' || role === 'admin'
  const canActStaff = canSeePlacedBy
  const showActionsCol = canActStaff || role === 'user'
  const hasMore = orders.length < total && !loading

  const placedBy = (o: Order) => {
    const u = o.user
    if (!u) return '—'
    if (typeof u === 'string') return u
    return u.email || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u._id || '—'
  }

  const itemsCount = (o: Order) => o.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0

  // ----- Actions -----
  const allowedNext = (s: Order['status']) => {
    if (s === 'pending' || s === 'placed') return 'accepted'
    if (s === 'accepted') return 'prepping'
    if (s === 'prepping') return 'ready'
    return null
  }
  const canCancel = (s: Order['status']) => ['pending','placed','accepted'].includes(s)

  const updateStatus = async (o: Order, to: 'accepted'|'prepping'|'ready') => {
    try {
      setBusyId(o._id)
      await api.post(`/orders/${o._id}/status`, { to })
      setOrders((arr) => arr.map((x) => (x._id === o._id ? { ...x, status: to } as Order : x)))
      toast.success(`Order ${to}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const cancelOrder = async (o: Order) => {
    if (!confirm('Cancel this order?')) return
    try {
      setBusyId(o._id)
      await api.post(`/orders/${o._id}/cancel`)
      setOrders((arr) => arr.map((x) => (x._id === o._id ? { ...x, status: 'cancelled' } as Order : x)))
      toast.success('Order cancelled')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Cancel failed')
    } finally {
      setBusyId(null)
    }
  }

  const applyFilters = (e: React.FormEvent) => { e.preventDefault(); load(true) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-neutral-900">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      {/* Filters */}
      <form onSubmit={applyFilters} className="bg-white backdrop-blur-md rounded-2xl border border-neutral-200 shadow-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-neutral-900 text-sm">
            <div className="mb-1 opacity-90">Status</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg bg-white text-black px-3 py-2">
              <option value="">All</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-neutral-900 text-sm">
            <div className="mb-1 opacity-90">From</div>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg bg-white text-black px-3 py-2" />
          </label>
          <label className="text-neutral-900 text-sm">
            <div className="mb-1 opacity-90">To</div>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg bg-white text-black px-3 py-2" />
          </label>
          <button type="submit" className="h-10 rounded-lg bg-indigo-600 text-neutral-900 px-4 font-medium hover:bg-indigo-700">Apply</button>
          <button type="button" onClick={() => { setStatus(''); setFrom(''); setTo(''); load(true) }} className="h-10 rounded-lg border border-white/30 bg-white/20 text-neutral-900 px-3 hover:bg-white/25">Reset</button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white backdrop-blur-md rounded-2xl border border-neutral-200 shadow-xl overflow-x-auto">
        <table className="min-w-full text-sm text-neutral-900">
          <thead className="bg-white text-neutral-900/90">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Method</th>
              { (role === 'owner' || role === 'admin') && <th className="px-3 py-2 text-left">Placed by</th> }
              <th className="px-3 py-2 text-left">Items</th>
              <th className="px-3 py-2 text-left">Total</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Payment</th>
              { showActionsCol && <th className="px-3 py-2 text-left">Actions</th> }
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const next = allowedNext(o.status)
              const userCanCancel = role === 'user' && canCancel(o.status)
              return (
                <tr key={o._id} className="border-t border-white/10">
                  <td className="px-3 py-2 font-medium">
                    <Link href={`/orders/${o._id}`} className="underline underline-offset-4">#{o._id.slice(-6)}</Link>
                  </td>
                  <td className="px-3 py-2">{fmtDate(o.createdAt)}</td>
                  <td className="px-3 py-2 capitalize">{o.method}</td>
                  { (role === 'owner' || role === 'admin') && <td className="px-3 py-2">{placedBy(o)}</td> }
                  <td className="px-3 py-2">{itemsCount(o)}</td>
                  <td className="px-3 py-2">${Number(o.total || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      o.status === 'completed' ? 'bg-emerald-300/20 border-emerald-200/30 text-emerald-100'
                      : o.status === 'cancelled' ? 'bg-rose-300/20 border-rose-200/30 text-rose-100'
                      : 'bg-white border-neutral-200 text-neutral-900/85'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs border ${
                      o.paymentStatus === 'paid' ? 'bg-emerald-300/20 border-emerald-200/30 text-emerald-100'
                      : o.paymentStatus === 'failed' ? 'bg-rose-300/20 border-rose-200/30 text-rose-100'
                      : 'bg-white border-neutral-200 text-neutral-900/85'
                    }`}>
                      {o.paymentStatus}
                    </span>
                  </td>

                  { showActionsCol && (
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {/* Staff progression */}
                        {(role === 'owner' || role === 'admin') && next && (
                          <button
                            onClick={() => updateStatus(o, next as any)}
                            disabled={busyId === o._id}
                            className="rounded-lg bg-white/20 border border-white/30 px-2 py-1 hover:bg-white/25 disabled:opacity-50"
                            title={`Move to ${next}`}
                          >
                            {next === 'accepted' ? 'Accept' : next === 'prepping' ? 'Prepping' : 'Ready'}
                          </button>
                        )}

                        {/* Cancel for staff or for user when allowed */}
                        { (role === 'owner' || role === 'admin' || userCanCancel) && canCancel(o.status) && (
                          <button
                            onClick={() => cancelOrder(o)}
                            disabled={busyId === o._id}
                            className="rounded-lg bg-rose-500/20 border border-rose-300/40 px-2 py-1 text-rose-50 hover:bg-rose-500/25 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  )}

                  <td className="px-3 py-2 text-right">
                    <Link href={`/orders/${o._id}`} className="text-indigo-100 hover:underline">View</Link>
                  </td>
                </tr>
              )
            })}

            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-neutral-900/80">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-neutral-900/90">
        <div className="text-sm">
          Showing <span className="font-medium">{orders.length}</span> of{' '}
          <span className="font-medium">{total}</span>
        </div>
        {hasMore && (
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="rounded-lg bg-white/20 border border-white/30 px-3 py-1.5 hover:bg-white/25"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  )
}
