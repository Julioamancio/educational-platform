import React from 'react'
import { Circle } from '@phosphor-icons/react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'

interface OnlineStatusProps {
  userId: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function OnlineStatus({ 
  userId, 
  showText = false, 
  size = 'md',
  className 
}: OnlineStatusProps) {
  const { getUserStatus, isUserOnline, formatLastSeen } = useOnlineStatus()
  
  const userStatus = getUserStatus(userId)
  const isOnline = isUserOnline(userId)
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  if (!userStatus && !showText) {
    return (
      <Circle 
        weight="fill" 
        className={cn(
          sizeClasses[size],
          'text-muted-foreground/40',
          className
        )} 
      />
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <Circle 
          weight="fill" 
          className={cn(
            sizeClasses[size],
            isOnline 
              ? 'text-green-500' 
              : 'text-muted-foreground/60'
          )} 
        />
        {isOnline && (
          <div className={cn(
            'absolute inset-0 rounded-full animate-pulse',
            sizeClasses[size],
            'bg-green-500/30'
          )} />
        )}
      </div>
      
      {showText && (
        <span className={cn(
          textSizeClasses[size],
          'text-muted-foreground'
        )}>
          {isOnline ? (
            <span className="text-green-600 font-medium">Online</span>
          ) : userStatus ? (
            `Visto ${formatLastSeen(userStatus.lastSeen)}`
          ) : (
            'Offline'
          )}
        </span>
      )}
    </div>
  )
}