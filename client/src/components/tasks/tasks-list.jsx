
// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
// import { Badge } from "../ui/badge"
// import { Button } from "../ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "../ui/dropdown-menu"
// import { MoreHorizontal, Eye, Edit, Trash, Loader2 } from 'lucide-react'
// import { TaskDetailsDialog } from "./task-details-dialog"
// import { useToast } from "../../hooks/use-toast"
// import { api } from "../../lib/api"
// import { useSocketContext } from "../../context/socket-context"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "../ui/dialog"
// import { Input } from "../ui/input"
// import { Label } from "../ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
// import { Textarea } from "../ui/textarea"

// function EditTaskDialog({ task, open, onOpenChange }) {
//   const { toast } = useToast()
//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     status: "Pending",
//     priority: "Medium",
//     dueDate: "",
//   })
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   // Update formData when task prop changes
//   useEffect(() => {
//     if (task) {
//       setFormData({
//         title: task.title || "",
//         description: task.description || "",
//         status: task.status || "Pending",
//         priority: task.priority || "Medium",
//         dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
//       })
//     }
//   }, [task])

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleSelectChange = (name, value) => {
//     setFormData((prev) => ({ ...prev, [name]: value }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     try {
//       setIsSubmitting(true)
//       await api.tasks.updateTask(task._id, {
//         ...formData,
//         dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
//       })
//       toast({
//         title: "Success",
//         description: "Task updated successfully",
//       })
//       onOpenChange(false)
//     } catch (error) {
//       console.error("Error updating task:", error)
//       toast({
//         title: "Error",
//         description: error.message || "Failed to update task",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange} className="dialog-overlay">
//       <DialogContent className="dialog-content sm:max-w-[525px]">
//         <DialogHeader>
//           <DialogTitle>Edit Task</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit}>
//           <div className="grid gap-4 py-4">
//             <div className="grid gap-2">
//               <Label htmlFor="title">Title</Label>
//               <Input
//                 id="title"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="description">Description</Label>
//               <Textarea
//                 id="description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//               />
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="status">Status</Label>
//               <Select
//                 value={formData.status}
//                 onValueChange={(value) => handleSelectChange("status", value)}
//               >
//                 <SelectTrigger className="bg-white border border-gray-300 rounded-md shadow-sm">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Pending">Pending</SelectItem>
//                   <SelectItem value="In Progress">In Progress</SelectItem>
//                   <SelectItem value="Completed">Completed</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="priority">Priority</Label>
//               <Select
//                 value={formData.priority}
//                 onValueChange={(value) => handleSelectChange("priority", value)}
//               >
//                 <SelectTrigger className="bg-white border border-gray-300 rounded-md shadow-sm">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Low">Low</SelectItem>
//                   <SelectItem value="Medium">Medium</SelectItem>
//                   <SelectItem value="High">High</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="dueDate">Due Date</Label>
//               <Input
//                 id="dueDate"
//                 name="dueDate"
//                 type="date"
//                 value={formData.dueDate}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : (
//                 "Save Changes"
//               )}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }

// export function TasksList({ filters }) {
//   const { toast } = useToast()
//   const { events } = useSocketContext()
//   const [tasks, setTasks] = useState([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState(null)
//   const [selectedTask, setSelectedTask] = useState(null)
//   const [isDetailsOpen, setIsDetailsOpen] = useState(false)
//   const [isEditOpen, setIsEditOpen] = useState(false)
//   const [isDeleting, setIsDeleting] = useState(false)

//   // Fetch tasks based on filters
//   useEffect(() => {
//     const fetchTasks = async () => {
//       try {
//         setIsLoading(true)
//         const data = await api.tasks.getTasks(filters)
//         setTasks(data)
//         setError(null)
//       } catch (err) {
//         setError(err.message || "Failed to load tasks")
//         toast({
//           title: "Error",
//           description: err.message || "Failed to load tasks",
//           variant: "destructive",
//         })
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchTasks()
//   }, [filters, toast])

//   // Handle socket events for real-time updates
//   useEffect(() => {
//     if (events.length > 0) {
//       const latestEvent = events[events.length - 1]

//       // Apply filter checks for socket updates
//       const matchesFilters = (task) => {
//         const { status, department, priority } = filters
//         return (
//           (!status?.length || status.includes(task.status)) &&
//           (!department?.length || department.includes(task.department?._id)) &&
//           (!priority || priority === "all" || task.priority === priority)
//         )
//       }

//       if (latestEvent.type === "task-created" && matchesFilters(latestEvent.data)) {
//         setTasks((prev) => [...prev, latestEvent.data])
//       } else if (latestEvent.type === "task-updated") {
//         setTasks((prev) =>
//           prev
//             .map((task) => (task._id === latestEvent.data._id ? latestEvent.data : task))
//             .filter(matchesFilters)
//         )
//       } else if (latestEvent.type === "task-deleted") {
//         setTasks((prev) => prev.filter((task) => task._id !== latestEvent.data._id))
//       }
//     }
//   }, [events, filters])

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "Completed":
//         return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
//       case "In Progress":
//         return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
//       case "Pending":
//         return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
//       default:
//         return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
//     }
//   }

//   const getPriorityColor = (priority) => {
//     switch (priority) {
//       case "High":
//         return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
//       case "Medium":
//         return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
//       case "Low":
//         return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
//       default:
//         return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
//     }
//   }

//   const handleViewTask = (task) => {
//     setSelectedTask(task)
//     setIsDetailsOpen(true)
//   }

//   const handleEditTask = (task) => {
//     setSelectedTask(task)
//     setIsEditOpen(true)
//   }

//   const handleDeleteTask = async (taskId) => {
//     if (confirm("Are you sure you want to delete this task?")) {
//       try {
//         setIsDeleting(true)
//         await api.tasks.deleteTask(taskId)
//         toast({
//           title: "Success",
//           description: "Task deleted successfully",
//         })
//       } catch (error) {
//         console.error("Error deleting task:", error)
//         toast({
//           title: "Error",
//           description: error.message || "Failed to delete task",
//           variant: "destructive",
//         })
//       } finally {
//         setIsDeleting(false)
//       }
//     }
//   }

//   // Group tasks by department
//   const groupedTasks = tasks.reduce((acc, task) => {
//     const deptName = task.department?.name || "Unknown"
//     if (!acc[deptName]) {
//       acc[deptName] = []
//     }
//     acc[deptName].push(task)
//     return acc
//   }, {})

//   if (isLoading) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>Tasks by Department</CardTitle>
//           <CardDescription>View tasks grouped by department</CardDescription>
//         </CardHeader>
//         <CardContent className="flex justify-center items-center py-10">
//           <div className="flex flex-col items-center gap-2">
//             <Loader2 className="h-8 w-8 animate-spin text-primary" />
//             <p>Loading tasks...</p>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   if (error) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>Tasks by Department</CardTitle>
//           <CardDescription>View tasks grouped by department</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="p-4 text-center text-red-500">
//             <p>Error loading tasks: {error}</p>
//             <Button
//               variant="outline"
//               className="mt-4"
//               onClick={() => window.location.reload()}
//             >
//               Try Again
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {Object.keys(groupedTasks).length === 0 ? (
//         <Card>
//           <CardContent className="text-center py-8 text-muted-foreground">
//             <p>No tasks found matching the selected filters.</p>
//           </CardContent>
//         </Card>
//       ) : (
//         Object.entries(groupedTasks).map(([deptName, deptTasks]) => (
//           <Card key={deptName}>
//             <CardHeader>
//               <CardTitle>{deptName} Tasks</CardTitle>
//               <CardDescription>Tasks assigned to the {deptName} department</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Title</TableHead>
//                       <TableHead>Assignee</TableHead>
//                       <TableHead>Status</TableHead>
//                       <TableHead>Priority</TableHead>
//                       <TableHead>Due Date</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {deptTasks.map((task) => (
//                       <TableRow key={task._id}>
//                         <TableCell>{task.title}</TableCell>
//                         <TableCell>{task.assignee?.name || "Unassigned"}</TableCell>
//                         <TableCell>
//                           <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
//                         </TableCell>
//                         <TableCell>
//                           <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
//                         </TableCell>
//                         <TableCell>
//                           {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <DropdownMenu>
//                             <DropdownMenuTrigger asChild>
//                               <Button variant="ghost" className="h-8 w-8 p-0">
//                                 <span className="sr-only">Open menu</span>
//                                 <MoreHorizontal className="h-4 w-4" />
//                               </Button>
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent
//                               align="end"
//                               className="bg-white border border-gray-200 shadow-lg rounded-md"
//                             >
//                               <DropdownMenuLabel className="font-medium text-gray-900">
//                                 Actions
//                               </DropdownMenuLabel>
//                               <DropdownMenuItem
//                                 onClick={() => handleViewTask(task)}
//                                 className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
//                               >
//                                 <Eye className="mr-2 h-4 w-4" />
//                                 View details
//                               </DropdownMenuItem>
//                               <DropdownMenuItem
//                                 onClick={() => handleEditTask(task)}
//                                 className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
//                               >
//                                 <Edit className="mr-2 h-4 w-4" />
//                                 Edit task
//                               </DropdownMenuItem>
//                               <DropdownMenuSeparator className="bg-gray-200" />
//                               <DropdownMenuItem
//                                 className="text-red-600 hover:bg-red-50 hover:text-red-700"
//                                 onClick={() => handleDeleteTask(task._id)}
//                                 disabled={isDeleting}
//                               >
//                                 <Trash className="mr-2 h-4 w-4" />
//                                 Delete task
//                               </DropdownMenuItem>
//                             </DropdownMenuContent>
//                           </DropdownMenu>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             </CardContent>
//           </Card>
//         ))
//       )}
//       {selectedTask && (
//         <>
//           <TaskDetailsDialog
//             task={selectedTask}
//             open={isDetailsOpen}
//             onOpenChange={setIsDetailsOpen}
//           />
//           <EditTaskDialog
//             task={selectedTask}
//             open={isEditOpen}
//             onOpenChange={setIsEditOpen}
//           />
//         </>
//       )}
//     </div>
//   )
// }

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash, Loader2 } from 'lucide-react'
import { TaskDetailsDialog } from "./task-details-dialog"
import { useToast } from "../../hooks/use-toast"
import { api } from "../../lib/api"
import { useSocketContext } from "../../context/socket-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EditTaskDialog({ task, open, onOpenChange }) {
  // const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Pending",
    priority: "Medium",
    dueDate: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update formData when task prop changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "Pending",
        priority: task.priority || "Medium",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      })
    }
  }, [task])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.tasks.updateTask(task._id, {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      });
      toast.success("Task updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.message || "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="dialog-overlay">
      <DialogContent className="dialog-content sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger className="bg-white border border-gray-300 rounded-md shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleSelectChange("priority", value)}
              >
                <SelectTrigger className="bg-white border border-gray-300 rounded-md shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TasksList({ filters }) {
  const { toast } = useToast()
  const { events } = useSocketContext()
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch tasks based on filters
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const data = await api.tasks.getTasks(filters)
        setTasks(data)
        setError(null)
      } catch (err) {
        setError(err.message || "Failed to load tasks")
        toast({
          title: "Error",
          description: err.message || "Failed to load tasks",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [filters, toast])

  // Handle socket events for real-time updates
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[events.length - 1]

      // Apply filter checks for socket updates
      const matchesFilters = (task) => {
        const { status, department, priority } = filters
        return (
          (!status?.length || status.includes(task.status)) &&
          (!department?.length || department.includes(task.department?._id)) &&
          (!priority || priority === "all" || task.priority === priority)
        )
      }

      if (latestEvent.type === "task-created" && matchesFilters(latestEvent.data)) {
        setTasks((prev) => [...prev, latestEvent.data])
      } else if (latestEvent.type === "task-updated") {
        setTasks((prev) =>
          prev
            .map((task) => (task._id === latestEvent.data._id ? latestEvent.data : task))
            .filter(matchesFilters)
        )
      } else if (latestEvent.type === "task-deleted") {
        setTasks((prev) => prev.filter((task) => task._id !== latestEvent.data._id))
      }
    }
  }, [events, filters])

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
      case "In Progress":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      case "Pending":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
      case "Medium":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
      case "Low":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
    }
  }

  const handleViewTask = (task) => {
    setSelectedTask(task)
    setIsDetailsOpen(true)
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setIsEditOpen(true)
  }

  const handleDeleteTask = async (taskId) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        setIsDeleting(true);
        await api.tasks.deleteTask(taskId);
        toast.success("Task deleted successfully");
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error(error.message || "Failed to delete task");
      } finally {
        setIsDeleting(false);
      }
    }
  }

  // Group tasks by department
  const groupedTasks = tasks.reduce((acc, task) => {
    const deptName = task.department?.name || "Unknown"
    if (!acc[deptName]) {
      acc[deptName] = []
    }
    acc[deptName].push(task)
    return acc
  }, {})

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Department</CardTitle>
          <CardDescription>View tasks grouped by department</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Department</CardTitle>
          <CardDescription>View tasks grouped by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-red-500">
            <p>Error loading tasks: {error}</p>
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
    <div className="space-y-6">
      {Object.keys(groupedTasks).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <p>No tasks found matching the selected filters.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedTasks).map(([deptName, deptTasks]) => (
          <Card key={deptName}>
            <CardHeader>
              <CardTitle>{deptName} Tasks</CardTitle>
              <CardDescription>Tasks assigned to the {deptName} department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptTasks.map((task) => (
                      <TableRow key={task._id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>{task.assignee?.name || "Unassigned"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white border border-gray-200 shadow-lg rounded-md"
                            >
                              <DropdownMenuLabel className="font-medium text-gray-900">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewTask(task)}
                                className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditTask(task)}
                                className="text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit task
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-200" />
                              <DropdownMenuItem
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDeleteTask(task._id)}
                                disabled={isDeleting}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      {selectedTask && (
        <>
          <TaskDetailsDialog
            task={selectedTask}
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
          />
          <EditTaskDialog
            task={selectedTask}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
        </>
      )}
    </div>
  )
}

<ToastContainer />



