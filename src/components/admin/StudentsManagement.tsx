import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { User } from '@/types'
import { Plus, Trash, Users, UserCircle, Check, X, MagnifyingGlass, Funnel, Download, Warning, Shield, Eye, EyeSlash, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'

  const [users, setUsers] = useKV<User[]>('users', [])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('students')

  // Filter users by role
  const students = users.filter(user => user.role === 'student')
  const admins = users.filter(user => user.role === 'admin')
  
  // Filter based on active tab and search term
  const getFilteredUsers = () => {
    const targetUsers = activeTab === 'students' ? students : admins
    return targetUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredUsers = getFilteredUsers()

  const togglePasswordVisibility = (userId: string) => {
    const newShowPasswords = new Set(showPasswords)
    if (newShowPasswords.has(userId)) {
      newShowPasswords.delete(userId)
    } else {
      newShowPasswords.add(userId)
    }
    setShowPasswords(newShowPasswords)
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`)
    }).catch(() => {
      toast.error('Failed to copy to clipboard')
    })
  }

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
      setSelectedStudents(new Set(filteredUsers.map(s => s.id)))
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
    toast.success('User deleted successfully')
    setIsDeleteDialogOpen(false)
    setStudentToDelete(null)
  }

  const handleBulkDelete = () => {
    const selectedIds = Array.from(selectedStudents)
    setUsers(currentUsers => 
      currentUsers.filter(user => !selectedIds.includes(user.id))
    )
    setSelectedStudents(new Set())
    toast.success(`${selectedIds.length} users deleted successfully`)
    setIsBulkDeleteDialogOpen(false)
  }

  const exportStudentsData = () => {
    const usersData = filteredUsers.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Password: user.password,
      'Created At': new Date(user.createdAt || '').toLocaleDateString(),
      'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
    }))

    const csv = [
      Object.keys(usersData[0] || {}).join(','),
      ...usersData.map(user => Object.values(user).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Users data exported successfully')
  }

  const allSelected = filteredUsers.length > 0 && selectedStudents.size === filteredUsers.length
  const someSelected = selectedStudents.size > 0 && selectedStudents.size < filteredUsers.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts and view their credentials
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportStudentsData}
            disabled={filteredUsers.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          {selectedStudents.size > 0 && activeTab === 'students' && (
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <UserCircle className="w-4 h-4" />
            Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Administrators ({admins.length})
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <MagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab} by name or email...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="outline" className="whitespace-nowrap">
                {filteredUsers.length} {activeTab === 'students' ? 'student' : 'admin'}{filteredUsers.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="students" className="space-y-6">
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
                
                {filteredUsers.length > 0 && (
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
              {filteredUsers.length === 0 ? (
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
                  {filteredUsers.map((student) => (
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{student.email}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(student.email, 'Email')}
                              className="h-auto p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
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
        </TabsContent>

        <TabsContent value="admins" className="space-y-6">
          {/* Administrators List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Administrators List</CardTitle>
                  <CardDescription>
                    View administrator accounts and their credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">
                    {searchTerm ? 'No administrators found' : 'No administrators registered'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'Try adjusting your search criteria'
                      : 'Administrators will appear here once they are registered'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium">{admin.name}</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium">Email:</span>
                              <span>{admin.email}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(admin.email, 'Email')}
                                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium">Password:</span>
                              <span className="font-mono">
                                {showPasswords.has(admin.id) ? admin.password : '••••••••'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => togglePasswordVisibility(admin.id)}
                                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                              >
                                {showPasswords.has(admin.id) ? (
                                  <EyeSlash className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </Button>
                              {showPasswords.has(admin.id) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(admin.password, 'Password')}
                                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Created: {new Date(admin.createdAt || '').toLocaleDateString()}
                            </span>
                            {admin.lastLogin && (
                              <span className="text-xs text-muted-foreground">
                                Last login: {new Date(admin.lastLogin).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          Administrator
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-destructive" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
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
              Delete User
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