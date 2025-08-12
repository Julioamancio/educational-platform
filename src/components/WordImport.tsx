import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon,
  FileQuestion,
  Eye,
  Download
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ImportedQuestion {
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
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E'
  explanation?: string
  images: string[]
  difficulty?: string
  tags: string[]
}

interface ImportResult {
  questions: ImportedQuestion[]
  images: { name: string; url: string }[]
  errors: string[]
  warnings: string[]
}

interface WordImportProps {
  onQuestionsImported?: (questions: ImportedQuestion[]) => void
}

export default function WordImport({ onQuestionsImported }: WordImportProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simulate document processing with realistic progress
  const simulateProcessing = (): Promise<ImportResult> => {
    return new Promise((resolve) => {
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15 + 5
        setProgress(Math.min(currentProgress, 95))
        
        if (currentProgress >= 100) {
          clearInterval(interval)
          setProgress(100)
          
          // Mock processing result
          const result: ImportResult = {
            questions: [
              {
                id: '1',
                title: 'English Grammar - Present Perfect',
                stem: 'Choose the correct form of the present perfect tense:',
                options: {
                  A: 'I have seen that movie',
                  B: 'I have saw that movie', 
                  C: 'I has seen that movie',
                  D: 'I seen that movie',
                  E: 'I had seen that movie'
                },
                correctAnswer: 'A',
                explanation: 'The present perfect tense is formed with "have/has" + past participle. "Seen" is the past participle of "see".',
                images: ['question1_diagram.png'],
                difficulty: 'B1',
                tags: ['grammar', 'present-perfect', 'tenses']
              },
              {
                id: '2',
                title: 'Reading Comprehension - Climate Change',
                stem: 'Based on the passage about climate change, what is the main cause of global warming?',
                options: {
                  A: 'Natural solar variations',
                  B: 'Greenhouse gas emissions from human activities',
                  C: 'Volcanic eruptions',
                  D: 'Ocean current changes', 
                  E: 'Deforestation only'
                },
                correctAnswer: 'B',
                explanation: 'According to the passage, the primary driver of current climate change is the increase in greenhouse gases due to human activities, particularly carbon dioxide from burning fossil fuels.',
                images: ['climate_chart.png', 'temperature_graph.jpg'],
                difficulty: 'B2',
                tags: ['reading', 'comprehension', 'environment']
              }
            ],
            images: [
              { name: 'question1_diagram.png', url: '/mock/diagram1.png' },
              { name: 'climate_chart.png', url: '/mock/chart1.png' },
              { name: 'temperature_graph.jpg', url: '/mock/graph1.jpg' }
            ],
            errors: [],
            warnings: [
              'One image could not be extracted due to format limitations',
              'Question numbering was automatically adjusted'
            ]
          }
          
          resolve(result)
        }
      }, 300)
    })
  }

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/pdf'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toast.error('Please select a Word document (.docx, .doc) or PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setImportResult(null)
    toast.success('File selected. Click "Process Document" to import questions.')
  }

  const processDocument = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setProgress(0)
    
    try {
      const result = await simulateProcessing()
      setImportResult(result)
      
      if (result.questions.length > 0) {
        toast.success(`Successfully imported ${result.questions.length} questions`)
      } else {
        toast.error('No questions found in the document')
      }
    } catch (error) {
      toast.error('Failed to process document')
      setImportResult({
        questions: [],
        images: [],
        errors: ['Failed to parse document. Please check the format and try again.'],
        warnings: []
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleImportQuestions = () => {
    if (importResult?.questions) {
      onQuestionsImported?.(importResult.questions)
      toast.success('Questions imported to your question bank')
    }
  }

  const downloadExample = () => {
    // In a real app, this would download an actual template
    toast.info('Example template download would start here')
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Questions from Word Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Select Word Document</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports .docx, .doc, and PDF files (max 10MB)
            </p>
            
            <div className="flex gap-2 justify-center">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
              <Button variant="outline" onClick={downloadExample}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button 
                onClick={processDocument} 
                disabled={isProcessing}
                className="ml-4"
              >
                <FileQuestion className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Process Document'}
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing document...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                Analyzing document structure, extracting questions and images...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Format Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Supported Question Format:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Question title or number</li>
                <li>• Question stem/prompt</li>
                <li>• Options A, B, C, D, E</li>
                <li>• Correct answer indication</li>
                <li>• Optional explanation/comment</li>
                <li>• Embedded images</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Detection Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic question counting</li>
                <li>• Multiple choice option detection</li>
                <li>• Image extraction and linking</li>
                <li>• Answer key identification</li>
                <li>• Difficulty level detection</li>
                <li>• Tag extraction from content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Import Results</span>
              {importResult.questions.length > 0 && (
                <Button onClick={handleImportQuestions}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Import {importResult.questions.length} Questions
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.questions.length}</div>
                <div className="text-sm text-muted-foreground">Questions Found</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importResult.images.length}</div>
                <div className="text-sm text-muted-foreground">Images Extracted</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{importResult.warnings.length}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {/* Warnings and Errors */}
            {importResult.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warnings:</strong>
                  <ul className="mt-1 ml-4 list-disc">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errors:</strong>
                  <ul className="mt-1 ml-4 list-disc">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Questions Preview */}
            {importResult.questions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Questions Preview</h4>
                  <ScrollArea className="h-96 border rounded-lg">
                    <div className="p-4 space-y-6">
                      {importResult.questions.map((question, index) => (
                        <div key={question.id} className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h5 className="font-medium">Question {index + 1}: {question.title}</h5>
                            <div className="flex gap-2">
                              {question.difficulty && (
                                <Badge variant="outline">{question.difficulty}</Badge>
                              )}
                              <Badge variant="secondary">{question.tags.length} tags</Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm">{question.stem}</p>
                          
                          <div className="grid grid-cols-1 gap-1">
                            {Object.entries(question.options).map(([key, value]) => (
                              <div 
                                key={key} 
                                className={`text-sm p-2 rounded ${
                                  key === question.correctAnswer 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-muted/50'
                                }`}
                              >
                                <strong>{key}.</strong> {value}
                                {key === question.correctAnswer && (
                                  <CheckCircle className="inline-block h-4 w-4 ml-2 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>

                          {question.images.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                              {question.images.length} image(s) attached
                            </div>
                          )}

                          {question.explanation && (
                            <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}

                          {index < importResult.questions.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}