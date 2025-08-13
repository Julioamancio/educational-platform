import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Topic, Question, Attempt } from '@/types'
import { 
  ArrowLeft, 
  CheckCircle, 
  X, 
  Clock, 
  Target, 
  TrendDown, 
  Search,
  Filter,
  Eye,
  RefreshCw
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReviewViewProps {
  onBack: () => void
  onViewChange: (view: string, data?: any) => void
}

interface AttemptWithDetails extends Attempt {
  question: Question
  topic: Topic
}

export default function ReviewView({ onBack, onViewChange }: ReviewViewProps) {
  const { user } = useAuth()
  const [topics] = useKV<Topic[]>('topics', [])
  const [questions] = useKV<Question[]>('questions', [])
  const [attempts] = useKV<Attempt[]>('attempts', [])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [showCorrectOnly, setShowCorrectOnly] = useState(false)
  const [showIncorrectOnly, setShowIncorrectOnly] = useState(false)
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptWithDetails | null>(null)

  // Get user attempts with question and topic details
  const userAttemptsWithDetails = useMemo(() => {
    if (!user) return []
    
    return attempts
      .filter(attempt => attempt.userId === user.id)
      .map(attempt => {
        const question = questions.find(q => q.id === attempt.questionId)
        const topic = question ? topics.find(t => t.id === question.topicId) : undefined
        
        if (!question || !topic) return null
        
        return {
          ...attempt,
          question,
          topic
        } as AttemptWithDetails
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [attempts, questions, topics, user])

  // Filter attempts based on search and filters
  const filteredAttempts = useMemo(() => {
    return userAttemptsWithDetails.filter(attempt => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (
          !attempt.question.title.toLowerCase().includes(searchLower) &&
          !attempt.topic.name.toLowerCase().includes(searchLower) &&
          !attempt.question.tags.some(tag => tag.toLowerCase().includes(searchLower))
        ) {
          return false
        }
      }
      
      // Topic filter
      if (selectedTopic !== 'all' && attempt.topic.id !== selectedTopic) {
        return false
      }
      
      // Correct/incorrect filters
      if (showCorrectOnly && !attempt.isCorrect) return false
      if (showIncorrectOnly && attempt.isCorrect) return false
      
      return true
    })
  }, [userAttemptsWithDetails, searchTerm, selectedTopic, showCorrectOnly, showIncorrectOnly])

  // Statistics
  const stats = useMemo(() => {
    const total = userAttemptsWithDetails.length
    const correct = userAttemptsWithDetails.filter(a => a.isCorrect).length
    const incorrect = total - correct
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const avgTime = total > 0 ? Math.round(
      userAttemptsWithDetails.reduce((sum, a) => sum + a.timeSpentSec, 0) / total
    ) : 0

    return { total, correct, incorrect, accuracy, avgTime }
  }, [userAttemptsWithDetails])

  const handleRetryQuestion = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question) {
      onViewChange('practice', { topicId: question.topicId })
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Revisão de Tentativas</h1>
          <p className="text-muted-foreground">
            Revise suas respostas e aprenda com os erros
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de tentativas</p>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-secondary">{stats.correct}</p>
                <p className="text-xs text-muted-foreground">Corretas</p>
              </div>
              <CheckCircle className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.incorrect}</p>
                <p className="text-xs text-muted-foreground">Incorretas</p>
              </div>
              <X className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.accuracy}%</p>
                <p className="text-xs text-muted-foreground">Precisão</p>
              </div>
              <TrendDown className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, tópico ou tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Selecionar tópico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tópicos</SelectItem>
                {topics.map(topic => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                variant={showCorrectOnly ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setShowCorrectOnly(!showCorrectOnly)
                  setShowIncorrectOnly(false)
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Corretas
              </Button>
              
              <Button
                variant={showIncorrectOnly ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  setShowIncorrectOnly(!showIncorrectOnly)
                  setShowCorrectOnly(false)
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Incorretas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attempts List */}
      <div className="space-y-4">
        {filteredAttempts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma tentativa encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                {userAttemptsWithDetails.length === 0 
                  ? 'Você ainda não respondeu nenhuma questão.'
                  : 'Tente ajustar os filtros para encontrar tentativas específicas.'
                }
              </p>
              {userAttemptsWithDetails.length === 0 && (
                <Button onClick={() => onViewChange('topics')}>
                  Começar a praticar
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAttempts.map((attempt) => (
            <Card key={attempt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{attempt.question.title}</h3>
                      <Badge variant="outline">{attempt.topic.name}</Badge>
                      <Badge variant={attempt.isCorrect ? "secondary" : "destructive"}>
                        {attempt.isCorrect ? 'Correto' : 'Incorreto'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>{format(new Date(attempt.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(attempt.timeSpentSec)}
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-muted-foreground">Sua resposta: </span>
                      <span className={attempt.isCorrect ? "text-secondary font-medium" : "text-destructive font-medium"}>
                        {attempt.chosenOption}) {attempt.question[`option${attempt.chosenOption}` as keyof Question] as string}
                      </span>
                    </div>
                    
                    {!attempt.isCorrect && (
                      <div className="text-sm mt-1">
                        <span className="text-muted-foreground">Resposta correta: </span>
                        <span className="text-secondary font-medium">
                          {attempt.question.correctOption}) {attempt.question[`option${attempt.question.correctOption}` as keyof Question] as string}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAttempt(attempt)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver explicação
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetryQuestion(attempt.question.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Selected Attempt Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedAttempt.question.title}</CardTitle>
                  <CardDescription>
                    {selectedAttempt.topic.name} • {format(new Date(selectedAttempt.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAttempt(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Questão:</h4>
                <div dangerouslySetInnerHTML={{ __html: selectedAttempt.question.stemHtml }} />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Explicação:</h4>
                <div 
                  className="bg-muted/50 p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: selectedAttempt.question.commentHtml }} 
                />
              </div>
              
              <div className="flex justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAttempt(null)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setSelectedAttempt(null)
                    handleRetryQuestion(selectedAttempt.question.id)
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}