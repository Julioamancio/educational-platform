import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { ChatMessage } from '@/types'

export const useMessageNotifications = () => {
  const { user } = useAuth()
  const [messages] = useKV<ChatMessage[]>('chat-messages', [])
  const [unreadCounts, setUnreadCounts] = useKV<Record<string, number>>('message-unread-counts', {})
  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    if (!user) {
      setTotalUnread(0)
      return
    }

    let total = 0
    
    // Global unread
    total += unreadCounts[`global-${user.id}`] || 0
    
    // Private unread (for admin and students)
    Object.keys(unreadCounts).forEach(key => {
      // Format: private-{senderId}-{receiverId}
      // We want to count messages where the current user is the receiver
      if (key.startsWith('private-') && key.endsWith(`-${user.id}`)) {
        total += unreadCounts[key] || 0
      }
    })
    
    setTotalUnread(total)
  }, [unreadCounts, user])

  // Mark messages as read
  const markAsRead = async (roomType: string, roomId?: string) => {
    if (!user) return
    
    const newUnreadCounts = { ...unreadCounts }
    
    if (roomType === 'global') {
      const key = `global-${user.id}`
      newUnreadCounts[key] = 0
    } else if (roomId) {
      // For private messages, use the correct key format
      const key1 = `private-${user.id}-${roomId}`
      const key2 = `private-${roomId}-${user.id}`
      
      // Clear both possible key formats
      newUnreadCounts[key1] = 0
      newUnreadCounts[key2] = 0
    }
    
    await setUnreadCounts(newUnreadCounts)
  }

  // Clear all notifications for the current user
  const clearAllNotifications = async () => {
    if (!user) return
    
    const newUnreadCounts = { ...unreadCounts }
    
    // Clear global notifications
    newUnreadCounts[`global-${user.id}`] = 0
    
    // Clear all private notifications where this user is the receiver
    Object.keys(newUnreadCounts).forEach(key => {
      if (key.startsWith('private-') && key.endsWith(`-${user.id}`)) {
        newUnreadCounts[key] = 0
      }
    })
    
    await setUnreadCounts(newUnreadCounts)
  }

  return {
    totalUnread,
    markAsRead,
    clearAllNotifications
  }
}