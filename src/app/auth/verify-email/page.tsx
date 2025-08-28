// src/app/users/verify-email/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/utils/api'
import Link from 'next/link'
import toast from 'react-hot-toast'

type VerifyState = 'idle' | 'verifying' | 'success' | 'error' | 'no-token'

export default function VerifyEmailPage() {
    const search = useSearchParams()
    const router = useRouter()
    const token = search.get('token')
    const email = search.get('email')

    const [state, setState] = useState<VerifyState>('idle')
    const [message, setMessage] = useState<string>('')

    useEffect(() => {
        if (!token || !email) {
            setState('no-token')
            return
        }

        const run = async () => {
            try {
                setState('verifying')
                const res = await api.get('/users/verify-email', { params: { token, email } })
                setState('success')
                setMessage(res?.data?.message || 'Email verified successfully. You can now log in.')
                toast.success('Email verified!')
                // Optionally auto-redirect to login after a short delay:
                // setTimeout(() => router.push('/auth/login'), 1800)
            } catch (err: any) {
                setState('error')
                setMessage(err?.response?.data?.message || 'Invalid or expired verification link.')
                toast.error('Verification failed')
            }
        }
        run()
    }, [token, email, router])

    return (
        <div className="min-h-dvh grid grid-cols-1 md:grid-cols-2">
            {/* Left: brand panel (same look for consistency) */}
            <div className="relative hidden md:block">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/bg.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/70 via-purple-700/60 to-pink-600/60" />
                <div className="relative z-10 h-full w-full flex items-center justify-center p-10">
                    <div className="max-w-md text-white">
                        <div className="mb-6 inline-flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl font-bold">CK</div>
                            <span className="text-2xl font-semibold tracking-tight">CloudKitchen</span>
                        </div>
                        <h1 className="text-4xl font-extrabold leading-tight">
                            Verify your email
                        </h1>
                        <p className="mt-4 text-white/85">
                            We sent a verification link to your inbox. Click it to activate your account.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: status card */}
            <div className="flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200/60 p-6 md:p-8 space-y-4">
                    {state === 'no-token' && (
                        <>
                            <h2 className="text-2xl font-bold tracking-tight">Check your inbox</h2>
                            <p className="text-neutral-600">
                                We sent a verification link to your email. Open it on this device and you’ll be ready to go.
                            </p>
                            <div className="pt-2">
                                <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">Back to login</Link>
                            </div>
                        </>
                    )}

                    {state === 'verifying' && (
                        <>
                            <h2 className="text-2xl font-bold tracking-tight">Verifying…</h2>
                            <p className="text-neutral-600">Please wait while we confirm your email.</p>
                        </>
                    )}

                    {state === 'success' && (
                        <>
                            <h2 className="text-2xl font-bold tracking-tight text-emerald-600">Verified!</h2>
                            <p className="text-neutral-700">{message}</p>
                            <div className="pt-2">
                                <Link href="/auth/login" className="inline-block rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700">
                                    Go to login
                                </Link>
                            </div>
                        </>
                    )}

                    {state === 'error' && (
                        <>
                            <h2 className="text-2xl font-bold tracking-tight text-rose-600">Verification failed</h2>
                            <p className="text-neutral-700">{message}</p>
                            <div className="pt-2 space-x-3">
                                <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">Back to login</Link>
                                {/* You can add a "Resend link" flow later */}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
