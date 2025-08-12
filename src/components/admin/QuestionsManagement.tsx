import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { Topic, Question } from '@/types'
import { Plus, PencilSimple, Trash, Question as QuestionIcon, Eye, EyeSlash, Upload, FileText, Brain, Target } from '@phosphor-icons/react'
import { toast } from 'sonner'
import MediaUpload from '@/components/MediaUpload'
import WordImport from '@/components/admin/WordImport'

export default function QuestionsManagement() {
  const [topics] = useKV<Topic[]>('topics', [])
  const [questions, setQuestions] = useKV<Question[]>('questions', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [activeTab, setActiveTab] = useState('manage')
  const [questionMedia, setQuestionMedia] = useState<any[]>([])

  const handleMediaUpload = (files: any[]) => {
    setQuestionMedia(prev => [...prev, ...files])
  }

  const handleWordImport = (importedQuestions: any[], topicId: string) => {
    const formattedQuestions: Question[] = importedQuestions.map(q => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      topicId: topicId,
      title: q.title,
      stemHtml: q.stem,
      optionA: q.options.a,
      optionB: q.options.b,
      optionC: q.options.c,
      optionD: q.options.d,
      optionE: q.options.e,
      correctOption: q.correctOption.toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E',
      commentHtml: q.explanation || '',
      difficulty: q.difficulty as Question['difficulty'],
      tags: [],
      isPublished: true,
      createdAt: new Date().toISOString(),
      mediaUrls: q.images || []
    }))

    setQuestions(currentQuestions => [...currentQuestions, ...formattedQuestions])
    setActiveTab('manage')
    toast.success(`Imported ${formattedQuestions.length} questions successfully`)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const questionData = {
      topicId: formData.get('topicId') as string,
      title: formData.get('title') as string,
      stemHtml: formData.get('stemHtml') as string,
      optionA: formData.get('optionA') as string,
      optionB: formData.get('optionB') as string,
      optionC: formData.get('optionC') as string,
      optionD: formData.get('optionD') as string,
      optionE: formData.get('optionE') as string,
      correctOption: formData.get('correctOption') as 'A' | 'B' | 'C' | 'D' | 'E',
      commentHtml: formData.get('commentHtml') as string,
      difficulty: formData.get('difficulty') as Question['difficulty'],
      tags: (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean),
      isPublished: formData.get('isPublished') === 'on'
    }

    if (editingQuestion) {
      setQuestions(currentQuestions => 
        currentQuestions.map(q => 
          q.id === editingQuestion.id 
            ? { ...q, ...questionData }
            : q
        )
      )
      toast.success('Question updated successfully')
    } else {
      const newQuestion: Question = {
        id: Date.now().toString(),
        ...questionData,
        createdAt: new Date().toISOString(),
        mediaUrls: questionMedia.map(m => m.url)
      }
      setQuestions(currentQuestions => [...currentQuestions, newQuestion])
      toast.success('Question created successfully')
    }

    setIsDialogOpen(false)
    setEditingQuestion(null)
    setQuestionMedia([])
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setIsDialogOpen(true)
  }

  const handleDelete = (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(currentQuestions => currentQuestions.filter(q => q.id !== questionId))
      toast.success('Question deleted successfully')
    }
  }

  const togglePublished = (questionId: string) => {
    setQuestions(currentQuestions => 
      currentQuestions.map(q => 
        q.id === questionId 
          ? { ...q, isPublished: !q.isPublished }
          : q
      )
    )
  }

  const getTopicName = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId)
    return topic?.name || 'Unknown Topic'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Questions Management</h1>
          <p className="text-muted-foreground">Create and manage practice questions</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <QuestionIcon size={16} />
            Manage Questions
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileText size={16} />
            Import from Word
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Upload size={16} />
            Media Library
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <QuestionIcon size={16} />
            Test Parser
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingQuestion(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? 'Edit Question' : 'Create New Question'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingQuestion ? 'Update question information' : 'Add a new practice question with optional media'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="topicId">Topic</Label>
                      <Select name="topicId" defaultValue={editingQuestion?.topicId || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map(topic => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select name="difficulty" defaultValue={editingQuestion?.difficulty || 'A1'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A1">A1</SelectItem>
                          <SelectItem value="A2">A2</SelectItem>
                          <SelectItem value="B1">B1</SelectItem>
                          <SelectItem value="B2">B2</SelectItem>
                          <SelectItem value="C1">C1</SelectItem>
                          <SelectItem value="C2">C2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Question Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Present Simple - Basic Form"
                      defaultValue={editingQuestion?.title || ''}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stemHtml">Question Text</Label>
                    <Textarea
                      id="stemHtml"
                      name="stemHtml"
                      placeholder="Write your question here..."
                      defaultValue={editingQuestion?.stemHtml || ''}
                      rows={4}
                      required
                    />
                  </div>

                  {/* Media Upload Section */}
                  <div className="space-y-2">
                    <Label>Media Files (Images/Videos)</Label>
                    <MediaUpload 
                      onUpload={handleMediaUpload}
                      accept="image/*,video/*"
                      title="Upload Question Media"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Answer Options</Label>
                    {['A', 'B', 'C', 'D', 'E'].map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <Label className="w-6 text-center">{option}:</Label>
                        <Input
                          name={`option${option}`}
                          placeholder={`Option ${option}`}
                          defaultValue={editingQuestion?.[`option${option}` as keyof Question] as string || ''}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="correctOption">Correct Answer</Label>
                    <Select name="correctOption" defaultValue={editingQuestion?.correctOption || 'A'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="commentHtml">Explanation</Label>
                    <Textarea
                      id="commentHtml"
                      name="commentHtml"
                      placeholder="Explain why this is the correct answer..."
                      defaultValue={editingQuestion?.commentHtml || ''}
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      placeholder="grammar, present, simple"
                      defaultValue={editingQuestion?.tags.join(', ') || ''}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isPublished" 
                      name="isPublished"
                      defaultChecked={editingQuestion?.isPublished ?? true}
                    />
                    <Label htmlFor="isPublished">Published</Label>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingQuestion ? 'Update Question' : 'Create Question'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false)
                        setQuestionMedia([])
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {questions.map((question) => (
              <Card key={question.id} className={!question.isPublished ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <QuestionIcon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{question.title}</CardTitle>
                        <Badge variant="outline">{question.difficulty}</Badge>
                        {question.isPublished ? (
                          <Badge variant="default" className="bg-secondary">
                            <Eye className="w-3 h-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Topic: {getTopicName(question.topicId)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(question)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(question.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Question:</p>
                      <p className="text-sm">{question.stemHtml}</p>
                    </div>

                    {/* Display media if available */}
                    {question.mediaUrls && question.mediaUrls.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Media:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {question.mediaUrls.map((url, index) => (
                            <div key={index} className="relative">
                              {url.includes('video') || url.includes('.mp4') || url.includes('.webm') ? (
                                <video 
                                  src={url} 
                                  className="w-full h-20 object-cover rounded border"
                                  controls
                                />
                              ) : (
                                <img 
                                  src={url} 
                                  alt={`Question media ${index + 1}`}
                                  className="w-full h-20 object-cover rounded border"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {['A', 'B', 'C', 'D', 'E'].map((option) => {
                        const optionText = question[`option${option}` as keyof Question] as string
                        const isCorrect = question.correctOption === option
                        return optionText ? (
                          <div key={option} className={`p-2 rounded border ${isCorrect ? 'bg-secondary/50 border-secondary' : ''}`}>
                            <span className="font-medium">{option}:</span> {optionText}
                            {isCorrect && <span className="ml-2 text-secondary-foreground">✓</span>}
                          </div>
                        ) : null
                      })}
                    </div>
                    
                    {question.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {question.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant={question.isPublished ? "outline" : "default"}
                        onClick={() => togglePublished(question.id)}
                      >
                        {question.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {questions.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <QuestionIcon className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No questions yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first question to start building practice exercises
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Question
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <WordImport onQuestionsImported={handleWordImport} />
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>
                Upload and manage images and videos for your questions and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MediaUpload 
                onFileSelect={(file) => {
                  toast.success(`${file.name} uploaded to media library`)
                }}
                acceptedTypes={['image/*', 'video/*']}
                maxSizeMB={50}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Import Testing</CardTitle>
              <CardDescription>
                Test document import functionality with sample files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Document Testing</h3>
                <p className="text-muted-foreground mb-4">
                  Upload sample documents to test the import functionality
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Test Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}