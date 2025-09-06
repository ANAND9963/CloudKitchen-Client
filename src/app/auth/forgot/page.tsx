// src/app/auth/forgot/page.tsx
"use client";


import { useState } from 'react'
import api from '@/utils/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateEmail(email)) {
            toast.error('Please enter a valid email.')
            return
        }
        try {
            setLoading(true)
            await api.post('/users/forgot-password', { email })
            toast.success('OTP sent to your email.')
            router.push(`/auth/reset?email=${encodeURIComponent(email)}`)
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh grid grid-cols-1 md:grid-cols-2">
            {/* Left brand / image panel */}
            <div className="relative hidden md:block">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/bg.jpg')" }} />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/70 via-purple-700/60 to-pink-600/60" />
                <div className="relative z-10 h-full w-full flex items-center justify-center p-10">
                    <div className="max-w-md text-white">
                        <div className="mb-6 inline-flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-white backdrop-blur-sm flex items-center justify-center text-xl font-bold">CK</div>
                            <span className="text-2xl font-semibold tracking-tight">CloudKitchen</span>
                        </div>
                        <h1 className="text-4xl font-extrabold leading-tight">Forgot your password?</h1>
                        <p className="mt-4 text-white/85">
                            Enter your email and we’ll send you a one‑time code to reset it securely.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right form */}
            <div className="flex items-center justify-center p-6">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200/60 p-6 md:p-8 space-y-4"
                >
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Reset password</h2>
                        <p className="text-sm text-neutral-500">
                            Remembered it?{' '}
                            <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline">
                                Back to login
                            </Link>
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loading ? 'Sending code…' : 'Send code'}
                    </button>

                    <p className="text-xs text-neutral-500">
                        We’ll email a one‑time code. It expires for your security.
                    </p>
                </form>
            </div>
        </div>
    )
}
