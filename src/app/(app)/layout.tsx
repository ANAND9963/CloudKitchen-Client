// src/app/(app)/layout.tsx
'use client'

import AppNavbar from '@/components/AppNavbar'

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  // AppNavbar already fetches /users/me and kicks to /auth/login if needed
  return (
    <div className="min-h-dvh bg-neutral-50">
      <AppNavbar />
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  )
}
