import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Video, File } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MediaUploadProps {
  onUpload: (files: FileUploadResult[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  title?: string
}

interface FileUploadResult {
  file: File
  url: string
  type: 'image' | 'video' | 'document'
  name: string
}

export default function MediaUpload({ 
  onUpload, 
  accept = "image/*,video/*,.doc,.docx", 
  multiple = true,
  maxSize = 50,
  title = "Upload Media Files"
}: MediaUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResult[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    return 'document'
  }

  const getFileIcon = (type: 'image' | 'video' | 'document') => {
    switch (type) {
      case 'image': return <ImageIcon size={24} />
      case 'video': return <Video size={24} />
      case 'document': return <File size={24} />
    }
  }

  const processFiles = async (files: FileList | null) => {
    if (!files) return

    setUploading(true)
    const results: FileUploadResult[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is ${maxSize}MB`)
          continue
        }

        // Create object URL for preview
        const url = URL.createObjectURL(file)
        const type = getFileType(file)

        results.push({
          file,
          url,
          type,
          name: file.name
        })
      }

      setUploadedFiles(prev => [...prev, ...results])
      onUpload(results)
      toast.success(`${results.length} file(s) uploaded successfully`)

    } catch (error) {
      toast.error('Error uploading files')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    processFiles(e.dataTransfer.files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files)
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    const fileToRemove = uploadedFiles[index]
    URL.revokeObjectURL(fileToRemove.url)
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-muted">
              <Upload size={32} className="text-muted-foreground" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports images, videos, and Word documents (max {maxSize}MB each)
              </p>
            </div>

            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-auto"
            >
              {uploading ? 'Uploading...' : 'Select Files'}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedFiles.map((file, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {file.type === 'image' ? (
                        <img 
                          src={file.url} 
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(file.type)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X size={16} />
                    </Button>
                  </div>

                  {file.type === 'video' && (
                    <video 
                      src={file.url} 
                      className="w-full mt-2 rounded"
                      controls
                      style={{ maxHeight: '120px' }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}