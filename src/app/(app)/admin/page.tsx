// src/app/(app)/admin/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import MenuManager from '@/components/owner/MenuManager'

export default function AdminDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/me')
        const me = data?.user || data
        if (me?.role !== 'admin') router.replace('/menus')
      } catch {
        router.replace('/auth/login')
      }
    })()
  }, [router])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      {/* Admins can edit menus, but no "Admins" tab here */}
      <MenuManager />
    </div>
  )
}
