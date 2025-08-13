import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Topic, Content, Question, StudyLog, Attempt } from '@/types'
import { 
  ArrowLeft, 
  CheckCircle, 
  X, 
  Target, 
  TrendUp, 
  BookOpen, 
  Brain,
  Clock,
  Calendar,
  Trophy,
  Star,
  Fire
} from '@phosphor-icons/react'
import { format, subDays, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProgressViewProps {
  onBack: () => void
  onViewChange: (view: string, data?: any) => void
}

interface TopicProgress {
  topic: Topic
  totalContents: number
  studiedContents: number
  totalQuestions: number
  correctAnswers: number
  totalAttempts: number
  accuracy: number
  overallProgress: number
  avgTimePerQuestion: number
  lastActivity?: string
}

interface DailyActivity {
  date: string
  questionsAnswered: number
  contentsStudied: number
  accuracy: number
}

export default function ProgressView({ onBack, onViewChange }: ProgressViewProps) {
  const { user } = useAuth()
  const [topics] = useKV<Topic[]>('topics', [])
  const [contents] = useKV<Content[]>('contents', [])
  const [questions] = useKV<Question[]>('questions', [])
  const [studyLogs] = useKV<StudyLog[]>('studyLogs', [])
  const [attempts] = useKV<Attempt[]>('attempts', [])

  // Calculate progress for each topic
  const topicProgress = useMemo(() => {
    if (!user) return []

    return topics.filter(t => t.isActive).map(topic => {
      const topicContents = contents.filter(c => c.topicId === topic.id && c.isPublished)
      const topicQuestions = questions.filter(q => q.topicId === topic.id && q.isPublished)
      
      const userStudyLogs = studyLogs.filter(log => 
        log.userId === user.id && 
        log.markedDone &&
        topicContents.some(c => c.id === log.contentId)
      )
      
      const userAttempts = attempts.filter(a => 
        a.userId === user.id && 
        topicQuestions.some(q => q.id === a.questionId)
      )
      
      const correctAttempts = userAttempts.filter(a => a.isCorrect)
      const uniqueCorrectQuestions = new Set(correctAttempts.map(a => a.questionId)).size
      
      const totalItems = topicContents.length + topicQuestions.length
      const completedItems = userStudyLogs.length + uniqueCorrectQuestions
      const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
      
      const accuracy = userAttempts.length > 0 
        ? Math.round((correctAttempts.length / userAttempts.length) * 100)
        : 0
      
      const avgTime = userAttempts.length > 0
        ? Math.round(userAttempts.reduce((sum, a) => sum + a.timeSpentSec, 0) / userAttempts.length)
        : 0

      // Get last activity date
      const allActivities = [
        ...userStudyLogs.map(log => log.createdAt),
        ...userAttempts.map(attempt => attempt.createdAt)
      ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

      return {
        topic,
        totalContents: topicContents.length,
        studiedContents: userStudyLogs.length,
        totalQuestions: topicQuestions.length,
        correctAnswers: uniqueCorrectQuestions,
        totalAttempts: userAttempts.length,
        accuracy,
        overallProgress,
        avgTimePerQuestion: avgTime,
        lastActivity: allActivities[0]
      } as TopicProgress
    }).sort((a, b) => b.overallProgress - a.overallProgress)
  }, [user, topics, contents, questions, studyLogs, attempts])

  // Calculate daily activity for the last 7 days
  const dailyActivity = useMemo(() => {
    if (!user) return []

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayAttempts = attempts.filter(a => 
        a.userId === user.id &&
        isWithinInterval(new Date(a.createdAt), { start: dayStart, end: dayEnd })
      )

      const dayStudyLogs = studyLogs.filter(log => 
        log.userId === user.id &&
        log.markedDone &&
        isWithinInterval(new Date(log.createdAt), { start: dayStart, end: dayEnd })
      )

      const accuracy = dayAttempts.length > 0
        ? Math.round((dayAttempts.filter(a => a.isCorrect).length / dayAttempts.length) * 100)
        : 0

      return {
        date: format(dayStart, 'dd/MM'),
        questionsAnswered: dayAttempts.length,
        contentsStudied: dayStudyLogs.length,
        accuracy
      } as DailyActivity
    }).reverse()

    return last7Days
  }, [user, attempts, studyLogs])

  // Overall statistics
  const overallStats = useMemo(() => {
    if (!user) return { totalStudied: 0, totalAnswered: 0, overallAccuracy: 0, totalTime: 0, streak: 0 }

    const userStudyLogs = studyLogs.filter(log => log.userId === user.id && log.markedDone)
    const userAttempts = attempts.filter(a => a.userId === user.id)
    const correctAttempts = userAttempts.filter(a => a.isCorrect)
    
    const overallAccuracy = userAttempts.length > 0 
      ? Math.round((correctAttempts.length / userAttempts.length) * 100)
      : 0

    const totalTime = Math.round(userAttempts.reduce((sum, a) => sum + a.timeSpentSec, 0) / 60) // in minutes

    // Calculate streak (consecutive days with activity)
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    while (streak < 30) { // Check max 30 days
      const dayStart = new Date(currentDate)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const hasActivity = 
        userAttempts.some(a => isWithinInterval(new Date(a.createdAt), { start: dayStart, end: dayEnd })) ||
        userStudyLogs.some(log => isWithinInterval(new Date(log.createdAt), { start: dayStart, end: dayEnd }))

      if (hasActivity) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return {
      totalStudied: userStudyLogs.length,
      totalAnswered: userAttempts.length,
      overallAccuracy,
      totalTime,
      streak
    }
  }, [user, studyLogs, attempts])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-secondary'
    if (progress >= 60) return 'text-primary'
    if (progress >= 40) return 'text-accent'
    return 'text-muted-foreground'
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-secondary'
    if (accuracy >= 75) return 'text-primary'
    if (accuracy >= 60) return 'text-accent'
    return 'text-destructive'
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Progresso de Estudos</h1>
          <p className="text-muted-foreground">
            Acompanhe seu desempenho e evolução
          </p>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{overallStats.totalStudied}</p>
                <p className="text-xs text-muted-foreground">Conteúdos estudados</p>
              </div>
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{overallStats.totalAnswered}</p>
                <p className="text-xs text-muted-foreground">Questões respondidas</p>
              </div>
              <Brain className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${getAccuracyColor(overallStats.overallAccuracy)}`}>
                  {overallStats.overallAccuracy}%
                </p>
                <p className="text-xs text-muted-foreground">Precisão geral</p>
              </div>
              <Target className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{overallStats.totalTime}min</p>
                <p className="text-xs text-muted-foreground">Tempo total</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-500">{overallStats.streak}</p>
                <p className="text-xs text-muted-foreground">Dias consecutivos</p>
              </div>
              <Fire className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Atividade dos Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyActivity.map((day, index) => {
              const maxActivity = Math.max(...dailyActivity.map(d => d.questionsAnswered + d.contentsStudied))
              const totalActivity = day.questionsAnswered + day.contentsStudied
              const activityPercentage = maxActivity > 0 ? (totalActivity / maxActivity) * 100 : 0
              
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm text-muted-foreground">
                    {day.date}
                  </div>
                  <div className="flex-1">
                    <Progress value={activityPercentage} className="h-2" />
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      {day.questionsAnswered}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {day.contentsStudied}
                    </span>
                    {day.questionsAnswered > 0 && (
                      <span className={`${getAccuracyColor(day.accuracy)}`}>
                        {day.accuracy}%
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Topic Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendUp className="w-5 h-5" />
            Progresso por Tópico
          </CardTitle>
          <CardDescription>
            Veja seu desempenho detalhado em cada tópico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {topicProgress.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhum progresso ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Comece a estudar para ver seu progresso aqui
                </p>
                <Button onClick={() => onViewChange('topics')}>
                  Começar a estudar
                </Button>
              </div>
            ) : (
              topicProgress.map((progress) => (
                <div key={progress.topic.id} className="border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{progress.topic.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {progress.topic.description}
                      </p>
                      {progress.lastActivity && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Última atividade: {format(new Date(progress.lastActivity), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {progress.topic.levelMin} - {progress.topic.levelMax}
                      </Badge>
                      {progress.overallProgress >= 100 && (
                        <Star className="w-5 h-5 text-yellow-500" weight="fill" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progresso geral</span>
                        <span className={getProgressColor(progress.overallProgress)}>
                          {progress.overallProgress}%
                        </span>
                      </div>
                      <Progress value={progress.overallProgress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-primary">
                          <BookOpen className="w-4 h-4" />
                          <span className="font-medium">
                            {progress.studiedContents}/{progress.totalContents}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Conteúdos</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-accent">
                          <Brain className="w-4 h-4" />
                          <span className="font-medium">
                            {progress.correctAnswers}/{progress.totalQuestions}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Questões</p>
                      </div>
                      
                      <div className="text-center">
                        <div className={`flex items-center justify-center gap-1 ${getAccuracyColor(progress.accuracy)}`}>
                          <Target className="w-4 h-4" />
                          <span className="font-medium">{progress.accuracy}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Precisão</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {formatTime(progress.avgTimePerQuestion)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Tempo médio</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewChange('study', { topicId: progress.topic.id })}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Estudar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewChange('practice', { topicId: progress.topic.id })}
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Praticar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}