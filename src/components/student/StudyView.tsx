import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  Clock, 
  ArrowLeft, 
  PlayCir
  CheckCircle, 
  Image as ImageIcon,
  PlayCircle,
  Question
} from '@phosphor-icons/react'
import { useAuth } from '@/contexts/AuthContext'
import { useKV } from '@github/spark/hooks'
          </p>
  const [contents] = useKV<Content[]>('contents', [])
  const [studyLogs, setStudyLogs] = useKV<any[]>('study_logs', [])
interface StudyViewProps {x] = useState(0)
                      <Badge variant="outline" 

               <CardDescription className="text-sm l
  onViewChange: (view: string, data?: any) => void
  
                      {/* Progress 
                        <div className="flex
                          <span classNam


                   
                    
                        </span>
                         
                        </span>

     
                        classNam
                        <div className="flex
                          'Sem conteú


                   
                    
                        </span>
                         
                        </span>

     
                        classNam

                          'Sem conteú
                          'Revisar conte

                    
         
              )
          }


              <BookOpen c
              <p classNa
              </p>
          </Card>
          contentId: currentContent.id,
          markedDone: true,

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

          </Button>
      </div>
      {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-fo
        <Progres

      <Card cl
          <div className="flex items-start justify-be
              <CardTitle className="text-xl mb-2">{currentContent.title}</C
                <div cla
               
            
     
   

          
            </div>
              <Badge
                Estudado
            )}
        </CardHeader>
          {/* Media */}
            <div 
                <div className="aspect-video roun
                    src={currentContent.mediaUrl.replace('
                    allowFullScreen
                 
              ) : currentContent.mediaUrl.match(/\.(jpg|jpe
                  <img
                    
                  /
              
            
      
                    re
                  >
                  </a>
              )}
          )}
          {/* 
            className="prose prose-slate max-w-none"
          />

            <div className
                onClick={navi
                disa
                <ArrowLeft className="w-4 h-4 mr-2" />
              </B
                onClick={navigateToNext}
                disabled={currentContentIndex === topicContents.length - 1}
                Próximo
              </Button>
            <Button
              disabled
            >
                <div className="w-4 h-4 border
                <CheckCircle className="w-4 h-4 mr-2" />
              {isStudied ? 'Já estudado' : 'Marcar como estudado'}
          </div>
      </Card>
      {/* Navigation */
        {topicContents.m
            key={i
            classNam
                ? 
                ? 'bg-green
            }`}
        ))}
    </div>
}




































































































