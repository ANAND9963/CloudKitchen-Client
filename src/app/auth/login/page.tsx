// src/app/auth/login/page.tsx
import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

export default function Page({
  searchParams,
}: {
  searchParams: { verified?: string; email?: string }
}) {
  const verified = typeof searchParams?.verified === 'string' ? searchParams.verified : undefined
  const email = typeof searchParams?.email === 'string' ? searchParams.email : ''
  return <LoginClient initialVerified={verified} initialEmail={email} />
}
