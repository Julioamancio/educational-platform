import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, Image, CheckCircle, AlertCircle, Plus } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import mammoth from 'mammoth'

interface ParsedQuestion {
  title: string
  stem: string
  options: {
    a: string
    b: string
    c: string
    d: string
    e: string
  }
  correctOption: string
  explanation: string
  images: string[]
  difficulty: string
}

interface WordImportProps {
  onQuestionsImported: (questions: ParsedQuestion[], topicId: string) => void
}

export default function WordImport({ onQuestionsImported }: WordImportProps) {
  const [topics] = useKV('topics', [])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([])
  const [processingStatus, setProcessingStatus] = useState('')

  const processWordDocument = useCallback(async (file: File): Promise<ParsedQuestion[]> => {
    setProcessingStatus('Reading document...')
    setProgress(10)

    try {
      const arrayBuffer = await file.arrayBuffer()
      
      setProcessingStatus('Extracting content...')
      setProgress(30)

      // Extract text and images from Word document
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const html = result.value
      const messages = result.messages

      setProcessingStatus('Processing content...')
      setProgress(50)

      // Parse the HTML content to extract questions
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Extract images
      const images = Array.from(doc.querySelectorAll('img')).map(img => img.src)
      
      setProcessingStatus('Analyzing question patterns...')
      setProgress(70)

      // Get text content and split into potential questions
      const textContent = doc.body.textContent || ''
      const questions = parseQuestionsFromText(textContent, images)

      setProcessingStatus('Finalizing...')
      setProgress(90)

      return questions
    } catch (error) {
      console.error('Error processing Word document:', error)
      throw new Error('Failed to process Word document')
    }
  }, [])

  const parseQuestionsFromText = (text: string, images: string[]): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = []
    
    // More comprehensive question splitting patterns
    const questionSeparators = [
      /(\d+\.\s*)/g, // "1. ", "2. "
      /(\bQuestion\s*\d+:?\s*)/gi, // "Question 1:", "Question 2"
      /(\bQuestão\s*\d+:?\s*)/gi, // "Questão 1:", "Questão 2"
      /(\bPergunta\s*\d+:?\s*)/gi, // "Pergunta 1:", "Pergunta 2"
      /(\n\s*\n)/g // Double line breaks
    ]
    
    // Try different splitting approaches
    let sections: string[] = []
    
    // First, try splitting by numbered questions
    sections = text.split(/(?=\d+\.\s)|(?=Question\s*\d+)|(?=Questão\s*\d+)/i)
      .filter(section => section.trim().length > 30)
    
    // If no good sections found, try paragraph splitting
    if (sections.length < 2) {
      sections = text.split(/\n\s*\n/)
        .filter(section => section.trim().length > 50)
    }
    
    // If still no sections, try by option patterns
    if (sections.length < 2) {
      sections = text.split(/(?=\s*[A-E][\)\.]?\s*[A-Z])/)
        .filter(section => {
          const hasOptions = /[A-E][\)\.]?\s/.test(section)
          return section.trim().length > 50 && hasOptions
        })
    }

    let imageIndex = 0

    sections.forEach((section, index) => {
      try {
        const questionData = parseIndividualQuestion(section.trim(), images.slice(imageIndex, imageIndex + 2))
        if (questionData) {
          questions.push({
            ...questionData,
            title: `Question ${questions.length + 1}`,
            difficulty: 'B1' // Default difficulty
          })
          
          // Assume max 2 images per question
          if (questionData.images.length > 0) {
            imageIndex += questionData.images.length
          }
        }
      } catch (error) {
        console.warn(`Failed to parse section ${index}:`, error)
      }
    })

    return questions
  }

  const parseIndividualQuestion = (section: string, availableImages: string[]): ParsedQuestion | null => {
    // Clean and normalize the text
    const cleanText = section.replace(/\s+/g, ' ').trim()
    
    // More comprehensive option detection patterns
    const optionPatterns = [
      /([A-E])[\)\.]?\s*([^A-E\(\)\n]*?)(?=[A-E][\)\.]|\n|$)/gi, // A) text B) text
      /\(([A-E])\)\s*([^A-E\(\)\n]*?)(?=\([A-E]\)|\n|$)/gi, // (A) text (B) text
      /([A-E])\s*[-–]\s*([^A-E\n]*?)(?=[A-E]\s*[-–]|\n|$)/gi, // A - text B - text
      /([A-E])\s*:\s*([^A-E\n]*?)(?=[A-E]\s*:|\n|$)/gi // A: text B: text
    ]
    
    let optionMatches: string[] = []
    let optionsData: { [key: string]: string } = {}
    
    // Try each pattern until we find options
    for (const pattern of optionPatterns) {
      const matches = Array.from(cleanText.matchAll(pattern))
      if (matches.length >= 3) {
        matches.forEach(match => {
          const letter = match[1].toLowerCase()
          const text = match[2].trim()
          if (text.length > 0 && ['a', 'b', 'c', 'd', 'e'].includes(letter)) {
            optionsData[letter] = text
          }
        })
        break
      }
    }
    
    // If no structured options found, try a more flexible approach
    if (Object.keys(optionsData).length < 3) {
      // Look for lines that start with letters
      const lines = cleanText.split(/\n/)
      const optionLines = lines.filter(line => 
        /^[A-E][\)\.\-:]?\s+/.test(line.trim())
      )
      
      optionLines.forEach(line => {
        const match = line.match(/^([A-E])[\)\.\-:]?\s+(.+)/)
        if (match) {
          const letter = match[1].toLowerCase()
          const text = match[2].trim()
          if (['a', 'b', 'c', 'd', 'e'].includes(letter)) {
            optionsData[letter] = text
          }
        }
      })
    }
    
    if (Object.keys(optionsData).length < 3) {
      return null // Need at least 3 options
    }

    // Extract the question stem
    const optionTexts = Object.values(optionsData).join('|')
    const optionRegex = new RegExp(`[A-E][\)\.\-:]?\\s*(?:${optionTexts.split('|')[0]})`, 'i')
    const firstOptionIndex = cleanText.search(optionRegex)
    
    let stem = ''
    if (firstOptionIndex !== -1) {
      stem = cleanText.substring(0, firstOptionIndex).trim()
    } else {
      // Fallback: take first part of text
      const firstLine = cleanText.split('\n')[0]
      stem = firstLine.length > 20 ? firstLine : cleanText.substring(0, 200)
    }
    
    // Clean up the stem
    stem = stem.replace(/^\d+\.\s*/, '') // Remove leading numbers
             .replace(/^Question\s*\d*:?\s*/i, '') // Remove "Question N:"
             .replace(/^Questão\s*\d*:?\s*/i, '') // Remove "Questão N:"
             .trim()
    
    if (stem.length < 10) return null // Question too short

    // Build options object
    const options = { 
      a: optionsData.a || '', 
      b: optionsData.b || '', 
      c: optionsData.c || '', 
      d: optionsData.d || '', 
      e: optionsData.e || '' 
    }

    // Enhanced answer detection patterns
    const answerPatterns = [
      /(?:answer|resposta|gabarito)[\s:]*([A-E])/i,
      /(?:correct|correta|correto)[\s:]*(?:option|opção)?[\s:]*([A-E])/i,
      /([A-E])[\s\-]*(?:correct|correta|correto)/i,
      /\*([A-E])\*/, // Marked with asterisks
      /\b([A-E])\s*✓/, // Marked with checkmark
      /\b([A-E])\s*\(correct\)/i,
      /\b([A-E])\s*\(correta\)/i,
      /(?:key|chave)[\s:]*([A-E])/i,
      /(?:solution|solução)[\s:]*([A-E])/i
    ]

    let correctOption = 'a' // Default
    for (const pattern of answerPatterns) {
      const match = cleanText.match(pattern)
      if (match && match[1]) {
        correctOption = match[1].toLowerCase()
        if (['a', 'b', 'c', 'd', 'e'].includes(correctOption)) {
          break
        }
      }
    }

    // Enhanced explanation detection
    const explanationPatterns = [
      /(?:explanation|explicação|comentário)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\n\n|$)/is,
      /(?:justificativa|resolução|solution)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\n\n|$)/is,
      /(?:rationale|reasoning)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\n\n|$)/is,
      /(?:because|porque)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\n\n|$)/is
    ]

    let explanation = ''
    for (const pattern of explanationPatterns) {
      const match = cleanText.match(pattern)
      if (match && match[1]) {
        explanation = match[1].trim()
        // Clean up the explanation
        explanation = explanation.replace(/^\W+/, '').replace(/\W+$/, '')
        if (explanation.length > 10) {
          break
        }
      }
    }

    return {
      title: '',
      stem,
      options,
      correctOption,
      explanation,
      images: availableImages.slice(0, 2), // Max 2 images per question
      difficulty: 'B1'
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.includes('wordprocessingml') || file.name.endsWith('.docx')) {
        setSelectedFile(file)
      } else {
        toast.error('Please select a valid Word document (.docx)')
      }
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !selectedTopic) {
      toast.error('Please select a file and topic')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const questions = await processWordDocument(selectedFile)
      
      if (questions.length === 0) {
        toast.error('No questions found in the document')
        return
      }

      setParsedQuestions(questions)
      setProgress(100)
      toast.success(`Successfully parsed ${questions.length} question(s)`)
      
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import questions from document')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmImport = () => {
    if (parsedQuestions.length > 0 && selectedTopic) {
      onQuestionsImported(parsedQuestions, selectedTopic)
      setIsOpen(false)
      setParsedQuestions([])
      setSelectedFile(null)
      setSelectedTopic('')
      setProgress(0)
      toast.success('Questions imported successfully!')
    }
  }

  const resetImport = () => {
    setSelectedFile(null)
    setSelectedTopic('')
    setParsedQuestions([])
    setProgress(0)
    setIsProcessing(false)
    setProcessingStatus('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import from Word
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Questions from Word Document
          </DialogTitle>
          <DialogDescription>
            Upload a Word document (.docx) containing questions with multiple choice options.
            The system will automatically detect questions and extract images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Select Word Document</Label>
              <div className="flex items-center gap-4">
                <input
                  id="file-upload"
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </Button>
                {selectedFile && (
                  <Badge variant="outline" className="px-3">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic for the imported questions" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic: any) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Processing Section */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">{processingStatus}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Parsed Questions Preview */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">
                  Found {parsedQuestions.length} Question(s)
                </h4>
                <Badge variant="outline">
                  Ready to import
                </Badge>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Questions parsed successfully! Review them below and click "Import Questions" to add them to your database.
                </AlertDescription>
              </Alert>

              <div className="max-h-96 overflow-y-auto space-y-4">
                {parsedQuestions.map((question, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Question {index + 1}
                        {question.images.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            <Image className="h-3 w-3 mr-1" />
                            {question.images.length} image(s)
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Question:</p>
                        <p className="text-sm">{question.stem.substring(0, 200)}...</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Options:</p>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {Object.entries(question.options).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <Badge 
                                variant={key === question.correctOption ? "default" : "outline"}
                                className="w-6 h-6 p-0 text-xs"
                              >
                                {key.toUpperCase()}
                              </Badge>
                              <span className={key === question.correctOption ? "font-medium" : ""}>
                                {value.substring(0, 100)}{value.length > 100 ? '...' : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {question.explanation && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Explanation:</p>
                          <p className="text-xs text-muted-foreground">
                            {question.explanation.substring(0, 150)}...
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Document Format Tips:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Questions should be numbered or clearly separated</li>
                <li>Use A), B), C), D), E) or (A), (B), (C), (D), (E) for options</li>
                <li>Mark correct answers with "Answer: A" or "Correct: A"</li>
                <li>Include explanations with "Explanation:" or "Comentário:"</li>
                <li>Images will be extracted automatically</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={resetImport}>
            Reset
          </Button>
          {parsedQuestions.length > 0 ? (
            <Button onClick={handleConfirmImport}>
              <Plus className="h-4 w-4 mr-2" />
              Import {parsedQuestions.length} Question(s)
            </Button>
          ) : (
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile || !selectedTopic || isProcessing}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Parse Document'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}