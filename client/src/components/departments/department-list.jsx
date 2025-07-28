"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Progress } from "../ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { MoreHorizontal, Users, CheckSquare, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { useToast } from "../../hooks/use-toast"
import { api } from "../../lib/api"
import { useSocketContext } from "../../context/socket-context"

export function DepartmentList() {
  const { toast } = useToast()
  const { events } = useSocketContext()
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [departmentTasks, setDepartmentTasks] = useState({})

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoading(true)
        const data = await api.departments.getDepartments()
        setDepartments(data)
        
        // Fetch tasks for each department
        const tasksPromises = data.map(async (dept) => {
          try {
          
            const tasks = await api.departments.getDepartmentTasks(dept._id)
            const completed = tasks.filter(task => task.status === "Completed").length
            return {
              departmentId: dept.id,
              tasks: {
                total: tasks.length,
                completed: completed
              }
            }
          } catch (error) {
            console.error(`Error fetching tasks for department ${dept.id}:`, error)
            return {
              departmentId: dept.id,
              tasks: { total: 0, completed: 0 }
            }
          }
        })
        
        const tasksResults = await Promise.all(tasksPromises)
        const tasksMap = {}
        tasksResults.forEach(result => {
          tasksMap[result.departmentId] = result.tasks
        })
        
        setDepartmentTasks(tasksMap)
        setError(null)
      } catch (err) {
        setError(err.message || "Failed to load departments")
        toast({
          title: "Error",
          description: err.message || "Failed to load departments",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDepartments()
  }, [toast])

  // Listen for socket events to update departments
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[events.length - 1]
      
      if (latestEvent.type === 'department-created') {
        setDepartments(prev => [...prev, latestEvent.data])
        setDepartmentTasks(prev => ({
          ...prev,
          [latestEvent.data.id]: { total: 0, completed: 0 }
        }))
      } 
      else if (latestEvent.type === 'department-updated') {
        setDepartments(prev => prev.map(dept => 
          dept.id === latestEvent.data.id ? latestEvent.data : dept
        ))
      }
      else if (latestEvent.type === 'department-deleted') {
        setDepartments(prev => prev.filter(dept => dept.id !== latestEvent.data.id))
        setDepartmentTasks(prev => {
          const newMap = {...prev}
          delete newMap[latestEvent.data.id]
          return newMap
        })
      }
    }
  }, [events])

  const handleDeleteDepartment = async (deptId) => {
    if (confirm("Are you sure you want to delete this department?")) {
      try {
        setIsDeleting(true)
        await api.departments.deleteDepartment(deptId)
        setDepartments(departments.filter(dept => dept.id !== deptId))
        toast({
          title: "Success",
          description: "Department deleted successfully"
        })
      } catch (error) {
        console.error("Error deleting department:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete department",
          variant: "destructive"
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
          <CardDescription>Manage and view all departments</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading departments...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
          <CardDescription>Manage and view all departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-red-500">
            <p>Error loading departments: {error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="grid">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="grid" className="mt-0">
        {departments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No departments found. Create a new department to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => {
              const tasks = departmentTasks[department.id] || { total: 0, completed: 0 }
              const completionPercentage = tasks.total > 0 
                ? Math.round((tasks.completed / tasks.total) * 100) 
                : 0
                
              return (
                <Card key={department.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${department.color}`} />
                          {department.name}
                        </CardTitle>
                        <CardDescription>{department.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Department</DropdownMenuItem>
                          <DropdownMenuItem>Edit Department</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteDepartment(department.id)}
                            disabled={isDeleting}
                          >
                            Delete Department
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage 
                            src={department.lead?.avatar || "/placeholder.svg?height=40&width=40"} 
                            alt={department.lead?.name || "Lead"} 
                          />
                          <AvatarFallback>
                            {department.lead?.name ? department.lead.name.charAt(0) : "L"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{department.lead?.name || "No lead assigned"}</div>
                          <div className="text-xs text-muted-foreground">Department Lead</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{department.members?.length || 0} Members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {tasks.completed}/{tasks.total} Tasks
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Task Completion</span>
                          <span>{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="list" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
            <CardDescription>Manage and view all departments</CardDescription>
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No departments found. Create a new department to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {departments.map((department) => {
                  const tasks = departmentTasks[department.id] || { total: 0, completed: 0 }
                  const completionPercentage = tasks.total > 0 
                    ? Math.round((tasks.completed / tasks.total) * 100) 
                    : 0
                    
                  return (
                    <div key={department.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full ${department.color} flex items-center justify-center text-white font-bold`}
                        >
                          {department.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium">{department.name}</h3>
                          <p className="text-sm text-muted-foreground">{department.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{department.members?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {tasks.completed}/{tasks.total}
                          </span>
                        </div>
                        <Badge>{completionPercentage}%</Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Department</DropdownMenuItem>
                            <DropdownMenuItem>Edit Department</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteDepartment(department.id)}
                              disabled={isDeleting}
                            >
                              Delete Department
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
