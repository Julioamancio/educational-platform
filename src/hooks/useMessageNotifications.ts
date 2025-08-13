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
      if (key.includes(`-${user.id}`) && key.startsWith('private-')) {
        total += unreadCounts[key] || 0
      }
    })
    
    setTotalUnread(total)
  }, [unreadCounts, user])

  // Mark messages as read
  const markAsRead = async (roomType: string, roomId?: string) => {
    if (!user) return
    
    const key = roomType === 'global' 
      ? `global-${user.id}`
      : `private-${roomId}-${user.id}`
    
    const newUnreadCounts = { ...unreadCounts }
    newUnreadCounts[key] = 0
    await setUnreadCounts(newUnreadCounts)
  }

  return {
    totalUnread,
    markAsRead
  }
}