import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [activeCategory, setActiveCategory] = useState('faces')

  const emojiCategories = {
    faces: {
      name: '😀 Rostos',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
        '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
        '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
      ]
    },
    gestures: {
      name: '👋 Gestos',
      emojis: [
        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
        '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
        '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'
      ]
    },
    activities: {
      name: '⚽ Atividades',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
        '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁',
        '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌'
      ]
    },
    objects: {
      name: '📱 Objetos',
      emojis: [
        '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💾', '💿', '📀',
        '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟',
        '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️'
      ]
    },
    nature: {
      name: '🌱 Natureza',
      emojis: [
        '🌱', '🌿', '☘️', '🍀', '🎋', '🎍', '🌾', '🌵', '🌲', '🌳',
        '🌴', '🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '💐', '🌼', '🌻',
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'
      ]
    },
    food: {
      name: '🍎 Comida',
      emojis: [
        '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑',
        '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒',
        '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞'
      ]
    }
  }

  return (
    <Card className="w-80 shadow-lg border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Selecionar Emoji</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-6 w-full h-auto p-1">
            {Object.entries(emojiCategories).map(([key, category]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="p-2 text-lg"
                title={category.name}
              >
                {category.emojis[0]}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(emojiCategories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-2">
              <ScrollArea className="h-40 px-3">
                <div className="grid grid-cols-8 gap-1 pb-3">
                  {category.emojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8 text-lg hover:bg-muted/50"
                      onClick={() => onEmojiSelect(emoji)}
                      title={emoji}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default EmojiPicker