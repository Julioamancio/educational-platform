import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { Download, FileText, TestTube, Settings, Info } from '@phosphor-icons/react'
import { wordParser, type ParsingResult } from '@/utils/wordParser'

export default function DocumentTester() {
  const [testResults, setTestResults] = useState<Record<string, ParsingResult>>({})
  const [testing, setTesting] = useState(false)

  const createTestDocument = (format: string, content: string): File => {
    const blob = new Blob([content], { type: 'text/plain' })
    return new File([blob], `test-${format}.txt`, { type: 'text/plain' })
  }

  const testFormats = {
    'standard-format': {
      name: 'Standard Format',
      description: 'Full questions with explanations and metadata',
      content: `1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
E) Rome

Answer: B
Explanation: Paris is the capital and largest city of France.
Tags: geography, capitals, france

2. Which form is correct: "I ___ a student"?
A) are
B) is
C) am
D) was
E) were

Answer: C
Explanation: "I am" is the correct present tense form of "to be" for first person singular.
Tags: grammar, verb to be, present tense

3. Which planet is closest to the Sun?
A) Venus
B) Earth
C) Mercury
D) Mars
E) Jupiter

Answer: C
Explanation: Mercury is the closest planet to the Sun in our solar system.
Tags: astronomy, planets, solar system`
    },
    
    'question-answer-format': {
      name: 'Question-Answer Format',
      description: 'Simple Q&A format',
      content: `Q: What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Answer: B

Q: Who wrote "Romeo and Juliet"?
A) Charles Dickens
B) William Shakespeare
C) Jane Austen
D) Mark Twain
Answer: B

Q: What is the largest ocean on Earth?
A) Atlantic
B) Indian
C) Arctic
D) Pacific
Answer: D`
    },

    'minimal-format': {
      name: 'Minimal Format',
      description: 'Basic questions without metadata',
      content: `1. What color is the sky?
A) Red
B) Blue
C) Green
D) Yellow
Answer: B

2. How many legs does a spider have?
A) 6
B) 8
C) 10
D) 12
Answer: B`
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
    }
  }

  const runTest = async (formatKey: string) => {
    setTesting(true)
    try {
      const formatData = testFormats[formatKey as keyof typeof testFormats]
      const testFile = createTestDocument(formatKey, formatData.content)
      
      const result = await wordParser.parseDocument(testFile)
      
      setTestResults(prev => ({
        ...prev,
        [formatKey]: result
      }))

      if (result.questions.length > 0) {
        toast.success(`Teste concluído: ${result.questions.length} questões encontradas`)
      } else {
        toast.warning('Nenhuma questão foi detectada no documento')
      }
    } catch (error) {
      console.error('Erro no teste:', error)
      toast.error('Erro ao processar documento de teste')
    } finally {
      setTesting(false)
    }
  }

  const runAllTests = async () => {
    setTesting(true)
    try {
      for (const formatKey of Object.keys(testFormats)) {
        await runTest(formatKey)
        // Pequena pausa entre testes
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      toast.success('Todos os testes concluídos')
    } catch (error) {
      toast.error('Erro ao executar testes')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Testador de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Esta ferramenta testa o parser de documentos com diferentes formatos de questões.
              Use-a para verificar se o sistema consegue detectar questões corretamente.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 mt-4">
            <Button 
              onClick={runAllTests}
              disabled={testing}
              className="flex items-center gap-2"
            >
              <TestTube size={16} />
              {testing ? 'Testando...' : 'Executar Todos os Testes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="samples" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="samples">Amostras</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="samples" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(testFormats).map(([key, data]) => (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{data.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {data.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runTest(key)}
                      disabled={testing}
                      className="flex items-center gap-2"
                    >
                      <TestTube size={14} />
                      Testar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
                    {data.content}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {Object.keys(testResults).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Execute os testes para ver os resultados aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(testResults).map(([formatKey, result]) => {
              const summary = {
                status: result.errors.length > 0 ? 'error' : 
                        result.warnings.length > 0 ? 'warning' : 'success',
                questionsFound: result.questions.length,
                errors: result.errors.length,
                warnings: result.warnings.length
              }

              return (
                <Card 
                  key={formatKey}
                  className={`border-l-4 ${
                    summary.status === 'error' ? 'border-l-destructive' :
                    summary.status === 'warning' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {testFormats[formatKey as keyof typeof testFormats].name}
                        <Badge variant={
                          summary.status === 'error' ? 'destructive' :
                          summary.status === 'warning' ? 'secondary' :
                          'default'
                        }>
                          {summary.questionsFound} questões
                        </Badge>
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {summary.questionsFound}
                        </div>
                        <div className="text-xs text-muted-foreground">Questões</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {summary.warnings}
                        </div>
                        <div className="text-xs text-muted-foreground">Avisos</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {summary.errors}
                        </div>
                        <div className="text-xs text-muted-foreground">Erros</div>
                      </div>
                    </div>

                    {result.warnings.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-medium text-yellow-700 mb-2">Avisos:</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {result.warnings.map((warning, idx) => (
                            <li key={idx} className="text-yellow-600">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.errors.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-medium text-red-700 mb-2">Erros:</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {result.errors.map((error, idx) => (
                            <li key={idx} className="text-red-600">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.questions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Questões Detectadas:</h4>
                        <div className="space-y-2">
                          {result.questions.slice(0, 3).map((question, idx) => (
                            <div key={idx} className="bg-muted p-2 rounded text-sm">
                              <div className="font-medium">{question.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Opções: {question.options.length} | 
                                Dificuldade: {question.difficulty} |
                                Tags: {question.tags.join(', ')}
                              </div>
                            </div>
                          ))}
                          {result.questions.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              ... e mais {result.questions.length - 3} questões
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Análise detalhada dos resultados dos testes será exibida aqui após a execução.
              </p>
            </CardContent>
          </Card>

          {Object.keys(testResults).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Geral</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Formatos testados:</span>
                      <span className="font-medium">{Object.keys(testResults).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de questões:</span>
                      <span className="font-medium">
                        {Object.values(testResults).reduce((sum, result) => sum + result.questions.length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sucessos:</span>
                      <span className="font-medium text-green-600">
                        {Object.values(testResults).filter(r => r.errors.length === 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Com erros:</span>
                      <span className="font-medium text-red-600">
                        {Object.values(testResults).filter(r => r.errors.length > 0).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(testResults).map(([key, result]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span>{testFormats[key as keyof typeof testFormats].name}:</span>
                        <span className="font-medium">
                          {result.statistics?.totalQuestions || result.questions.length} questões
                        </span>
                      </div>
                    ))}
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