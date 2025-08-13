import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  PlayCircle,
  Image as ImageIcon,
  BookOpen
} from '@phosphor-icons/react'
import { Topic, Content } from '@/types'

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
  const [studyLogs, setStudyLogs] = useKV<any[]>('study_logs', [])
  const [currentContentIndex, setCurrentContentIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const currentTopic = topics.find(t => t.id === topicId)
  const topicContents = contents.filter(c => c.topicId === topicId && c.isPublished)
  const currentContent = contentId 
    ? contents.find(c => c.id === contentId)
    : topicContents[currentContentIndex]

  useEffect(() => {
    if (contentId) {
      const index = topicContents.findIndex(c => c.id === contentId)
      if (index !== -1) {
        setCurrentContentIndex(index)
      }
    }
  }, [contentId, topicContents])

  const markAsStudied = async () => {
    if (!currentContent || !user) return

    setLoading(true)
    try {
      const existingLog = studyLogs.find(
        log => log.userId === user.id && log.contentId === currentContent.id
      )

      if (!existingLog) {
        const newLog = {
          id: Date.now().toString(),
          userId: user.id,
          contentId: currentContent.id,
          markedDone: true,
          createdAt: new Date().toISOString()
        }

        setStudyLogs(currentLogs => [...currentLogs, newLog])
        toast.success('Conteúdo marcado como estudado!')
      }
    } catch (error) {
      toast.error('Erro ao marcar conteúdo como estudado')
    } finally {
      setLoading(false)
    }
  }

  const isStudied = studyLogs.some(
    log => log.userId === user?.id && log.contentId === currentContent?.id && log.markedDone
  )

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

  if (!currentContent) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum conteúdo encontrado</h3>
            <p className="text-muted-foreground">
              Não há conteúdos disponíveis para este tópico.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = topicContents.length > 0 ? ((currentContentIndex + 1) / topicContents.length) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para {currentTopic?.name}
        </Button>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {currentContentIndex + 1} de {topicContents.length}
          </Badge>
          <Button onClick={goToPractice} variant="outline">
            Praticar questões
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso do estudo</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{currentContent.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {currentContent.estimatedTimeMin} min
                </div>
                {currentContent.tags && currentContent.tags.length > 0 && (
                  <div className="flex gap-1">
                    {currentContent.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {isStudied && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Estudado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Media */}
          {currentContent.mediaUrl && (
            <div className="space-y-4">
              {currentContent.mediaUrl.includes('youtube.com') || currentContent.mediaUrl.includes('youtu.be') ? (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={currentContent.mediaUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allowFullScreen
                    title="Video content"
                  />
                </div>
              ) : currentContent.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="text-center">
                  <img
                    src={currentContent.mediaUrl}
                    alt="Content illustration"
                    className="max-w-full h-auto rounded-lg mx-auto"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <ImageIcon className="w-5 h-5" />
                  <a
                    href={currentContent.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Ver mídia relacionada
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Content Body */}
          <div 
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: currentContent.bodyHtml }}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                onClick={navigateToPrevious}
                variant="outline"
                disabled={currentContentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              <Button
                onClick={navigateToNext}
                variant="outline"
                disabled={currentContentIndex === topicContents.length - 1}
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <Button
              onClick={markAsStudied}
              disabled={isStudied || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {isStudied ? 'Já estudado' : 'Marcar como estudado'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-2">
        {topicContents.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentContentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentContentIndex
                ? 'bg-primary'
                : index < currentContentIndex
                ? 'bg-green-500'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}