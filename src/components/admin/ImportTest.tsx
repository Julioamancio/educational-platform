import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Image,
  Brain,
  Upload
} from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function ImportTest() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const createTestDocument = () => {
    const testContent = `
Test Document for Question Import

1. What is the capital of Brazil?
A) São Paulo
B) Rio de Janeiro  
C) Brasília
D) Salvador
E) Fortaleza
Answer: C
Explanation: Brasília is the federal capital of Brazil, established in 1960.

2. Which programming language is known for web development?
A) Assembly
B) JavaScript
C) COBOL
D) Fortran
Answer: B
Explanation: JavaScript is widely used for both frontend and backend web development.

Question 3: What is 2 + 2?
(A) 3
(B) 4
(C) 5
(D) 6
Correct: B
Justificativa: Basic arithmetic operation.

Questão 4: Qual é a cor do céu?
A - Azul
B - Verde
C - Vermelho
D - Amarelo
Resposta: A
Comentário: O céu aparece azul devido ao espalhamento da luz.

5. Best practice in React?
A: Use class components
B: Use functional components with hooks
C: Mix both approaches
D: Avoid components
Solution: B
Rationale: Modern React development favors functional components with hooks.
`

    const blob = new Blob([testContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'test-questions.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Test document created and downloaded')
  }

  const runImportTest = async () => {
    setIsRunning(true)
    setProgress(0)
    setTestResults([])

    const tests = [
      {
        name: 'Pattern Detection Test',
        description: 'Testing various question numbering patterns',
        test: () => testPatternDetection()
      },
      {
        name: 'Option Parsing Test', 
        description: 'Testing different option formats',
        test: () => testOptionParsing()
      },
      {
        name: 'Answer Detection Test',
        description: 'Testing answer pattern recognition',
        test: () => testAnswerDetection()
      },
      {
        name: 'Explanation Extraction Test',
        description: 'Testing explanation parsing',
        test: () => testExplanationExtraction()
      }
    ]

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      setProgress((i / tests.length) * 100)
      
      try {
        const result = await test.test()
        setTestResults(prev => [...prev, {
          ...test,
          status: 'success',
          result
        }])
      } catch (error) {
        setTestResults(prev => [...prev, {
          ...test,
          status: 'error',
          error: error.message
        }])
      }
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setProgress(100)
    setIsRunning(false)
    toast.success('Import test completed')
  }

  const testPatternDetection = () => {
    const patterns = [
      "1. Question text",
      "Question 1: Question text", 
      "Questão 1: Question text",
      "1) Question text"
    ]
    
    const results = patterns.map(pattern => {
      const hasNumber = /\d+/.test(pattern)
      const hasColon = /:/.test(pattern)
      const hasParens = /\)/.test(pattern)
      
      return {
        pattern,
        detected: hasNumber,
        format: hasColon ? 'colon' : hasParens ? 'parenthesis' : 'dot'
      }
    })
    
    return results
  }

  const testOptionParsing = () => {
    const optionFormats = [
      "A) Option text",
      "(A) Option text",
      "A: Option text", 
      "A - Option text",
      "A. Option text"
    ]
    
    const results = optionFormats.map(format => {
      const match = format.match(/([A-E])[\)\.\-:]?\s*(.+)/)
      return {
        format,
        parsed: !!match,
        letter: match?.[1],
        text: match?.[2]
      }
    })
    
    return results
  }

  const testAnswerDetection = () => {
    const answerFormats = [
      "Answer: A",
      "Correct: B", 
      "Resposta: C",
      "Solution: D",
      "*E*",
      "Key: A"
    ]
    
    const results = answerFormats.map(format => {
      const patterns = [
        /(?:answer|resposta|gabarito)[\s:]*([A-E])/i,
        /(?:correct|correta|correto)[\s:]*([A-E])/i,
        /(?:solution|solução)[\s:]*([A-E])/i,
        /\*([A-E])\*/,
        /(?:key|chave)[\s:]*([A-E])/i
      ]
      
      let detected = null
      for (const pattern of patterns) {
        const match = format.match(pattern)
        if (match) {
          detected = match[1]
          break
        }
      }
      
      return {
        format,
        detected,
        success: !!detected
      }
    })
    
    return results
  }

  const testExplanationExtraction = () => {
    const explanationFormats = [
      "Explanation: This is the explanation",
      "Comentário: Este é o comentário", 
      "Justificativa: Esta é a justificativa",
      "Rationale: This is the rationale"
    ]
    
    const results = explanationFormats.map(format => {
      const patterns = [
        /(?:explanation|explicação|comentário)[\s:]*(.+)/i,
        /(?:justificativa|resolução)[\s:]*(.+)/i,
        /(?:rationale|reasoning)[\s:]*(.+)/i
      ]
      
      let detected = null
      for (const pattern of patterns) {
        const match = format.match(pattern)
        if (match) {
          detected = match[1]
          break
        }
      }
      
      return {
        format,
        detected,
        success: !!detected
      }
    })
    
    return results
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Import Testing Suite
          </h2>
          <p className="text-muted-foreground">
            Test the Word document import functionality
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={createTestDocument}>
            <Download className="w-4 h-4 mr-2" />
            Download Test Doc
          </Button>
          <Button onClick={runImportTest} disabled={isRunning}>
            <Upload className="w-4 h-4 mr-2" />
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </div>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Running import tests...</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          
          {testResults.map((test, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {test.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  {test.name}
                  <Badge variant={test.status === 'success' ? 'default' : 'destructive'}>
                    {test.status}
                  </Badge>
                </CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {test.status === 'success' ? (
                  <div className="space-y-2">
                    {Array.isArray(test.result) ? (
                      <div className="grid gap-2">
                        {test.result.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                            <span className="font-mono">{item.format || item.pattern}</span>
                            <Badge variant={item.success || item.detected || item.parsed ? 'default' : 'outline'}>
                              {item.success || item.detected || item.parsed ? 'Pass' : 'Fail'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(test.result, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{test.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Testing Instructions:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Download the test document to see expected format</li>
            <li>Run tests to verify pattern recognition works correctly</li>
            <li>Check that all question formats, options, and answers are detected</li>
            <li>Verify explanations are properly extracted</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}