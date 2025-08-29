'use client'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6">Loading…</div>
  if (!user) return (
    <div className="p-6">
      <p className="mb-3">You must be logged in.</p>
      <Link className="text-indigo-600 underline" href="/auth/login">Go to login</Link>
    </div>
  )
  return <>{children}</>
}
