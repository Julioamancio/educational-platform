import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { User } from '@/types'

interface OnlineUser {
  id: string
  name: string
  role: 'admin' | 'student'
  lastSeen: string
  isOnline: boolean
}

export function useOnlineStatus() {
  const [onlineUsers, setOnlineUsers] = useKV<OnlineUser[]>('online-users', [])
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Update online status
  const updateUserStatus = (user: User, online: boolean) => {
    setOnlineUsers((currentUsers) => {
      const filteredUsers = currentUsers.filter(u => u.id !== user.id)
      
      if (online) {
        return [
          ...filteredUsers,
          {
            id: user.id,
            name: user.name,
            role: user.role,
            lastSeen: new Date().toISOString(),
            isOnline: true
          }
        ]
      } else {
        // Mark as offline with last seen timestamp
        const existingUser = currentUsers.find(u => u.id === user.id)
        if (existingUser) {
          return [
            ...filteredUsers,
            {
              ...existingUser,
              isOnline: false,
              lastSeen: new Date().toISOString()
            }
          ]
        }
        return filteredUsers
      }
    })
  }

  // Remove user from online list
  const removeUser = (userId: string) => {
    setOnlineUsers((currentUsers) => 
      currentUsers.filter(u => u.id !== userId)
    )
  }

  // Get user status
  const getUserStatus = (userId: string): OnlineUser | null => {
    return onlineUsers.find(u => u.id === userId) || null
  }

  // Get all online users
  const getOnlineUsers = (): OnlineUser[] => {
    return onlineUsers.filter(u => u.isOnline)
  }

  // Get all users with their status
  const getAllUsersWithStatus = (): OnlineUser[] => {
    return onlineUsers
  }

  // Check if user is online
  const isUserOnline = (userId: string): boolean => {
    const user = onlineUsers.find(u => u.id === userId)
    return user?.isOnline || false
  }

  // Update last seen for current user
  const updateLastSeen = (userId: string) => {
    setOnlineUsers((currentUsers) => 
      currentUsers.map(user => 
        user.id === userId 
          ? { ...user, lastSeen: new Date().toISOString() }
          : user
      )
    )
  }

  // Clean up offline users after 5 minutes of inactivity
  const cleanupOfflineUsers = () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    setOnlineUsers((currentUsers) => 
      currentUsers.filter(user => {
        if (user.isOnline) return true
        return user.lastSeen > fiveMinutesAgo
      })
    )
  }

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Cleanup offline users periodically
  useEffect(() => {
    const interval = setInterval(cleanupOfflineUsers, 60000) // Every minute
    return () => clearInterval(interval)
  }, [])

  // Format last seen time
  const formatLastSeen = (lastSeen: string): string => {
    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Agora mesmo'
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d atrás`
    
    return lastSeenDate.toLocaleDateString('pt-BR')
  }

  return {
    onlineUsers,
    isOnline,
    updateUserStatus,
    removeUser,
    getUserStatus,
    getOnlineUsers,
    getAllUsersWithStatus,
    isUserOnline,
    updateLastSeen,
    formatLastSeen,
    cleanupOfflineUsers
  }
}