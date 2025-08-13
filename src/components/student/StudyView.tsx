import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthConte
import { 
  ArrowLeft, 
  CheckCircle, 
  PlayCircle,
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  PlayCircle,
  Image as ImageIcon,
  const [study
  const [c

    ? contents.filter(c => c.t

  useEffect(() => {
      const index 
        setCurrentCo
    }

 

    if (currentContent && user) {
        log.userId === user.
        log.markedDone
      setIsCompleted(!!log)
  }, [currentContent, user, studyLogs])
  

      log.userId === user.id && log.contentId === curre

      // Update existing log
        currentLogs.map(log => 
            ? { ...log, markedDone: true 

    } else {
      const newLog:
        userId: user
        markedDone: true,
      }
    }
    set
  }
  const handleNextContent = () => {

      toast.success('Você completou todos os conteúdos!')
    }

    if (currentContentIndex > 0) {
    }

    if (!user) return { completed: 0, to
    const completedContents = stud
      log.markedDone &&
    ).length
    ret
      total: availableConte
    }


        <div className="flex items-ce
            <ArrowLeft className="w-4 h-

            <h1 className="text-3xl font-bold"
              {topic ? `${topic.name} - ` : ''}Nenhum conteúdo disp
     

          <CardContent
            <h3 className="f
              {topic 
                : 'Não há conte
            </p>
              <ArrowLeft className="w-4 h-
            </But
        <
    )


    <div className="space-y-6 ma
        <Button variant="outline" 
          Voltar
        <div className="flex-1">
          <p className="t
            Conteúdo {currentContentIndex +
       
          <Badge variant={isCompleted ? "secondary" : "outl
     

        </div>

   

            <span>{progress.percent
          <Progress value={progress.percentage} className="h-
      </Card>
      {/* Co
        <CardHeader>
            <d
     
   

              </div>
          </div>
            <div className="flex gap-1 flex-wr
     
   

        </CardHeader>
          {/* Media content */}
    
                <div className="relative">
                    src={current
                    con
                  />
            

            
                  <img 
                    alt={currentConten
                    style={{ maxHeight: '400px' }}
     
   

            </div>

          <div className="prose p
          </div>
          {/* Actions */}
            <Button 
              disa
            >
               
                  Estudado
              ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                
            </Bu
            <B

              
            </Button>

          <div className="flex justify-between items-center pt-4">
              variant="outline" 
              disable
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
            <sp
            </sp
            <Button 
            >
                <>
                  <Ar
              ) : (
              )
          </
     
  )



































































































































































