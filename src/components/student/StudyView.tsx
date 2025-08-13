import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Topic, Content, StudyLog } from '@/types'
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  PlayCircle,
  Image as ImageIcon,
  VideoCamera,
  FileText
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface StudyViewProps {
  topicId?: string
  contentId?: string
  onBack: () => void
  onViewChange: (view: string, data?: any) => void
}

export default function StudyView({ topicId, contentId, onBack, onViewChange }: StudyViewProps) {
  const { user } = useAuth()
  const [topics] = useKV<Topic[]>('topics', [])
  const [contents] = useKV<Content[]>('contents', [])
  const [studyLogs, setStudyLogs] = useKV<StudyLog[]>('studyLogs', [])
  
  const [currentContentIndex, setCurrentContentIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  const availableContents = topicId 
    ? contents.filter(c => c.topicId === topicId && c.isPublished)
    : contents.filter(c => c.isPublished)

  // If specific content ID is provided, find its index
  useEffect(() => {
    if (contentId) {
      const index = availableContents.findIndex(c => c.id === contentId)
      if (index !== -1) {
        setCurrentContentIndex(index)
      }
    }
  }, [contentId, availableContents])

  const currentContent = availableContents[currentContentIndex]
  const topic = topics.find(t => t.id === (topicId || currentContent?.topicId))

  // Check if current content is already marked as done
  useEffect(() => {
    if (currentContent && user) {
      const log = studyLogs.find(log => 
        log.userId === user.id && 
        log.contentId === currentContent.id && 
        log.markedDone
      )
      setIsCompleted(!!log)
    }
  }, [currentContent, user, studyLogs])

  const handleMarkAsStudied = () => {
    if (!currentContent || !user) return

    const existingLog = studyLogs.find(log => 
      log.userId === user.id && log.contentId === currentContent.id
    )

    if (existingLog) {
      // Update existing log
      setStudyLogs(currentLogs => 
        currentLogs.map(log => 
          log.id === existingLog.id 
            ? { ...log, markedDone: true }
            : log
        )
      )
    } else {
      // Create new log
      const newLog: StudyLog = {
        id: Date.now().toString(),
        userId: user.id,
        contentId: currentContent.id,
        markedDone: true,
        createdAt: new Date().toISOString()
      }
      setStudyLogs(currentLogs => [...currentLogs, newLog])
    }

    setIsCompleted(true)
    toast.success('Conteúdo marcado como estudado!')
  }

  const handleNextContent = () => {
    if (currentContentIndex < availableContents.length - 1) {
      setCurrentContentIndex(prev => prev + 1)
    } else {
      toast.success('Você completou todos os conteúdos!')
      onBack()
    }
  }

  const handlePrevContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(prev => prev - 1)
    }
  }

  const getStudyProgress = () => {
    if (!user) return { completed: 0, total: availableContents.length, percentage: 0 }
    
    const completedContents = studyLogs.filter(log => 
      log.userId === user.id && 
      log.markedDone &&
      availableContents.some(c => c.id === log.contentId)
    ).length

    return {
      completed: completedContents,
      total: availableContents.length,
      percentage: availableContents.length > 0 ? Math.round((completedContents / availableContents.length) * 100) : 0
    }
  }

  if (availableContents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Conteúdo de Estudo</h1>
            <p className="text-muted-foreground">
              {topic ? `${topic.name} - ` : ''}Nenhum conteúdo disponível
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhum conteúdo disponível</h3>
            <p className="text-muted-foreground text-center mb-4">
              {topic 
                ? `Não há conteúdo publicado para ${topic.name} ainda.`
                : 'Não há conteúdo publicado disponível ainda.'
              }
            </p>
            <Button onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = getStudyProgress()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Conteúdo de Estudo</h1>
          <p className="text-muted-foreground">
            {topic ? `${topic.name} - ` : ''}
            Conteúdo {currentContentIndex + 1} de {availableContents.length}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={isCompleted ? "secondary" : "outline"}>
            {isCompleted ? "Estudado" : "Não estudado"}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Progresso: {progress.completed}/{progress.total} ({progress.percentage}%)
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso do tópico</span>
            <span>{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle className="text-2xl">{currentContent?.title}</CardTitle>
            </div>
            {currentContent?.estTimeMin && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {currentContent.estTimeMin} min
              </div>
            )}
          </div>
          {currentContent?.tags && currentContent.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {currentContent.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Media content */}
          {currentContent?.mediaUrl && (
            <div className="space-y-4">
              {currentContent.mediaUrl.includes('video') || currentContent.mediaUrl.includes('.mp4') || currentContent.mediaUrl.includes('.webm') ? (
                <div className="relative">
                  <video 
                    src={currentContent.mediaUrl} 
                    className="w-full rounded-lg border"
                    controls
                    style={{ maxHeight: '400px' }}
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <VideoCamera className="w-3 h-3" />
                    Vídeo
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={currentContent.mediaUrl} 
                    alt={currentContent.title}
                    className="w-full rounded-lg border object-cover"
                    style={{ maxHeight: '400px' }}
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Imagem
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content body */}
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: currentContent?.bodyHtml || '' }} />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-border">
            <Button 
              onClick={handleMarkAsStudied}
              disabled={isCompleted}
              className="flex-1"
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Estudado
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como estudado
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => onViewChange('practice', { topicId: topic?.id })}
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Praticar questões
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={handlePrevContent}
              disabled={currentContentIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentContentIndex + 1} de {availableContents.length}
            </span>
            
            <Button 
              onClick={handleNextContent}
            >
              {currentContentIndex < availableContents.length - 1 ? (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                'Finalizar'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}