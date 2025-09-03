'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'

type Me = {
  _id: string
  firstName?: string
  lastName?: string
  email: string
  role: 'user' | 'admin' | 'owner'
}

export default function AppNavbar() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.get('/users/me')
        if (mounted) setMe(data?.user || data)
      } catch {
        router.replace('/auth/login')
      }
    })()
    return () => { mounted = false }
  }, [router])

  const logout = () => {
    localStorage.removeItem('ck_token')
    localStorage.removeItem('token')
    router.replace('/auth/login')
  }

  const initials =
    (me?.firstName?.[0] || '') + (me?.lastName?.[0] || me?.email?.[0] || '')

  return (
    <header className="h-14 sticky top-0 z-50 border-b bg-white/40 backdrop-blur supports-[backdrop-filter]:bg-white/20">
      <div className="mx-auto max-w-6xl h-full px-4 flex items-center justify-between">
        <Link href="/menus" className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-bold grid place-items-center">CK</div>
          <span className="font-semibold">CloudKitchen</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/owner" className="text-sm hover:text-indigo-600">Owner Home</Link>
          <Link href="/menus" className="text-sm hover:text-indigo-600">Menus</Link>
        </nav>

        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="h-9 w-9 rounded-full bg-neutral-200 text-sm font-semibold grid place-items-center"
            aria-label="Profile"
          >
            {(initials || 'U').toUpperCase()}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 z-[60] w-64 rounded-2xl border bg-white shadow-xl p-2">
              <div className="px-3 py-2">
                <div className="text-sm font-medium">
                  {me?.firstName} {me?.lastName}
                </div>
                <div className="text-xs text-neutral-500">{me?.email}</div>
                <div className="text-xs text-neutral-500 capitalize">Role: {me?.role}</div>
              </div>
              <hr />
              <Link
                href="/profile"
                className="block px-3 py-2 text-sm rounded-lg hover:bg-neutral-100"
                onClick={() => setOpen(false)}
              >
                Edit personal information
              </Link>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-neutral-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
