import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthApi, getToken, setToken, type AuthUser } from './api'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Hydrate session from a stored token on first load.
  useEffect(() => {
    let active = true
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    AuthApi.me()
      .then((u) => {
        if (active) setUser(u)
      })
      .catch(() => {
        setToken(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { accessToken, user } = await AuthApi.login(email, password)
    setToken(accessToken)
    setUser(user)
    return user
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** Wraps authenticated routes; redirects to /login when unauthenticated. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-white/50">
        <div className="animate-pulse text-sm">Loading session…</div>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
