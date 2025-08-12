import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useKV } from '@github/spark/hooks'
import { Topic } from '@/types'
import { Plus, Edit, Trash2, Book } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function TopicsManagement() {
  const [topics, setTopics] = useKV<Topic[]>('topics', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const topicData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      levelMin: formData.get('levelMin') as string,
      levelMax: formData.get('levelMax') as string,
      isActive: formData.get('isActive') === 'on'
    }

    if (editingTopic) {
      setTopics(currentTopics => 
        currentTopics.map(t => 
          t.id === editingTopic.id 
            ? { ...t, ...topicData }
            : t
        )
      )
      toast.success('Topic updated successfully')
    } else {
      const newTopic: Topic = {
        id: Date.now().toString(),
        ...topicData,
        createdAt: new Date().toISOString()
      }
      setTopics(currentTopics => [...currentTopics, newTopic])
      toast.success('Topic created successfully')
    }

    setIsDialogOpen(false)
    setEditingTopic(null)
  }

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic)
    setIsDialogOpen(true)
  }

  const handleDelete = (topicId: string) => {
    if (confirm('Are you sure you want to delete this topic?')) {
      setTopics(currentTopics => currentTopics.filter(t => t.id !== topicId))
      toast.success('Topic deleted successfully')
    }
  }

  const toggleActive = (topicId: string) => {
    setTopics(currentTopics => 
      currentTopics.map(t => 
        t.id === topicId 
          ? { ...t, isActive: !t.isActive }
          : t
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Topics Management</h1>
          <p className="text-muted-foreground">Create and manage learning topics</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTopic(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTopic ? 'Edit Topic' : 'Create New Topic'}
              </DialogTitle>
              <DialogDescription>
                {editingTopic ? 'Update topic information' : 'Add a new topic to your platform'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Topic Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Present Simple"
                  defaultValue={editingTopic?.name || ''}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the topic"
                  defaultValue={editingTopic?.description || ''}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="levelMin">Min Level</Label>
                  <Select name="levelMin" defaultValue={editingTopic?.levelMin || 'A1'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
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
                
                <div className="space-y-2">
                  <Label htmlFor="levelMax">Max Level</Label>
                  <Select name="levelMax" defaultValue={editingTopic?.levelMax || 'A2'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
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
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isActive" 
                  name="isActive"
                  defaultChecked={editingTopic?.isActive ?? true}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTopic ? 'Update Topic' : 'Create Topic'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <Card key={topic.id} className={!topic.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{topic.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(topic)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(topic.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{topic.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Level Range:</span>
                  <span>{topic.levelMin} - {topic.levelMax}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Button
                    size="sm"
                    variant={topic.isActive ? "default" : "secondary"}
                    onClick={() => toggleActive(topic.id)}
                  >
                    {topic.isActive ? 'Active' : 'Inactive'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {topics.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Book className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No topics yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first topic to start organizing your content
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Topic
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}