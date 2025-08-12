import { createContext, useContext, useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'student'
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useKV<User[]>('users', [])
  const [currentUserId, setCurrentUserId] = useKV<string | null>('currentUserId', null)

  useEffect(() => {
    if (currentUserId && users.length > 0) {
      const foundUser = users.find(u => u.id === currentUserId)
      setUser(foundUser || null)
    }
    setIsLoading(false)
  }, [currentUserId, users])

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email === email)
    if (foundUser && password === 'demo123') { // Simple demo password
      setCurrentUserId(foundUser.id)
      setUser(foundUser)
      return true
    }
    return false
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    if (users.find(u => u.email === email)) {
      return false // User already exists
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: 'student',
      createdAt: new Date().toISOString()
    }

    setUsers(currentUsers => [...currentUsers, newUser])
    setCurrentUserId(newUser.id)
    setUser(newUser)
    return true
  }

  const logout = () => {
    setCurrentUserId(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}