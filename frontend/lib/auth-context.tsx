"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getToken, getUser, clearToken, login as apiLogin, register as apiRegister } from "./api"

interface AuthUser {
  id: string
  email?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (email: string, password: string, username: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = getToken()
    const u = getUser()
    if (t && u) {
      setToken(t)
      setUser(u)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password)
    if (result.ok && result.data) {
      const t = getToken()
      const u = getUser()
      if (t) setToken(t)
      if (u) setUser(u)
    }
    return { ok: result.ok, error: result.error }
  }

  const register = async (email: string, password: string, username: string) => {
    const result = await apiRegister(email, password, username)
    if (result.ok && result.data) {
      const t = getToken()
      const u = getUser()
      if (t) setToken(t)
      if (u) setUser(u)
    }
    return { ok: result.ok, error: result.error }
  }

  const logout = () => {
    clearToken()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
