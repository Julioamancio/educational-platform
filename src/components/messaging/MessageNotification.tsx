import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChatMessage } from '@/types'
import { MessageCircle, Bell } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MessageNotificationProps {
  onOpenMessages?: () => void
}

const MessageNotification = ({ onOpenMessages }: MessageNotificationProps) => {
  const { user } = useAuth()
  const [messages] = useKV<ChatMessage[]>('chat-messages', [])
  const [lastChecked, setLastChecked] = useKV<string>(`last-checked-${user?.id}`, '')
  const [newMessageCount, setNewMessageCount] = useState(0)

  useEffect(() => {
    if (!user || !lastChecked) return

    const lastCheckedDate = new Date(lastChecked)
    const newMessages = messages.filter(msg => {
      const messageDate = new Date(msg.createdAt)
      return messageDate > lastCheckedDate && 
             (msg.isGlobal || msg.senderId !== user.id) &&
             (msg.isGlobal || msg.receiverId === user.id || msg.senderId === user.id)
    })

    setNewMessageCount(newMessages.length)

    // Show toast for very recent messages (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const veryRecentMessages = newMessages.filter(msg => 
      new Date(msg.createdAt) > fiveMinutesAgo && msg.senderId !== user.id
    )

    veryRecentMessages.forEach(msg => {
      if (msg.isGlobal) {
        toast.info('Nova mensagem no chat geral', {
          description: `${msg.senderName}: ${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}`,
          action: onOpenMessages ? {
            label: 'Ver',
            onClick: onOpenMessages
          } : undefined
        })
      } else {
        toast.info('Nova mensagem privada', {
          description: `${msg.senderName}: ${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}`,
          action: onOpenMessages ? {
            label: 'Ver',
            onClick: onOpenMessages
          } : undefined
        })
      }
    })
  }, [messages, lastChecked, user, onOpenMessages])

  const handleCheckMessages = async () => {
    await setLastChecked(new Date().toISOString())
    setNewMessageCount(0)
    onOpenMessages?.()
  }

  if (!user || newMessageCount === 0) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCheckMessages}
      className="relative animate-pulse"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Novas Mensagens
      <Badge variant="destructive" className="ml-2">
        {newMessageCount > 99 ? '99+' : newMessageCount}
      </Badge>
      <Bell className="w-3 h-3 ml-1 animate-bounce" />
    </Button>
  )
}

export default MessageNotification