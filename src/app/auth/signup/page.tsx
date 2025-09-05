// src/app/auth/signup/page.tsx
'use client'

import { useState } from 'react'
import api from '@/utils/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

type FormState = {
    firstName: string
    lastName: string
    email: string
    mobileNumber: string
    password: string
    confirmPassword: string
}

export default function SignupPage() {
    const router = useRouter()
    const [form, setForm] = useState<FormState>({
        firstName: '',
        lastName: '',
        email: '',
        mobileNumber: '',
        password: '',
        confirmPassword: '',
    })
    const [showPw, setShowPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    const [loading, setLoading] = useState(false)

    const onChange = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((s) => ({ ...s, [k]: e.target.value }))

    const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    const validatePassword = (pw: string) =>
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,12}$/.test(pw)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateEmail(form.email)) {
            toast.error('Please enter a valid email.')
            return
        }
        if (!validatePassword(form.password)) {
            toast.error('Password 8–12 chars incl. A‑Z, a‑z, number, symbol.')
            return
        }
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match.')
            return
        }

        try {
            setLoading(true)
            const { confirmPassword, ...userData } = form
            await api.post('/users/signup', userData)
            toast.success('Signup successful! Check your email for verification.')
            // backend exposes GET /api/users/verify-email — we can route users to a local info page later
            router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`)
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Signup failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh grid grid-cols-1 md:grid-cols-2">
            {/* Left: image + gradient brand panel */}
            <div className="relative hidden md:block">
                {/* Background image: put a file at /public/bg.jpg or change the URL */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/bg.jpg')" }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/70 via-purple-700/60 to-pink-600/60" />
                {/* Brand copy */}
                <div className="relative z-10 h-full w-full flex items-center justify-center p-10">
                    <div className="max-w-md text-white">
                        <div className="mb-6 inline-flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-white backdrop-blur-sm flex items-center justify-center text-xl font-bold">CK</div>
                            <span className="text-2xl font-semibold tracking-tight">CloudKitchen</span>
                        </div>
                        <h1 className="text-4xl font-extrabold leading-tight">
                            Fresh experiences, delivered.
                        </h1>
                        <p className="mt-4 text-white/85">
                            Create your account to manage orders, menus, and customers —
                            all in one beautifully simple dashboard.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: signup form card */}
            <div className="flex items-center justify-center p-6">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200/60 p-6 md:p-8 space-y-4"
                >
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
                        <p className="text-sm text-neutral-500">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">First name</label>
                            <input
                                type="text"
                                value={form.firstName}
                                onChange={onChange('firstName')}
                                placeholder="Jane"
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">Last name</label>
                            <input
                                type="text"
                                value={form.lastName}
                                onChange={onChange('lastName')}
                                placeholder="Doe"
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
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
                        <label className="text-sm font-medium text-neutral-700">Mobile number</label>
                        <input
                            type="tel"
                            value={form.mobileNumber}
                            onChange={onChange('mobileNumber')}
                            placeholder="+1 555 000 1234"
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
                        <p className="text-xs text-neutral-500">
                            8–12 chars with uppercase, lowercase, number, and symbol.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-700">Confirm password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPw ? 'text' : 'password'}
                                value={form.confirmPassword}
                                onChange={onChange('confirmPassword')}
                                placeholder="••••••••"
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPw((s) => !s)}
                                className="absolute inset-y-0 right-2 my-auto text-sm text-neutral-500 hover:text-neutral-700"
                                aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPw ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>

                    <p className="text-xs text-neutral-500">
                        By continuing, you agree to our Terms & Privacy Policy.
                    </p>
                </form>
            </div>
        </div>
    )
}
