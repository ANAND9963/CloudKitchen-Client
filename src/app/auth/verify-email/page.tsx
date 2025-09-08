// src/app/auth/verify-email/page.tsx
import VerifyClient from './VerifyClient'

export const dynamic = 'force-dynamic'

export default function Page({
  searchParams,
}: {
  searchParams: { token?: string; email?: string }
}) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token : ''
  const email = typeof searchParams?.email === 'string' ? searchParams.email : ''
  return <VerifyClient token={token} email={email} />
}
