import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import NavBar from '@/components/NavBar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CloudKitchen',
  description: 'CloudKitchen app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-neutral-50 text-neutral-900">
        <AuthProvider>
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
