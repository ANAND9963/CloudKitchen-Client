'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '@/utils/api'

type User = {
  _id: string
  firstName?: string
  lastName?: string
  email: string
  mobileNumber?: string
  role: 'owner' | 'admin' | 'user'
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthCtx = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      setLoading(true)
      const res = await api.get('/users/me')
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/users/login', { email, password })
    const token = res.data?.token
    if (token) localStorage.setItem('ck_token', token)
    await refresh()
  }

  const logout = () => {
    localStorage.removeItem('ck_token')
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
