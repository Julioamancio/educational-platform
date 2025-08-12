import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { GraduationCap, SignIn, UserPlus, Lightning, Atom, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function LoginPage() {
  const { login, register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const success = await login(email, password)
    if (success) {
      toast.success('Login realizado com sucesso!')
    } else {
      toast.error('Credenciais inválidas')
    }
    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const success = await register(name, email, password)
    if (success) {
      toast.success('Conta criada com sucesso!')
    } else {
      toast.error('Usuário já existe')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      
      <Card className="w-full max-w-md glass-effect shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg">
              <GraduationCap size={28} className="text-primary-foreground" weight="bold" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-foreground">
                EduPlatform
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Plataforma de Ensino
              </p>
            </div>
          </div>
          <CardDescription className="text-base">
            Acesse sua plataforma de aprendizado
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Registrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue="admin@demo.com"
                    placeholder="Digite seu e-mail"
                    className="focus-ring"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      defaultValue="demo123"
                      placeholder="Digite sua senha"
                      className="focus-ring pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlash size={16} className="text-muted-foreground" />
                      ) : (
                        <Eye size={16} className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  <SignIn size={16} className="mr-2" weight="bold" />
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50">
                <p className="text-sm font-medium text-foreground mb-4 flex items-center">
                  <GraduationCap size={16} className="mr-2" />
                  Credenciais de Demonstração
                </p>
                <div className="space-y-3 text-sm">
                  <div className="p-4 bg-card/70 rounded-lg border border-border/30">
                    <div className="flex items-center mb-3">
                      <Lightning size={16} className="mr-2 text-primary" weight="fill" />
                      <p className="font-medium text-primary">Administrador</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-mono text-foreground">admin@demo.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Senha:</span>
                        <span className="font-mono text-foreground">demo123</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-card/70 rounded-lg border border-border/30">
                    <div className="flex items-center mb-3">
                      <Atom size={16} className="mr-2 text-secondary" weight="fill" />
                      <p className="font-medium text-secondary">Estudante (exemplo)</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-mono text-foreground">student@demo.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Senha:</span>
                        <span className="font-mono text-foreground">demo123</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Ou registre-se para criar uma nova conta de estudante
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-6">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Digite seu nome completo"
                    className="focus-ring"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium">E-mail</Label>
                  <Input
                    id="reg-email"
                    name="email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    className="focus-ring"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Escolha uma senha"
                      className="focus-ring pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlash size={16} className="text-muted-foreground" />
                      ) : (
                        <Eye size={16} className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  <UserPlus size={16} className="mr-2" weight="bold" />
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
              
              <div className="text-center text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                Ao criar uma conta, você será registrado como estudante
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}