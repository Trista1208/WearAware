"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { champagneBorder } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

type Mode = "login" | "register"

interface AuthModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result =
      mode === "login"
        ? await login(email, password)
        : await register(email, password, username)

    setLoading(false)

    if (result.success) {
      onSuccess?.()
      onClose()
    } else {
      setError(result.error || "Something went wrong")
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[rgba(212,180,118,0.3)] bg-[rgba(255,255,248,0.06)] px-4 py-3 text-sm text-[#2C2C2C] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[rgba(212,180,118,0.6)] transition"

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className={cn(
            "relative w-full max-w-sm rounded-2xl bg-[#FFFFF8] p-8 shadow-2xl",
            champagneBorder,
          )}
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Title */}
          <h2 className="font-serif text-2xl font-medium text-[#2C2C2C] mb-1">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-[13px] text-muted-foreground mb-6">
            {mode === "login"
              ? "Sign in to access your wardrobe"
              : "Start tracking your wardrobe mindfully"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                required
                minLength={3}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
              minLength={8}
            />

            {error && (
              <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-b from-[#6A7A60] to-[#54634C] px-4 py-3 text-sm font-medium text-[#FFFFF8] shadow-md transition hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-5 text-center text-[12px] text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }}
              className="font-medium text-[#54634C] hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
