import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Play, Copy, RotateCcw } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { wordParser, type ParsingResult } from '@/utils/wordParser'

export default function LiveDemo() {
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<ParsingResult | null>(null)
  const [parsing, setParsing] = useState(false)

  const sampleText = `1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
E) Rome

Correct Answer: B
Explanation: Paris is the capital and largest city of France.
Difficulty: A1
Tags: geography, capitals

2. Choose the correct article: "I saw ___ elephant."
A) a
B) an
C) the
D) some
E) any

Answer: B
Explanation: Use "an" before words starting with vowel sounds.
Tags: grammar, articles`

  const handleParse = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text to parse')
      return
    }

    setParsing(true)
    try {
      const file = new File([inputText], 'live-demo.txt', { type: 'text/plain' })
      const parseResult = await wordParser.parseDocument(file)
      setResult(parseResult)

      if (parseResult.questions.length > 0) {
        toast.success(`Parsed ${parseResult.questions.length} questions successfully`)
      } else {
        toast.warning('No questions detected in the text')
      }
    } catch (error) {
      toast.error('Failed to parse text', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setParsing(false)
    }
  }

  const loadSample = () => {
    setInputText(sampleText)
    setResult(null)
    toast.success('Sample text loaded')
  }

  const copyResult = () => {
    if (!result) return
    
    const summary = `Parsing Results:
- Questions found: ${result.questions.length}
- With answers: ${result.statistics.questionsWithAnswers}
- With explanations: ${result.statistics.questionsWithExplanations}
- With tags: ${result.statistics.questionsWithTags}
- Warnings: ${result.warnings.length}
- Errors: ${result.errors.length}`

    navigator.clipboard.writeText(summary)
    toast.success('Results copied to clipboard')
  }

  const reset = () => {
    setInputText('')
    setResult(null)
    toast.success('Demo reset')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play size={20} />
            Live Parser Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Paste your question text:</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadSample}>
                  Load Sample
                </Button>
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw size={14} className="mr-1" />
                  Reset
                </Button>
              </div>
            </div>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your questions here... You can use any of the supported formats."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleParse} disabled={parsing || !inputText.trim()} className="flex-1">
              {parsing ? 'Parsing...' : 'Parse Text'}
            </Button>
            {result && (
              <Button variant="outline" onClick={copyResult}>
                <Copy size={16} className="mr-2" />
                Copy Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Parsing Results</span>
              <div className="flex gap-2">
                <Badge variant={result.errors.length > 0 ? 'destructive' : 'default'}>
                  {result.questions.length} questions
                </Badge>
                {result.warnings.length > 0 && (
                  <Badge variant="secondary">{result.warnings.length} warnings</Badge>
                )}
                {result.errors.length > 0 && (
                  <Badge variant="destructive">{result.errors.length} errors</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{result.statistics.totalQuestions}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{result.statistics.questionsWithAnswers}</div>
                <div className="text-sm text-muted-foreground">With Answers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{result.statistics.questionsWithImages}</div>
                <div className="text-sm text-muted-foreground">With Images</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{result.statistics.questionsWithExplanations}</div>
                <div className="text-sm text-muted-foreground">Explanations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{result.statistics.questionsWithTags}</div>
                <div className="text-sm text-muted-foreground">With Tags</div>
              </div>
            </div>

            {/* Warnings and Errors */}
            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-700">Warnings:</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 bg-yellow-50 p-3 rounded">
                  {result.warnings.slice(0, 5).map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                  {result.warnings.length > 5 && (
                    <li>... and {result.warnings.length - 5} more warnings</li>
                  )}
                </ul>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Errors:</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 bg-destructive/5 p-3 rounded">
                  {result.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Parsed Questions */}
            {result.questions.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <h4 className="font-medium">Parsed Questions:</h4>
                <div className="space-y-4">
                  {result.questions.slice(0, 3).map((question, idx) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">Question {idx + 1}</span>
                              <Badge variant="secondary">{question.difficulty}</Badge>
                              {question.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                              {question.correctAnswer && (
                                <Badge variant="default" className="bg-green-600">
                                  ✓ Answer: {question.correctAnswer}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm bg-muted p-2 rounded">
                              <strong>Q:</strong> {question.stem}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {Object.entries(question.options).map(([letter, option]) => (
                            option && (
                              <div 
                                key={letter} 
                                className={`flex items-center gap-2 p-2 rounded ${
                                  question.correctAnswer === letter 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-background border'
                                }`}
                              >
                                <span className="font-mono text-xs w-4">{letter})</span>
                                <span className="flex-1">{option}</span>
                                {question.correctAnswer === letter && (
                                  <span className="text-green-600 text-xs">✓</span>
                                )}
                              </div>
                            )
                          ))}
                        </div>

                        {question.explanation && (
                          <div className="text-sm">
                            <strong>Explanation:</strong> {question.explanation}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {result.questions.length > 3 && (
                    <div className="text-center text-sm text-muted-foreground">
                      ... and {result.questions.length - 3} more questions
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}