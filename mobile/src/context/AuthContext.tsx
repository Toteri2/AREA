import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { authApi } from '../api'
import { tokenStorage } from '../api/client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const userData = await authApi.getProfile()
      setUser(userData)
    } catch {
      setUser(null)
      await tokenStorage.removeToken()
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const token = await tokenStorage.getToken()
      if (token) {
        await refreshUser()
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    await tokenStorage.setToken(response.access_token)
    setUser(response.user)
  }

  const register = async (email: string, password: string, name: string) => {
    await authApi.register(email, password, name)
  }

  const logout = async () => {
    await tokenStorage.removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
