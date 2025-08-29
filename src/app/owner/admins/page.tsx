'use client'
import { useEffect, useState } from 'react'
import api from '@/utils/api'
import Protected from '@/components/Protected'
import RoleGate from '@/components/RoleGate'

type Result = { _id: string, fullName: string, email: string, role: 'owner'|'admin'|'user' }

export default function OwnerAdmins() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const debounced = useDebounced(q, 200)

  useEffect(() => {
    let ignore = false
    const run = async () => {
      if (!debounced) { setResults([]); return }
      setLoading(true)
      try {
        const res = await api.get('/users/search', { params: { query: debounced, limit: 6 } })
        if (!ignore) setResults(res.data)
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => { ignore = true }
  }, [debounced])

  const promote = async (userId: string) => {
    await api.post('/users/admins', { userId })
    setResults(r => r.map(x => x._id === userId ? { ...x, role: 'admin' } : x))
  }
  const demote = async (userId: string) => {
    await api.delete(`/users/admins/${userId}`)
    setResults(r => r.map(x => x._id === userId ? { ...x, role: 'user' } : x))
  }

  return (
    <Protected>
      <RoleGate allow={['owner']} fallback={<div>Forbidden</div>}>
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Admin Management</h1>
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Search users by name…"
            className="w-full rounded-lg border px-3 py-2 bg-white"
          />
          <div className="rounded-xl border bg-white">
            {loading && <div className="p-3 text-sm text-neutral-500">Searching…</div>}
            {!loading && results.length === 0 && <div className="p-3 text-sm text-neutral-500">No results</div>}
            {results.map(u => (
              <div key={u._id} className="flex items-center justify-between p-3 border-t first:border-t-0">
                <div>
                  <div className="font-medium">{u.fullName || u.email}</div>
                  <div className="text-xs text-neutral-500">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs rounded-full px-2 py-1 border">{u.role}</span>
                  {u.role !== 'owner' && (
                    u.role === 'admin' ?
                      <button onClick={()=>demote(u._id)} className="px-3 py-1 rounded bg-rose-600 text-white">Remove admin</button>
                    : <button onClick={()=>promote(u._id)} className="px-3 py-1 rounded bg-indigo-600 text-white">Make admin</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </RoleGate>
    </Protected>
  )
}

function useDebounced(value: string, delay: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(()=>setV(value), delay)
    return ()=>clearTimeout(t)
  }, [value, delay])
  return v
}
