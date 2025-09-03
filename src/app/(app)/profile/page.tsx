// src/app/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import api from '@/utils/api'
import toast from 'react-hot-toast'

type P = {
  firstName?: string
  lastName?: string
  mobileNumber?: string
  email: string
}

export default function ProfilePage() {
  const [data, setData] = useState<P>({ email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/users/me')
        if (mounted) setData(data?.user || data)
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.patch('/users/me', {
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNumber: data.mobileNumber,
      })
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-white">Loading…</div>

  return (
    <div className="mx-auto max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-6 text-white">
      <h1 className="text-xl font-semibold mb-4">Personal Information</h1>
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* keep inputs bright for readability on glass */}
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/90">First name</span>
          <input
            className="border rounded-lg px-3 py-2 bg-white/95 text-black"
            value={data.firstName || ''}
            onChange={(e) => setData({ ...data, firstName: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/90">Last name</span>
          <input
            className="border rounded-lg px-3 py-2 bg-white/95 text-black"
            value={data.lastName || ''}
            onChange={(e) => setData({ ...data, lastName: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/90">Mobile number</span>
          <input
            className="border rounded-lg px-3 py-2 bg-white/95 text-black"
            value={data.mobileNumber || ''}
            onChange={(e) => setData({ ...data, mobileNumber: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2 opacity-90">
          <span className="text-sm text-white/90">Email</span>
          <input
            className="border rounded-lg px-3 py-2 bg-white/70 text-black"
            value={data.email}
            disabled
          />
        </label>

        <div className="md:col-span-2 flex justify-end gap-2">
          <button type="submit" className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/25 border border-white/20 text-white" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
