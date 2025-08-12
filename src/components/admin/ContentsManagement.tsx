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
import { useKV } from '@github/spark/hooks'
import { Topic, Content } from '@/types'
import { Plus, PencilSimple, Trash, FileText, Eye, EyeSlash, Clock, Image, VideoCamera, Upload, ArticleNyTimes } from '@phosphor-icons/react'
import { toast } from 'sonner'
import MediaUpload from '@/components/MediaUpload'

export default function ContentsManagement() {
  const [topics] = useKV<Topic[]>('topics', [])
  const [contents, setContents] = useKV<Content[]>('contents', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [contentMedia, setContentMedia] = useState<any[]>([])

  const handleMediaUpload = (files: any[]) => {
    setContentMedia(prev => [...prev, ...files])
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const contentData = {
      topicId: formData.get('topicId') as string,
      title: formData.get('title') as string,
      bodyHtml: formData.get('bodyHtml') as string,
      mediaUrl: formData.get('mediaUrl') as string,
      estimatedTimeMin: parseInt(formData.get('estimatedTimeMin') as string) || 5,
      tags: (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean),
      isPublished: formData.get('isPublished') === 'on'
    }

    if (editingContent) {
      setContents(currentContents => 
        currentContents.map(c => 
          c.id === editingContent.id 
            ? { ...c, ...contentData, mediaUrls: contentMedia.map(m => m.url) }
            : c
        )
      )
      toast.success('Content updated successfully')
    } else {
      const newContent: Content = {
        id: Date.now().toString(),
        ...contentData,
        createdAt: new Date().toISOString(),
        mediaUrls: contentMedia.map(m => m.url)
      }
      setContents(currentContents => [...currentContents, newContent])
      toast.success('Content created successfully')
    }

    setIsDialogOpen(false)
    setEditingContent(null)
    setContentMedia([])
  }

  const handleEdit = (content: Content) => {
    setEditingContent(content)
    setIsDialogOpen(true)
  }

  const handleDelete = (contentId: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      setContents(currentContents => currentContents.filter(c => c.id !== contentId))
      toast.success('Content deleted successfully')
    }
  }

  const togglePublished = (contentId: string) => {
    setContents(currentContents => 
      currentContents.map(c => 
        c.id === contentId 
          ? { ...c, isPublished: !c.isPublished }
          : c
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
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Create and manage educational content</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingContent(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? 'Edit Content' : 'Create New Content'}
              </DialogTitle>
              <DialogDescription>
                {editingContent ? 'Update content information' : 'Add new educational content with media'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topicId">Topic</Label>
                  <Select name="topicId" defaultValue={editingContent?.topicId || ''}>
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
                  <Label htmlFor="estimatedTimeMin">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTimeMin"
                    name="estimatedTimeMin"
                    type="number"
                    min="1"
                    max="180"
                    defaultValue={editingContent?.estimatedTimeMin || 5}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Content Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Introduction to Present Simple"
                  defaultValue={editingContent?.title || ''}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bodyHtml">Content Body</Label>
                <Textarea
                  id="bodyHtml"
                  name="bodyHtml"
                  placeholder="Write your educational content here... (HTML supported)"
                  defaultValue={editingContent?.bodyHtml || ''}
                  rows={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediaUrl">External Media URL (optional)</Label>
                <Input
                  id="mediaUrl"
                  name="mediaUrl"
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  defaultValue={editingContent?.mediaUrl || ''}
                />
              </div>

              {/* Media Upload Section */}
              <div className="space-y-2">
                <Label>Upload Media Files</Label>
                <MediaUpload 
                  onFileSelect={(file) => {
                    setContentMedia(prev => [...prev, file])
                    toast.success(`${file.name} added to content media`)
                  }}
                  acceptedTypes={['image/*', 'video/*']}
                  maxSizeMB={50}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="grammar, beginner, introduction"
                  defaultValue={editingContent?.tags.join(', ') || ''}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isPublished" 
                  name="isPublished"
                  defaultChecked={editingContent?.isPublished ?? true}
                />
                <Label htmlFor="isPublished">Published</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingContent ? 'Update Content' : 'Create Content'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false)
                    setContentMedia([])
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
        {contents.map((content) => (
          <Card key={content.id} className={!content.isPublished ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{content.title}</CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {content.estimatedTimeMin}min
                    </Badge>
                    {content.isPublished ? (
                      <Badge variant="default" className="bg-secondary">
                        <Eye className="w-3 h-3 mr-1" />
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeSlash className="w-3 h-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Topic: {getTopicName(content.topicId)}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(content)}
                  >
                    <PencilSimple className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(content.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Content Preview:</p>
                  <div className="text-sm bg-muted/50 p-3 rounded max-h-20 overflow-hidden">
                    <div dangerouslySetInnerHTML={{ 
                      __html: content.bodyHtml.substring(0, 200) + (content.bodyHtml.length > 200 ? '...' : '') 
                    }} />
                  </div>
                </div>

                {/* Display media if available */}
                {((content.mediaUrls && content.mediaUrls.length > 0) || content.mediaUrl) && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Media:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {content.mediaUrls?.map((url, index) => (
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
                              alt={`Content media ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                          )}
                        </div>
                      ))}
                      {content.mediaUrl && (
                        <div className="relative">
                          <div className="w-full h-20 bg-muted rounded border flex items-center justify-center">
                            <FileText size={24} className="text-muted-foreground" />
                          </div>
                          <p className="text-xs text-center mt-1 truncate">External Media</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {content.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {content.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-muted-foreground">
                    Created: {new Date(content.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    variant={content.isPublished ? "outline" : "default"}
                    onClick={() => togglePublished(content.id)}
                  >
                    {content.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {contents.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No content yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first educational content to start building your course
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Content
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}