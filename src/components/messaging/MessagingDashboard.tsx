import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChatMessage, User } from '@/types'
import { MessageCircle, Send, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MessagingDashboardProps {
  onViewChange?: (view: string, data?: any) => void
}

const MessagingDashboard = ({ onViewChange }: MessagingDashboardProps) => {
  const { user } = useAuth()
  const [messages, setMessages] = useKV<ChatMessage[]>('chat-messages', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [unreadCounts, setUnreadCounts] = useKV<Record<string, number>>('message-unread-counts', {})

  if (!user) return null

  // Get recent messages for preview
  const getRecentMessages = () => {
    const userMessages = messages
      .filter(msg => 
        msg.isGlobal || 
        msg.senderId === user.id || 
        msg.receiverId === user.id
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
    
    return userMessages
  }

  // Calculate total unread messages
  const getTotalUnreadCount = () => {
    if (!user) return 0
    
    let total = 0
    
    // Global unread
    total += unreadCounts[`global-${user.id}`] || 0
    
    // Private unread
    Object.keys(unreadCounts).forEach(key => {
      if (key.includes(`-${user.id}`) && key.startsWith('private-')) {
        total += unreadCounts[key] || 0
      }
    })
    
    return total
  }

  const handleNavigateToMessages = () => {
    onViewChange?.('messages')
    toast.success('Abrindo Centro de Mensagens...', {
      description: 'Você será redirecionado para a aba de mensagens completa'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Agora'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  }

  const recentMessages = getRecentMessages()
  const totalUnread = getTotalUnreadCount()

  return (
    <Card className="card-hover glass-effect">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Centro de Mensagens
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-1">
                {totalUnread}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigateToMessages}
            className="hover:bg-primary/5 hover:border-primary/50"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Abrir Chat
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {recentMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhuma mensagem ainda</p>
            <p className="text-sm">
              {user.role === 'admin' 
                ? 'Comece uma conversa com seus alunos' 
                : 'As mensagens aparecerão aqui'
              }
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 hover:bg-primary/5 hover:border-primary/50"
              onClick={handleNavigateToMessages}
            >
              <Send className="w-4 h-4 mr-2" />
              Abrir Centro de Mensagens
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMessages.map(message => {
              const isOwnMessage = message.senderId === user.id
              const otherUser = users.find(u => 
                u.id === (isOwnMessage ? message.receiverId : message.senderId)
              )
              
              return (
                <div
                  key={message.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 cursor-pointer transition-all duration-200 border border-transparent hover:border-primary/20"
                  onClick={handleNavigateToMessages}
                  title="Clique para abrir o Centro de Mensagens"
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {(isOwnMessage ? user.name : message.senderName)
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {message.isGlobal ? (
                          <span className="flex items-center gap-1">
                            <span>Chat Geral</span>
                            {message.senderRole === 'admin' && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                          </span>
                        ) : (
                          isOwnMessage ? (
                            otherUser ? `Para: ${otherUser.name}` : 'Mensagem privada'
                          ) : (
                            message.senderName
                          )
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {isOwnMessage && <span className="text-primary">Você: </span>}
                      {message.message}
                    </p>
                  </div>
                </div>
              )
            })}
            
            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full hover:bg-primary/5 hover:border-primary/50 transition-colors"
                onClick={handleNavigateToMessages}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ir para Centro de Mensagens
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {totalUnread}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Quick stats for admin */}
        {user.role === 'admin' && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="w-4 h-4" />
                Alunos Online
              </span>
              <span className="font-medium">
                {users.filter(u => u.role === 'student').length}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MessagingDashboard