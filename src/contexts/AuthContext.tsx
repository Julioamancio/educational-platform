import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, Topic, Content, Question } from '@/types'
import { seedUsers, seedTopics, seedContents, seedQuestions } from '@/utils/seedData'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Initialize all data
  const [users, setUsers] = useKV<User[]>('users', [])
  const [topics, setTopics] = useKV<Topic[]>('topics', [])
  const [contents, setContents] = useKV<Content[]>('contents', [])
  const [questions, setQuestions] = useKV<Question[]>('questions', [])
  const [currentUserId, setCurrentUserId] = useKV<string | null>('currentUserId', null)
  const [initialized, setInitialized] = useKV<boolean>('dataInitialized', false)

  // Initialize seed data if empty
  useEffect(() => {
    if (!initialized && users.length === 0) {
      setUsers(seedUsers)
      setTopics(seedTopics)
      setContents(seedContents)
      setQuestions(seedQuestions)
      setInitialized(true)
    }
  }, [initialized, users.length, setUsers, setTopics, setContents, setQuestions, setInitialized])

  useEffect(() => {
    if (currentUserId && users.length > 0) {
      const foundUser = users.find(u => u.id === currentUserId)
      setUser(foundUser || null)
    }
    setIsLoading(false)
  }, [currentUserId, users])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const foundUser = users.find(u => u.email === email)
      if (foundUser) {
        // Admin credentials
        if (foundUser.email === 'admin@eduplatform.com' && password === 'admin123') {
          setCurrentUserId(foundUser.id)
          setUser(foundUser)
          return true
        }
        // Student credentials  
        if (foundUser.role === 'student' && password === 'student123') {
          setCurrentUserId(foundUser.id)
          setUser(foundUser)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
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
    } catch (error) {
      console.error('Registration error:', error)
      return false
    }
  }

  const logout = () => {
    setCurrentUserId(null)
    setUser(null)
  }

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}