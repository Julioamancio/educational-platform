import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, Eye, CheckCircle, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useKV } from '@github/spark/hooks'

interface ParsedQuestion {
  id: string
  title: string
  stem: string
  options: {
    A: string
    B: string
    C: string
    D: string
    E: string
  }
  correctAnswer: string
  explanation?: string
  difficulty: string
  tags: string[]
  images: string[]
}

interface WordImportProps {
  onQuestionsImported: (questions: ParsedQuestion[]) => void
}

export default function WordImport({ onQuestionsImported }: WordImportProps) {
  const [topics] = useKV<any[]>('topics', [])
  const [importing, setImporting] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse Word document content
  const parseWordDocument = async (file: File): Promise<ParsedQuestion[]> => {
    try {
      if (file.name.endsWith('.docx')) {
        // Dynamically import mammoth to handle parsing
        const mammothModule = await import('mammoth')
        const mammoth = mammothModule.default || mammothModule
        
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const text = result.value
        
        // Also extract images if any
        const imageResult = await mammoth.convertToHtml({ arrayBuffer })
        const images = extractImagesFromHtml(imageResult.value)
        
        return parseTextToQuestions(text, images)
      } else {
        // For .doc and .txt files, read as text
        const text = await readFileAsText(file)
        return parseTextToQuestions(text)
      }
    } catch (error) {
      console.error('Error parsing document:', error)
      throw new Error('Failed to parse Word document. Please check the file format.')
    }
  }

  const extractImagesFromHtml = (html: string): string[] => {
    const imageUrls: string[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const images = doc.querySelectorAll('img')
    
    images.forEach(img => {
      if (img.src && img.src.startsWith('data:')) {
        imageUrls.push(img.src)
      }
    })
    
    return imageUrls
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      
      // For .docx files, this is simplified - in reality you'd need mammoth.js
      if (file.name.endsWith('.docx')) {
        // Simulate Word document content
        resolve(`
1. What is the capital of France?
A) London
B) Paris
C) Madrid
D) Rome
E) Berlin

Correct Answer: B
Explanation: Paris is the capital and largest city of France.
Difficulty: A1
Tags: geography, capitals

2. Which planet is closest to the Sun?
A) Venus
B) Earth
C) Mercury
D) Mars
E) Jupiter

Correct Answer: C
Explanation: Mercury is the smallest planet in our solar system and the closest to the Sun.
Difficulty: A2
Tags: astronomy, solar system

3. What is 15 + 27?
A) 40
B) 41
C) 42
D) 43
E) 44

Correct Answer: C
Explanation: 15 + 27 = 42. This is basic addition.
Difficulty: A1
Tags: mathematics, arithmetic
        `)
      } else {
        reader.readAsText(file)
      }
    })
  }

  const parseTextToQuestions = (text: string, images: string[] = []): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = []
    const questionBlocks = text.split(/(?=\d+\.)/).filter(block => block.trim())

    questionBlocks.forEach((block, index) => {
      const lines = block.split('\n').filter(line => line.trim())
      if (lines.length < 7) return // Need at least question + 5 options + answer

      const questionMatch = lines[0].match(/^\d+\.\s*(.+)/)
      if (!questionMatch) return

      const title = questionMatch[1].trim()
      const stem = title

      // Extract options
      const options = { A: '', B: '', C: '', D: '', E: '' }
      const optionLetters = ['A', 'B', 'C', 'D', 'E'] as const
      
      let optionIndex = 0
      let correctAnswer = ''
      let explanation = ''
      let difficulty = 'A1'
      let tags: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Parse options
        const optionMatch = line.match(/^([A-E])\)\s*(.+)/)
        if (optionMatch && optionIndex < 5) {
          const letter = optionMatch[1] as keyof typeof options
          options[letter] = optionMatch[2].trim()
          optionIndex++
          continue
        }

        // Parse correct answer
        const answerMatch = line.match(/^Correct Answer:\s*([A-E])/)
        if (answerMatch) {
          correctAnswer = answerMatch[1]
          continue
        }

        // Parse explanation
        const explanationMatch = line.match(/^Explanation:\s*(.+)/)
        if (explanationMatch) {
          explanation = explanationMatch[1]
          continue
        }

        // Parse difficulty
        const difficultyMatch = line.match(/^Difficulty:\s*(.+)/)
        if (difficultyMatch) {
          difficulty = difficultyMatch[1].trim()
          continue
        }

        // Parse tags
        const tagsMatch = line.match(/^Tags:\s*(.+)/)
        if (tagsMatch) {
          tags = tagsMatch[1].split(',').map(tag => tag.trim())
          continue
        }
      }

      if (correctAnswer && Object.values(options).some(opt => opt)) {
        questions.push({
          id: `imported-${Date.now()}-${index}`,
          title,
          stem,
          options,
          correctAnswer,
          explanation,
          difficulty,
          tags,
          images: images.slice(index, index + 1) // Assign one image per question if available
        })
      }
    })

    return questions
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(doc|docx|txt)$/i)) {
      toast.error('Please select a Word document (.doc, .docx) or text file')
      return
    }

    setImporting(true)
    try {
      const questions = await parseWordDocument(file)
      
      if (questions.length === 0) {
        toast.error('No questions were found in the document. Please check the format.')
        return
      }

      setParsedQuestions(questions)
      setPreviewMode(true)
      
      // Show detailed import summary
      const questionsWithAnswers = questions.filter(q => q.correctAnswer)
      const questionsWithImages = questions.filter(q => q.images.length > 0)
      
      toast.success(
        `Successfully detected ${questions.length} question(s):\n` +
        `• ${questionsWithAnswers.length} with answers\n` +
        `• ${questionsWithImages.length} with images\n` +
        `Ready for review and import!`,
        { duration: 5000 }
      )
    } catch (error) {
      toast.error('Failed to import questions from document: ' + (error as Error).message)
      console.error('Import error:', error)
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImportQuestions = () => {
    if (!selectedTopic) {
      toast.error('Please select a topic for the imported questions')
      return
    }

    const questionsWithTopic = parsedQuestions.map(q => ({
      ...q,
      topicId: selectedTopic
    }))

    onQuestionsImported(questionsWithTopic)
    setParsedQuestions([])
    setPreviewMode(false)
    setSelectedTopic('')
    
    toast.success(`${questionsWithTopic.length} questions imported successfully`)
  }

  const editQuestion = (index: number, field: string, value: any) => {
    setParsedQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ))
  }

  if (previewMode && parsedQuestions.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye size={20} />
            Preview Imported Questions ({parsedQuestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="topic-select">Assign to Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setParsedQuestions([])
                  setPreviewMode(false)
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImportQuestions}
                disabled={!selectedTopic}
              >
                Import {parsedQuestions.length} Questions
              </Button>
            </div>
          </div>

          {/* Import Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{parsedQuestions.length}</div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{parsedQuestions.filter(q => q.correctAnswer).length}</div>
              <div className="text-sm text-muted-foreground">With Answers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{parsedQuestions.filter(q => q.images.length > 0).length}</div>
              <div className="text-sm text-muted-foreground">With Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{parsedQuestions.filter(q => q.explanation).length}</div>
              <div className="text-sm text-muted-foreground">With Explanations</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            {parsedQuestions.map((question, index) => (
              <Card key={question.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Label>Question {index + 1}</Label>
                      <Textarea
                        value={question.stem}
                        onChange={(e) => editQuestion(index, 'stem', e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Badge variant="secondary">{question.difficulty}</Badge>
                      {question.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Display question images if any */}
                  {question.images && question.images.length > 0 && (
                    <div>
                      <Label>Images</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                        {question.images.map((image, imgIndex) => (
                          <div key={imgIndex} className="relative">
                            <img 
                              src={image} 
                              alt={`Question ${index + 1} image ${imgIndex + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(question.options).map(([letter, option]) => (
                      <div key={letter} className="flex items-center gap-2">
                        <Label className="w-6 font-mono">{letter})</Label>
                        <Input
                          value={option}
                          onChange={(e) => editQuestion(index, 'options', {
                            ...question.options,
                            [letter]: e.target.value
                          })}
                          className={
                            question.correctAnswer === letter 
                              ? 'border-green-500 bg-green-50' 
                              : ''
                          }
                        />
                        {question.correctAnswer === letter && (
                          <CheckCircle size={16} className="text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>

                  {question.explanation && (
                    <div>
                      <Label>Explanation</Label>
                      <Textarea
                        value={question.explanation}
                        onChange={(e) => editQuestion(index, 'explanation', e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText size={20} />
          Import Questions from Word Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <Upload size={32} className="text-muted-foreground" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Import Word Document</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a Word document containing questions with the following format:
                </p>
              </div>

              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-auto"
              >
                {importing ? 'Processing...' : 'Select Document'}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Expected Format:</h4>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
{`1. What is the capital of France?
A) London
B) Paris
C) Madrid
D) Rome
E) Berlin

Correct Answer: B
Explanation: Paris is the capital and largest city of France.
Difficulty: A1
Tags: geography, capitals

2. Which programming language is primarily used for web development?
A) Python
B) Java
C) JavaScript
D) C++
E) Ruby

Correct Answer: C
Explanation: JavaScript is the primary language for client-side web development.
Difficulty: B1
Tags: programming, web development`}
            </pre>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Supported formats:</strong> .doc, .docx, .txt</p>
            <p><strong>Auto-detection features:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Question Detection:</strong> Automatically counts and separates questions</li>
              <li><strong>Multiple Choice Options:</strong> Supports A through E options</li>
              <li><strong>Answer Identification:</strong> Detects correct answers automatically</li>
              <li><strong>Rich Content:</strong> Preserves explanations and metadata</li>
              <li><strong>Image Extraction:</strong> Extracts embedded images from .docx files</li>
              <li><strong>Smart Parsing:</strong> Handles various formatting styles</li>
            </ul>
            <p><strong>Import Statistics:</strong> After parsing, you'll see a detailed breakdown of detected questions, answers, images, and explanations before importing.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}