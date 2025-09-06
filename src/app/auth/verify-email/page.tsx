"use client";


import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/utils/api'
import Link from 'next/link'

type VerifyState = 'verifying' | 'no-token'

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

export default function VerifyEmailPage() {
  const search = useSearchParams()
  const token = search.get('token')
  const email = search.get('email') ?? ''

  const [state, setState] = useState<VerifyState>('verifying')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string>('')

  // Redirect to backend (email verification endpoint)
  useEffect(() => {
    if (!token || !email) {
      setState('no-token')
      return
    }
    window.location.href = `${BACKEND}/api/users/verify-email?token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(email)}`
  }, [token, email])

  const resend = async () => {
    if (!email) return
    try {
      setSending(true)
      await api.post('/users/resend-verification-public', { email })
      setMessage('Verification email resent. Check your inbox.')
    } catch (err) {
      const errorMessage =
        (err as any)?.response?.data?.message ??
        'Failed to resend verification email.'
      setMessage(errorMessage)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden md:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/70 via-purple-700/60 to-pink-600/60" />
        <div className="relative z-10 h-full w-full flex items-center justify-center p-10">
          <div className="max-w-md text-white">
            <div className="mb-6 inline-flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white backdrop-blur-sm flex items-center justify-center text-xl font-bold">
                CK
              </div>
              <span className="text-2xl font-semibold tracking-tight">
                CloudKitchen
              </span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight">
              Verify your email
            </h1>
            <p className="mt-4 text-white/85">
              We sent a verification link to your inbox. Click it to activate
              your account.
            </p>
          </div>
        </div>
      </div>

      {/* Right: status card */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200/60 p-6 md:p-8 space-y-4">
          {state === 'verifying' && (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Verifying…</h2>
              <p className="text-neutral-600">
                Please wait while we confirm your email.
              </p>
            </>
          )}

          {state === 'no-token' && (
            <>
              <h2 className="text-2xl font-bold tracking-tight">
                Check your inbox
              </h2>
              <p className="text-neutral-600">
                Open the verification email on this device to finish.
              </p>
              {email && (
                <button
                  onClick={resend}
                  disabled={sending}
                  className="rounded bg-indigo-600 text-white px-4 py-2"
                >
                  {sending ? 'Resending…' : 'Resend verification email'}
                </button>
              )}
              {message && (
                <p className="text-sm text-neutral-700 pt-2">{message}</p>
              )}
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
