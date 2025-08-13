export interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'admin' | 'student'
  createdAt: string
  lastLogin?: string
  isOnline?: boolean
  lastSeen?: string
}

export interface Topic {
  id: string
  name: string
  description: string
  levelMin: string
  levelMax: string
  isActive: boolean
  createdAt: string
}

export interface Content {
  id: string
  topicId: string
  title: string
  bodyHtml: string
  mediaUrl: string
  estTimeMin: number
  tags: string[]
  isPublished: boolean
  createdAt: string
}

export interface Question {
  id: string
  topicId: string
  title: string
  stemHtml: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionE: string
  correctOption: 'A' | 'B' | 'C' | 'D' | 'E'
  commentHtml: string
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  tags: string[]
  isPublished: boolean
  createdAt: string
  mediaUrls: string[]
}

export interface Attempt {
  id: string
  userId: string
  questionId: string
  chosenOption: 'A' | 'B' | 'C' | 'D' | 'E'
  isCorrect: boolean
  timeSpentSec: number
  createdAt: string
}

export interface StudyLog {
  id: string
  userId: string
  contentId: string
  markedDone: boolean
  createdAt: string
}

export interface MediaFile {
  id: string
  filename: string
  originalName: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: number
  url: string
  uploadedAt: string
}

export interface ChatMessage {
  id: string
  senderId: string
  receiverId?: string
  message: string
  isGlobal: boolean
  createdAt: string
  emoji?: string
}

export interface ChatRoom {
  id: string
  type: 'global' | 'private'
  title: string
  lastMessage?: {
    id: string
    senderName: string
    message: string
    createdAt: string
  }
  unreadCount: number
}