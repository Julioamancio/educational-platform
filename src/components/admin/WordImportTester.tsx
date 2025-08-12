import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useKV } from '@github/spark/hooks'
import { FileText, CheckCircle, AlertCircle, Download, Upload, Play, Lightbulb } from '@phosphor-icons/react'
import { toast } from 'sonner'
import mammoth from 'mammoth'

export default function WordImportTester() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseResults, setParseResults] = useState<any | null>(null)

  // Sample test documents to generate
  const generateSampleDocument = (format: 'basic' | 'complex' | 'portuguese' | 'mixed') => {
    const samples = {
      basic: `
1. What is the capital of France?
A) London
B) Berlin
C) Paris
D) Madrid
Answer: C
Explanation: Paris is the capital and largest city of France.

2. Which planet is closest to the Sun?
A) Venus
B) Mercury
C) Earth
D) Mars
Answer: B
Explanation: Mercury is the smallest planet and the one closest to the Sun.
      `.trim(),
      
      complex: `
Question 1: In the following sentence, identify the correct grammatical structure:
"The students who were studying in the library completed their assignments."

A) Simple sentence with compound predicate
B) Complex sentence with relative clause
C) Compound sentence with coordination
D) Complex sentence with noun clause
E) Simple sentence with participial phrase

Answer: B
Explanation: This is a complex sentence because it contains an independent clause ("The students completed their assignments") and a dependent relative clause ("who were studying in the library") that modifies "students".

Question 2: Choose the most appropriate word to complete the sentence:
"Despite the heavy rain, the outdoor concert was _______ successful."

(A) remarkably
(B) remarkable
(C) remark
(D) remarking
(E) remarked

Correct Answer: A
Rationale: "Remarkably" is an adverb that modifies the adjective "successful," indicating the degree of success despite adverse conditions.
      `.trim(),
      
      portuguese: `
Questão 1: Qual é a função sintática do termo destacado na frase: "O livro QUE COMPREI ontem é interessante"?

a) Sujeito
b) Objeto direto
c) Complemento nominal
d) Adjunto adverbial
e) Predicativo

Resposta: A
Justificativa: O pronome relativo "que" retoma "livro" e funciona como sujeito do verbo "comprei" na oração subordinada.

Questão 2: Complete a frase com a forma verbal correta: "Se eu _______ mais tempo, viajaria pelo mundo."

A - teria
B - tenho
C - tivesse
D - teve
E - tinha

Gabarito: C
Comentário: A frase expressa uma condição irreal no presente, exigindo o pretérito imperfeito do subjuntivo "tivesse".
      `.trim(),
      
      mixed: `
Q1. Mathematical Problem
Calculate the derivative of f(x) = 3x² + 2x - 1
A. f'(x) = 6x + 2
B. f'(x) = 6x - 1  
C. f'(x) = 3x + 2
D. f'(x) = 6x²
*A*

Q2. Geography Question  
Which ocean is the largest by surface area?
(A) Atlantic Ocean
(B) Indian Ocean
(C) Pacific Ocean
(D) Arctic Ocean
(E) Southern Ocean
Correct: C
Because: The Pacific Ocean covers about 165 million square kilometers.

3) Literature Analysis
What is the main theme in Shakespeare's "Romeo and Juliet"?
a - Political power
b - Family honor
c - Love and fate
d - Social inequality  
e - Religious conflict
Answer = C
The play explores how love can transcend family feuds but is ultimately defeated by fate.
      `.trim()
    }
    
    return samples[format]
  }

  const downloadSampleDocument = (format: 'basic' | 'complex' | 'portuguese' | 'mixed') => {
    const content = generateSampleDocument(format)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sample-${format}-questions.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${format} sample document`)
  }

  const runComprehensiveTest = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const tests = [
      {
        name: 'Basic Format Detection',
        description: 'Test numbered questions with simple A) B) C) format',
        content: generateSampleDocument('basic')
      },
      {
        name: 'Complex Question Patterns',
        description: 'Test various question numbering and option formats',
        content: generateSampleDocument('complex')
      },
      {
        name: 'Portuguese Content',
        description: 'Test Portuguese language questions with different patterns',
        content: generateSampleDocument('portuguese')
      },
      {
        name: 'Mixed Format Detection',
        description: 'Test mixed numbering styles and answer formats',
        content: generateSampleDocument('mixed')
      }
    ]

    for (const test of tests) {
      try {
        const result = await testQuestionParsing(test.content, test.name)
        setTestResults(prev => [...prev, {
          ...test,
          result,
          success: result.questions.length > 0,
          questionsFound: result.questions.length,
          timestamp: new Date().toISOString()
        }])
      } catch (error) {
        setTestResults(prev => [...prev, {
          ...test,
          success: false,
          error: error.message,
          questionsFound: 0,
          timestamp: new Date().toISOString()
        }])
      }
    }

    setIsRunning(false)
    toast.success('Comprehensive testing completed')
  }

  const testQuestionParsing = async (content: string, testName: string) => {
    // Simulate document parsing logic
    const questions = parseQuestionsFromText(content)
    
    return {
      questions,
      metadata: {
        testName,
        totalLength: content.length,
        lineCount: content.split('\n').length,
        detectedPatterns: detectPatterns(content)
      }
    }
  }

  const parseQuestionsFromText = (text: string) => {
    const questions: any[] = []
    
    // Enhanced question detection patterns
    const questionMarkers = [
      /(\d+[\.\)])\s*([^]*?)(?=\d+[\.\)]|$)/g, // 1. or 1)
      /(Question\s*\d+:?)\s*([^]*?)(?=Question\s*\d+|$)/gi, // Question 1:
      /(Questão\s*\d+:?)\s*([^]*?)(?=Questão\s*\d+|$)/gi, // Questão 1:
      /(Q\d+[\.\)])\s*([^]*?)(?=Q\d+|$)/gi, // Q1. or Q1)
    ]
    
    let questionSections: string[] = []
    
    // Try each pattern
    for (const pattern of questionMarkers) {
      const matches = Array.from(text.matchAll(pattern))
      if (matches.length >= 2) {
        questionSections = matches.map(match => match[0])
        break
      }
    }
    
    // Fallback: split by double newlines and look for option patterns
    if (questionSections.length === 0) {
      const paragraphs = text.split(/\n\s*\n/)
      const potentialQuestions: string[] = []
      let currentQuestion = ''
      
      for (const paragraph of paragraphs) {
        const hasOptions = /[A-E][\)\.\-:]?\s+[^\n]*/.test(paragraph)
        const hasQuestionNumber = /^\d+[\.\)]/.test(paragraph.trim())
        
        if (hasQuestionNumber || (currentQuestion && hasOptions)) {
          if (currentQuestion) {
            potentialQuestions.push(currentQuestion)
          }
          currentQuestion = paragraph
        } else if (currentQuestion) {
          currentQuestion += '\n\n' + paragraph
        }
      }
      
      if (currentQuestion) {
        potentialQuestions.push(currentQuestion)
      }
      
      questionSections = potentialQuestions.filter(q => q.trim().length > 50)
    }

    // Parse each question section
    questionSections.forEach((section, index) => {
      const questionData = parseIndividualQuestion(section.trim())
      if (questionData && Object.values(questionData.options).filter(opt => opt.trim()).length >= 3) {
        questions.push({
          ...questionData,
          index: index + 1,
          originalText: section.substring(0, 200) + (section.length > 200 ? '...' : '')
        })
      }
    })

    return questions
  }

  const parseIndividualQuestion = (section: string) => {
    const cleanText = section.replace(/\s+/g, ' ').trim()
    
    // Enhanced option detection patterns
    const optionPatterns = [
      /([A-E])[\)\.]?\s*([^A-E\(\)\n]*?)(?=\s*[A-E][\)\.]|\n\s*[A-E][\)\.]|$)/gi,
      /\(([A-E])\)\s*([^A-E\(\)\n]*?)(?=\s*\([A-E]\)|\n\s*\([A-E]\)|$)/gi,
      /([A-E])\s*[-–]\s*([^A-E\n]*?)(?=\s*[A-E]\s*[-–]|\n\s*[A-E]\s*[-–]|$)/gi,
      /([A-E])\s*:\s*([^A-E\n]*?)(?=\s*[A-E]\s*:|\n\s*[A-E]\s*:|$)/gi,
    ]
    
    let optionsData: { [key: string]: string } = {}
    let bestPatternMatches = 0
    
    // Try each pattern and use the one with most matches
    for (const pattern of optionPatterns) {
      const matches = Array.from(cleanText.matchAll(pattern))
      
      if (matches.length > bestPatternMatches) {
        bestPatternMatches = matches.length
        optionsData = {}
        
        matches.forEach(match => {
          const letter = match[1].toLowerCase()
          const text = match[2].trim()
          if (text.length > 0 && ['a', 'b', 'c', 'd', 'e'].includes(letter)) {
            optionsData[letter] = text.replace(/^\W+/, '').replace(/\W+$/, '').trim()
          }
        })
      }
    }
    
    // Extract question stem
    const optionKeys = Object.keys(optionsData).sort()
    const firstOptionKey = optionKeys[0]?.toUpperCase()
    const firstOptionText = optionsData[optionKeys[0]]
    
    let stem = ''
    if (firstOptionKey && firstOptionText) {
      const optionStartPattern = new RegExp(`${firstOptionKey}[\\)\\.]?\\s*${firstOptionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 15)}`, 'i')
      const match = cleanText.search(optionStartPattern)
      if (match !== -1) {
        stem = cleanText.substring(0, match).trim()
      }
    }
    
    // Clean up the stem
    stem = stem
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/^Question\s*\d*:?\s*/i, '')
      .replace(/^Questão\s*\d*:?\s*/i, '')
      .replace(/^Q\d*[\.\):\s]+/i, '')
      .trim()
    
    // Answer detection patterns
    const answerPatterns = [
      /(?:answer|resposta|gabarito)[\s:]*([A-E])/i,
      /(?:correct|correta|correto)[\s:]*(?:answer|option|opção)?[\s:]*([A-E])/i,
      /\*([A-E])\*/,
      /([A-E])\s*✓/,
      /(?:key|chave)[\s:]*([A-E])/i,
    ]

    let correctOption = 'a'
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

    // Explanation detection
    const explanationPatterns = [
      /(?:explanation|explicação|comentário|justificativa|rationale|because|porque)[\s:]*(.+?)(?=\n[A-E][\)\.]|\n\d+\.|\nQuestion|\nQuestão|\n\n|$)/is,
    ]

    let explanation = ''
    for (const pattern of explanationPatterns) {
      const match = cleanText.match(pattern)
      if (match && match[1]) {
        explanation = match[1].trim().substring(0, 500)
        if (explanation.length > 10) {
          break
        }
      }
    }

    const validOptions = Object.keys(optionsData).filter(key => optionsData[key].trim().length > 0)
    if (validOptions.length < 3 || stem.length < 5) {
      return null
    }

    return {
      stem,
      options: {
        a: optionsData.a || '',
        b: optionsData.b || '',
        c: optionsData.c || '',
        d: optionsData.d || '',
        e: optionsData.e || ''
      },
      correctOption,
      explanation,
      detectedPatterns: {
        optionCount: validOptions.length,
        hasExplanation: !!explanation,
        stemLength: stem.length
      }
    }
  }

  const detectPatterns = (content: string) => {
    const patterns = {
      numberedQuestions: (content.match(/\d+[\.\)]/g) || []).length,
      namedQuestions: (content.match(/Question\s*\d+/gi) || []).length,
      portugueseQuestions: (content.match(/Questão\s*\d+/gi) || []).length,
      optionFormats: {
        parentheses: (content.match(/\([A-E]\)/g) || []).length,
        brackets: (content.match(/[A-E][\)\.]?\s/g) || []).length,
        dashes: (content.match(/[A-E]\s*[-–]/g) || []).length,
        colons: (content.match(/[A-E]\s*:/g) || []).length
      },
      answerMarkers: {
        answer: (content.match(/answer[\s:]*[A-E]/gi) || []).length,
        correct: (content.match(/correct[\s:]*[A-E]/gi) || []).length,
        asterisks: (content.match(/\*[A-E]\*/g) || []).length,
        resposta: (content.match(/resposta[\s:]*[A-E]/gi) || []).length
      }
    }
    return patterns
  }

  const testSingleFile = async (file: File) => {
    try {
      setIsRunning(true)
      
      if (file.name.endsWith('.docx')) {
        // Process Word document
        const arrayBuffer = await file.arrayBuffer()
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
        
        const parser = new DOMParser()
        const doc = parser.parseFromString(result.value, 'text/html')
        const textContent = doc.body.textContent || ''
        
        const parseResult = await testQuestionParsing(textContent, file.name)
        setParseResults({
          filename: file.name,
          fileSize: file.size,
          wordDocument: true,
          htmlExtracted: result.value.length,
          textExtracted: textContent.length,
          ...parseResult
        })
      } else {
        // Process text file
        const text = await file.text()
        const parseResult = await testQuestionParsing(text, file.name)
        setParseResults({
          filename: file.name,
          fileSize: file.size,
          wordDocument: false,
          textContent: text.length,
          ...parseResult
        })
      }
      
      toast.success('File processed successfully')
    } catch (error) {
      console.error('File processing error:', error)
      toast.error('Failed to process file: ' + error.message)
    } finally {
      setIsRunning(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      testSingleFile(file)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Word Import Testing Suite
          </CardTitle>
          <CardDescription>
            Test and validate Word document import functionality with various question formats
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="comprehensive" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comprehensive">Comprehensive Test</TabsTrigger>
          <TabsTrigger value="file-test">File Testing</TabsTrigger>
          <TabsTrigger value="samples">Sample Documents</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="comprehensive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automated Testing</CardTitle>
              <CardDescription>
                Run comprehensive tests on different question formats and patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runComprehensiveTest} 
                disabled={isRunning}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? 'Running Tests...' : 'Run Comprehensive Test Suite'}
              </Button>

              {testResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Test Results</h4>
                  {testResults.map((result, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {result.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="font-medium">{result.name}</span>
                          </div>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.questionsFound} questions found
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{result.description}</p>
                        
                        {result.success && result.result?.questions && (
                          <div className="space-y-2">
                            {result.result.questions.map((q: any, qIndex: number) => (
                              <div key={qIndex} className="p-2 bg-muted rounded text-xs">
                                <div className="font-medium">Q{qIndex + 1}: {q.stem.substring(0, 60)}...</div>
                                <div className="text-muted-foreground">
                                  Options: {Object.values(q.options).filter(opt => opt).length}/5 | 
                                  Answer: {q.correctOption.toUpperCase()} | 
                                  Explanation: {q.explanation ? 'Yes' : 'No'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {result.error && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {result.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="file-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Your Own Files</CardTitle>
              <CardDescription>
                Upload Word documents or text files to test parsing capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".docx,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="test-file-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('test-file-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'Choose File to Test'}
                </Button>
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>

              {parseResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Parsing Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">File:</span> {parseResults.filename}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {(parseResults.fileSize / 1024).toFixed(1)} KB
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {parseResults.wordDocument ? 'Word Document' : 'Text File'}
                      </div>
                      <div>
                        <span className="font-medium">Questions Found:</span> {parseResults.questions?.length || 0}
                      </div>
                    </div>

                    <Separator />

                    {parseResults.questions?.length > 0 ? (
                      <div className="space-y-2">
                        <h5 className="font-medium">Detected Questions:</h5>
                        {parseResults.questions.map((q: any, index: number) => (
                          <div key={index} className="p-3 bg-muted rounded">
                            <div className="font-medium text-sm mb-1">
                              Question {index + 1}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {q.stem.substring(0, 100)}...
                            </div>
                            <div className="flex gap-2 text-xs">
                              <Badge variant="outline">
                                {Object.values(q.options).filter(opt => opt).length} options
                              </Badge>
                              <Badge variant="outline">
                                Answer: {q.correctOption.toUpperCase()}
                              </Badge>
                              {q.explanation && (
                                <Badge variant="outline">Has explanation</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No questions were detected in this file. Check the formatting requirements.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="samples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sample Documents</CardTitle>
              <CardDescription>
                Download sample documents to test the import functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Basic Format</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Simple numbered questions with A) B) C) options
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadSampleDocument('basic')}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Complex Format</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      "Question 1:" format with detailed explanations
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadSampleDocument('complex')}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Portuguese Format</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      "Questão" format with Portuguese keywords
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadSampleDocument('portuguese')}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Mixed Formats</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Various numbering styles and option formats
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadSampleDocument('mixed')}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Pro Tip:</strong> After downloading, you can copy the content into a Word document,
                  add some images, and save as .docx to test the full Word import functionality.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test History</CardTitle>
              <CardDescription>
                View results from previous tests and parsing attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length > 0 ? (
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{result.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(result.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? 'Success' : 'Failed'}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {result.questionsFound} questions
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No test results yet</p>
                  <p className="text-sm text-muted-foreground">
                    Run some tests to see results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}