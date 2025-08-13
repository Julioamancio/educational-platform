import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useKV } from '@github/spark/hooks'
import { Eye, EyeSlash, Key, User, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function CredentialsView() {
  const [users] = useKV<any[]>('users', [])
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${type} copiado para a área de transferência`)
  }

  const adminUsers = users.filter(user => user.role === 'admin')
  const studentUsers = users.filter(user => user.role === 'student')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Credenciais de Acesso</h1>
        <p className="text-muted-foreground">
          Visualize as credenciais de login dos usuários cadastrados
        </p>
      </div>

      {/* Administradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Administradores ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum administrador cadastrado
            </p>
          ) : (
            <div className="space-y-4">
              {adminUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.name}</h3>
                      <Badge variant="destructive">Admin</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Email/Usuário
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                          {user.email}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(user.email, 'Email')}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Senha
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                          {showPasswords[user.id] ? (user.password || 'Não disponível') : '••••••••'}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePasswordVisibility(user.id)}
                        >
                          {showPasswords[user.id] ? <EyeSlash size={14} /> : <Eye size={14} />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(user.password || 'Não disponível', 'Senha')}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estudantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Estudantes ({studentUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum estudante cadastrado
            </p>
          ) : (
            <div className="space-y-4">
              {studentUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.name}</h3>
                      <Badge variant="secondary">Estudante</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Email/Usuário
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                          {user.email}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(user.email, 'Email')}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Senha
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                          {showPasswords[user.id] ? (user.password || 'Não disponível') : '••••••••'}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePasswordVisibility(user.id)}
                        >
                          {showPasswords[user.id] ? <EyeSlash size={14} /> : <Eye size={14} />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(user.password || 'Não disponível', 'Senha')}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info sobre credenciais padrão */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Credenciais Padrão do Sistema</h4>
              <p className="text-blue-700 text-sm mb-3">
                Para acessar o sistema, utilize as credenciais abaixo:
              </p>
              <div className="space-y-2 text-sm">
                <div className="bg-white/70 p-3 rounded border border-blue-200">
                  <strong className="text-blue-900">Administrador:</strong>
                  <div className="mt-1 font-mono text-blue-800">
                    <div>Email: admin@eduplatform.com</div>
                    <div>Senha: admin123</div>
                  </div>
                </div>
                <div className="bg-white/70 p-3 rounded border border-blue-200">
                  <strong className="text-blue-900">Estudante:</strong>
                  <div className="mt-1 font-mono text-blue-800">
                    <div>Email: ana@example.com</div>
                    <div>Senha: student123</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}