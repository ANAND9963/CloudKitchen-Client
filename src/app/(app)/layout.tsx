// src/app/(app)/layout.tsx
'use client'

import AppNavbar from '@/components/AppNavbar'

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      {/* Background image + gradient overlay (same as login) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-800/70 via-purple-700/60 to-pink-600/60" />

      {/* Content */}
      <div className="relative z-10 min-h-dvh">
        <AppNavbar />
        <main className="mx-auto max-w-6xl p-4 pt-6">{children}</main>
      </div>
    </div>
  )
}
