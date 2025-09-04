// src/components/AppNavbar.tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import CartDrawer from '@/components/cart/CartDrawer'

type Role = 'user' | 'admin' | 'owner'
type Me = {
  _id: string
  firstName?: string
  lastName?: string
  email: string
  role: Role
}

export default function AppNavbar() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [openProfile, setOpenProfile] = useState(false)

  // cart state (only used for role=user)
  const [openCart, setOpenCart] = useState(false)
  const [cartCount, setCartCount] = useState(0)

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

  // Initial cart count for users
  useEffect(() => {
    if (me?.role !== 'user') return
    ;(async () => {
      try {
        const { data } = await api.get('/cart')
        const items = (data?.cart?.items ?? data?.items ?? data?.cartItems ?? []) as any[]
        const count = items.reduce((s, it) => s + Number(it?.qty ?? it?.quantity ?? 1), 0)
        setCartCount(count)
      } catch {
        setCartCount(0)
      }
    })()
  }, [me?.role])

  const logout = () => {
    localStorage.removeItem('ck_token')
    localStorage.removeItem('token')
    router.replace('/auth/login')
  }

  const initials =
    (me?.firstName?.[0] || '') + (me?.lastName?.[0] || me?.email?.[0] || '')

  const links = useMemo(() => {
    const role = me?.role
    if (role === 'owner') {
      return [
        { href: '/owner', label: 'Owner Home' },
        { href: '/menus', label: 'Menus' },
      ]
    }
    if (role === 'admin') {
      return [
        { href: '/admin', label: 'Admin Dashboard' },
        { href: '/menus', label: 'Menus' },
      ]
    }
    // user (or unknown): only Menus
    return [{ href: '/menus', label: 'Menus' }]
  }, [me?.role])

  return (
    <>
      <header className="h-14 sticky top-0 z-50 border-b bg-white/40 backdrop-blur supports-[backdrop-filter]:bg-white/20">
        <div className="mx-auto max-w-6xl h-full px-4 flex items-center justify-between">
          <Link href="/menus" className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-bold grid place-items-center">CK</div>
            <span className="font-semibold">CloudKitchen</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm hover:text-indigo-600">
                {l.label}
              </Link>
            ))}
          </nav>

          

          <div className="relative flex items-center gap-3">
            {/* Cart only for regular users */}
            {me?.role === 'user' && (
              <button
                onClick={() => setOpenCart(true)}
                className="relative h-9 w-9 grid place-items-center rounded-full border border-neutral-300 bg-white/70 hover:bg-white"
                aria-label="Cart"
              >
                {/* cart icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M2.25 3.75a.75.75 0 0 1 .75-.75h1.386a1.5 1.5 0 0 1 1.434 1.093l.299 1.12h12.831a.75.75 0 0 1 .73.93l-1.5 6a.75.75 0 0 1-.73.57H8.22l.248 1h9.782a.75.75 0 0 1 0 1.5H8.25a1.5 1.5 0 0 1-1.45-1.094L4.53 5.28l-.23-.86H3a.75.75 0 0 1-.75-.75ZM8.25 20.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-rose-600 text-white text-[10px] px-1.5 py-[2px]">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile */}
            <button
              onClick={() => setOpenProfile((v) => !v)}
              className="h-9 w-9 rounded-full bg-neutral-200 text-sm font-semibold grid place-items-center"
              aria-label="Profile"
            >
              {(initials || 'U').toUpperCase()}
            </button>

            {openProfile && (
              <div className="absolute right-0 top-10 z-[60] w-64 rounded-2xl border bg-white shadow-xl p-2">
                <div className="px-3 py-2">
                  <div className="text-sm font-medium">
                    {me?.firstName} {me?.lastName}
                  </div>
                  <div className="text-xs text-neutral-500">{me?.email}</div>
                  <div className="text-xs text-neutral-500 capitalize">Role: {me?.role || 'user'}</div>
                </div>
                <hr />
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-sm rounded-lg hover:bg-neutral-100"
                  onClick={() => setOpenProfile(false)}
                >
                  Edit personal information
                </Link>
                <Link href="/addresses" className="block px-3 py-2 text-sm rounded-lg hover:bg-neutral-100">
                  Addresses
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

      {/* Drawer mounts globally; updates badge count via onCountChange */}
      {me?.role === 'user' && (
        <CartDrawer
          open={openCart}
          onClose={() => setOpenCart(false)}
          onCountChange={setCartCount}
        />
      )}
    </>
  )
}
