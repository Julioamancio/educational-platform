import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import { 
  House, 
  Book, 
  Question, 
  ChartLine, 
  Gear, 
  Users, 
  Article, 
  SignOut,
  List,
  BookOpen
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  currentView: string
  onViewChange: (view: string) => void
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user, logout } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House },
    { id: 'topics', label: 'Topics', icon: Book },
    { id: 'contents', label: 'Contents', icon: Article },
    { id: 'questions', label: 'Questions', icon: Question },
    { id: 'reports', label: 'Reports', icon: ChartLine },
    { id: 'settings', label: 'Settings', icon: Gear },
  ]

  const studentMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: House },
    { id: 'topics', label: 'Topics', icon: Book },
    { id: 'practice', label: 'Practice', icon: Question },
    { id: 'review', label: 'Review', icon: BookOpen },
    { id: 'progress', label: 'Progress', icon: ChartLine },
  ]

  const menuItems = user?.role === 'admin' ? adminMenuItems : studentMenuItems

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <Book className="w-8 h-8 text-primary" />
          <div>
            <h2 className="font-bold text-lg">EduPlatform</h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <Button
                  variant={currentView === item.id ? 'default' : 'ghost'}
                  className={cn(
                    "w-full justify-start gap-3",
                    currentView === item.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => {
                    onViewChange(item.id)
                    setIsMobileOpen(false)
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3 p-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={logout}
        >
          <SignOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-card lg:border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-40"
          >
            <List className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}