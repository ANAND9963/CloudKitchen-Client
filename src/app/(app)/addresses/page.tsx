'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import toast from 'react-hot-toast'
import AddressForm, { Address } from '@/components/addresses/AddressForm'
import { createPortal } from 'react-dom'

function ModalPortal({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || !open) return null
  return createPortal(<>{children}</>, document.body)
}

export default function AddressesPage() {
  const router = useRouter()
  const [list, setList] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)

  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/addresses')
      setList(data?.addresses || [])
    } catch (e: any) {
      const s = e?.response?.status
      if (s === 401 || s === 403) {
        router.replace('/auth/login')
      } else {
        toast.error(e?.response?.data?.message || 'Failed to load addresses')
      }
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onCreate = () => {
    setEditing(null)
    setOpenForm(true)
  }

  const onEdit = (addr: Address) => {
    setEditing(addr)
    setOpenForm(true)
  }

  const onSubmit = async (data: Address) => {
    try {
      setSaving(true)
      if (editing?._id) {
        await api.put(`/addresses/${editing._id}`, {
          ...data,
          isDefault: data.isDefault, // backend promotes/demotes others if true
        })
        toast.success('Address updated')
      } else {
        await api.post('/addresses', {
          ...data,
          isDefault: data.isDefault,
        })
        toast.success('Address added')
      }
      setOpenForm(false)
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const setDefault = async (id: string) => {
    try {
      await api.patch(`/addresses/${id}/default`)
      toast.success('Default address set')
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not set default')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this address?')) return
    try {
      await api.delete(`/addresses/${id}`)
      toast.success('Address deleted')
      setList((arr) => arr.filter((a) => a._id !== id))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-white">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <button
          onClick={onCreate}
          className="rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-white hover:bg-white/25"
        >
          + Add address
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
        {loading ? (
          <div className="p-4 text-white/85 text-sm">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-4 text-white/85 text-sm">No addresses yet. Add one to get started.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {list.map((a) => (
              <li key={a._id} className="p-4 text-white/90 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{a.label || 'Address'}</span>
                    {a.isDefault && (
                      <span className="text-xs rounded border border-emerald-200/40 bg-emerald-300/20 text-emerald-100 px-2 py-0.5">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white/80 mt-1">
                    {a.fullName} • {a.phone}
                  </div>
                  <div className="text-sm text-white/80">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => onEdit(a)}
                    className="text-sm underline underline-offset-4 hover:text-white"
                  >
                    Edit
                  </button>
                  {!a.isDefault && (
                    <button
                      onClick={() => setDefault(a._id!)}
                      className="text-sm underline underline-offset-4 hover:text-white"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => remove(a._id!)}
                    className="text-sm text-rose-200 underline underline-offset-4 hover:text-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal */}
      <ModalPortal open={openForm}>
        <div className="fixed inset-0 z-[70] grid place-items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenForm(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white/85 p-5 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">
                {editing ? 'Edit address' : 'Add address'}
              </h3>
              <button
                onClick={() => setOpenForm(false)}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                Close
              </button>
            </div>

            <AddressForm
              initial={editing || undefined}
              onSubmit={onSubmit}
              onCancel={() => setOpenForm(false)}
              saving={saving}
              showDefaultToggle
            />
          </div>
        </div>
      </ModalPortal>
    </div>
  )
}
