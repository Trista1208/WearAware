"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiLogin, apiRegister, apiLogout, getToken, getUser } from "./api"

export interface AuthUser {
  id: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = getToken()
    const u = getUser()
    if (t && u) {
      setTokenState(t)
      setUserState(u as unknown as AuthUser)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    if (data.success) {
      setTokenState(data.data.session.access_token)
      setUserState(data.data.user)
      return { success: true }
    }
    return { success: false, error: data.error }
  }

  const register = async (email: string, password: string, username: string) => {
    const data = await apiRegister(email, password, username)
    if (data.success) return { success: true }
    return { success: false, error: data.error }
  }

  const logout = () => {
    apiLogout()
    setTokenState(null)
    setUserState(null)
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
