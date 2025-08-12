import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import { useKV } from '@github/spark/hooks'
import { Topic, Content, Question, Attempt, StudyLog } from '@/types'
import { Book, Question as QuestionIcon, TrendUp, Users, CheckCircle, GraduationCap, ClockCounterClockwise, Target, Plus, Database, Lightning, Calendar, Trophy, Activity, Sparkle, Note, FileText } from '@phosphor-icons/react'
import { initializeSampleData } from '@/lib/sampleData'
import { toast } from 'sonner'

export default function Dashboard() {
  const { user } = useAuth()
  const [topics, setTopics] = useKV<Topic[]>('topics', [])
  const [contents, setContents] = useKV<Content[]>('contents', [])
  const [questions, setQuestions] = useKV<Question[]>('questions', [])
  const [attempts] = useKV<Attempt[]>('attempts', [])
  const [studyLogs] = useKV<StudyLog[]>('studyLogs', [])
  const [users, setUsers] = useKV<any[]>('users', [])

  const loadSampleData = () => {
    const sampleData = initializeSampleData()
    setUsers(sampleData.users)
    setTopics(sampleData.topics)
    setContents(sampleData.contents)
    setQuestions(sampleData.questions)
    toast.success('Dados de exemplo carregados!', {
      description: 'A plataforma agora tem usuários, tópicos, conteúdos e questões de exemplo para explorar.'
    })
  }

  if (user?.role === 'admin') {
    const totalStudents = users.filter(u => u.role === 'student').length
    const totalQuestions = questions.filter(q => q.isPublished).length
    const totalAttempts = attempts.length
    const avgAccuracy = attempts.length > 0 
      ? Math.round((attempts.filter(a => a.isCorrect).length / attempts.length) * 100)
      : 0

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard Administrativo</h1>
            <p className="text-muted-foreground text-lg">Visão geral da sua plataforma de ensino</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={16} />
            <span className="text-sm">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover glass-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Estudantes</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users size={20} className="text-primary icon-enhance" weight="fill" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalStudents}</div>
              <p className="text-sm text-muted-foreground mt-1">Alunos registrados</p>
            </CardContent>
          </Card>

          <Card className="card-hover glass-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Questões Publicadas</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-lg">
                <QuestionIcon size={20} className="text-secondary icon-enhance" weight="fill" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalQuestions}</div>
              <p className="text-sm text-muted-foreground mt-1">Questões disponíveis</p>
            </CardContent>
          </Card>

          <Card className="card-hover glass-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Tentativas</CardTitle>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Activity size={20} className="text-accent icon-enhance" weight="fill" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalAttempts}</div>
              <p className="text-sm text-muted-foreground mt-1">Respostas enviadas</p>
            </CardContent>
          </Card>

          <Card className="card-hover glass-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Precisão Média</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Target size={20} className="text-green-600 icon-enhance" weight="fill" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{avgAccuracy}%</div>
              <p className="text-sm text-muted-foreground mt-1">Taxa de acerto</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Setup Card - Show when no data exists */}
        {topics.length === 0 && questions.length === 0 && (
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Database size={24} className="text-primary" weight="fill" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Configuração Rápida</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    Comece rapidamente carregando dados de exemplo
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Isso criará tópicos, questões, conteúdos e usuários de teste para ajudá-lo a explorar os recursos da plataforma.
                </p>
                <Button onClick={loadSampleData} className="w-full btn-primary h-12">
                  <Sparkle size={18} className="mr-2" weight="fill" />
                  Carregar Dados de Exemplo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightning size={20} className="text-primary" weight="fill" />
                Atividade Recente
              </CardTitle>
              <CardDescription>Últimas tentativas e sessões de estudo dos estudantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attempts.slice(-5).reverse().map((attempt) => {
                  const question = questions.find(q => q.id === attempt.questionId)
                  const student = users.find(u => u.id === attempt.userId)
                  return (
                    <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {student?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student?.name || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground">
                            {question?.title || 'Questão'}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        attempt.isCorrect 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {attempt.isCorrect ? 'Correto' : 'Incorreto'}
                      </div>
                    </div>
                  )
                })}
                {attempts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhuma tentativa ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book size={20} className="text-secondary" weight="fill" />
                Visão Geral dos Tópicos
              </CardTitle>
              <CardDescription>Conteúdos e questões por tópico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topics.map((topic) => {
                  const topicContents = contents.filter(c => c.topicId === topic.id && c.isPublished)
                  const topicQuestions = questions.filter(q => q.topicId === topic.id && q.isPublished)
                  return (
                    <div key={topic.id} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground">{topic.name}</h4>
                        <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {topicContents.length + topicQuestions.length} itens
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Note size={14} />
                          {topicContents.length} conteúdos
                        </span>
                        <span className="flex items-center gap-1">
                          <QuestionIcon size={14} />
                          {topicQuestions.length} questões
                        </span>
                      </div>
                    </div>
                  )
                })}
                {topics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Book size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum tópico criado ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Student Dashboard
  const userAttempts = attempts.filter(a => a.userId === user?.id)
  const userStudyLogs = studyLogs.filter(s => s.userId === user?.id)
  
  const topicProgress = topics.map(topic => {
    const topicContents = contents.filter(c => c.topicId === topic.id && c.isPublished)
    const topicQuestions = questions.filter(q => q.topicId === topic.id && q.isPublished)
    const studiedContents = userStudyLogs.filter(log => 
      topicContents.some(c => c.id === log.contentId) && log.markedDone
    )
    const attemptedQuestions = userAttempts.filter(a => 
      topicQuestions.some(q => q.id === a.questionId)
    )
    const correctAttempts = attemptedQuestions.filter(a => a.isCorrect)
    
    const totalItems = topicContents.length + topicQuestions.length
    const completedItems = studiedContents.length + correctAttempts.length
    
    return {
      topic,
      progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      accuracy: attemptedQuestions.length > 0 ? Math.round((correctAttempts.length / attemptedQuestions.length) * 100) : 0
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Bem-vindo de volta, {user?.name}!</h1>
          <p className="text-muted-foreground text-lg">Continue sua jornada de aprendizado</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={16} />
          <span className="text-sm">{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover glass-effect">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessões de Estudo</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Book size={20} className="text-primary icon-enhance" weight="fill" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{userStudyLogs.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Conteúdos estudados</p>
          </CardContent>
        </Card>

        <Card className="card-hover glass-effect">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questões Respondidas</CardTitle>
            <div className="p-2 bg-secondary/10 rounded-lg">
              <QuestionIcon size={20} className="text-secondary icon-enhance" weight="fill" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{userAttempts.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Tentativas realizadas</p>
          </CardContent>
        </Card>

        <Card className="card-hover glass-effect">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precisão Geral</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Trophy size={20} className="text-green-600 icon-enhance" weight="fill" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {userAttempts.length > 0 
                ? Math.round((userAttempts.filter(a => a.isCorrect).length / userAttempts.length) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">Taxa de acerto</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendUp size={20} className="text-accent" weight="fill" />
            Progresso por Tópico
          </CardTitle>
          <CardDescription>Seu progresso em diferentes tópicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {topicProgress.map(({ topic, progress, accuracy }) => (
              <div key={topic.id} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">{topic.name}</h4>
                  <span className="text-sm font-medium text-primary">{progress}% completo</span>
                </div>
                <Progress value={progress} className="h-3 mb-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{topic.description}</span>
                  <span className="flex items-center gap-1">
                    <Target size={14} />
                    {accuracy}% precisão
                  </span>
                </div>
              </div>
            ))}
            {topics.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Book size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhum tópico disponível</h3>
                <p>Aguarde enquanto o administrador adiciona conteúdo</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}