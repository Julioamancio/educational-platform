import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Settings as SettingsIcon, 
  Save, 
  Trash, 
  Download, 
  Upload, 
  Shield, 
  Bell, 
  Palette, 
  Database,
  Users,
  BookOpen,
  FileQuestion,
  Eye,
  EyeSlash,
  Moon,
  Sun,
  Monitor
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { toast } from 'sonner'

interface PlatformSettings {
  siteName: string
  siteDescription: string
  allowRegistration: boolean
  requireEmailVerification: boolean
  maxAttemptsPerQuestion: number
  timeoutMinutes: number
  showCorrectAnswer: boolean
  showExplanation: boolean
  allowReview: boolean
  defaultDifficulty: string
  emailNotifications: boolean
  theme: string
}

export default function SettingsManagement() {
  const { theme, setTheme } = useTheme()
  const [users, setUsers] = useKV('users', [])
  const [topics] = useKV('topics', [])
  const [questions] = useKV('questions', [])
  const [attempts, setAttempts] = useKV('attempts', [])
  const [studyLogs, setStudyLogs] = useKV('studyLogs', [])
  const [settings, setSettings] = useKV('platformSettings', {
    siteName: 'EduPlatform',
    siteDescription: 'A comprehensive learning management system',
    allowRegistration: true,
    requireEmailVerification: false,
    maxAttemptsPerQuestion: 3,
    timeoutMinutes: 30,
    showCorrectAnswer: true,
    showExplanation: true,
    allowReview: true,
    defaultDifficulty: 'B1',
    emailNotifications: true,
    theme: 'light'
  } as PlatformSettings)

  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Save theme to platform settings and apply it
      const updatedSettings = { ...settings, theme }
      setSettings(updatedSettings)
      
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate save
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    const data = {
      users: users.map(user => ({ ...user, password: '[REDACTED]' })),
      topics,
      questions,
      attempts,
      studyLogs,
      settings,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `eduplatform-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Data exported successfully')
  }

  const clearAllData = async () => {
    try {
      // Clear student data but keep admin users and settings
      setAttempts([])
      setStudyLogs([])
      // Remove student users only, keep admins
      setUsers(users.filter(user => user.role === 'admin'))
      
      toast.success('Student data cleared successfully')
    } catch (error) {
      toast.error('Failed to clear data')
    }
  }

  const resetToDefaults = async () => {
    try {
      const defaultSettings: PlatformSettings = {
        siteName: 'EduPlatform',
        siteDescription: 'A comprehensive learning management system',
        allowRegistration: true,
        requireEmailVerification: false,
        maxAttemptsPerQuestion: 3,
        timeoutMinutes: 30,
        showCorrectAnswer: true,
        showExplanation: true,
        allowReview: true,
        defaultDifficulty: 'B1',
        emailNotifications: true,
        theme: 'light'
      }
      setSettings(defaultSettings)
      setTheme('light')
      toast.success('Settings reset to defaults')
    } catch (error) {
      toast.error('Failed to reset settings')
    }
  }

  // Statistics
  const stats = {
    totalUsers: users.length,
    activeStudents: users.filter(u => u.role === 'student').length,
    totalTopics: topics.length,
    publishedTopics: topics.filter(t => t.isActive).length,
    totalQuestions: questions.length,
    publishedQuestions: questions.filter(q => q.isPublished).length,
    totalAttempts: attempts.length,
    storageUsed: '2.3 MB' // Mock data
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie a configuração da plataforma e configurações do sistema
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isLoading} className="btn-primary">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="learning">Aprendizado</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Platform Information
              </CardTitle>
              <CardDescription>
                Configure basic platform settings and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select 
                    value={theme} 
                    onValueChange={(value: 'light' | 'dark' | 'auto') => {
                      setTheme(value)
                      toast.success(`Theme changed to ${value}`)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Auto
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Current theme: {theme === 'auto' ? 'Auto (follows system)' : theme}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  placeholder="Brief description of your platform"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for important events
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication & Registration
              </CardTitle>
              <CardDescription>
                Manage user registration and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new students to register for accounts
                  </p>
                </div>
                <Switch
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowRegistration: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require students to verify their email before accessing content
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="timeout">Session Timeout (minutes)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={settings.timeoutMinutes}
                  onChange={(e) => setSettings(prev => ({ ...prev, timeoutMinutes: parseInt(e.target.value) || 30 }))}
                  min="5"
                  max="480"
                />
                <p className="text-sm text-muted-foreground">
                  Automatically log out inactive users after this time
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learning Settings
              </CardTitle>
              <CardDescription>
                Configure how students interact with questions and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts per Question</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={settings.maxAttemptsPerQuestion}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxAttemptsPerQuestion: parseInt(e.target.value) || 3 }))}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultDifficulty">Default Difficulty Level</Label>
                  <Select 
                    value={settings.defaultDifficulty} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, defaultDifficulty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 - Beginner</SelectItem>
                      <SelectItem value="A2">A2 - Elementary</SelectItem>
                      <SelectItem value="B1">B1 - Intermediate</SelectItem>
                      <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                      <SelectItem value="C1">C1 - Advanced</SelectItem>
                      <SelectItem value="C2">C2 - Proficiency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Correct Answer</Label>
                    <p className="text-sm text-muted-foreground">
                      Display the correct answer after submission
                    </p>
                  </div>
                  <Switch
                    checked={settings.showCorrectAnswer}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showCorrectAnswer: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Explanation</Label>
                    <p className="text-sm text-muted-foreground">
                      Display detailed explanations after submission
                    </p>
                  </div>
                  <Switch
                    checked={settings.showExplanation}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showExplanation: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Review</Label>
                    <p className="text-sm text-muted-foreground">
                      Let students review their previous attempts
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowReview}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowReview: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                Visualize todos os usuários e suas credenciais de acesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Credenciais dos Usuários</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="focus-ring"
                    >
                      {showPasswords ? <EyeSlash className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showPasswords ? 'Ocultar' : 'Mostrar'} Senhas
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-semibold">Nome</th>
                          <th className="text-left p-4 font-semibold">E-mail</th>
                          <th className="text-left p-4 font-semibold">Tipo</th>
                          <th className="text-left p-4 font-semibold">Senha</th>
                          <th className="text-left p-4 font-semibold">Criado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length > 0 ? users.map((user, index) => (
                          <tr key={user.id || index} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-medium">{user.name}</td>
                            <td className="p-4 text-sm">{user.email}</td>
                            <td className="p-4">
                              <Badge 
                                variant={user.role === 'admin' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {user.role === 'admin' ? 'Administrador' : 'Estudante'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                  {showPasswords ? user.password : '••••••••'}
                                </code>
                                {showPasswords && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(user.password)
                                      toast.success('Senha copiada!')
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>Nenhum usuário encontrado</p>
                              <p className="text-sm">Usuários aparecerão aqui quando forem criados</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {users.filter(u => u.role === 'admin').length > 0 && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-amber-800">Informações de Segurança</h5>
                        <p className="text-sm text-amber-700 mt-1">
                          As credenciais dos administradores são exibidas apenas para fins de gerenciamento.
                          Mantenha essas informações seguras e compartilhe apenas com pessoal autorizado.
                        </p>
                        <p className="text-xs text-amber-600 mt-2">
                          Recomenda-se que os administradores alterem suas senhas periodicamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>
                Platform statistics and data management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-secondary">{stats.totalTopics}</div>
                  <div className="text-sm text-muted-foreground">Topics</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-accent">{stats.totalQuestions}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalAttempts}</div>
                  <div className="text-sm text-muted-foreground">Attempts</div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <h4 className="font-medium">Data Management</h4>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  
                  <Button variant="outline" onClick={resetToDefaults}>
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash className="h-4 w-4 mr-2" />
                        Clear Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all student data,
                          attempts, and study logs. Admin accounts and content will be preserved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearAllData} className="bg-destructive text-destructive-foreground">
                          Yes, clear data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}