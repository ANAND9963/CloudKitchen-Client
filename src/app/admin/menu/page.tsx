'use client'
import { useEffect, useState } from 'react'
import api from '@/utils/api'
import Protected from '@/components/Protected'
import RoleGate from '@/components/RoleGate'

type MenuItem = {
  _id: string
  title: string
  description?: string
  price: number
  imageUrl?: string
  category?: string
  isAvailable: boolean
}

export default function ManageMenu() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<MenuItem | null>(null)

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await api.get('/menus')
      setItems(res.data.items || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(()=>{ fetchList() }, [])

  const onSave = async (payload: Partial<MenuItem>) => {
    if (editing?._id) {
      await api.patch(`/menus/${editing._id}`, payload)
    } else {
      await api.post('/menus', payload)
    }
    setEditing(null)
    fetchList()
  }

  const onDelete = async (id: string) => {
    await api.delete(`/menus/${id}`)
    fetchList()
  }

  return (
    <Protected>
      <RoleGate allow={['admin','owner']} fallback={<div>Forbidden</div>}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Menu Management</h1>
            <button onClick={()=>setEditing({_id:'', title:'', price:0, isAvailable:true})} className="px-3 py-1 rounded bg-indigo-600 text-white">Add Item</button>
          </div>

          {loading ? <div>Loading…</div> : (
            <div className="rounded-xl border bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Price</th>
                    <th className="p-2 text-left">Available</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(m => (
                    <tr key={m._id} className="border-t">
                      <td className="p-2">{m.title}</td>
                      <td className="p-2">{m.category || '-'}</td>
                      <td className="p-2">${m.price.toFixed(2)}</td>
                      <td className="p-2">{m.isAvailable ? 'Yes' : 'No'}</td>
                      <td className="p-2 text-right">
                        <button onClick={()=>setEditing(m)} className="px-2 py-1 rounded border mr-2">Edit</button>
                        <button onClick={()=>onDelete(m._id)} className="px-2 py-1 rounded bg-rose-600 text-white">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td className="p-3 text-neutral-500" colSpan={5}>No items</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {editing && <EditDialog initial={editing} onClose={()=>setEditing(null)} onSave={onSave} />}
        </div>
      </RoleGate>
    </Protected>
  )
}

function EditDialog({ initial, onClose, onSave }:{ initial:any, onClose:()=>void, onSave:(p:any)=>void }){
  const [form, setForm] = useState<any>({
    title: initial.title || '', description: initial.description || '',
    price: initial.price || 0, imageUrl: initial.imageUrl || '',
    category: initial.category || '', isAvailable: initial.isAvailable ?? true
  })
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 space-y-3">
        <h3 className="font-semibold">{initial._id ? 'Edit' : 'Add'} Menu Item</h3>
        {['title','description','imageUrl','category'].map((k: string) => (
          <input key={k} placeholder={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}
            className="w-full rounded-lg border px-3 py-2 bg-white" />
        ))}
        <input type="number" step="0.01" placeholder="price" value={form.price}
          onChange={e=>setForm({...form, price: Number(e.target.value)})}
          className="w-full rounded-lg border px-3 py-2 bg-white" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.isAvailable} onChange={e=>setForm({...form, isAvailable: e.target.checked})} />
          Available
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
          <button onClick={()=>onSave(form)} className="px-3 py-1 rounded bg-indigo-600 text-white">Save</button>
        </div>
      </div>
    </div>
  )
}
