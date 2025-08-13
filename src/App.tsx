import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoginPage from '@/components/LoginPage'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import TopicsManagement from '@/components/admin/TopicsManagement'
import ContentsManagement from '@/components/admin/ContentsManagement'
import QuestionsManagement from '@/components/admin/QuestionsManagement'
import ReportsManagement from '@/components/admin/ReportsManagement'
import SettingsManagement from '@/components/admin/SettingsManagement'
import StudentsManagement from '@/components/admin/StudentsManagement'
import CredentialsView from '@/components/admin/CredentialsView'
import TopicsView from '@/components/student/TopicsView'
import PracticeView from '@/components/student/PracticeView'
import StudyView from '@/components/student/StudyView'
import AllContentsView from '@/components/student/AllContentsView'
import ReviewView from '@/components/student/ReviewView'
import ProgressView from '@/components/student/ProgressView'
import MessagingCenter from '@/components/messaging/MessagingCenter'

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Carregando...</p>
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
        return <Dashboard onViewChange={handleViewChange} />
      
      // Admin views
      case 'topics':
        return user.role === 'admin' ? <TopicsManagement /> : <TopicsView onViewChange={handleViewChange} />
      case 'contents':
        return user.role === 'admin' ? <ContentsManagement /> : null
      case 'questions':
        return user.role === 'admin' ? <QuestionsManagement /> : null
      case 'reports':
        return user.role === 'admin' ? <ReportsManagement /> : null
      case 'users':
        return user.role === 'admin' ? <StudentsManagement /> : null
      case 'settings':
        return user.role === 'admin' ? <SettingsManagement /> : null
      case 'credentials':
        return user.role === 'admin' ? <CredentialsView /> : null
      case 'messages':
        return <MessagingCenter />
      
      // Student views
      case 'practice':
        return user.role === 'student' ? (
          <PracticeView 
            topicId={viewData?.topicId} 
            onBack={() => setCurrentView('topics')} 
          />
        ) : null
      case 'study':
        return user.role === 'student' ? (
          // If no specific topic is selected, show all contents for studying
          viewData?.topicId ? (
            <StudyView 
              topicId={viewData.topicId}
              contentId={viewData?.contentId}
              onBack={() => setCurrentView('topics')}
              onViewChange={handleViewChange}
            />
          ) : (
            <AllContentsView onViewChange={handleViewChange} />
          )
        ) : null
      case 'review':
        return user.role === 'student' ? (
          <ReviewView 
            onBack={() => setCurrentView('dashboard')}
            onViewChange={handleViewChange}
          />
        ) : null
      case 'progress':
        return user.role === 'student' ? (
          <ProgressView 
            onBack={() => setCurrentView('dashboard')}
            onViewChange={handleViewChange}
          />
        ) : null
      
      default:
        return <Dashboard />
    }
  }

  // Special layout for messaging center
  if (currentView === 'messages') {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar currentView={currentView} onViewChange={handleViewChange} />
        <main className="lg:pl-64 transition-all duration-300">
          <div className="h-screen">
            {renderMainContent()}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <main className="lg:pl-64 transition-all duration-300">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {renderMainContent()}
          </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App