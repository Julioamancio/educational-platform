import { ChatMessage, User } from '@/types'

export const initializeSampleMessages = (): {
  messages: ChatMessage[]
} => {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const messages: ChatMessage[] = [
    {
      id: '1',
      senderId: 'admin-1',
      receiverId: undefined,
      message: 'Bem-vindos ao nosso sistema de aprendizado! 🎉 Estou aqui para ajudar vocês.',
      isGlobal: true,
      createdAt: oneDayAgo.toISOString(),
      senderName: 'Administrador',
      senderRole: 'admin'
    },
    {
      id: '2',
      senderId: 'admin-1',
      receiverId: undefined,
      message: 'Lembrem-se de praticar regularmente e não hesitem em fazer perguntas! 📚',
      isGlobal: true,
      createdAt: twoHoursAgo.toISOString(),
      senderName: 'Administrador',
      senderRole: 'admin'
    },
    {
      id: '3',
      senderId: 'student-1',
      receiverId: 'admin-1',
      message: 'Olá! Tenho uma dúvida sobre o exercício de gramática. Poderia me ajudar?',
      isGlobal: false,
      createdAt: oneHourAgo.toISOString(),
      senderName: 'Ana Silva',
      senderRole: 'student'
    },
    {
      id: '4',
      senderId: 'admin-1',
      receiverId: 'student-1',
      message: 'Claro, Ana! Qual parte específica está causando dificuldade? 😊',
      isGlobal: false,
      createdAt: new Date(oneHourAgo.getTime() + 10 * 60 * 1000).toISOString(),
      senderName: 'Administrador',
      senderRole: 'admin'
    },
    {
      id: '5',
      senderId: 'student-2',
      receiverId: undefined,
      message: 'O conteúdo está excelente! Muito obrigado pelas explicações detalhadas! 👏',
      isGlobal: true,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      senderName: 'João Santos',
      senderRole: 'student'
    }
  ]

  return { messages }
}