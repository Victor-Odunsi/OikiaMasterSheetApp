"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import type { User } from "@/lib/types"
import { authApi } from "@/lib/api/auth"
import { apiClient } from "@/lib/api/client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
      apiClient.clearTokens()
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser()
          setUser(currentUser)
        } catch {
          apiClient.clearTokens()
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    setUser(response.user as User)
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
