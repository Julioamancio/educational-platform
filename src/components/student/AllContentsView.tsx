import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Topic, Content, StudyLog } from '@/types'
import { 
  BookOpen, 
  Clock, 
  Search, 
  Filter,
  CheckCircle,
  Image as ImageIcon,
  PlayCircle,
  ArrowRight
} from '@phosphor-icons/react'

interface AllContentsViewProps {
  onViewChange: (view: string, data?: any) => void
}

export default function AllContentsView({ onViewChange }: AllContentsViewProps) {
  const { user } = useAuth()
  const [topics] = useKV<Topic[]>('topics', [])
  const [contents] = useKV<Content[]>('contents', [])
  const [studyLogs] = useKV<StudyLog[]>('study_logs', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')

  const filteredContents = useMemo(() => {
    return contents.filter(content => {
      if (!content.isPublished) return false
      
      const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           content.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesTopic = selectedTopic === 'all' || content.topicId === selectedTopic
      
      return matchesSearch && matchesTopic
    })
  }, [contents, searchTerm, selectedTopic])

  const getTopicName = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId)
    return topic?.name || 'Tópico não encontrado'
  }

  const isContentStudied = (contentId: string) => {
    return studyLogs.some(log => 
      log.userId === user?.id && 
      log.contentId === contentId && 
      log.markedDone
    )
  }

  const startStudying = (content: Content) => {
    onViewChange('study', { 
      topicId: content.topicId, 
      contentId: content.id 
    })
  }

  const activeTopics = topics.filter(t => t.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Estudar Conteúdos</h1>
        <p className="text-muted-foreground">
          Explore todos os conteúdos disponíveis para estudo
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar conteúdos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por tópico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tópicos</SelectItem>
            {activeTopics.map(topic => (
              <SelectItem key={topic.id} value={topic.id}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContents.map((content) => {
          const isStudied = isContentStudied(content.id)
          
          return (
            <Card key={content.id} className="card-hover relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {getTopicName(content.topicId)}
                    </CardDescription>
                  </div>
                  {isStudied && (
                    <Badge variant="default" className="bg-green-100 text-green-800 ml-2">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Estudado
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    {content.estTimeMin} min
                  </Badge>
                  {content.mediaUrl && (
                    <Badge variant="outline">
                      {content.mediaUrl.includes('youtube.com') || content.mediaUrl.includes('youtu.be') ? (
                        <PlayCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <ImageIcon className="w-3 h-3 mr-1" />
                      )}
                      Mídia
                    </Badge>
                  )}
                </div>

                {content.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {content.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {content.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{content.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: content.bodyHtml.length > 150 
                      ? content.bodyHtml.substring(0, 150) + '...' 
                      : content.bodyHtml 
                  }}
                  className="prose prose-sm prose-slate max-w-none mb-4 line-clamp-3"
                />
                
                <Button 
                  onClick={() => startStudying(content)}
                  className="w-full"
                  variant={isStudied ? "outline" : "default"}
                >
                  <BookOpen className="w-4 h-4 mr-2" weight="bold" />
                  {isStudied ? 'Revisar' : 'Estudar'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
        
        {filteredContents.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhum conteúdo encontrado</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || selectedTopic !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há conteúdos disponíveis no momento'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Access to Topics */}
      <div className="mt-8 p-6 bg-muted/30 rounded-lg">
        <h3 className="font-semibold mb-4">Acesso rápido por tópico</h3>
        <div className="flex flex-wrap gap-2">
          {activeTopics.map(topic => (
            <Button
              key={topic.id}
              variant="outline"
              size="sm"
              onClick={() => onViewChange('study', { topicId: topic.id })}
            >
              {topic.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}