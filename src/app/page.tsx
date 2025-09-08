// src/app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token =
      localStorage.getItem('ck_token') || localStorage.getItem('token')

    // No token? → straight to login
    if (!token) {
      router.replace('/auth/login')
      return
    }

    // Has token → fetch profile and route by role
    ;(async () => {
      try {
        const { data } = await api.get('/users/me')
        const me = data?.user || data
        const role = me?.role

        if (role === 'owner') router.replace('/owner')
        else if (role === 'admin') router.replace('/admin')
        else router.replace('/menus') // default for regular users
      } catch {
        // token invalid/expired → go to login
        router.replace('/auth/login')
      }
    })()
  }, [router])

  // Small placeholder while redirecting
  return <div className="p-6">Loading…</div>
}
