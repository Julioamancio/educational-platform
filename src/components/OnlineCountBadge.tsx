import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Circle, Users } from '@phosphor-icons/react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

interface OnlineCountBadgeProps {
  className?: string
  showIcon?: boolean
}

export default function OnlineCountBadge({ 
  className = '',
  showIcon = true 
}: OnlineCountBadgeProps) {
  const { getOnlineUsers } = useOnlineStatus()
  const onlineCount = getOnlineUsers().length

  return (
    <Badge 
      variant="outline" 
      className={`bg-green-50 text-green-700 border-green-200 ${className}`}
    >
      {showIcon && (
        <div className="flex items-center gap-1 mr-1">
          <Circle weight="fill" className="w-2 h-2 text-green-500" />
          <Users className="w-3 h-3" />
        </div>
      )}
      {onlineCount} online
    </Badge>
  )
}