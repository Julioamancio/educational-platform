import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  ArrowLeft, 
  CheckCircle, 
  Image as ImageIcon,
  PlayCircle,
  Question,
  BookOpen
} from '@phosphor-icons/react'

import { useAuth } from '@/contexts/AuthContext'
import { useKV } from '@github/spark/hooks'

interface StudyViewProps {
  topicId?: string
  contentId?: string
  onBack: () => void
  onViewChange: (view: string, data?: any) => void
}

interface Content {
  id: string
  topicId: string
  title: string
  bodyHtml: string
  mediaUrl?: string
  estTimeMin: number
  tags: string[]
  isPublished: boolean
}

interface StudyLog {
  id: string
  userId: string
  contentId: string
  markedDone: boolean
  createdAt: string
}

export default function StudyView({ topicId, contentId, onBack, onViewChange }: StudyViewProps) {
  const { user } = useAuth()
  const [contents] = useKV<Content[]>('contents', [])
  const [studyLogs, setStudyLogs] = useKV<StudyLog[]>('study_logs', [])
  const [currentContentIndex, setCurrentContentIndex] = useState(0)

  // Filter contents for this topic
  const topicContents = contents.filter(content => 
    content.topicId === topicId && content.isPublished
  )

  // Set initial content if contentId is provided
  useEffect(() => {
    if (contentId && topicContents.length > 0) {
      const index = topicContents.findIndex(content => content.id === contentId)
      if (index !== -1) {
        setCurrentContentIndex(index)
      }
    }
  }, [contentId, topicContents])

  const currentContent = topicContents[currentContentIndex]

  const markAsStudied = async () => {
    if (!user || !currentContent) return

    const existingLog = studyLogs.find(
      log => log.userId === user.id && log.contentId === currentContent.id
    )

    if (!existingLog) {
      const newLog: StudyLog = {
        id: Date.now().toString(),
        userId: user.id,
        contentId: currentContent.id,
        markedDone: true,
        createdAt: new Date().toISOString()
      }

      setStudyLogs(prev => [...prev, newLog])
    }
  }

  const isStudied = studyLogs.some(
    log => log.userId === user?.id && log.contentId === currentContent?.id && log.markedDone
  )

  const studiedCount = topicContents.filter(content =>
    studyLogs.some(log => 
      log.userId === user?.id && 
      log.contentId === content.id && 
      log.markedDone
    )
  ).length

  const progress = topicContents.length > 0 ? (studiedCount / topicContents.length) * 100 : 0

  const navigateToNext = () => {
    if (currentContentIndex < topicContents.length - 1) {
      setCurrentContentIndex(prev => prev + 1)
    }
  }

  const navigateToPrevious = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(prev => prev - 1)
    }
  }

  const goToPractice = () => {
    onViewChange('practice', { topicId })
  }

  if (!topicContents.length) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum conteúdo encontrado</h3>
            <p className="text-muted-foreground">
              Não há conteúdos disponíveis para este tópico no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={goToPractice} variant="outline">
          <Question className="w-4 h-4 mr-2" />
          Praticar
        </Button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Progresso do tópico: {studiedCount} de {topicContents.length} conteúdos
          </span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Content Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{currentContent.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {currentContent.estTimeMin} min
                </Badge>
                {currentContent.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
            {isStudied && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Estudado
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Media */}
          {currentContent.mediaUrl && (
            <div className="mb-6">
              {currentContent.mediaUrl.includes('youtube.com') || currentContent.mediaUrl.includes('youtu.be') ? (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={currentContent.mediaUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title="Video"
                  />
                </div>
              ) : currentContent.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={currentContent.mediaUrl}
                    alt={currentContent.title}
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="p-4 border border-dashed rounded-lg text-center">
                  <PlayCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <a
                    href={currentContent.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Abrir mídia externa
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div
            dangerouslySetInnerHTML={{ __html: currentContent.bodyHtml }}
            className="prose prose-slate max-w-none mb-6"
          />

          {/* Navigation and Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                onClick={navigateToPrevious}
                disabled={currentContentIndex === 0}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              <Button
                onClick={navigateToNext}
                disabled={currentContentIndex === topicContents.length - 1}
                variant="outline"
                size="sm"
              >
                Próximo
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
            
            <Button
              onClick={markAsStudied}
              disabled={isStudied}
              variant={isStudied ? "secondary" : "default"}
            >
              {isStudied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Já estudado
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como estudado
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation dots */}
      {topicContents.length > 1 && (
        <div className="flex justify-center gap-2">
          {topicContents.map((_, index) => {
            const contentStudied = studyLogs.some(
              log => log.userId === user?.id && 
              log.contentId === topicContents[index].id && 
              log.markedDone
            )
            
            return (
              <button
                key={index}
                onClick={() => setCurrentContentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentContentIndex
                    ? 'bg-primary scale-125'
                    : contentStudied
                    ? 'bg-green-500'
                    : 'bg-muted-foreground/30'
                }`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}