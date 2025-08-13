import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, Topic, Content, Question } from '@/types'
import { seedUsers, seedTopics, seedContents, seedQuestions } from '@/utils/seedData'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

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
  const { updateUserStatus, updateLastSeen } = useOnlineStatus()
  
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
      
      // Mark user as online when they are found
      if (foundUser) {
        updateUserStatus(foundUser, true)
      }
    }
    setIsLoading(false)
  }, [currentUserId, users, updateUserStatus])

  // Update last seen periodically for active user
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        updateLastSeen(user.id)
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user, updateLastSeen])

  // Handle page visibility change to update online status
  useEffect(() => {
    if (user) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          updateUserStatus(user, false)
        } else {
          updateUserStatus(user, true)
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, updateUserStatus])

  // Mark user as offline when component unmounts
  useEffect(() => {
    return () => {
      if (user) {
        updateUserStatus(user, false)
      }
    }
  }, [user, updateUserStatus])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const foundUser = users.find(u => u.email === email)
      if (foundUser) {
        // Check if the provided password matches the stored password
        if (foundUser.password && foundUser.password === password) {
          // Update last login timestamp
          const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() }
          setUsers(currentUsers => currentUsers.map(u => u.id === foundUser.id ? updatedUser : u))
          setCurrentUserId(foundUser.id)
          setUser(updatedUser)
          updateUserStatus(updatedUser, true)
          return true
        }
        // Fallback for admin credentials
        if (foundUser.email === 'admin@eduplatform.com' && password === 'admin123') {
          const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() }
          setUsers(currentUsers => currentUsers.map(u => u.id === foundUser.id ? updatedUser : u))
          setCurrentUserId(foundUser.id)
          setUser(updatedUser)
          updateUserStatus(updatedUser, true)
          return true
        }
        // Fallback for student credentials  
        if (foundUser.role === 'student' && password === 'student123') {
          const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() }
          setUsers(currentUsers => currentUsers.map(u => u.id === foundUser.id ? updatedUser : u))
          setCurrentUserId(foundUser.id)
          setUser(updatedUser)
          updateUserStatus(updatedUser, true)
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
    if (user) {
      updateUserStatus(user, false)
    }
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