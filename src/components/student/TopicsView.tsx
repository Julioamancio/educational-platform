import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Topic, Content, Question, StudyLog, Attempt } from '@/types'
import { BookOpen, Brain, Clock, Play, Target, TrendUp, Book } from '@phosphor-icons/react'

interface TopicsViewProps {
  onViewChange: (view: string, data?: any) => void
  studyMode?: boolean
}

export default function TopicsView({ onViewChange, studyMode = false }: TopicsViewProps) {
  const { user } = useAuth()
  const [topics] = useKV<Topic[]>('topics', [])
  const [contents] = useKV<Content[]>('contents', [])
  const [questions] = useKV<Question[]>('questions', [])
  const [studyLogs] = useKV<StudyLog[]>('study_logs', [])
  const [attempts] = useKV<Attempt[]>('attempts', [])

  const getTopicProgress = (topic: Topic) => {
    const topicContents = contents.filter(c => c.topicId === topic.id && c.isPublished)
    const topicQuestions = questions.filter(q => q.topicId === topic.id && q.isPublished)
    
    const userStudyLogs = studyLogs.filter(log => 
      log.userId === user?.id && 
      topicContents.some(c => c.id === log.contentId) &&
      log.markedDone
    )
    
    const userAttempts = attempts.filter(a => 
      a.userId === user?.id && 
      topicQuestions.some(q => q.id === a.questionId)
    )
    
    const uniqueCorrectQuestions = new Set(
      userAttempts.filter(a => a.isCorrect).map(a => a.questionId)
    ).size
    
    const totalItems = topicContents.length + topicQuestions.length
    const completedItems = userStudyLogs.length + uniqueCorrectQuestions
    
    return {
      progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      studiedContents: userStudyLogs.length,
      totalContents: topicContents.length,
      answeredQuestions: uniqueCorrectQuestions,
      totalQuestions: topicQuestions.length,
      accuracy: userAttempts.length > 0 
        ? Math.round((userAttempts.filter(a => a.isCorrect).length / userAttempts.length) * 100)
        : 0
    }
  }

  const activeTopics = topics.filter(t => t.isActive)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {studyMode ? 'Estudar' : 'Tópicos de Aprendizado'}
        </h1>
        <p className="text-muted-foreground">
          {studyMode 
            ? 'Escolha um tópico para começar a estudar os conteúdos'
            : 'Escolha um tópico para começar a aprender'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTopics.map((topic) => {
          const progress = getTopicProgress(topic)
          
          return (
            <Card key={topic.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary icon-enhance" weight="duotone" />
                    <CardTitle className="text-lg">{topic.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{topic.levelMin} - {topic.levelMax}</Badge>
                </div>
                <CardDescription>{topic.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" weight="duotone" />
                    <span>{progress.studiedContents}/{progress.totalContents} estudados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-muted-foreground" weight="duotone" />
                    <span>{progress.answeredQuestions}/{progress.totalQuestions} corretas</span>
                  </div>
                </div>
                
                {progress.accuracy > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-secondary" weight="duotone" />
                    <span>{progress.accuracy}% precisão</span>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  {studyMode ? (
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => onViewChange('study', { topicId: topic.id })}
                    >
                      <BookOpen className="w-4 h-4 mr-2" weight="bold" />
                      Estudar
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="default" 
                        className="flex-1"
                        onClick={() => onViewChange('study', { topicId: topic.id })}
                      >
                        <BookOpen className="w-4 h-4 mr-2" weight="bold" />
                        Estudar
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => onViewChange('practice', { topicId: topic.id })}
                      >
                        <Play className="w-4 h-4 mr-2" weight="bold" />
                        Praticar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {activeTopics.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Book className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhum tópico disponível</h3>
              <p className="text-muted-foreground text-center">
                Verifique novamente mais tarde para novo conteúdo de aprendizado
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}