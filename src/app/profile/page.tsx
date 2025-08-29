'use client'
import { useEffect, useState } from 'react'
import api from '@/utils/api'
import Protected from '@/components/Protected'

type Address = { label?:string, line1?:string, line2?:string, city?:string, state?:string, postalCode?:string, country?:string, isDefault?:boolean }
type User = { firstName?:string, lastName?:string, email:string, mobileNumber?:string, addresses?: Address[] }

export default function ProfilePage() {
  const [data, setData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users/me')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }
  useEffect(()=>{ load() }, [])

  const save = async () => {
    await api.patch('/users/me', data)
    await load()
  }

  if (loading) return <div>Loading…</div>
  if (!data) return <div>Profile not found</div>

  return (
    <Protected>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Your Profile</h1>
        <div className="rounded-xl border bg-white p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={data.firstName || ''} onChange={e=>setData({...data!, firstName: e.target.value})} placeholder="First name" className="rounded-lg border px-3 py-2 bg-white" />
            <input value={data.lastName || ''} onChange={e=>setData({...data!, lastName: e.target.value})} placeholder="Last name" className="rounded-lg border px-3 py-2 bg-white" />
            <input value={data.email} disabled className="rounded-lg border px-3 py-2 bg-neutral-100" />
            <input value={data.mobileNumber || ''} onChange={e=>setData({...data!, mobileNumber: e.target.value})} placeholder="Mobile number" className="rounded-lg border px-3 py-2 bg-white" />
          </div>

          <h2 className="font-medium mt-4">Addresses</h2>
          {(data.addresses || []).map((a, idx) => (
            <div key={idx} className="grid sm:grid-cols-2 gap-3 border rounded-lg p-3">
              <input value={a.label || ''} onChange={e=>updateAddr(setData, data, idx, 'label', e.target.value)} placeholder="Label" className="rounded-lg border px-3 py-2 bg-white" />
              <input value={a.line1 || ''} onChange={e=>updateAddr(setData, data, idx, 'line1', e.target.value)} placeholder="Line 1" className="rounded-lg border px-3 py-2 bg-white" />
              <input value={a.line2 || ''} onChange={e=>updateAddr(setData, data, idx, 'line2', e.target.value)} placeholder="Line 2" className="rounded-lg border px-3 py-2 bg-white" />
              <input value={a.city || ''} onChange={e=>updateAddr(setData, data, idx, 'city', e.target.value)} placeholder="City" className="rounded-lg border px-3 py-2 bg-white" />
              <input value={a.state || ''} onChange={e=>updateAddr(setData, data, idx, 'state', e.target.value)} placeholder="State" className="rounded-lg border px-3 py-2 bg-white" />
              <input value={a.postalCode || ''} onChange={e=>updateAddr(setData, data, idx, 'postalCode', e.target.value)} placeholder="Postal code" className="rounded-lg border px-3 py-2 bg-white" />
              <input value={a.country || ''} onChange={e=>updateAddr(setData, data, idx, 'country', e.target.value)} placeholder="Country" className="rounded-lg border px-3 py-2 bg-white" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!a.isDefault} onChange={e=>updateAddr(setData, data, idx, 'isDefault', e.target.checked)} />
                Default
              </label>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={()=>setData({...data!, addresses:[...(data!.addresses||[]), {}]})} className="px-3 py-1 rounded border">Add address</button>
            <button onClick={save} className="px-3 py-1 rounded bg-indigo-600 text-white">Save</button>
          </div>
        </div>
      </div>
    </Protected>
  )
}

function updateAddr(setData:any, data:any, idx:number, key:string, val:any) {
  const copy = [...(data.addresses || [])]
  copy[idx] = { ...(copy[idx]||{}), [key]: val }
  setData({ ...data, addresses: copy })
}
