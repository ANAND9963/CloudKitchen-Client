'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useState, useRef, useEffect } from 'react'

export default function NavBar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const initials = (user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-neutral-200">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">CloudKitchen</Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/menu" className="hover:underline">Menu</Link>

          {/* Cart icon */}
          <Link href="/cart" aria-label="Cart" className="p-1 rounded hover:bg-neutral-100">
            <CartIcon />
          </Link>

          {/* Right side: auth */}
          {!user ? (
            <Link href="/auth/login" className="rounded bg-indigo-600 text-white px-3 py-1">Login</Link>
          ) : (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((s) => !s)}
                className="h-8 w-8 rounded-full bg-neutral-900 text-white flex items-center justify-center"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                {initials}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border bg-white shadow-lg overflow-hidden">
                  <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-neutral-50">Manage profile</Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3h2l3.6 12.59A2 2 0 0 0 10.5 17h7a2 2 0 0 0 1.9-1.37L22 8H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10.5" cy="20" r="1.5" fill="currentColor"/>
      <circle cx="18.5" cy="20" r="1.5" fill="currentColor"/>
    </svg>
  )
}
