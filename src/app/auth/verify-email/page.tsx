// src/app/auth/verify-email/page.tsx
import VerifyClient from './VerifyClient'

export const dynamic = 'force-dynamic'

type SP = Promise<{ token?: string | string[]; email?: string | string[] }>

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const tokenParam = Array.isArray(sp.token) ? sp.token[0] : sp.token
  const emailParam = Array.isArray(sp.email) ? sp.email[0] : sp.email

  const token = typeof tokenParam === 'string' ? tokenParam : ''
  const email = typeof emailParam === 'string' ? emailParam : ''

  return <VerifyClient token={token} email={email} />
}
