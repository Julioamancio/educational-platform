import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { X, Upload, Image as ImageIcon, Video, FileText, Download } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video' | 'document'
  size: number
  url: string
  uploadedAt: string
}

interface MediaUploadProps {
  onFileSelect?: (file: MediaFile) => void
  acceptedTypes?: string[]
  maxSizeMB?: number
}

export default function MediaUpload({ onFileSelect, acceptedTypes = ['image/*', 'video/*'], maxSizeMB = 50 }: MediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    return 'document'
  }

  const getFileIcon = (type: 'image' | 'video' | 'document') => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-blue-500" />
      case 'video':
        return <Video className="h-8 w-8 text-purple-500" />
      case 'document':
        return <FileText className="h-8 w-8 text-green-500" />
    }
  }

  const simulateUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          clearInterval(interval)
          setUploadProgress(100)
          // Simulate file URL (in real app, this would come from server)
          const url = URL.createObjectURL(file)
          resolve(url)
        } else {
          setUploadProgress(progress)
        }
      }, 200)
    })
  }

  const handleFileSelect = async (selectedFiles: FileList) => {
    const fileList = Array.from(selectedFiles)
    
    // Validate file size
    const oversizedFiles = fileList.filter(file => file.size > maxSizeMB * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(`Some files are too large. Max size: ${maxSizeeMB}MB`)
      return
    }

    setUploading(true)

    try {
      for (const file of fileList) {
        setUploadProgress(0)
        const url = await simulateUpload(file)
        
        const mediaFile: MediaFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: getFileType(file),
          size: file.size,
          url,
          uploadedAt: new Date().toISOString()
        }

        setFiles(prev => [...prev, mediaFile])
        onFileSelect?.(mediaFile)
        toast.success(`${file.name} uploaded successfully`)
      }
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    toast.success('File removed')
  }

  const downloadFile = (file: MediaFile) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Media Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors hover:border-muted-foreground/50"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Drop files here or click to browse</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: Images, Videos, Documents (max {maxSizeMB}MB each)
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            />
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">Uploading...</span>
                <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.type)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Badge variant="outline">
                    {file.type}
                  </Badge>

                  {file.type === 'image' && (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded"
                    />
                  )}

                  {file.type === 'video' && (
                    <video
                      src={file.url}
                      className="w-full h-24 object-cover rounded"
                      controls
                    />
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    {onFileSelect && (
                      <Button
                        size="sm"
                        onClick={() => onFileSelect(file)}
                        className="flex-1"
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}