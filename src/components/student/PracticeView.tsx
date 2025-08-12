import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Topic, Question, Attempt } from '@/types'
import { Brain, CheckCircle, X, ArrowLeft, ArrowRight, RotateCcw, Target, Lightbulb } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface PracticeViewProps {
  topicId?: string
  onBack: () => void
}

export default function PracticeView({ topicId, onBack }: PracticeViewProps) {
  const { user } = useAuth()
  const [topics] = useKV<Topic[]>('topics', [])
  const [questions] = useKV<Question[]>('questions', [])
  const [attempts, setAttempts] = useKV<Attempt[]>('attempts', [])
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())

  const availableQuestions = topicId 
    ? questions.filter(q => q.topicId === topicId && q.isPublished)
    : questions.filter(q => q.isPublished)

  const currentQuestion = availableQuestions[currentQuestionIndex]
  const topic = topics.find(t => t.id === topicId)

  useEffect(() => {
    setStartTime(Date.now())
    setSelectedOption('')
    setShowResult(false)
  }, [currentQuestionIndex])

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion || !user) return

    const correct = selectedOption === currentQuestion.correctOption
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    
    const attempt: Attempt = {
      id: Date.now().toString(),
      userId: user.id,
      questionId: currentQuestion.id,
      chosenOption: selectedOption as 'A' | 'B' | 'C' | 'D' | 'E',
      isCorrect: correct,
      timeSpentSec: timeSpent,
      createdAt: new Date().toISOString()
    }

    setAttempts(currentAttempts => [...currentAttempts, attempt])
    setIsCorrect(correct)
    setShowResult(true)
    
    if (correct) {
      toast.success('Correct! Well done!')
    } else {
      toast.error('Incorrect. Check the explanation below.')
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < availableQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      toast.success('Practice session complete!')
      onBack()
    }
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setSelectedOption('')
    setShowResult(false)
    setStartTime(Date.now())
  }

  if (availableQuestions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Practice Questions</h1>
            <p className="text-muted-foreground">
              {topic ? `${topic.name} - ` : ''}No questions available
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QuestionIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No questions available</h3>
            <p className="text-muted-foreground text-center mb-4">
              {topic 
                ? `There are no published questions for ${topic.name} yet.`
                : 'There are no published questions available yet.'
              }
            </p>
            <Button onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Practice Questions</h1>
          <p className="text-muted-foreground">
            {topic ? `${topic.name} - ` : ''}
            Question {currentQuestionIndex + 1} of {availableQuestions.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>
          <Badge variant="outline">
            {currentQuestion?.difficulty}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QuestionIcon className="w-5 h-5 text-primary" />
            {currentQuestion?.title}
          </CardTitle>
          {currentQuestion?.tags && currentQuestion.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {currentQuestion.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg">
            <div dangerouslySetInnerHTML={{ __html: currentQuestion?.stemHtml || '' }} />
          </div>

          {/* Display question media if available */}
          {currentQuestion?.mediaUrls && currentQuestion.mediaUrls.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.mediaUrls.map((url, index) => (
                  <div key={index} className="relative">
                    {url.includes('video') || url.includes('.mp4') || url.includes('.webm') ? (
                      <video 
                        src={url} 
                        className="w-full rounded-lg border"
                        controls
                        style={{ maxHeight: '300px' }}
                      />
                    ) : (
                      <img 
                        src={url} 
                        alt={`Question media ${index + 1}`}
                        className="w-full rounded-lg border object-cover"
                        style={{ maxHeight: '300px' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {['A', 'B', 'C', 'D', 'E'].map((option) => {
              const optionText = currentQuestion?.[`option${option}` as keyof Question] as string
              if (!optionText) return null

              const isSelected = selectedOption === option
              const isCorrectOption = currentQuestion?.correctOption === option
              const showCorrectAnswer = showResult && isCorrectOption
              const showIncorrectAnswer = showResult && isSelected && !isCorrectOption

              return (
                <div
                  key={option}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    showCorrectAnswer
                      ? 'border-secondary bg-secondary/20'
                      : showIncorrectAnswer
                      ? 'border-destructive bg-destructive/20'
                      : isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  } ${showResult ? 'cursor-default' : ''}`}
                  onClick={() => !showResult && setSelectedOption(option)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      showCorrectAnswer
                        ? 'border-secondary bg-secondary text-secondary-foreground'
                        : showIncorrectAnswer
                        ? 'border-destructive bg-destructive text-destructive-foreground'
                        : isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}>
                      {option}
                    </div>
                    <span className="flex-1">{optionText}</span>
                    {showCorrectAnswer && <CheckCircle className="w-5 h-5 text-secondary" />}
                    {showIncorrectAnswer && <X className="w-5 h-5 text-destructive" />}
                  </div>
                </div>
              )
            })}
          </div>

          {!showResult && (
            <Button 
              onClick={handleSubmitAnswer} 
              disabled={!selectedOption}
              className="w-full"
            >
              Submit Answer
            </Button>
          )}

          {showResult && (
            <div className="space-y-4">
              <Alert className={isCorrect ? 'border-secondary' : 'border-destructive'}>
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-secondary" />
                  ) : (
                    <X className="w-5 h-5 text-destructive" />
                  )}
                  <AlertDescription className="font-medium">
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </AlertDescription>
                </div>
              </Alert>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Explanation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div dangerouslySetInnerHTML={{ __html: currentQuestion?.commentHtml || '' }} />
                </CardContent>
              </Card>

              <Button onClick={handleNextQuestion} className="w-full">
                {currentQuestionIndex < availableQuestions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'Finish Practice'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}