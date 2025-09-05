'use client'

import AppNavbar from "@/components/AppNavbar"



export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    // ↓ add ck-app wrapper + light gradient + dark text
    <div className="ck-app min-h-dvh bg-gradient-to-br from-indigo-50 via-violet-50 to-sky-50 text-neutral-900">
      <AppNavbar />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
