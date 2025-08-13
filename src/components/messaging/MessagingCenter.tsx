import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatMessage, ChatRoom, User } from '@/types'
import { Send, Users, MessageCircle, Smile, Hash, AtSign } from '@phosphor-icons/react'
import { toast } from 'sonner'
import EmojiPicker from './EmojiPicker'

const MessagingCenter = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useKV<ChatMessage[]>('chat-messages', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [newMessage, setNewMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('global')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [unreadCounts, setUnreadCounts] = useKV<Record<string, number>>('message-unread-counts', {})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Filter messages based on current view
  const getFilteredMessages = () => {
    if (activeTab === 'global') {
      return messages.filter(msg => msg.isGlobal)
    } else {
      return messages.filter(msg => 
        !msg.isGlobal && 
        ((msg.senderId === user?.id && msg.receiverId === selectedUser) ||
         (msg.senderId === selectedUser && msg.receiverId === user?.id))
      )
    }
  }

  // Get students list for admin
  const getStudents = () => {
    return users.filter(u => u.role === 'student')
  }

  // Get chat rooms for students (only global + admin)
  const getChatRooms = (): ChatRoom[] => {
    const rooms: ChatRoom[] = []
    
    // Global room
    const globalMessages = messages.filter(msg => msg.isGlobal)
    const lastGlobalMessage = globalMessages[globalMessages.length - 1]
    const globalUnread = unreadCounts[`global-${user?.id}`] || 0
    
    rooms.push({
      id: 'global',
      type: 'global',
      participants: [],
      lastMessage: lastGlobalMessage,
      unreadCount: globalUnread,
      title: 'Chat Geral'
    })

    // Admin private chat (for students only)
    if (user?.role === 'student') {
      const adminUser = users.find(u => u.role === 'admin')
      if (adminUser) {
        const privateMessages = messages.filter(msg => 
          !msg.isGlobal && 
          ((msg.senderId === user.id && msg.receiverId === adminUser.id) ||
           (msg.senderId === adminUser.id && msg.receiverId === user.id))
        )
        const lastPrivateMessage = privateMessages[privateMessages.length - 1]
        const privateUnread = unreadCounts[`private-${adminUser.id}-${user.id}`] || 0

        rooms.push({
          id: adminUser.id,
          type: 'private',
          participants: [user.id, adminUser.id],
          lastMessage: lastPrivateMessage,
          unreadCount: privateUnread,
          title: `Admin - ${adminUser.name}`
        })
      }
    }

    return rooms
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: activeTab === 'global' ? undefined : selectedUser || undefined,
      message: newMessage.trim(),
      isGlobal: activeTab === 'global',
      createdAt: new Date().toISOString(),
      senderName: user.name,
      senderRole: user.role
    }

    await setMessages(prev => [...prev, message])
    setNewMessage('')
    
    // Update unread counts for other users
    if (activeTab === 'global') {
      // Update global unread for all other users
      const otherUsers = users.filter(u => u.id !== user.id)
      const newUnreadCounts = { ...unreadCounts }
      otherUsers.forEach(otherUser => {
        const key = `global-${otherUser.id}`
        newUnreadCounts[key] = (newUnreadCounts[key] || 0) + 1
      })
      await setUnreadCounts(newUnreadCounts)
    } else if (selectedUser) {
      // Update private chat unread
      const key = `private-${user.id}-${selectedUser}`
      const newUnreadCounts = { ...unreadCounts }
      newUnreadCounts[key] = (newUnreadCounts[key] || 0) + 1
      await setUnreadCounts(newUnreadCounts)
    }

    toast.success('Mensagem enviada!')
  }

  const markAsRead = async (roomType: string, roomId?: string) => {
    if (!user) return
    
    const key = roomType === 'global' 
      ? `global-${user.id}`
      : `private-${roomId}-${user.id}`
    
    const newUnreadCounts = { ...unreadCounts }
    newUnreadCounts[key] = 0
    await setUnreadCounts(newUnreadCounts)
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    messageInputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  }

  if (!user) return null

  return (
    <div className="h-[600px] flex bg-background rounded-lg border overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card/50">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Mensagens
          </h2>
        </div>

        <ScrollArea className="h-[calc(600px-80px)]">
          {user.role === 'admin' ? (
            <div className="p-4 space-y-2">
              {/* Global Chat */}
              <div
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  activeTab === 'global' 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setActiveTab('global')
                  setSelectedUser(null)
                  markAsRead('global')
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Chat Geral</p>
                      <p className="text-sm text-muted-foreground">
                        Conversa com todos os alunos
                      </p>
                    </div>
                  </div>
                  {(unreadCounts[`global-${user.id}`] || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCounts[`global-${user.id}`]}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator className="my-3" />
              
              {/* Students List */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground px-2 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Alunos ({getStudents().length})
                </p>
                {getStudents().map(student => {
                  const unreadKey = `private-${user.id}-${student.id}`
                  const unreadCount = unreadCounts[unreadKey] || 0
                  const lastMessage = messages
                    .filter(msg => 
                      !msg.isGlobal && 
                      ((msg.senderId === user.id && msg.receiverId === student.id) ||
                       (msg.senderId === student.id && msg.receiverId === user.id))
                    )
                    .pop()

                  return (
                    <div
                      key={student.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUser === student.id && activeTab === 'private'
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setActiveTab('private')
                        setSelectedUser(student.id)
                        markAsRead('private', student.id)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{student.name}</p>
                            {lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {lastMessage.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(lastMessage.createdAt)}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            // Student view - simplified
            <div className="p-4 space-y-2">
              {getChatRooms().map(room => (
                <div
                  key={room.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    (room.type === 'global' && activeTab === 'global') ||
                    (room.type === 'private' && selectedUser === room.id)
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    if (room.type === 'global') {
                      setActiveTab('global')
                      setSelectedUser(null)
                      markAsRead('global')
                    } else {
                      setActiveTab('private')
                      setSelectedUser(room.id)
                      markAsRead('private', room.id)
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {room.type === 'global' ? (
                          <Hash className="w-5 h-5 text-primary" />
                        ) : (
                          <AtSign className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{room.title}</p>
                        {room.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {room.lastMessage.senderName}: {room.lastMessage.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {room.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(room.lastMessage.createdAt)}
                        </span>
                      )}
                      {room.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card/50">
          <div className="flex items-center gap-3">
            {activeTab === 'global' ? (
              <>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Chat Geral</h3>
                  <p className="text-sm text-muted-foreground">
                    {user.role === 'admin' ? 'Conversa com todos os alunos' : 'Conversa geral'}
                  </p>
                </div>
              </>
            ) : selectedUser ? (
              (() => {
                const targetUser = users.find(u => u.id === selectedUser)
                return targetUser ? (
                  <>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {targetUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{targetUser.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Conversa privada
                      </p>
                    </div>
                  </>
                ) : null
              })()
            ) : (
              <div className="text-center text-muted-foreground">
                Selecione uma conversa para começar
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 min-h-[400px]">
            {getFilteredMessages().map(message => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.senderId === user.id ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`p-3 rounded-lg ${
                      message.senderId === user.id
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    {message.senderId !== user.id && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {message.senderName}
                        </span>
                        {message.senderRole === 'admin' && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">{message.message}</p>
                    <p className={`text-xs mt-2 ${
                      message.senderId === user.id 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        {(activeTab === 'global' || (activeTab === 'private' && selectedUser)) && (
          <div className="p-4 border-t bg-card/50">
            <div className="flex gap-2">
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="shrink-0"
                >
                  <Smile className="w-4 h-4" />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  </div>
                )}
              </div>
              <Input
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  activeTab === 'global' 
                    ? 'Digite sua mensagem no chat geral...' 
                    : 'Digite sua mensagem privada...'
                }
                className="flex-1"
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessagingCenter