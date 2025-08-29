'use client'
import { useAuth } from '@/hooks/useAuth'

export default function RoleGate({
  allow,
  children,
  fallback = null
}: { allow: Array<'owner'|'admin'|'user'>, children: React.ReactNode, fallback?: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return null
  return allow.includes(user.role) ? <>{children}</> : <>{fallback}</>
}
