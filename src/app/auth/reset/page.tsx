// src/app/auth/reset/page.tsx
import ResetClient from './ResetClient'

export const dynamic = 'force-dynamic'

type SP = Promise<{ email?: string | string[] }>

export default async function Page({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const emailParam = Array.isArray(sp.email) ? sp.email[0] : sp.email
  const email = typeof emailParam === 'string' ? emailParam : ''
  return <ResetClient initialEmail={email} />
}

//