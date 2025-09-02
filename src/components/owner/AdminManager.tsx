// src/components/owner/AdminManager.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import api from '@/utils/api'
import toast from 'react-hot-toast'

type U = { _id: string; firstName?: string; lastName?: string; email: string; role: 'user'|'admin'|'owner' }

export default function AdminManager() {
  const [users, setUsers] = useState<U[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      // owners can fetch all users
      const { data } = await api.get('/users/allusers')
      setUsers(data?.users || data || [])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return users
    return users.filter(u =>
      (u.email?.toLowerCase()?.includes(term)) ||
      (`${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(term))
    )
  }, [users, q])

  const promote = async (userId: string) => {
    try {
      await api.post('/users/admins', { userId })
      toast.success('Promoted to admin')
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Promote failed')
    }
  }

  const demote = async (userId: string) => {
    try {
      await api.delete(`/users/admins/${userId}`)
      toast.success('Demoted to user')
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Demote failed')
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-semibold">Admins</h2>
        <input
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border rounded-lg px-3 py-1.5 w-72"
        />
      </div>

      {loading ? (
        <div className="p-4 text-sm text-neutral-600">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{u.firstName} {u.lastName}</div>
                  </td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 capitalize">{u.role}</td>
                  <td className="px-3 py-2 text-right">
                    {u.role === 'admin' ? (
                      <button
                        onClick={() => demote(u._id)}
                        className="px-2 py-1 text-rose-600 hover:underline"
                      >
                        Demote
                      </button>
                    ) : u.role === 'user' ? (
                      <button
                        onClick={() => promote(u._id)}
                        className="px-2 py-1 text-indigo-600 hover:underline"
                      >
                        Promote to admin
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-500">Owner</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-neutral-500">No users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
