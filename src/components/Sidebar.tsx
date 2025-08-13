import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { usePlatformSettings } from '@/hooks/usePlatformSettings'
import { useMessageNotifications } from '@/hooks/useMessageNotifications'
import OnlineCountBadge from '@/components/OnlineCountBadge'
import { cn } from '@/lib/utils'
import { 
  House, 
  Books, 
  FileText, 
  Question, 
  ChartBar, 
  Users, 
  Gear, 
  BookOpenText, 
  Target, 
  TrendUp, 
  SignOut,
  CaretLeft,
  CaretRight,
  GraduationCap,
  Atom,
  Lightning,
  List,
  Key,
  X,
  MessageCircle
} from '@phosphor-icons/react'

interface SidebarProps {
  currentView: string
  onViewChange: (view: string) => void
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [settings] = usePlatformSettings()
  const { totalUnread, markAsRead, clearAllNotifications } = useMessageNotifications()

  const handleViewChange = (view: string) => {
    // If navigating to messages, clear all notifications
    if (view === 'messages') {
      clearAllNotifications()
    }
    onViewChange(view)
    setIsMobileOpen(false)
  }

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House },
    { id: 'topics', label: 'Tópicos', icon: Books },
    { id: 'contents', label: 'Conteúdos', icon: FileText },
    { id: 'questions', label: 'Questões', icon: Question },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'messages', label: 'Mensagens', icon: MessageCircle },
    { id: 'reports', label: 'Relatórios', icon: ChartBar },
    { id: 'credentials', label: 'Credenciais', icon: Key },
    { id: 'settings', label: 'Configurações', icon: Gear },
  ]

  const studentMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House },
    { id: 'topics', label: 'Tópicos', icon: Books },
    { id: 'study', label: 'Estudar', icon: BookOpenText },
    { id: 'practice', label: 'Praticar', icon: Target },
    { id: 'messages', label: 'Mensagens', icon: MessageCircle },
    { id: 'review', label: 'Revisar', icon: TrendUp },
    { id: 'progress', label: 'Progresso', icon: ChartBar },
  ]

  const menuItems = user?.role === 'admin' ? adminMenuItems : studentMenuItems

  const handleLogout = () => {
    logout()
  }

  const SidebarContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div 
      className={cn(
        "h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col",
        isDesktop && isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {(!isCollapsed || !isDesktop) && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg shadow-md">
              <GraduationCap size={20} className="text-primary-foreground" weight="bold" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {settings.siteName}
            </span>
          </div>
        )}
        
        {isDesktop && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-muted/80 transition-colors"
          >
            {isCollapsed ? (
              <CaretRight size={16} className="icon-enhance" />
            ) : (
              <CaretLeft size={16} className="icon-enhance" />
            )}
          </Button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full border-2 border-primary/30 shadow-sm">
            <span className="text-sm font-semibold text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          
          {(!isCollapsed || !isDesktop) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize flex items-center">
                {user?.role === 'admin' ? (
                  <>
                    <Lightning size={12} className="mr-1" weight="fill" />
                    Administrador
                  </>
                ) : (
                  <>
                    <Atom size={12} className="mr-1" weight="fill" />
                    Estudante
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start p-3 h-auto sidebar-item group relative",
                    isActive && "bg-primary/10 border border-primary/20 text-primary font-medium shadow-sm",
                    isDesktop && isCollapsed && "justify-center px-0"
                  )}
                  onClick={() => {
                    handleViewChange(item.id)
                  }}
                >
                  <Icon 
                    size={20} 
                    className={cn(
                      "icon-enhance transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      !isCollapsed || !isDesktop ? "mr-3" : ""
                    )}
                    weight={isActive ? "fill" : "regular"}
                  />
                  {(!isCollapsed || !isDesktop) && (
                    <div className="flex items-center justify-between flex-1">
                      <span className={cn(
                        "text-sm transition-colors duration-200",
                        isActive ? "text-primary" : "text-foreground"
                      )}>
                        {item.label}
                      </span>
                      {item.id === 'messages' && totalUnread > 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Badge for collapsed state */}
                  {isDesktop && isCollapsed && item.id === 'messages' && totalUnread > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </Badge>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {isDesktop && isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md shadow-lg text-sm text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Online Status Display */}
        {(!isCollapsed || !isDesktop) && (
          <div className="flex items-center justify-center">
            <OnlineCountBadge className="w-full justify-center" />
          </div>
        )}
        
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start p-3 h-auto text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group",
            isDesktop && isCollapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
        >
          <SignOut 
            size={20} 
            className={cn(
              "icon-enhance",
              !isCollapsed || !isDesktop ? "mr-3" : ""
            )}
          />
          {(!isCollapsed || !isDesktop) && (
            <span className="text-sm">Sair</span>
          )}
          
          {/* Tooltip for collapsed state */}
          {isDesktop && isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md shadow-lg text-sm text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Sair
            </div>
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 z-40">
        <SidebarContent isDesktop={true} />
      </div>

      {/* Mobile Trigger */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-card/95 backdrop-blur-sm shadow-lg border-border"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <List size={20} weight="bold" />
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 z-50 transition-transform duration-300">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}