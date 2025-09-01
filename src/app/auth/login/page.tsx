// src/app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import api from '@/utils/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

type FormState = {
    email: string
    password: string
}

export default function LoginPage() {
    const router = useRouter()
    const [form, setForm] = useState<FormState>({ email: '', password: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)

    const onChange = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((s) => ({ ...s, [k]: e.target.value }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            await api.post('/users/login', form)
            toast.success('Welcome back!')
            router.push('/') // change to /dashboard when ready
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh grid grid-cols-1 md:grid-cols-2">
            {/* Left: brand panel (matches signup) */}
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
                            Good to see you again.
                        </h1>
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

                    <div className="text-right">
                        <Link href="/auth/forgot" className="text-sm text-indigo-600 hover:underline">
                            Forgot your password?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
