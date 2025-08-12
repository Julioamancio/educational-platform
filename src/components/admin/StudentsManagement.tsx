import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useKV } from '@github/spark/hooks'
import { User } from '@/types'
import { Plus, Trash, Users, UserCircle, Check, X, MagnifyingGlass, Funnel, Download, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function StudentsManagement() {
  const [users, setUsers] = useKV<User[]>('users', [])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  // Filter only students
  const students = users.filter(user => user.role === 'student')
  
  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (checked) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handleDeleteStudent = (studentId: string) => {
    setUsers(currentUsers => currentUsers.filter(user => user.id !== studentId))
    setSelectedStudents(prev => {
      const newSelected = new Set(prev)
      newSelected.delete(studentId)
      return newSelected
    })
    toast.success('Student deleted successfully')
    setIsDeleteDialogOpen(false)
    setStudentToDelete(null)
  }

  const handleBulkDelete = () => {
    const selectedIds = Array.from(selectedStudents)
    setUsers(currentUsers => 
      currentUsers.filter(user => !selectedIds.includes(user.id))
    )
    setSelectedStudents(new Set())
    toast.success(`${selectedIds.length} students deleted successfully`)
    setIsBulkDeleteDialogOpen(false)
  }

  const exportStudentsData = () => {
    const studentsData = filteredStudents.map(student => ({
      Name: student.name,
      Email: student.email,
      'Created At': new Date(student.createdAt || '').toLocaleDateString(),
      'Last Login': student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'
    }))

    const csv = [
      Object.keys(studentsData[0] || {}).join(','),
      ...studentsData.map(student => Object.values(student).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Students data exported successfully')
  }

  const allSelected = filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length
  const someSelected = selectedStudents.size > 0 && selectedStudents.size < filteredStudents.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Students Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage student accounts and view their information
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportStudentsData}
            disabled={filteredStudents.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          {selectedStudents.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsBulkDeleteDialogOpen(true)}
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete Selected ({selectedStudents.size})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="whitespace-nowrap">
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Students List</CardTitle>
              <CardDescription>
                View and manage all registered students
              </CardDescription>
            </div>
            
            {filteredStudents.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select all
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {searchTerm ? 'No students found' : 'No students registered'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Students will appear here once they register for the platform'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    selectedStudents.has(student.id) ? 'bg-muted/50 border-primary/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                    />
                    
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Joined: {new Date(student.createdAt || '').toLocaleDateString()}
                        </span>
                        {student.lastLogin && (
                          <span className="text-xs text-muted-foreground">
                            Last login: {new Date(student.lastLogin).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Student</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setStudentToDelete(student.id)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-destructive" />
              Delete Student
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
              All their progress and data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={() => studentToDelete && handleDeleteStudent(studentToDelete)}
              className="flex-1"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete Student
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setStudentToDelete(null)
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-destructive" />
              Delete Multiple Students
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStudents.size} selected student{selectedStudents.size !== 1 ? 's' : ''}? 
              This action cannot be undone. All their progress and data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="flex-1"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}