// src/app/auth/login/page.tsx
import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

type SP = Promise<{ verified?: string | string[]; email?: string | string[] }>

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const verifiedParam = Array.isArray(sp.verified) ? sp.verified[0] : sp.verified
  const emailParam = Array.isArray(sp.email) ? sp.email[0] : sp.email

  const verified = typeof verifiedParam === 'string' ? verifiedParam : undefined
  const email = typeof emailParam === 'string' ? emailParam : ''

  return <LoginClient initialVerified={verified} initialEmail={email} />
}
