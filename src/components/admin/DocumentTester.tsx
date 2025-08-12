import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, FileText, TestTube, Settings, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { wordParser, type ParsingResult } from '@/utils/wordParser'
import SampleDocuments from './SampleDocuments'
import LiveDemo from './LiveDemo'

export default function DocumentTester() {
  const [testResults, setTestResults] = useState<Record<string, ParsingResult>>({})
  const [testing, setTesting] = useState(false)

  const createTestDocument = (format: string, content: string): File => {
    const blob = new Blob([content], { type: 'text/plain' })
    return new File([blob], `test-${format}.txt`, { type: 'text/plain' })
  }

  const testFormats = {
    'numbered-standard': {
      name: 'Standard Numbered Format',
      description: 'Traditional numbered questions with A-E options',
      content: `1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
E) Rome

Correct Answer: B
Explanation: Paris is the capital and largest city of France.
Difficulty: A1
Tags: geography, capitals, france

2. Choose the correct form of "to be": I ___ a student.
A) am
B) is
C) are
D) was
E) were

Correct Answer: A
Explanation: "I am" is the correct present tense form of "to be" for first person singular.
Difficulty: A1
Tags: grammar, verb to be, present tense

3. Which planet is closest to the Sun?
A) Venus
B) Earth
C) Mercury
D) Mars
E) Jupiter

Correct Answer: C
Explanation: Mercury is the innermost planet in our solar system.
Difficulty: A2
Tags: astronomy, planets, solar system`
    },

    'qa-format': {
      name: 'Question-Answer Format',
      description: 'Q: and A: style questions',
      content: `Question: What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
E) 7
Answer: B

Q: Who wrote "Romeo and Juliet"?
A) Charles Dickens
B) William Shakespeare
C) Jane Austen
D) Mark Twain
E) Ernest Hemingway
A: B

Question: What is the largest ocean on Earth?
A) Atlantic
B) Indian
C) Arctic
D) Pacific
E) Southern
Answer: D`
    },

    'mixed-format': {
      name: 'Mixed Format',
      description: 'Various question styles mixed together',
      content: `Question 1: What is the chemical symbol for gold?
Options:
(A) Au
(B) Ag
(C) Fe
(D) Cu
(E) Pb
Answer: A
Explanation: Au comes from the Latin name "aurum" meaning gold.
Level: B1
Tags: chemistry, elements

2) In which year did World War II end?
a. 1943
b. 1944
c. 1945
d. 1946
e. 1947
Correct: c
Note: World War II ended in 1945 with the surrender of Japan.
Category: history

Q3. What is the square root of 64?
(A) 6
(B) 7
(C) 8
(D) 9
(E) 10
Right answer: C
Tags: mathematics, square roots`
    },

    'minimal-format': {
      name: 'Minimal Format',
      description: 'Basic questions without metadata',
      content: `1. What color is the sky?
A) Red
B) Blue
C) Green
D) Yellow
E) Purple

2. How many legs does a spider have?
A) 6
B) 8
C) 10
D) 12
E) 14

3. What is the freezing point of water?
A) 0°C
B) 10°C
C) -10°C
D) 5°C
E) -5°C`
    },

    'complex-format': {
      name: 'Complex Format with Images',
      description: 'Questions with detailed explanations and image references',
      content: `1. Based on the diagram shown below, what type of triangle is illustrated?

[IMAGE: right_triangle.png would be embedded here]

A) Equilateral triangle
B) Isosceles triangle  
C) Right triangle
D) Scalene triangle
E) Obtuse triangle

Correct Answer: C
Explanation: A right triangle has one angle that measures exactly 90 degrees. In the diagram, you can see the square symbol indicating the right angle. This type of triangle follows the Pythagorean theorem: a² + b² = c², where c is the hypotenuse.
Difficulty: B1
Tags: geometry, triangles, pythagorean theorem, mathematics

2. Examine the molecular structure diagram. What compound is represented?

[IMAGE: water_molecule.png would be embedded here]

A) Carbon dioxide (CO₂)
B) Water (H₂O)
C) Methane (CH₄)
D) Oxygen (O₂)
E) Nitrogen (N₂)

Correct Answer: B
Explanation: The diagram shows one oxygen atom bonded to two hydrogen atoms, forming water (H₂O). The bent molecular geometry is characteristic of water molecules due to the lone pairs of electrons on the oxygen atom.
Difficulty: B2
Tags: chemistry, molecular structure, water, chemical bonds

3. According to the chart, what was the population growth rate in 2020?

[IMAGE: population_chart.png would be embedded here]

A) 1.2%
B) 1.5%
C) 1.8%
D) 2.1%
E) 2.4%

Correct Answer: B
Explanation: Looking at the bar chart for the year 2020, the population growth rate was 1.5%. This represents a slight decrease from the previous year's rate of 1.7%.
Difficulty: A2
Tags: demographics, statistics, data interpretation, charts`
    }
  }

  const runSingleTest = async (formatKey: string, testData: any) => {
    try {
      const file = createTestDocument(formatKey, testData.content)
      const result = await wordParser.parseDocument(file)
      setTestResults(prev => ({ ...prev, [formatKey]: result }))
      
      if (result.errors.length > 0) {
        toast.error(`Test ${formatKey} failed`, {
          description: result.errors[0]
        })
      } else {
        toast.success(`Test ${formatKey} completed`, {
          description: `Found ${result.questions.length} questions`
        })
      }
      
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Test ${formatKey} failed`, { description: errorMsg })
      throw error
    }
  }

  const runAllTests = async () => {
    setTesting(true)
    setTestResults({})
    
    try {
      const startTime = Date.now()
      toast.loading('Running comprehensive document tests...', {
        description: 'Testing different document formats and parsing strategies'
      })
      
      const testPromises = Object.entries(testFormats).map(([key, data]) =>
        runSingleTest(key, data)
      )
      
      await Promise.allSettled(testPromises)
      
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)
      
      toast.success('All tests completed', {
        description: `Completed in ${duration}s. Check results below.`
      })
      
    } catch (error) {
      toast.error('Test suite failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }

  const downloadTestDocument = (formatKey: string) => {
    const testData = testFormats[formatKey as keyof typeof testFormats]
    const blob = new Blob([testData.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-${formatKey}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Test document downloaded', {
      description: `You can now upload ${a.download} to test the Word import feature`
    })
  }

  const getResultSummary = (result: ParsingResult) => {
    const { statistics, errors, warnings } = result
    return {
      status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success',
      questionsFound: statistics.totalQuestions,
      errorCount: errors.length,
      warningCount: warnings.length
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube size={20} />
            Word Document Parser Testing Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This testing suite validates the Word import functionality with different document formats.
                You can run individual tests or all tests at once to see how the parser handles various question styles.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={testing}
                className="flex-1"
              >
                {testing ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  // Quick test with a simple document
                  const testDoc = `1. What is 2+2?
A) 3
B) 4
C) 5
Answer: B

