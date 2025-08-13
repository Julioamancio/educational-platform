import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, Car
import { Badge } from '@/components/ui/badge'
  BookOpen, om '@/contexts/AuthContext'
import { toast } from 'sonner'
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Image as ImageIcon,
  PlayCircle,
  const [c
  BookOpen
    ? contents.filter(c => c.t
import { Topic, Content } from '@/types'

      const index 
  topicId?: string
    }
  onBack: () => void
 string, data?: any) => void

    if (currentContent && user) {
        log.userId === user.dyViewProps) {
  const { user } = useAuth()
  const [topics] = useKV<Topic[]>('topics', [])
  }, [currentContent, user, studyLogs])
  const [studyLogs, setStudyLogs] = useKV<any[]>('study_logs', [])
t [currentContentIndex, setCurrentContentIndex] = useState(0)
      log.userId === user.id && log.contentId === curre

  const topicContents = contents.filter(c => c.topicId === topicId && c.isPublished)
        currentLogs.map(log => 
    ? contents.find(c => c.id === contentId)
    : topicContents[currentContentIndex]
    } else {
      const newLog:
        userId: user
      if (index !== -1) {
      }
      }
    set
  }, [contentId, topicContents])

  const markAsStudied = async () => {
    if (!currentContent || !user) return


    if (currentContentIndex > 0) {
      const existingLog = studyLogs.find(
        log => log.userId === user.id && log.contentId === currentContent.id
      )

        const newLog = {
    ).length
          userId: user.id,
          contentId: currentContent.id,
    }     markedDone: true,
te().toISOString()

        <div className="flex items-ce
        setStudyLogs(currentLogs => [...currentLogs, newLog])
        toast.success('Conteúdo marcado como estudado!')
    } catch (error) {
      toast.error('Erro ao marcar conteúdo como estudado')
    } finally {
 setLoading(false)
          <CardContent
  }

  const isStudied = studyLogs.some(
    log => log.userId === user?.id && log.contentId === currentContent?.id && log.markedDone
  )
            </But
        <
      setCurrentContentIndex(prev => prev + 1)
    }


  const navigateToPrevious = () => {
    if (currentContentIndex > 0) {
    }
          <p className="t

       
    onViewChange('practice', { topicId })


    return (
      <div className="max-w-4xl mx-auto p-6">
          <ArrowLeft className="w-4 h-4 mr-2" />

            <span>{progress.percent
        <Card>
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum conteúdo encontrado</h3>
            <p className="text-muted-foreground">
            <d
            </p>
          </CardContent>

    )
          </div>


  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
    ariant="ghost">
                <div className="relative">
          Voltar para {currentTopic?.name}
        </Button>
        <div className="flex items-center gap-4">
            {currentContentIndex + 1} de {topicContents.length}

          <Button onClick={goToPractice} variant="outline">
          </Button>
                    alt={currentConten
      </div>
     
      <div className="mb-6">
 <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso do estudo</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

              disa
      <Card className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              ) : ({currentContent.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                
                  <Clock className="w-4 h-4" />
                  {currentContent.estimatedTimeMin} min
 </div>
                {currentContent.tags && currentContent.tags.length > 0 && (
                    {currentContent.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
              variant="outline" 
                    ))}
                  </div>
              </div>
            <sp
            {isStudied && (
                <CheckCircle className="w-3 h-3 mr-1" />
            >   Estudado
                <>
                  <Ar
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