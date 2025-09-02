// src/app/auth/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import api from '@/utils/api'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

type FormState = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()

  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  // Show success/failure toast from backend verification redirects
  useEffect(() => {
    const v = search.get('verified')
    if (v === '1') {
      toast.success('Email verified! Please log in.')
    } else if (v === '0') {
      toast.error('Verification failed. Invalid or expired verification link.')
    }
  }, [search])

  // Pre-fill email from URL (?email=...) so the Resend button works instantly
  useEffect(() => {
    const emailFromUrl = search.get('email')
    if (emailFromUrl) {
      setForm((s) => ({ ...s, email: emailFromUrl }))
    }
  }, [search])

  const onChange =
    (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }))

  const resendVerification = async () => {
    if (!form.email) {
      toast.error('Enter your email above, then click Resend.')
      return
    }
    try {
      await api.post('/users/resend-verification-public', { email: form.email })
      toast.success('Verification email sent again. Check your inbox.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not resend verification email.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      // 1) Login
      const { data } = await api.post('/users/login', form)

      // 2) Persist JWT (support common field names; save under both keys for safety)
      const token =
        data?.token ?? data?.jwt ?? data?.accessToken ?? data?.data?.token
      if (!token) {
        toast.error('Login failed: missing token in response.')
        return
      }
      localStorage.setItem('ck_token', token)
      localStorage.setItem('token', token)

      // 3) Figure out role (use response user if present, else /users/me)
      let role: string | undefined = data?.user?.role ?? data?.role
      if (!role) {
        try {
          const meRes = await api.get('/users/me')
          const me = meRes?.data?.user ?? meRes?.data
          role = me?.role
        } catch {
          // ignore; we’ll fall back to a generic route
        }
      }

      toast.success('Welcome back!')

      // 4) Route by role
      if (role === 'owner') {
        router.replace('/owner')
      } else if (role === 'admin') {
        router.replace('/admin')
      } else {
        // default for normal users (change to "/" if you prefer)
        router.replace('/menus')
      }
    } catch (err: any) {
      const code = err?.response?.data?.code as string | undefined
      const message = err?.response?.data?.message || 'Login failed'

      if (code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Email not verified. Please check your inbox.')
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
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
              <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl font-bold">
                CK
              </div>
              <span className="text-2xl font-semibold tracking-tight">CloudKitchen</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight">Good to see you again.</h1>
            <p className="mt-4 text-white/85">
              Log in to manage orders, menus, and your customers from anywhere.
            </p>
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200/60 p-6 md:p-8 space-y-4"
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Log in</h2>
            <p className="text-sm text-neutral-500">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-indigo-600 hover:underline">
                Create one
              </Link>
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={onChange('email')}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={onChange('password')}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto text-sm text-neutral-500 hover:text-neutral-700"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link href="/auth/forgot" className="text-indigo-600 hover:underline">
              Forgot your password?
            </Link>

            {/* Bottom-right: Resend button */}
            <button
              type="button"
              onClick={resendVerification}
              className="text-indigo-600 hover:underline"
            >
              Resend verification
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
