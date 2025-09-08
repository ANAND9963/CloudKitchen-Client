// src/app/auth/reset/page.tsx
import ResetClient from './ResetClient'

export const dynamic = 'force-dynamic'

export default function Page({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const email = typeof searchParams?.email === 'string' ? searchParams.email : ''
  return <ResetClient initialEmail={email} />
}
