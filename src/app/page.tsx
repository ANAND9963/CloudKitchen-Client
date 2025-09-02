// src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('ck_token') || localStorage.getItem('token')
    if (!t) {
      setIsPublic(true)
      setChecking(false)
      return
    }
    ;(async () => {
      try {
        const { data } = await api.get('/users/me')
        const me = data?.user || data
        if (me?.role === 'owner') return router.replace('/owner')
        if (me?.role === 'admin') return router.replace('/admin')
        // normal user route (change if you have a specific path)
        return router.replace('/menus')
      } catch {
        setIsPublic(true)
      } finally {
        setChecking(false)
      }
    })()
  }, [router])

  // while we check, avoid flashing the public text
  if (checking) return <div className="p-6">Loading…</div>

  if (isPublic) {
    // your existing public landing content
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Welcome to CloudKitchen</h1>
        <p className="text-neutral-600">Please log in to continue.</p>
      </main>
    )
  }

  // we usually redirected already; this is a fallback
  return null
}
