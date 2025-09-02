// src/app/(app)/owner/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import MenuManager from '@/components/owner/MenuManager'
import AdminManager from '@/components/owner/AdminManager'

export default function OwnerHomePage() {
  const router = useRouter()
  const [tab, setTab] = useState<'menus' | 'admins'>('menus')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/me')
        const me = data?.user || data
        if (me?.role !== 'owner') router.replace('/menus') // or '/'
      } catch {
        router.replace('/auth/login')
      }
    })()
  }, [router])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Owner Home</h1>
      <div className="flex gap-2">
        <button
          onClick={() => setTab('menus')}
          className={`px-3 py-1.5 rounded-lg border ${tab==='menus' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}
        >
          Menus
        </button>
        <button
          onClick={() => setTab('admins')}
          className={`px-3 py-1.5 rounded-lg border ${tab==='admins' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'}`}
        >
          Admins
        </button>
      </div>
      {tab === 'menus' ? <MenuManager /> : <AdminManager />}
    </div>
  )
}
