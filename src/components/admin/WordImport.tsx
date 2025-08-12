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
  images: string[] // Base64 or URL strings
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
      
      setProcessingStatus('Extracting content with images...')
      setProgress(30)

      // Configure mammoth to extract images as base64
      const result = await mammoth.convertToHtml({ 
        arrayBuffer,
        convertImage: mammoth.images.imgElement(function(image) {
          return image.read("base64").then(function(imageBuffer) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            }
          })
        })
      })
      
      const html = result.value
      const messages = result.messages

      setProcessingStatus('Processing HTML content...')
      setProgress(50)

      // Parse the HTML content to extract questions with preserved formatting
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Extract images with better handling
      const images = Array.from(doc.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt || '',
        title: img.title || ''
      }))
      
      setProcessingStatus('Analyzing question patterns...')
      setProgress(70)

      // Use both HTML and text for better parsing
      const questions = parseQuestionsFromHTML(doc, images)

      setProcessingStatus('Finalizing...')
      setProgress(90)

      return questions
    } catch (error) {
      console.error('Error processing Word document:', error)
      throw new Error('Failed to process Word document: ' + error.message)
    }
  }, [])

  const parseQuestionsFromHTML = (doc: Document, images: any[]): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = []
    
    // Get both HTML structure and text content
    const htmlContent = doc.body.innerHTML
    const textContent = doc.body.textContent || ''
    
    // Enhanced question detection - look for various patterns
    const questionMarkers = [
      /(\d+[\.\)])\s*([^]*?)(?=\d+[\.\)]|$)/g, // 1. question content 2. question content
      /(Question\s*\d+:?)\s*([^]*?)(?=Question\s*\d+|$)/gi, // Question 1: content Question 2: content
      /(Questão\s*\d+:?)\s*([^]*?)(?=Questão\s*\d+|$)/gi, // Questão 1: content Questão 2: content
      /(<p[^>]*>.*?<\/p>(?:\s*<p[^>]*>.*?<\/p>)*)/gi // Paragraph groups
    ]
    
    let questionSections: string[] = []
    
    // Try numbered question pattern first
    const numberedMatches = Array.from(textContent.matchAll(/(\d+[\.\)])\s*([^]*?)(?=\d+[\.\)]|$)/g))
    if (numberedMatches.length >= 2) {
      questionSections = numberedMatches.map(match => match[0])
    } else {
      // Try question keyword pattern
      const keywordMatches = Array.from(textContent.matchAll(/((?:Question|Questão)\s*\d+:?)\s*([^]*?)(?=(?:Question|Questão)\s*\d+|$)/gi))
      if (keywordMatches.length >= 2) {
        questionSections = keywordMatches.map(match => match[0])
      } else {
        // Fall back to paragraph splitting with option detection
        const paragraphs = textContent.split(/\n\s*\n/)
        const questionsFound: string[] = []
        let currentQuestion = ''
        
        for (const paragraph of paragraphs) {
          const hasOptions = /[A-E][\)\.\-:]?\s+[^\n]*/.test(paragraph)
          const hasQuestionNumber = /^\d+[\.\)]/.test(paragraph.trim())
          
          if (hasQuestionNumber || (currentQuestion && hasOptions)) {
            if (currentQuestion) {
              questionsFound.push(currentQuestion)
            }
            currentQuestion = paragraph
          } else if (currentQuestion) {
            currentQuestion += '\n\n' + paragraph
          }
        }
        
        if (currentQuestion) {
          questionsFound.push(currentQuestion)
        }
        
        questionSections = questionsFound.filter(q => q.trim().length > 50)
      }
    }

    // If still no sections found, try a more aggressive approach
    if (questionSections.length === 0) {
      // Look for any text blocks with options
      const textBlocks = textContent.split(/\n\s*\n/)
      questionSections = textBlocks.filter(block => {
        const hasMultipleOptions = (block.match(/[A-E][\)\.\-:]?\s+/g) || []).length >= 3
        return block.trim().length > 100 && hasMultipleOptions
      })
    }

    let imageIndex = 0

    questionSections.forEach((section, index) => {
      try {
        // Find images that might belong to this question
        const sectionImages = images.slice(imageIndex, imageIndex + 3) // Max 3 images per question
        
        const questionData = parseIndividualQuestionEnhanced(section.trim(), sectionImages)
        if (questionData && Object.values(questionData.options).filter(opt => opt.trim()).length >= 3) {
          questions.push({
            ...questionData,
            title: `Question ${questions.length + 1}`,
            difficulty: 'B1'
          })
          
          // Advance image index based on detected images
          if (questionData.images.length > 0) {
            imageIndex += questionData.images.length
          } else {
            imageIndex += 1 // Assume one image per question if none detected
          }
        }
      } catch (error) {
        console.warn(`Failed to parse section ${index}:`, error)
      }
    })

    return questions
  }

  const parseIndividualQuestionEnhanced = (section: string, availableImages: any[]): ParsedQuestion | null => {
    // Clean and normalize the text
    const cleanText = section.replace(/\s+/g, ' ').trim()
    
    // Enhanced option detection with comprehensive patterns
    const optionPatterns = [
      // Standard formats: A) text B) text
      /([A-E])[\)\.]?\s*([^A-E\(\)\n]*?)(?=\s*[A-E][\)\.]|\n\s*[A-E][\)\.]|$)/gi,
      // Parenthesis format: (A) text (B) text  
      /\(([A-E])\)\s*([^A-E\(\)\n]*?)(?=\s*\([A-E]\)|\n\s*\([A-E]\)|$)/gi,
      // Dash format: A - text B - text
      /([A-E])\s*[-–]\s*([^A-E\n]*?)(?=\s*[A-E]\s*[-–]|\n\s*[A-E]\s*[-–]|$)/gi,
      // Colon format: A: text B: text
      /([A-E])\s*:\s*([^A-E\n]*?)(?=\s*[A-E]\s*:|\n\s*[A-E]\s*:|$)/gi,
      // Dot format: A. text B. text
      /([A-E])\.\s*([^A-E\n]*?)(?=\s*[A-E]\.|\n\s*[A-E]\.|$)/gi
    ]
    
    let optionsData: { [key: string]: string } = {}
    let bestPatternMatches = 0
    let usedPattern = ''
    
    // Try each pattern and use the one with most matches
    for (let i = 0; i < optionPatterns.length; i++) {
      const pattern = optionPatterns[i]
      const matches = Array.from(cleanText.matchAll(pattern))
      
      if (matches.length > bestPatternMatches) {
        bestPatternMatches = matches.length
        optionsData = {}
        usedPattern = `Pattern ${i + 1}`
        
        matches.forEach(match => {
          const letter = match[1].toLowerCase()
          const text = match[2].trim()
          if (text.length > 0 && ['a', 'b', 'c', 'd', 'e'].includes(letter)) {
            // Clean the option text thoroughly
            const cleanOptionText = text
              .replace(/^\W+/, '')  // Remove leading punctuation
              .replace(/\W+$/, '')  // Remove trailing punctuation
              .replace(/\s+/g, ' ') // Normalize whitespace
              .replace(/\n/g, ' ')  // Replace newlines with spaces
              .trim()
            
            if (cleanOptionText.length > 0) {
              optionsData[letter] = cleanOptionText
            }
          }
        })
      }
    }
    
    // If still no good options found, try line-by-line approach
    if (Object.keys(optionsData).length < 3) {
      const lines = cleanText.split(/\n/)
      
      lines.forEach(line => {
        const trimmedLine = line.trim()
        // Look for lines starting with A-E followed by various separators
        const linePatterns = [
          /^([A-E])[\)\.\-:\s]+(.+)/,
          /^\(([A-E])\)\s*(.+)/,
          /^([A-E])\s*[-–]\s*(.+)/,
          /^([A-E])\s*:\s*(.+)/
        ]
        
        for (const linePattern of linePatterns) {
          const lineMatch = trimmedLine.match(linePattern)
          if (lineMatch) {
            const letter = lineMatch[1].toLowerCase()
            const text = lineMatch[2].trim()
            if (['a', 'b', 'c', 'd', 'e'].includes(letter) && text.length > 0) {
              optionsData[letter] = text
              break
            }
          }
        }
      })
      usedPattern = 'Line-by-line parsing'
    }
    
    // Enhanced fallback: look for any text after letters A-E
    if (Object.keys(optionsData).length < 3) {
      // Split text and look for patterns like "A something B something"
      const words = cleanText.split(/\s+/)
      let currentLetter = ''
      let currentText = ''
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        
        // Check if this word is a letter A-E (possibly with punctuation)
        const letterMatch = word.match(/^([A-E])[\)\.\-:]?$/)
        if (letterMatch) {
          // Save previous option if exists
          if (currentLetter && currentText.trim()) {
            optionsData[currentLetter.toLowerCase()] = currentText.trim()
          }
          
          currentLetter = letterMatch[1]
          currentText = ''
        } else if (currentLetter) {
          // Add to current option text
          currentText += (currentText ? ' ' : '') + word
          
          // If we hit another letter pattern, finalize current option
          const nextLetterMatch = word.match(/([A-E])[\)\.\-:]?/)
          if (nextLetterMatch && nextLetterMatch[1] !== currentLetter) {
            // Remove the letter from the current text
            currentText = currentText.replace(new RegExp(`\\s*${nextLetterMatch[0]}\\s*$`), '')
            if (currentText.trim()) {
              optionsData[currentLetter.toLowerCase()] = currentText.trim()
            }
            currentLetter = nextLetterMatch[1]
            currentText = ''
          }
        }
      }
      
      // Don't forget the last option
      if (currentLetter && currentText.trim()) {
        optionsData[currentLetter.toLowerCase()] = currentText.trim()
      }
      
      if (Object.keys(optionsData).length >= 3) {
        usedPattern = 'Word-by-word parsing'
      }
    }
    
    // Require at least 3 options to consider it a valid question
    const validOptions = Object.keys(optionsData).filter(key => optionsData[key].trim().length > 0)
    if (validOptions.length < 3) {
      console.warn('Insufficient valid options found:', validOptions.length, optionsData, 'Used pattern:', usedPattern)
      return null
    }

    // Extract the question stem - everything before the first option
    const optionKeys = Object.keys(optionsData).sort()
    const firstOptionKey = optionKeys[0].toUpperCase()
    const firstOptionText = optionsData[optionKeys[0]]
    
    // Find where options start in the text with multiple approaches
    const optionStartPatterns = [
      new RegExp(`${firstOptionKey}[\\)\\.]?\\s*${firstOptionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 15)}`, 'i'),
      new RegExp(`\\(${firstOptionKey}\\)\\s*${firstOptionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 15)}`, 'i'),
      new RegExp(`${firstOptionKey}\\s*[-–:]\\s*${firstOptionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 15)}`, 'i'),
      new RegExp(`${firstOptionKey}[\\)\\.]?\\s`, 'i'), // Fallback: just the letter
    ]
    
    let stem = ''
    let stemFound = false
    
    for (const pattern of optionStartPatterns) {
      const match = cleanText.search(pattern)
      if (match !== -1) {
        stem = cleanText.substring(0, match).trim()
        stemFound = true
        break
      }
    }
    
    if (!stemFound) {
      // Ultimate fallback: take everything before the first occurrence of any option letter
      for (const letter of ['A', 'B', 'C', 'D', 'E']) {
        const letterIndex = cleanText.indexOf(letter)
        if (letterIndex !== -1) {
          stem = cleanText.substring(0, letterIndex).trim()
          break
        }
      }
    }
    
    // Clean up the stem thoroughly
    stem = stem
      .replace(/^\d+[\.\)]\s*/, '') // Remove leading numbers
      .replace(/^Question\s*\d*:?\s*/i, '') // Remove "Question N:"
      .replace(/^Questão\s*\d*:?\s*/i, '') // Remove "Questão N:"
      .replace(/^Pergunta\s*\d*:?\s*/i, '') // Remove "Pergunta N:"
      .replace(/^Q\d*[\.\):\s]+/i, '') // Remove "Q1.", "Q1)", etc.
      .trim()
    
    if (stem.length < 5) {
      console.warn('Question stem too short:', stem.length, stem)
      return null
    }

    // Ensure all 5 options exist (fill missing ones with empty strings)
    const options = { 
      a: (optionsData.a || '').substring(0, 500), // Limit option length
      b: (optionsData.b || '').substring(0, 500), 
      c: (optionsData.c || '').substring(0, 500), 
      d: (optionsData.d || '').substring(0, 500), 
      e: (optionsData.e || '').substring(0, 500)
    }

    // Enhanced answer detection with more patterns
    const answerPatterns = [
      /(?:answer|resposta|gabarito)[\s:]*([A-E])/i,
      /(?:correct|correta|correto)[\s:]*(?:option|opção)?[\s:]*([A-E])/i,
      /([A-E])[\s\-]*(?:correct|correta|correto|certa)/i,
      /\*([A-E])\*/, // Marked with asterisks
      /\b([A-E])\s*✓/, // Marked with checkmark
      /\b([A-E])\s*\(correct\)/i,
      /\b([A-E])\s*\(correta\)/i,
      /(?:key|chave)[\s:]*([A-E])/i,
      /(?:solution|solução)[\s:]*([A-E])/i,
      /(?:letra|letter)[\s:]*([A-E])/i,
      /(?:alternativa|alternative)[\s:]*([A-E])/i,
      /(?:opção|option)[\s:]*([A-E])/i
    ]

    let correctOption = 'a' // Default to A if no answer found
    for (const pattern of answerPatterns) {
      const match = cleanText.match(pattern)
      if (match && match[1]) {
        const foundOption = match[1].toLowerCase()
        if (['a', 'b', 'c', 'd', 'e'].includes(foundOption)) {
          correctOption = foundOption
          break
        }
      }
    }

    // Enhanced explanation detection
    const explanationPatterns = [
      /(?:explanation|explicação|comentário)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\nQuestion|\nQuestão|\n\n|$)/is,
      /(?:justificativa|resolução|solution)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\nQuestion|\nQuestão|\n\n|$)/is,
      /(?:rationale|reasoning|fundamentação)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\nQuestion|\nQuestão|\n\n|$)/is,
      /(?:because|porque|pois)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\nQuestion|\nQuestão|\n\n|$)/is,
      /(?:resposta|answer)[\s:]*[A-E][\s\.\-]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\nQuestion|\nQuestão|\n\n|$)/is,
      /(?:comentário|comment)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\nQuestion|\nQuestão|\n\n|$)/is
    ]

    let explanation = ''
    for (const pattern of explanationPatterns) {
      const match = cleanText.match(pattern)
      if (match && match[1]) {
        explanation = match[1].trim()
        // Clean up the explanation
        explanation = explanation
          .replace(/^\W+/, '')
          .replace(/\W+$/, '')
          .replace(/\s+/g, ' ')
          .substring(0, 1000) // Limit explanation length
        
        if (explanation.length > 10) { // Minimum explanation length
          break
        }
      }
    }

    // Process images - convert to base64 if needed
    const processedImages: string[] = []
    availableImages.forEach(img => {
      if (img.src) {
        processedImages.push(img.src)
      }
    })

    console.log('Parsed question:', {
      stem: stem.substring(0, 50) + '...',
      optionsCount: validOptions.length,
      correctOption,
      hasExplanation: !!explanation,
      usedPattern,
      imageCount: processedImages.length
    })

    return {
      title: '',
      stem,
      options,
      correctOption,
      explanation,
      images: processedImages.slice(0, 3), // Max 3 images per question
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
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Question {index + 1}</span>
                        <div className="flex items-center gap-2">
                          {question.images.length > 0 && (
                            <Badge variant="secondary">
                              <Image className="h-3 w-3 mr-1" />
                              {question.images.length} image(s)
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {question.correctOption.toUpperCase()}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Question:</p>
                        <p className="text-sm">{question.stem.substring(0, 150)}{question.stem.length > 150 ? '...' : ''}</p>
                      </div>
                      
                      {/* Show images if any */}
                      {question.images.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Images:</p>
                          <div className="flex gap-2 flex-wrap">
                            {question.images.map((img, imgIndex) => (
                              <div key={imgIndex} className="w-16 h-16 border rounded overflow-hidden">
                                <img 
                                  src={img} 
                                  alt={`Question ${index + 1} image ${imgIndex + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Options:</p>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          {Object.entries(question.options).map(([key, value]) => (
                            value.trim() && (
                              <div key={key} className="flex items-start gap-2">
                                <Badge 
                                  variant={key === question.correctOption ? "default" : "outline"}
                                  className="w-6 h-6 p-0 text-xs flex-shrink-0 mt-0.5"
                                >
                                  {key.toUpperCase()}
                                </Badge>
                                <span className={`flex-1 ${key === question.correctOption ? "font-medium" : ""}`}>
                                  {value.substring(0, 80)}{value.length > 80 ? '...' : ''}
                                </span>
                              </div>
                            )
                          ))}
                        </div>
                        
                        {/* Show count of filled options */}
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {Object.values(question.options).filter(opt => opt.trim()).length}/5 options filled
                          </Badge>
                        </div>
                      </div>

                      {question.explanation && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Explanation:</p>
                          <p className="text-xs text-muted-foreground">
                            {question.explanation.substring(0, 100)}{question.explanation.length > 100 ? '...' : ''}
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
              <strong>Document Format Requirements:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Questions:</strong> Number them (1., 2.) or use "Question 1:", "Questão 1:"</li>
                <li><strong>Options:</strong> Format as A) text, B) text or (A) text, (B) text</li>
                <li><strong>Alternative formats:</strong> A: text, A - text, or A. text</li>
                <li><strong>Answers:</strong> Mark with "Answer: A", "Correct: A", "Resposta: A", or use *A*</li>
                <li><strong>Explanations:</strong> Start with "Explanation:", "Comentário:", "Justificativa:"</li>
                <li><strong>Images:</strong> Will be automatically extracted and converted to base64</li>
                <li><strong>Minimum:</strong> Each question needs at least 3 options (A, B, C)</li>
                <li><strong>Language:</strong> Supports both English and Portuguese</li>
              </ul>
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <strong>Example format:</strong><br/>
                1. What is the capital of Brazil?<br/>
                A) São Paulo<br/>
                B) Rio de Janeiro<br/>
                C) Brasília<br/>
                D) Salvador<br/>
                Answer: C<br/>
                Explanation: Brasília is the federal capital of Brazil.
              </div>
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