2. What color is the sky?
A) Red
B) Blue
C) Green
Correct Answer: B`
                  
                  const file = new File([testDoc], 'quick-test.txt', { type: 'text/plain' })
                  const result = await wordParser.parseDocument(file)
                  
                  if (result.questions.length > 0) {
                    toast.success(`Quick test passed: ${result.questions.length} questions detected`)
                  } else {
                    toast.error('Quick test failed: No questions detected')
                  }
                }}
                disabled={testing}
              >
                <TestTube size={16} className="mr-2" />
                Quick Test
              </Button>
              <Button variant="outline" disabled={testing}>
                <Settings size={16} className="mr-2" />
                Advanced Options
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="live-demo" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="live-demo">Live Demo</TabsTrigger>
          <TabsTrigger value="test-formats">Test Formats</TabsTrigger>
          <TabsTrigger value="samples">Sample Documents</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="live-demo" className="space-y-4">
          <LiveDemo />
        </TabsContent>

        <TabsContent value="test-formats" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(testFormats).map(([key, data]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{data.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {data.description}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Preview: {data.content.substring(0, 100)}...
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTestDocument(key)}
                      >
                        <Download size={14} className="mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => runSingleTest(key, data)}
                        disabled={testing}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="samples" className="space-y-4">
          <SampleDocuments />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {Object.keys(testResults).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No test results yet. Run some tests to see results here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(testResults).map(([formatKey, result]) => {
                const summary = getResultSummary(result)
                const testData = testFormats[formatKey as keyof typeof testFormats]
                
                return (
                  <Card key={formatKey} className={`border-l-4 ${
                    summary.status === 'error' ? 'border-l-destructive' :
                    summary.status === 'warning' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{testData.name}</h3>
                          <p className="text-sm text-muted-foreground">{testData.description}</p>
                        </div>
                        <Badge variant={
                          summary.status === 'error' ? 'destructive' :
                          summary.status === 'warning' ? 'secondary' :
                          'default'
                        }>
                          {summary.status === 'error' ? 'Failed' : 
                           summary.status === 'warning' ? 'Warning' : 'Success'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">{summary.questionsFound}</div>
                          <div className="text-xs text-muted-foreground">Questions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-secondary">{result.statistics.questionsWithAnswers}</div>
                          <div className="text-xs text-muted-foreground">With Answers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-600">{summary.warningCount}</div>
                          <div className="text-xs text-muted-foreground">Warnings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-destructive">{summary.errorCount}</div>
                          <div className="text-xs text-muted-foreground">Errors</div>
                        </div>
                      </div>

                      {result.warnings.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-yellow-700 mb-1">Warnings:</p>
                          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                            {result.warnings.slice(0, 3).map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                            {result.warnings.length > 3 && (
                              <li>... and {result.warnings.length - 3} more warnings</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {result.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-destructive mb-1">Errors:</p>
                          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                            {result.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.questions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Sample Questions:</p>
                          <div className="space-y-2">
                            {result.questions.slice(0, 2).map((question, idx) => (
                              <div key={idx} className="p-2 bg-background rounded border text-xs">
                                <div className="font-medium">{question.title}</div>
                                <div className="text-muted-foreground mt-1">
                                  Options: {Object.values(question.options).filter(opt => opt).length}/5 |
                                  Answer: {question.correctAnswer} |
                                  Difficulty: {question.difficulty} |
                                  Tags: {question.tags.join(', ') || 'None'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {Object.keys(testResults).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Run tests to see detailed analysis.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {Object.keys(testResults).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Tests Run</div>
                    </div>
                    <div className="text-center p-4 bg-green-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Object.values(testResults).filter(r => r.errors.length === 0).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-500/5 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {Object.values(testResults).filter(r => r.warnings.length > 0 && r.errors.length === 0).length}
                      </div>
                      <div className="text-sm text-muted-foreground">With Warnings</div>
                    </div>
                    <div className="text-center p-4 bg-destructive/5 rounded-lg">
                      <div className="text-2xl font-bold text-destructive">
                        {Object.values(testResults).filter(r => r.errors.length > 0).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parser Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(testResults).map(([formatKey, result]) => {
                      const testData = testFormats[formatKey as keyof typeof testFormats]
                      const accuracy = result.statistics.totalQuestions > 0 
                        ? (result.statistics.questionsWithAnswers / result.statistics.totalQuestions * 100).toFixed(1)
                        : '0'
                      
                      return (
                        <div key={formatKey} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{testData.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.statistics.totalQuestions} questions detected
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{accuracy}%</div>
                            <div className="text-xs text-muted-foreground">Answer Detection</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}