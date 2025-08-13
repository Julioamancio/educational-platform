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
import OnlineStatus from '@/components/OnlineStatus'
import OnlineUsersList from '@/components/OnlineUsersList'
import OnlineCountBadge from '@/components/OnlineCountBadge'

const MessagingCenter = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useKV<ChatMessage[]>('chat-messages', [])
  const [users, setUsers] = useKV<User[]>('users', [])
  const [newMessage, setNewMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('global')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [unreadCounts, setUnreadCounts] = useKV<Record<string, number>>('message-unread-counts', {})
  const [showSidebar, setShowSidebar] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setShowSidebar(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-mark messages as read when viewing a conversation
  useEffect(() => {
    if (activeTab === 'global') {
      markAsRead('global')
    } else if (activeTab === 'private' && selectedUser) {
      markAsRead('private', selectedUser)
    }
  }, [activeTab, selectedUser])

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
      // Update private chat unread for the recipient
      const newUnreadCounts = { ...unreadCounts }
      const key = `private-${selectedUser}-${user.id}`
      newUnreadCounts[key] = (newUnreadCounts[key] || 0) + 1
      await setUnreadCounts(newUnreadCounts)
    }

    toast.success('Mensagem enviada!')
  }

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
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Main Header for Full Screen Context */}
      <div className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-b border-border z-50 lg:left-64">
        <div className="flex items-center justify-between p-3 lg:p-4">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="shrink-0 w-10 h-10 lg:hidden"
              >
                <Users className="w-5 h-5" />
              </Button>
            )}
            <div className="p-2 rounded-lg bg-primary/15">
              <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-xl font-bold text-foreground truncate">Centro de Mensagens</h1>
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
                Comunicação em tempo real • {user.role === 'admin' ? 'Administrador' : 'Estudante'}
              </p>
            </div>
          </div>
          <OnlineCountBadge className="text-xs lg:text-sm" />
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isMobile && !showSidebar ? '-translate-x-full' : 'translate-x-0'}
        w-80 xl:w-96 border-r bg-card/30 flex flex-col mt-16 
        transition-transform duration-300 ease-in-out z-50
        ${isMobile ? 'h-[calc(100vh-4rem)]' : 'h-full'}
      `}>
        <div className="p-4 lg:p-6 border-b bg-gradient-to-r from-primary/10 to-accent/10">
          <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-3">
            <div className="p-2 lg:p-3 rounded-xl bg-primary/15 shadow-sm">
              <MessageCircle className="w-5 h-5 lg:w-7 lg:h-7 text-primary" />
            </div>
            Conversas
          </h2>
          <p className="text-xs lg:text-sm text-muted-foreground mt-2">
            Selecione uma conversa para começar
          </p>
        </div>

        <ScrollArea className="flex-1 p-3 lg:p-4">
          {user.role === 'admin' ? (
            <div className="space-y-3">
              {/* Global Chat */}
              <div
                className={`p-3 lg:p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeTab === 'global' 
                    ? 'bg-gradient-to-r from-primary/15 to-accent/10 border-2 border-primary/30 shadow-md' 
                    : 'hover:bg-muted/50 border border-transparent hover:border-border/50'
                }`}
                onClick={() => {
                  setActiveTab('global')
                  setSelectedUser(null)
                  markAsRead('global')
                  if (isMobile) setShowSidebar(false)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                      <Hash className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm lg:text-base">Chat Geral</p>
                      <p className="text-xs lg:text-sm text-muted-foreground truncate">
                        Conversa com todos os alunos
                      </p>
                    </div>
                  </div>
                  {(unreadCounts[`global-${user.id}`] || 0) > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 lg:h-6 lg:min-w-6 flex items-center justify-center text-xs shrink-0">
                      {unreadCounts[`global-${user.id}`]}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator className="my-4" />
              
              {/* Students List */}
              <div className="space-y-2">
                <div className="px-2 mb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Alunos ({getStudents().length})
                    </p>
                    <OnlineCountBadge showIcon={false} className="text-xs" />
                  </div>
                </div>
                {getStudents().map(student => {
                  const unreadKey = `private-${student.id}-${user.id}`
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
                      className={`p-3 lg:p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedUser === student.id && activeTab === 'private'
                          ? 'bg-gradient-to-r from-primary/15 to-accent/10 border-2 border-primary/30 shadow-md' 
                          : 'hover:bg-muted/50 border border-transparent hover:border-border/50'
                      }`}
                      onClick={() => {
                        setActiveTab('private')
                        setSelectedUser(student.id)
                        markAsRead('private', student.id)
                        if (isMobile) setShowSidebar(false)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                          <div className="relative">
                            <Avatar className="w-10 h-10 lg:w-12 lg:h-12 border-2 border-border/20 shrink-0">
                              <AvatarFallback className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground font-semibold text-xs lg:text-sm">
                                {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1">
                              <OnlineStatus userId={student.id} size="sm" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm lg:text-base truncate">{student.name}</p>
                            </div>
                            {lastMessage ? (
                              <p className="text-xs lg:text-sm text-muted-foreground truncate mt-1">
                                {lastMessage.message}
                              </p>
                            ) : (
                              <OnlineStatus userId={student.id} showText size="sm" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 lg:gap-2 shrink-0">
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground font-medium">
                              {formatTime(lastMessage.createdAt)}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-5 lg:h-6 lg:min-w-6 flex items-center justify-center text-xs">
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
            <div className="space-y-3">
              {getChatRooms().map(room => (
                <div
                  key={room.id}
                  className={`p-3 lg:p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    (room.type === 'global' && activeTab === 'global') ||
                    (room.type === 'private' && selectedUser === room.id)
                      ? 'bg-gradient-to-r from-primary/15 to-accent/10 border-2 border-primary/30 shadow-md' 
                      : 'hover:bg-muted/50 border border-transparent hover:border-border/50'
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
                    if (isMobile) setShowSidebar(false)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                        {room.type === 'global' ? (
                          <Hash className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                        ) : (
                          <AtSign className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm lg:text-base">{room.title}</p>
                        {room.lastMessage && (
                          <p className="text-xs lg:text-sm text-muted-foreground truncate mt-1">
                            {room.lastMessage.senderName}: {room.lastMessage.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 lg:gap-2 shrink-0">
                      {room.lastMessage && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatTime(room.lastMessage.createdAt)}
                        </span>
                      )}
                      {room.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 lg:h-6 lg:min-w-6 flex items-center justify-center text-xs">
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
      <div className={`flex-1 flex flex-col min-w-0 mt-16 ${isMobile && showSidebar ? 'hidden' : ''}`}>
        {/* Chat Header */}
        <div className="p-4 lg:p-6 border-b bg-gradient-to-r from-card/80 to-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 lg:gap-4">
            {activeTab === 'global' ? (
              <>
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                  <Hash className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg lg:text-xl">Chat Geral</h3>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    {user.role === 'admin' ? 'Conversa com todos os alunos' : 'Conversa geral'}
                  </p>
                </div>
              </>
            ) : selectedUser ? (
              (() => {
                const targetUser = users.find(u => u.id === selectedUser)
                return targetUser ? (
                  <>
                    <div className="relative">
                      <Avatar className="w-12 h-12 lg:w-14 lg:h-14 border-2 border-border/20 shrink-0">
                        <AvatarFallback className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground font-bold text-sm lg:text-lg">
                          {targetUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <OnlineStatus userId={targetUser.id} size="md" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg lg:text-xl truncate">{targetUser.name}</h3>
                      <div className="flex items-center gap-2">
                        <OnlineStatus userId={targetUser.id} showText size="sm" />
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs lg:text-sm text-muted-foreground">
                          {targetUser.role === 'admin' ? 'Administrador' : 'Aluno'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : null
              })()
            ) : (
              <div className="text-center text-muted-foreground flex-1 py-6 lg:py-8">
                <MessageCircle className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-base lg:text-lg font-semibold mb-2">Selecione uma conversa</h3>
                <p className="text-xs lg:text-sm">Escolha um chat para começar a conversar</p>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 min-h-full">
            {getFilteredMessages().map(message => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] lg:max-w-[75%] ${message.senderId === user.id ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`p-3 lg:p-4 rounded-2xl shadow-sm ${
                      message.senderId === user.id
                        ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto'
                        : 'bg-muted border border-border/50'
                    }`}
                  >
                    {message.senderId !== user.id && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs lg:text-sm font-semibold text-muted-foreground">
                          {message.senderName}
                        </span>
                        {message.senderRole === 'admin' && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm lg:text-base leading-relaxed">{message.message}</p>
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
          <div className="p-3 lg:p-6 border-t bg-gradient-to-r from-card/80 to-card/50 backdrop-blur-sm shrink-0">
            <div className="flex gap-2 lg:gap-3">
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-xl"
                >
                  <Smile className="w-4 h-4 lg:w-5 lg:h-5" />
                </Button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 lg:bottom-16 left-0 z-50">
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
                className="flex-1 h-10 lg:h-12 rounded-xl text-sm lg:text-base px-3 lg:px-4"
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-xl"
              >
                <Send className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessagingCenter