// src/app/auth/reset/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/utils/api'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
    const search = useSearchParams()
    const router = useRouter()

    const emailFromQuery = search.get('email') || ''
    const [email, setEmail] = useState(emailFromQuery)
    const [otp, setOtp] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [resetting, setResetting] = useState(false)

    useEffect(() => {
        if (emailFromQuery) setEmail(emailFromQuery)
    }, [emailFromQuery])

    const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    const validatePassword = (pw: string) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,12}$/.test(pw)

    const handleVerifyAndReset = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateEmail(email)) {
            toast.error('Please enter a valid email.')
            return
        }
        if (!otp || otp.trim().length < 4) {
            toast.error('Please enter the OTP sent to your email.')
            return
        }
        if (!validatePassword(password)) {
            toast.error('Password 8–12 chars incl. A‑Z, a‑z, number, symbol.')
            return
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match.')
            return
        }

        try {
            setVerifying(true)
            // Step 1: verify OTP
            await api.post('/users/verify-otp', { email, otp })
            toast.success('Code verified.')

            // Step 2: reset password — IMPORTANT: include otp here too
            setResetting(true)
            await api.post('/users/reset-password', { email, otp, newPassword: password })
            toast.success('Password reset successfully.')
            router.push('/auth/login')
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Reset failed')
        } finally {
            setVerifying(false)
            setResetting(false)
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
                        <h1 className="text-4xl font-extrabold leading-tight">Enter your code & new password</h1>
                        <p className="mt-4 text-white/85">
                            Check your inbox for the one‑time code, then set a new password below.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right form */}
            <div className="flex items-center justify-center p-6">
                <form
                    onSubmit={handleVerifyAndReset}
                    className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200/60 p-6 md:p-8 space-y-4"
                >
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Reset password</h2>
                        <p className="text-sm text-neutral-500">
                            Don&apos;t need this?{' '}
                            <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline">
                                Back to login
                            </Link>
                        </p>
                    </div>

                    {/* Email (pre-filled if provided) */}
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

                    {/* OTP */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-700">One‑time code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter the code from your email"
                            required
                            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {/* New password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-700">New password</label>
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((s) => !s)}
                                className="absolute inset-y-0 right-2 my-auto text-sm text-neutral-500 hover:text-neutral-700"
                            >
                                {showPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <p className="text-xs text-neutral-500">
                            8–12 chars with uppercase, lowercase, number, and symbol.
                        </p>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-700">Confirm new password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPw ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPw((s) => !s)}
                                className="absolute inset-y-0 right-2 my-auto text-sm text-neutral-500 hover:text-neutral-700"
                            >
                                {showConfirmPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={verifying || resetting}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {verifying || resetting ? 'Updating…' : 'Update password'}
                    </button>
                </form>
            </div>
        </div>
    )
}
