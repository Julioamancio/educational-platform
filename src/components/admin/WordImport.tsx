import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Eye, CheckCircle, XCircle, Warning, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useKV } from '@github/spark/hooks'
import { wordParser, type ParsedQuestion, type ParsingResult } from '@/utils/wordParser'

interface WordImportProps {
  onQuestionsImported: (questions: ParsedQuestion[]) => void
}

export default function WordImport({ onQuestionsImported }: WordImportProps) {
  const [topics] = useKV<any[]>('topics', [])
  const [importing, setImporting] = useState(false)
  const [parsingResult, setParsingResult] = useState<ParsingResult | null>(null)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(doc|docx|txt)$/i)) {
      toast.error('Please select a Word document (.doc, .docx) or text file')
      return
    }

    setImporting(true)
    
    try {
      // Show progress toast
      const progressToast = toast.loading('Processing document...', {
        description: 'Extracting questions and images from your document'
      })
      
      const result = await wordParser.parseDocument(file)
      
      // Dismiss progress toast
      toast.dismiss(progressToast)
      
      if (result.errors.length > 0) {
        toast.error('Document parsing failed', {
          description: result.errors[0]
        })
        return
      }

      if (result.questions.length === 0) {
        toast.error('No questions were found in the document.', {
          description: 'Please check that your document follows the expected format with numbered questions and multiple choice options.'
        })
        return
      }

      setParsingResult(result)
      setPreviewMode(true)
      
      // Show detailed import summary
      const stats = result.statistics
      const summaryLines = [
        `📊 Successfully detected ${stats.totalQuestions} question${stats.totalQuestions !== 1 ? 's' : ''}`,
        `✅ ${stats.questionsWithAnswers} with correct answers`,
        `🖼️ ${stats.questionsWithImages} with embedded images`,
        `💡 ${stats.questionsWithExplanations} with explanations`,
        `🏷️ ${stats.questionsWithTags} with tags`
      ]

      if (result.warnings.length > 0) {
        summaryLines.push(`⚠️ ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`)
      }

      summaryLines.push('', '👀 Review the questions below and click Import when ready!')
      
      toast.success('Document parsed successfully!', {
        description: summaryLines.join('\n'),
        duration: 6000
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error('Failed to import questions from document', {
        description: errorMessage
      })
      console.error('Import error:', error)
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImportQuestions = () => {
    if (!selectedTopic || !parsingResult) {
      toast.error('Please select a topic for the imported questions')
      return
    }

    const questionsWithTopic = parsingResult.questions.map(q => ({
      ...q,
      topicId: selectedTopic
    }))

    onQuestionsImported(questionsWithTopic)
    setParsingResult(null)
    setPreviewMode(false)
    setSelectedTopic('')
    
    toast.success(`${questionsWithTopic.length} questions imported successfully`)
  }

  const editQuestion = (index: number, field: string, value: any) => {
    if (!parsingResult) return
    
    const updatedQuestions = parsingResult.questions.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    )
    
    setParsingResult({
      ...parsingResult,
      questions: updatedQuestions
    })
  }

  if (previewMode && parsingResult && parsingResult.questions.length > 0) {
    const { questions, statistics, warnings, errors } = parsingResult
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye size={20} />
            Preview Imported Questions ({questions.length})
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
                  setParsingResult(null)
                  setPreviewMode(false)
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImportQuestions}
                disabled={!selectedTopic}
              >
                Import {questions.length} Questions
              </Button>
            </div>
          </div>

          {/* Show warnings and errors */}
          {warnings.length > 0 && (
            <Alert>
              <Warning className="h-4 w-4" />
              <AlertDescription>
                <strong>Warnings ({warnings.length}):</strong>
                <ul className="mt-1 text-sm list-disc list-inside">
                  {warnings.slice(0, 5).map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                  {warnings.length > 5 && <li>... and {warnings.length - 5} more</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Errors ({errors.length}):</strong>
                <ul className="mt-1 text-sm list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced Import Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{statistics.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{statistics.questionsWithAnswers}</div>
              <div className="text-sm text-muted-foreground">With Answers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{statistics.questionsWithImages}</div>
              <div className="text-sm text-muted-foreground">With Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{statistics.questionsWithExplanations}</div>
              <div className="text-sm text-muted-foreground">With Explanations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{statistics.questionsWithTags}</div>
              <div className="text-sm text-muted-foreground">With Tags</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="font-medium">Question {index + 1}</Label>
                        <Badge variant="secondary">{question.difficulty}</Badge>
                        {question.tags && question.tags.length > 0 && question.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        {question.correctAnswer && (
                          <Badge variant="default" className="bg-green-600">
                            ✓ Answer: {question.correctAnswer}
                          </Badge>
                        )}
                      </div>
                      <Textarea
                        value={question.stem}
                        onChange={(e) => editQuestion(index, 'stem', e.target.value)}
                        className="mt-1"
                        rows={3}
                        placeholder="Question text..."
                      />
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
                          placeholder={`Option ${letter}`}
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
                        placeholder="Explanation for the correct answer..."
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
            <h4 className="font-medium mb-2">📝 Expected Format (Flexible):</h4>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
{`1. What is the present tense of "to be" for "I"?
A) am
B) is
C) are
D) was
E) were

Correct Answer: A
Explanation: The present tense of "to be" for first person singular is "am".
Difficulty: A1
Tags: grammar, present tense

2. Choose the correct article: "I saw ___ elephant."
A) a
B) an
C) the
D) some
E) any

Correct Answer: B
Explanation: Use "an" before words starting with vowel sounds.
Difficulty: A1
Tags: grammar, articles`}
            </pre>
          </div>

          <div className="text-sm text-muted-foreground space-y-3">
            <div>
              <h4 className="font-medium text-foreground mb-1">🔧 Supported formats:</h4>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><strong>.docx files:</strong> Full support with embedded images and formatting</li>
                <li><strong>.doc files:</strong> Basic text extraction</li>
                <li><strong>.txt files:</strong> Plain text parsing</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">🤖 Auto-detection features:</h4>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><strong>Smart Question Detection:</strong> Finds questions even with varied formatting</li>
                <li><strong>Flexible Answer Patterns:</strong> Detects A-E options in multiple formats</li>
                <li><strong>Image Extraction:</strong> Automatically extracts embedded images from .docx files</li>
                <li><strong>Metadata Parsing:</strong> Extracts difficulty, tags, and explanations</li>
                <li><strong>Answer Detection:</strong> Auto-identifies correct answers or provides fallbacks</li>
                <li><strong>Format Flexibility:</strong> Handles various question numbering and styling</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">📊 Import Statistics:</h4>
              <p className="ml-2">After processing, you'll see a detailed breakdown with question count, answers detected, images found, and explanations available.</p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">💡 Tips for best results:</h4>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Number your questions (1., 2., 3., etc.)</li>
                <li>Use A), B), C), D), E) for options</li>
                <li>Include "Correct Answer: X" line</li>
                <li>Add explanations with "Explanation: ..." line</li>
                <li>Specify difficulty with "Difficulty: A1/A2/B1/B2/C1/C2"</li>
                <li>Add tags with "Tags: comma, separated, values"</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}