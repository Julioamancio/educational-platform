import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { seedUsers, seedTopics, seedContents, seedQuestions } from '@/utils/seedData'
import { User } from '@/contexts/AuthContext'
import { Topic, Content, Question } from '@/types'

export function useInitializeData() {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [topics, setTopics] = useKV<Topic[]>('topics', [])
  const [contents, setContents] = useKV<Content[]>('contents', [])
  const [questions, setQuestions] = useKV<Question[]>('questions', [])
  const [initialized, setInitialized] = useKV<boolean>('dataInitialized', false)

  useEffect(() => {
    if (!initialized && users.length === 0) {
      // Initialize with seed data
      setUsers(seedUsers)
      setTopics(seedTopics)
      setContents(seedContents)
      setQuestions(seedQuestions)
      setInitialized(true)
    }
  }, [initialized, users.length, setUsers, setTopics, setContents, setQuestions, setInitialized])

  return { isInitialized: initialized }
}