import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoginPage from '@/components/LoginPage'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import TopicsManagement from '@/components/admin/TopicsManagement'
import ContentsManagement from '@/components/admin/ContentsManagement'
import QuestionsManagement from '@/components/admin/QuestionsManagement'
import TopicsView from '@/components/student/TopicsView'
import PracticeView from '@/components/student/PracticeView'

function AppContent() {
  const { user, isLoading } = useAuth()
  const [currentView, setCurrentView] = useState('dashboard')
  const [viewData, setViewData] = useState<any>(null)

  const handleViewChange = (view: string, data?: any) => {
    setCurrentView(view)
    setViewData(data)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      
      // Admin views
      case 'topics':
        return user.role === 'admin' ? <TopicsManagement /> : <TopicsView onViewChange={handleViewChange} />
      case 'contents':
        return user.role === 'admin' ? <ContentsManagement /> : null
      case 'questions':
        return user.role === 'admin' ? <QuestionsManagement /> : null
      case 'reports':
        return user.role === 'admin' ? <div>Reports (Coming Soon)</div> : null
      case 'settings':
        return user.role === 'admin' ? <div>Settings (Coming Soon)</div> : null
      
      // Student views
      case 'practice':
        return user.role === 'student' ? (
          <PracticeView 
            topicId={viewData?.topicId} 
            onBack={() => setCurrentView('topics')} 
          />
        ) : null
      case 'study':
        return user.role === 'student' ? <div>Study Content (Coming Soon)</div> : null
      case 'review':
        return user.role === 'student' ? <div>Review (Coming Soon)</div> : null
      case 'progress':
        return user.role === 'student' ? <div>Progress (Coming Soon)</div> : null
      
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">
          {renderMainContent()}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App