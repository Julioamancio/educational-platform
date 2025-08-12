import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Download, Users, BookOpen, FileQuestion, TrendingUp, Eye, Timer, Target } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface StudentStats {
  id: string
  name: string
  email: string
  topicsStudied: number
  totalAttempts: number
  correctAnswers: number
  accuracy: number
  timeSpent: number
  lastActivity: string
}

interface TopicStats {
  id: string
  name: string
  studentsEnrolled: number
  questionsAnswered: number
  averageAccuracy: number
  averageTimeSpent: number
}

interface QuestionStats {
  id: string
  title: string
  topic: string
  totalAttempts: number
  correctAnswers: number
  accuracy: number
  averageTimeSpent: number
  difficulty: string
}

export default function ReportsManagement() {
  const [users] = useKV('users', [])
  const [topics] = useKV('topics', [])
  const [questions] = useKV('questions', [])
  const [attempts] = useKV('attempts', [])
  const [studyLogs] = useKV('studyLogs', [])
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  
  // Filter students only
  const students = users.filter(user => user.role === 'student')
  
  // Calculate student statistics
  const studentStats: StudentStats[] = students.map(student => {
    const studentAttempts = attempts.filter(attempt => attempt.userId === student.id)
    const studentLogs = studyLogs.filter(log => log.userId === student.id)
    
    const correctAnswers = studentAttempts.filter(attempt => attempt.isCorrect).length
    const totalAttempts = studentAttempts.length
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0
    const timeSpent = studentAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0)
    
    const uniqueTopics = new Set([
      ...studentLogs.map(log => {
        const content = questions.find(q => q.id === log.contentId) || topics.find(t => t.id === log.contentId)
        return content?.topicId || 'unknown'
      }),
      ...studentAttempts.map(attempt => {
        const question = questions.find(q => q.id === attempt.questionId)
        return question?.topicId || 'unknown'
      })
    ])

    const lastAttempt = studentAttempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      topicsStudied: uniqueTopics.size,
      totalAttempts,
      correctAnswers,
      accuracy,
      timeSpent,
      lastActivity: lastAttempt?.createdAt || 'Never'
    }
  })

  // Calculate topic statistics
  const topicStats: TopicStats[] = topics.map(topic => {
    const topicQuestions = questions.filter(q => q.topicId === topic.id)
    const topicAttempts = attempts.filter(attempt => {
      const question = questions.find(q => q.id === attempt.questionId)
      return question?.topicId === topic.id
    })
    
    const studentsWithAttempts = new Set(topicAttempts.map(attempt => attempt.userId))
    const correctAnswers = topicAttempts.filter(attempt => attempt.isCorrect).length
    const totalAttempts = topicAttempts.length
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0
    const averageTimeSpent = totalAttempts > 0 ? topicAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / totalAttempts : 0

    return {
      id: topic.id,
      name: topic.name,
      studentsEnrolled: studentsWithAttempts.size,
      questionsAnswered: totalAttempts,
      averageAccuracy: accuracy,
      averageTimeSpent
    }
  })

  // Calculate question statistics
  const questionStats: QuestionStats[] = questions.map(question => {
    const questionAttempts = attempts.filter(attempt => attempt.questionId === question.id)
    const correctAnswers = questionAttempts.filter(attempt => attempt.isCorrect).length
    const totalAttempts = questionAttempts.length
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0
    const averageTimeSpent = totalAttempts > 0 ? questionAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / totalAttempts : 0
    
    const topic = topics.find(t => t.id === question.topicId)

    return {
      id: question.id,
      title: question.title,
      topic: topic?.name || 'Unknown',
      totalAttempts,
      correctAnswers,
      accuracy,
      averageTimeSpent,
      difficulty: question.difficulty || 'N/A'
    }
  })

  // Prepare chart data
  const topicAccuracyData = topicStats.map(topic => ({
    name: topic.name.length > 15 ? topic.name.substring(0, 15) + '...' : topic.name,
    accuracy: topic.averageAccuracy,
    attempts: topic.questionsAnswered
  }))

  const difficultyData = questions.reduce((acc, question) => {
    const questionAttempts = attempts.filter(attempt => attempt.questionId === question.id)
    const accuracy = questionAttempts.length > 0 ? 
      (questionAttempts.filter(attempt => attempt.isCorrect).length / questionAttempts.length) * 100 : 0
    
    const difficulty = question.difficulty || 'N/A'
    if (!acc[difficulty]) {
      acc[difficulty] = { difficulty, totalAccuracy: 0, count: 0 }
    }
    acc[difficulty].totalAccuracy += accuracy
    acc[difficulty].count += 1
    return acc
  }, {} as any)

  const difficultyChartData = Object.values(difficultyData).map((item: any) => ({
    difficulty: item.difficulty,
    accuracy: item.count > 0 ? item.totalAccuracy / item.count : 0
  }))

  const pieChartData = [
    { name: 'Correct', value: attempts.filter(a => a.isCorrect).length, color: '#10b981' },
    { name: 'Incorrect', value: attempts.filter(a => !a.isCorrect).length, color: '#ef4444' }
  ]

  // Summary metrics
  const totalStudents = students.length
  const totalQuestions = questions.length
  const totalAttempts = attempts.length
  const overallAccuracy = totalAttempts > 0 ? (attempts.filter(a => a.isCorrect).length / totalAttempts) * 100 : 0

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success(`${filename} exported successfully`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of platform performance and student progress
          </p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <FileQuestion className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{totalQuestions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Attempts</p>
                <p className="text-2xl font-bold">{totalAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Accuracy</p>
                <p className="text-2xl font-bold">{overallAccuracy.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Topic</CardTitle>
                <CardDescription>Average accuracy percentage per topic</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topicAccuracyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Answer Distribution</CardTitle>
                <CardDescription>Overall correct vs incorrect answers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Difficulty</CardTitle>
                <CardDescription>How students perform by question difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={difficultyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="difficulty" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Student Performance</h3>
            <Button 
              variant="outline" 
              onClick={() => exportToCSV(studentStats, 'student-performance')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Student</th>
                      <th className="p-4 font-medium">Topics Studied</th>
                      <th className="p-4 font-medium">Attempts</th>
                      <th className="p-4 font-medium">Accuracy</th>
                      <th className="p-4 font-medium">Time Spent (min)</th>
                      <th className="p-4 font-medium">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentStats.map((student) => (
                      <tr key={student.id} className="border-b">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </td>
                        <td className="p-4">{student.topicsStudied}</td>
                        <td className="p-4">{student.totalAttempts}</td>
                        <td className="p-4">
                          <Badge variant={student.accuracy >= 70 ? "default" : "destructive"}>
                            {student.accuracy.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-4">{Math.round(student.timeSpent / 60)}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {student.lastActivity !== 'Never' ? 
                            new Date(student.lastActivity).toLocaleDateString() : 
                            'Never'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Topic Performance</h3>
            <Button 
              variant="outline" 
              onClick={() => exportToCSV(topicStats, 'topic-performance')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Topic</th>
                      <th className="p-4 font-medium">Students Enrolled</th>
                      <th className="p-4 font-medium">Questions Answered</th>
                      <th className="p-4 font-medium">Average Accuracy</th>
                      <th className="p-4 font-medium">Avg Time per Question (sec)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topicStats.map((topic) => (
                      <tr key={topic.id} className="border-b">
                        <td className="p-4 font-medium">{topic.name}</td>
                        <td className="p-4">{topic.studentsEnrolled}</td>
                        <td className="p-4">{topic.questionsAnswered}</td>
                        <td className="p-4">
                          <Badge variant={topic.averageAccuracy >= 70 ? "default" : "destructive"}>
                            {topic.averageAccuracy.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-4">{Math.round(topic.averageTimeSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Question Performance</h3>
            <Button 
              variant="outline" 
              onClick={() => exportToCSV(questionStats, 'question-performance')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Question</th>
                      <th className="p-4 font-medium">Topic</th>
                      <th className="p-4 font-medium">Difficulty</th>
                      <th className="p-4 font-medium">Attempts</th>
                      <th className="p-4 font-medium">Accuracy</th>
                      <th className="p-4 font-medium">Avg Time (sec)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionStats.map((question) => (
                      <tr key={question.id} className="border-b">
                        <td className="p-4">
                          <p className="font-medium truncate max-w-xs" title={question.title}>
                            {question.title}
                          </p>
                        </td>
                        <td className="p-4">{question.topic}</td>
                        <td className="p-4">
                          <Badge variant="outline">{question.difficulty}</Badge>
                        </td>
                        <td className="p-4">{question.totalAttempts}</td>
                        <td className="p-4">
                          <Badge variant={question.accuracy >= 70 ? "default" : "destructive"}>
                            {question.accuracy.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-4">{Math.round(question.averageTimeSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}