import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Topic, Content, Question, StudyLog, Attempt } from '@/types'
import { BookOpen, Brain, Clock, Play, Target, TrendUp } from '@phosphor-icons/react'

interface TopicsViewProps {
  onViewChange: (view: string, data?: any) => void
}

export default function TopicsView({ onViewChange }: TopicsViewProps) {
  const { user } = useAuth()
  const [topics] = useKV<Topic[]>('topics', [])
  const [contents] = useKV<Content[]>('contents', [])
  const [questions] = useKV<Question[]>('questions', [])
  const [studyLogs] = useKV<StudyLog[]>('studyLogs', [])
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
        <h1 className="text-3xl font-bold">Learning Topics</h1>
        <p className="text-muted-foreground">Choose a topic to start learning</p>
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
                    <span>Progress</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" weight="duotone" />
                    <span>{progress.studiedContents}/{progress.totalContents} studied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-muted-foreground" weight="duotone" />
                    <span>{progress.answeredQuestions}/{progress.totalQuestions} correct</span>
                  </div>
                </div>
                
                {progress.accuracy > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-secondary" weight="duotone" />
                    <span>{progress.accuracy}% accuracy</span>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => onViewChange('study', { topicId: topic.id })}
                  >
                    <BookOpen className="w-4 h-4 mr-2" weight="bold" />
                    Study
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => onViewChange('practice', { topicId: topic.id })}
                  >
                    <Play className="w-4 h-4 mr-2" weight="bold" />
                    Practice
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {activeTopics.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Book className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No topics available</h3>
              <p className="text-muted-foreground text-center">
                Check back later for new learning content
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}