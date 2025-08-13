import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Circle } from '@phosphor-icons/react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useAuth } from '@/contexts/AuthContext'
import OnlineStatus from '@/components/OnlineStatus'

export default function OnlineUsersList() {
  const { getAllUsersWithStatus, getOnlineUsers } = useOnlineStatus()
  const { user: currentUser } = useAuth()
  
  const onlineUsers = getOnlineUsers()
  const allUsers = getAllUsersWithStatus()
  
  // Filter out current user
  const filteredOnlineUsers = onlineUsers.filter(u => u.id !== currentUser?.id)
  const filteredAllUsers = allUsers.filter(u => u.id !== currentUser?.id)

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Usuários Online</h3>
        <Badge variant="secondary" className="ml-auto">
          {filteredOnlineUsers.length}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {filteredOnlineUsers.length > 0 ? (
          filteredOnlineUsers.map((user) => (
            <div 
              key={user.id} 
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant={user.role === 'admin' ? 'default' : 'secondary'} 
                    className="text-xs"
                  >
                    {user.role === 'admin' ? 'Professor' : 'Aluno'}
                  </Badge>
                </div>
              </div>
              
              <OnlineStatus userId={user.id} size="sm" />
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum usuário online no momento
          </p>
        )}
        
        {/* Show recently seen users */}
        {filteredAllUsers.length > filteredOnlineUsers.length && (
          <>
            <div className="border-t pt-3 mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Visto recentemente
              </h4>
              <div className="space-y-2">
                {filteredAllUsers
                  .filter(u => !u.isOnline)
                  .slice(0, 5)
                  .map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-xs">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{user.name}</p>
                        <OnlineStatus userId={user.id} showText size="sm" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}