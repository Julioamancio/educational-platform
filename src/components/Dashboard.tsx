import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import { useKV } from '@github/spark/hooks'
import { Topic, Content, Question, Attempt, StudyLog } from '@/types'
import { Book, Question as QuestionIcon, TrendUp, Users, CheckCircle } from '@phosphor-icons/react'

export default function Dashboard() {
  const { user } = useAuth()
  const [topics] = useKV<Topic[]>('topics', [])
  const [contents] = useKV<Content[]>('contents', [])
  const [questions] = useKV<Question[]>('questions', [])
  const [attempts] = useKV<Attempt[]>('attempts', [])
  const [studyLogs] = useKV<StudyLog[]>('studyLogs', [])
  const [users] = useKV<any[]>('users', [])

  if (user?.role === 'admin') {
    const totalStudents = users.filter(u => u.role === 'student').length
    const totalQuestions = questions.filter(q => q.isPublished).length
    const totalAttempts = attempts.length
    const avgAccuracy = attempts.length > 0 
      ? Math.round((attempts.filter(a => a.isCorrect).length / attempts.length) * 100)
      : 0

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your learning platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Published Questions</CardTitle>
              <QuestionIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuestions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <TrendUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAttempts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgAccuracy}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest student attempts and study sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {attempts.slice(-5).reverse().map((attempt) => {
                const question = questions.find(q => q.id === attempt.questionId)
                const student = users.find(u => u.id === attempt.userId)
                return (
                  <div key={attempt.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{student?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {question?.title || 'Unknown Question'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      attempt.isCorrect ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'
                    }`}>
                      {attempt.isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                  </div>
                )
              })}
              {attempts.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No attempts yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Topic Overview</CardTitle>
              <CardDescription>Content and questions by topic</CardDescription>
            </CardHeader>
            <CardContent>
              {topics.map((topic) => {
                const topicContents = contents.filter(c => c.topicId === topic.id && c.isPublished)
                const topicQuestions = questions.filter(q => q.topicId === topic.id && q.isPublished)
                return (
                  <div key={topic.id} className="py-3 border-b last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{topic.name}</h4>
                      <span className="text-sm text-muted-foreground">
                        {topicContents.length + topicQuestions.length} items
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{topicContents.length} contents</span>
                      <span>{topicQuestions.length} questions</span>
                    </div>
                  </div>
                )
              })}
              {topics.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No topics created yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Student Dashboard
  const userAttempts = attempts.filter(a => a.userId === user?.id)
  const userStudyLogs = studyLogs.filter(s => s.userId === user?.id)
  
  const topicProgress = topics.map(topic => {
    const topicContents = contents.filter(c => c.topicId === topic.id && c.isPublished)
    const topicQuestions = questions.filter(q => q.topicId === topic.id && q.isPublished)
    const studiedContents = userStudyLogs.filter(log => 
      topicContents.some(c => c.id === log.contentId) && log.markedDone
    )
    const attemptedQuestions = userAttempts.filter(a => 
      topicQuestions.some(q => q.id === a.questionId)
    )
    const correctAttempts = attemptedQuestions.filter(a => a.isCorrect)
    
    const totalItems = topicContents.length + topicQuestions.length
    const completedItems = studiedContents.length + correctAttempts.length
    
    return {
      topic,
      progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      accuracy: attemptedQuestions.length > 0 ? Math.round((correctAttempts.length / attemptedQuestions.length) * 100) : 0
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Continue your learning journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
            <Book className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStudyLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
            <QuestionIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAttempts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userAttempts.length > 0 
                ? Math.round((userAttempts.filter(a => a.isCorrect).length / userAttempts.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Topic Progress</CardTitle>
          <CardDescription>Your progress across different topics</CardDescription>
        </CardHeader>
        <CardContent>
          {topicProgress.map(({ topic, progress, accuracy }) => (
            <div key={topic.id} className="py-4 border-b last:border-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{topic.name}</h4>
                <span className="text-sm text-muted-foreground">{progress}% complete</span>
              </div>
              <Progress value={progress} className="h-2 mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{topic.description}</span>
                <span>{accuracy}% accuracy</span>
              </div>
            </div>
          ))}
          {topics.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No topics available yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}