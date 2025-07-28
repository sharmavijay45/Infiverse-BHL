

// "use client"

// import { useState, useEffect } from "react"
// import { useParams, useNavigate } from "react-router-dom"
// import axios from "axios"
// import { useToast } from "../hooks/use-toast"
// import { useAuth } from "../context/auth-context"
// import {
//   Calendar,
//   Clock,
//   AlertTriangle,
//   CheckCircle,
//   ArrowLeft,
//   FileText,
//   Github,
//   Link2,
//   ExternalLink,
//   Users,
//   BarChart3,
//   FileCode,
//   Layers,
// } from "lucide-react"
// import { Button } from "../components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
// import { Badge } from "../components/ui/badge"
// import { Progress } from "../components/ui/progress"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
// import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
// import { TaskSubmissionDialog } from "../components/tasks/task-submission-dialog"
// import { Skeleton } from "../components/ui/skeleton"
// import { API_URL } from "@/lib/api"

// function TaskDetails() {
//   const { id } = useParams()
//   const navigate = useNavigate()
//   const { toast } = useToast()
//   const { user } = useAuth()
//   const [task, setTask] = useState(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false)
//   const [submission, setSubmission] = useState(null)

//   useEffect(() => {
//     const fetchTaskDetails = async () => {
//       try {
//         setIsLoading(true)
//         const token = localStorage.getItem("WorkflowToken")
//         const taskResponse = await axios.get(`${API_URL}/tasks/${id}`, {
//           headers: { "x-auth-token": token },
//         })
//         setTask(taskResponse.data)

//         try {
//           const submissionResponse = await axios.get(`${API_URL}/submissions/task/${id}`, {
//             headers: { "x-auth-token": token },
//           })
//           if (submissionResponse.data) {
//             setSubmission(submissionResponse.data)
//           }
//         } catch (error) {
//           console.log("No submission found for this task")
//         }
//       } catch (error) {
//         console.error("Error fetching task details:", error)
//         toast({
//           title: "Error",
//           description: "Failed to load task details",
//           variant: "destructive",
//         })
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     if (id) {
//       fetchTaskDetails()
//     }
//   }, [id, toast])

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

//   const getDaysRemaining = (dueDate) => {
//     const today = new Date()
//     const due = new Date(dueDate)
//     const diffTime = due - today
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
//     return diffDays
//   }

//   const getDueDateStatus = (dueDate) => {
//     const daysRemaining = getDaysRemaining(dueDate)

//     if (daysRemaining < 0) {
//       return { text: "Overdue", color: "text-red-500" }
//     } else if (daysRemaining === 0) {
//       return { text: "Due today", color: "text-amber-500" }
//     } else if (daysRemaining <= 2) {
//       return { text: `Due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`, color: "text-amber-500" }
//     } else {
//       return { text: `Due in ${daysRemaining} days`, color: "text-green-500" }
//     }
//   }

//   const getDocumentDetails = (documentLink, fileType) => {
//     if (!documentLink) return [{ url: null, fileName: null, fileType: null, isImage: false }]

//     // Handle concatenated URLs or multiple document links
//     const links = documentLink.split(/\s+/).filter(link => link && link.match(/^https?:\/\//))
//     const documents = []

//     const fileTypeMap = {
//       "application/pdf": "PDF Document",
//       "application/msword": "Word Document",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
//       "image/png": "PNG Image",
//       "image/jpeg": "JPEG Image",
//       "text/plain": "Text Document",
//       "text/html": "HTML Document",
//     }

//     // Handle Document: <url> (<filename>) format from older version
//     const docMatch = documentLink.match(/^Document: (.+?) \((.+)\)$/)
//     if (docMatch) {
//       const url = docMatch[1]
//       const fileName = docMatch[2] || url.split("/").pop() || "Document"
//       const mimeType = fileType || ""
//       const displayFileType = fileTypeMap[mimeType] || "Document"
//       const isPDF = mimeType === "application/pdf"
//       const isImage = mimeType.startsWith("image/") || false
//       const displayUrl = isPDF ? `${url}?_a=BAE6pY0` : url
//       return [{ url: displayUrl, fileName, fileType: displayFileType, isImage }]
//     }

//     // Handle single or multiple raw URLs
//     for (const link of links) {
//       const fileName = link.split("/").pop() || "Document"
//       const url = link
//       const mimeType = fileType || ""
//       const displayFileType = fileTypeMap[mimeType] || "Document"
//       const isPDF = mimeType === "application/pdf"
//       const isImage = mimeType.startsWith("image/") || false
//       const displayUrl = isPDF ? `${url}?_a=BAE6pY0` : url
//       documents.push({ url: displayUrl, fileName, fileType: displayFileType, isImage })
//     }

//     return documents.length > 0 ? documents : [{ url: null, fileName: null, fileType: null, isImage: false }]
//   }

//   const handleSubmitTask = async (submissionData) => {
//     try {
//       const token = localStorage.getItem("WorkflowToken")
//       if (!token) {
//         toast({
//           title: "Authentication Error",
//           description: "User token is missing. Please log in again.",
//           variant: "destructive",
//         })
//         return
//       }

//       const config = {
//         headers: {
//           "x-auth-token": token,
//           "Content-Type": "multipart/form-data",
//         },
//       }

//       const storedUser = JSON.parse(localStorage.getItem("WorkflowUser"))
//       if (!storedUser || !storedUser.id) {
//         toast({
//           title: "User Error",
//           description: "User information is missing. Please log in again.",
//           variant: "destructive",
//         })
//         return
//       }

//       submissionData.append("task", id)

//       if (submission) {
//         await axios.put(`${API_URL}/submissions/${submission._id}`, submissionData, config)

//         toast({
//           title: "Success",
//           description: "Your submission has been updated",
//         })
//       } else {
//         const response = await axios.post(`${API_URL}/submissions`, submissionData, config)

//         setSubmission(response.data)

//         toast({
//           title: "Success",
//           description: "Your task has been submitted successfully",
//         })
//       }

//       const submissionResponse = await axios.get(`${API_URL}/submissions/task/${id}`, {
//         headers: { "x-auth-token": token },
//       })
//       setSubmission(submissionResponse.data)

//       setIsSubmissionDialogOpen(false)
//     } catch (error) {
//       console.error("Error submitting task:", error)
//       toast({
//         title: "Error",
//         description: error?.response?.data?.error || "Failed to submit task",
//         variant: "destructive",
//       })
//     }
//   }

//   if (isLoading) {
//     return (
//       <div className="space-y-6 p-4 md:p-6">
//         <div className="flex items-center gap-2">
//           <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
//             <ArrowLeft className="h-5 w-5" />
//           </Button>
//           <Skeleton className="h-8 w-64" />
//         </div>
//         <div className="grid gap-6 md:grid-cols-3">
//           <Skeleton className="h-[300px] md:col-span-2" />
//           <Skeleton className="h-[300px]" />
//         </div>
//         <Skeleton className="h-[200px]" />
//       </div>
//     )
//   }

//   if (!task) {
//     return (
//       <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
//         <AlertTriangle className="h-12 w-12 text-amber-500" />
//         <h2 className="text-2xl font-bold">Task Not Found</h2>
//         <p className="text-muted-foreground">
//           The task you're looking for doesn't exist or you don't have permission to view it.
//         </p>
//         <Button onClick={() => navigate(-1)}>Go Back</Button>
//       </div>
//     )
//   }

//   const dueDateStatus = getDueDateStatus(task.dueDate)
//   const storedUser = JSON.parse(localStorage.getItem("WorkflowUser"))
//   const isAssignedToCurrentUser = storedUser?.id === task.assignee?._id
//   const documents = getDocumentDetails(task.notes, task.fileType)

//   return (
//     <div className="space-y-6 p-4 md:p-6">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div className="flex items-center gap-2">
//           <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
//             <ArrowLeft className="h-5 w-5" />
//           </Button>
//           <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
//         </div>
//         <div className="flex items-center gap-2">
//           <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
//           <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
//           {task.department && (
//             <Badge variant="outline" className="border-[1px] border-muted-foreground/20">
//               {task.department.name}
//             </Badge>
//           )}
//         </div>
//       </div>

//       <div className="grid gap-6 md:grid-cols-3">
//         <Card className="md:col-span-2">
//           <CardHeader>
//             <CardTitle>Task Details</CardTitle>
//             <CardDescription>Complete information about this task</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             <Tabs defaultValue="description">
//               <TabsList className="grid w-full grid-cols-3">
//                 <TabsTrigger value="description">Description</TabsTrigger>
//                 <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
//                 <TabsTrigger value="submission">Submission</TabsTrigger>
//               </TabsList>
//               <TabsContent value="description" className="space-y-4 pt-4">
//                 <div className="prose max-w-none dark:prose-invert">
//                   <p className="whitespace-pre-line">{task.description}</p>
//                 </div>
//                 {documents[0].url && (
//                   <div className="space-y-2">
//                     {documents.map((doc, index) => (
//                       <div key={index} className="flex items-center gap-2 text-sm">
//                         <FileText className="h-4 w-4 text-muted-foreground" />
//                         <a
//                           href={doc.url}
//                           target={doc.isImage ? "_self" : "_blank"}
//                           rel="noopener noreferrer"
//                           className="text-blue-500 hover:underline"
//                         >
//                           {doc.fileName} ({doc.fileType})
//                         </a>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </TabsContent>
//               <TabsContent value="dependencies" className="pt-4">
//                 {task.dependencies && task.dependencies.length > 0 ? (
//                   <div className="space-y-4">
//                     <h3 className="text-sm font-medium">This task depends on:</h3>
//                     {task.dependencies.map((dependency) => (
//                       <Card key={dependency._id} className="overflow-hidden">
//                         <CardHeader className="p-4">
//                           <CardTitle className="text-base">{dependency.title}</CardTitle>
//                         </CardHeader>
//                         <CardContent className="p-4 pt-0">
//                           <div className="flex items-center justify-between">
//                             <Badge className={getStatusColor(dependency.status)}>{dependency.status}</Badge>
//                             <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${dependency._id}`)}>
//                               View Task
//                             </Button>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center py-8 text-center">
//                     <Layers className="h-12 w-12 text-muted-foreground/60 mb-2" />
//                     <p className="text-muted-foreground">This task has no dependencies</p>
//                   </div>
//                 )}
//               </TabsContent>
//               <TabsContent value="submission" className="pt-4">
//                 {submission ? (
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <h3 className="text-sm font-medium">Submission Details</h3>
//                       {isAssignedToCurrentUser && (
//                         <Button variant="outline" size="sm" onClick={() => setIsSubmissionDialogOpen(true)}>
//                           Edit Submission
//                         </Button>
//                       )}
//                     </div>
//                     <Card>
//                       <CardContent className="p-4 space-y-4">
//                         {submission.githubLink && (
//                           <div className="flex items-center gap-2 text-sm">
//                             <Github className="h-4 w-4" />
//                             <a
//                               href={submission.githubLink}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-blue-500 hover:underline flex items-center gap-1"
//                             >
//                               {submission.githubLink}
//                               <ExternalLink className="h-3 w-3" />
//                             </a>
//                           </div>
//                         )}
//                         {submission.additionalLinks && (
//                           <div className="flex items-center gap-2 text-sm">
//                             <Link2 className="h-4 w-4" />
//                             <a
//                               href={submission.additionalLinks}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-blue-500 hover:underline flex items-center gap-1"
//                             >
//                               {submission.additionalLinks}
//                               <ExternalLink className="h-3 w-3" />
//                             </a>
//                           </div>
//                         )}
//                         {submission.documentLink && (
//                           <div className="flex items-center gap-2 text-sm">
//                             <FileText className="h-4 w-4" />
//                             <a
//                               href={getDocumentDetails(submission.documentLink, submission.fileType)[0].url}
//                               target={getDocumentDetails(submission.documentLink, submission.fileType)[0].isImage ? "_self" : "_blank"}
//                               rel="noopener noreferrer"
//                               className="text-blue-500 hover:underline flex items-center gap-1"
//                             >
//                               {getDocumentDetails(submission.documentLink, submission.fileType)[0].fileName} ({getDocumentDetails(submission.documentLink, submission.fileType)[0].fileType})
//                               <ExternalLink className="h-3 w-3" />
//                             </a>
//                           </div>
//                         )}
//                         {submission.notes && (
//                           <div className="pt-2">
//                             <h4 className="text-sm font-medium mb-1">Notes:</h4>
//                             <p className="text-sm text-muted-foreground whitespace-pre-line">{submission.notes}</p>
//                           </div>
//                         )}
//                         <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
//                           <span>Submitted on {new Date(submission.createdAt).toLocaleDateString()}</span>
//                           {submission.updatedAt !== submission.createdAt && (
//                             <span>Updated on {new Date(submission.updatedAt).toLocaleDateString()}</span>
//                           )}
//                         </div>
//                       </CardContent>
//                     </Card>
//                     {submission.feedback && (
//                       <Card>
//                         <CardContent className="p-4">
//                           <h4 className="text-sm font-medium mb-2">Review Feedback</h4>
//                           <p className="text-sm text-muted-foreground whitespace-pre-line">{submission.feedback}</p>
//                           <div className="mt-2">
//                             <Badge className={submission.status === "Approved" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
//                               {submission.status}
//                             </Badge>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center py-8 text-center">
//                     <FileCode className="h-12 w-12 text-muted-foreground/60 mb-2" />
//                     <p className="text-muted-foreground mb-4">No submission yet</p>
//                     {isAssignedToCurrentUser && (
//                       <Button onClick={() => setIsSubmissionDialogOpen(true)}>Submit Task</Button>
//                     )}
//                   </div>
//                 )}
//               </TabsContent>
//             </Tabs>
//           </CardContent>
//           <CardFooter className="flex justify-between border-t px-6 py-4">
//             <div className="flex items-center gap-2">
//               <Clock className="h-4 w-4 text-muted-foreground" />
//               <span className="text-sm text-muted-foreground">
//                 Created on {new Date(task.createdAt).toLocaleDateString()}
//               </span>
//             </div>
//             {isAssignedToCurrentUser && !submission && (
//               <Button onClick={() => setIsSubmissionDialogOpen(true)}>Submit Task</Button>
//             )}
//           </CardFooter>
//         </Card>

//         <div className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Task Progress</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm font-medium">{task.progress}%</span>
//                   <span className={`text-sm ${dueDateStatus.color}`}>{dueDateStatus.text}</span>
//                 </div>
//                 <Progress value={task.progress} className="h-2" />
//               </div>
//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   <Calendar className="h-4 w-4 text-muted-foreground" />
//                   <span>
//                     Due: {new Date(task.dueDate).toLocaleDateString()}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Users className="h-4 w-4 text-muted-foreground" />
//                   <span>
//                     Assignee: {task.assignee?.name || "Unassigned"}
//                   </span>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Task Metadata</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="flex items-center gap-2">
//                 <BarChart3 className="h-4 w-4 text-muted-foreground" />
//                 <span className="text-sm">
//                   Priority: {task.priority}
//                 </span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Layers className="h-4 w-4 text-muted-foreground" />
//                 <span className="text-sm">
//                   Department: {task.department?.name || "None"}
//                 </span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Clock className="h-4 w-4 text-muted-foreground" />
//                 <span className="text-sm">
//                   Updated: {new Date(task.updatedAt).toLocaleDateString()}
//                 </span>
//               </div>
//             </CardContent>
//           </Card>

//           {task.assignee && (
//             <Card>
//               <CardHeader>
//                 <CardTitle>Assignee</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center gap-3">
//                   <Avatar>
//                     <AvatarImage src={task.assignee.avatar || "/placeholder.svg"} />
//                     <AvatarFallback>
//                       {task.assignee.name
//                         .split(" ")
//                         .map((n) => n[0])
//                         .join("")}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div>
//                     <p className="font-medium">{task.assignee.name}</p>
//                     <p className="text-sm text-muted-foreground">{task.assignee.email}</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       </div>

//       <TaskSubmissionDialog
//         open={isSubmissionDialogOpen}
//         onOpenChange={setIsSubmissionDialogOpen}
//         onSubmit={handleSubmitTask}
//         existingSubmission={submission}
//       />
//     </div>
//   )
// }

// export default TaskDetails




"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { useToast } from "../hooks/use-toast"
import { useAuth } from "../context/auth-context"
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  FileText,
  Github,
  Link2,
  ExternalLink,
  Users,
  BarChart3,
  FileCode,
  Layers,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { TaskSubmissionDialog } from "../components/tasks/task-submission-dialog"
import { Skeleton } from "../components/ui/skeleton"
import { API_URL } from "@/lib/api"

function TaskDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false)
  const [submission, setSubmission] = useState(null)

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("WorkflowToken")
        const taskResponse = await axios.get(`${API_URL}/tasks/${id}`, {
          headers: { "x-auth-token": token },
        })
        setTask(taskResponse.data)

        try {
          const submissionResponse = await axios.get(`${API_URL}/submissions/task/${id}`, {
            headers: { "x-auth-token": token },
          })
          if (submissionResponse.data) {
            setSubmission(submissionResponse.data)
          }
        } catch (error) {
          console.log("No submission found for this task")
        }
      } catch (error) {
        console.error("Error fetching task details:", error)
        toast({
          title: "Error",
          description: "Failed to load task details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchTaskDetails()
    }
  }, [id, toast])

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

  const getDaysRemaining = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDueDateStatus = (dueDate) => {
    const daysRemaining = getDaysRemaining(dueDate)

    if (daysRemaining < 0) {
      return { text: "Overdue", color: "text-red-500" }
    } else if (daysRemaining === 0) {
      return { text: "Due today", color: "text-amber-500" }
    } else if (daysRemaining <= 2) {
      return { text: `Due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`, color: "text-amber-500" }
    } else {
      return { text: `Due in ${daysRemaining} days`, color: "text-green-500" }
    }
  }

  const getDocumentDetails = (documentLink, fileType) => {
    if (!documentLink) return [{ url: null, fileName: null, fileType: null, isImage: false }]

    // Handle concatenated URLs or multiple document links
    const links = documentLink.split(/\s+/).filter(link => link && link.match(/^https?:\/\//))
    const documents = []

    const fileTypeMap = {
      "application/pdf": "PDF Document",
      "application/msword": "Word Document",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
      "image/png": "PNG Image",
      "image/jpeg": "JPEG Image",
      "text/plain": "Text Document",
      "text/html": "HTML Document",
    }

    // Handle Document: <url> (<filename>) format from older version
    const docMatch = documentLink.match(/^Document: (.+?) \((.+)\)$/)
    if (docMatch) {
      const url = docMatch[1]
      const fileName = docMatch[2] || url.split("/").pop() || "Document"
      const mimeType = fileType || ""
      const displayFileType = fileTypeMap[mimeType] || "Document"
      const isPDF = mimeType === "application/pdf"
      const isImage = mimeType.startsWith("image/") || false
      const displayUrl = isPDF ? `${url}?_a=BAE6pY0` : url
      return [{ url: displayUrl, fileName, fileType: displayFileType, isImage }]
    }

    // Handle single or multiple raw URLs
    for (const link of links) {
      const fileName = link.split("/").pop() || "Document"
      const url = link
      const mimeType = fileType || ""
      const displayFileType = fileTypeMap[mimeType] || "Document"
      const isPDF = mimeType === "application/pdf"
      const isImage = mimeType.startsWith("image/") || false
      const displayUrl = isPDF ? `${url}?_a=BAE6pY0` : url
      documents.push({ url: displayUrl, fileName, fileType: displayFileType, isImage })
    }

    return documents.length > 0 ? documents : [{ url: null, fileName: null, fileType: null, isImage: false }]
  }

  const handleSubmitTask = async (submissionData) => {
    try {
      const token = localStorage.getItem("WorkflowToken")
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "User token is missing. Please log in again.",
          variant: "destructive",
        })
        return
      }

      const config = {
        headers: {
          "x-auth-token": token,
          "Content-Type": "multipart/form-data",
        },
      }

      const storedUser = JSON.parse(localStorage.getItem("WorkflowUser"))
      if (!storedUser || !storedUser.id) {
        toast({
          title: "User Error",
          description: "User information is missing. Please log in again.",
          variant: "destructive",
        })
        return
      }

      submissionData.append("task", id)

      if (submission) {
        await axios.put(`${API_URL}/submissions/${submission._id}`, submissionData, config)

        toast({
          title: "Success",
          description: "Your submission has been updated",
        })
      } else {
        const response = await axios.post(`${API_URL}/submissions`, submissionData, config)

        setSubmission(response.data)

        toast({
          title: "Success",
          description: "Your task has been submitted successfully",
        })
      }

      const submissionResponse = await axios.get(`${API_URL}/submissions/task/${id}`, {
        headers: { "x-auth-token": token },
      })
      setSubmission(submissionResponse.data)

      setIsSubmissionDialogOpen(false)
    } catch (error) {
      console.error("Error submitting task:", error)
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to submit task",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[300px] md:col-span-2" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[200px]" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h2 className="text-2xl font-bold">Task Not Found</h2>
        <p className="text-muted-foreground">
          The task you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  const dueDateStatus = getDueDateStatus(task.dueDate)
  const storedUser = JSON.parse(localStorage.getItem("WorkflowUser"))
  const isAssignedToCurrentUser = storedUser?.id === task.assignee?._id
  const documents = getDocumentDetails(task.notes, task.fileType)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
          {task.department && (
            <Badge variant="outline" className="border-[1px] border-muted-foreground/20">
              {task.department.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Complete information about this task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="submission">Submission</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-4 pt-4">
                <div className="prose max-w-none dark:prose-invert">
                  <p className="whitespace-pre-line">{task.description}</p>
                </div>
                {documents[0].url && (
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={doc.url}
                          target={doc.isImage ? "_self" : "_blank"}
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {doc.fileName} ({doc.fileType})
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Display Links */}
                {task.links && task.links.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Links:</h3>
                    {task.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="dependencies" className="pt-4">
                {task.dependencies && task.dependencies.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">This task depends on:</h3>
                    {task.dependencies.map((dependency) => (
                      <Card key={dependency._id} className="overflow-hidden">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">{dependency.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center justify-between">
                            <Badge className={getStatusColor(dependency.status)}>{dependency.status}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/tasks/${dependency._id}`)}>
                              View Task
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Layers className="h-12 w-12 text-muted-foreground/60 mb-2" />
                    <p className="text-muted-foreground">This task has no dependencies</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="submission" className="pt-4">
                {submission ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Submission Details</h3>
                      {isAssignedToCurrentUser && (
                        <Button variant="outline" size="sm" onClick={() => setIsSubmissionDialogOpen(true)}>
                          Edit Submission
                        </Button>
                      )}
                    </div>
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        {submission.githubLink && (
                          <div className="flex items-center gap-2 text-sm">
                            <Github className="h-4 w-4" />
                            <a
                              href={submission.githubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              {submission.githubLink}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {submission.additionalLinks && (
                          <div className="flex items-center gap-2 text-sm">
                            <Link2 className="h-4 w-4" />
                            <a
                              href={submission.additionalLinks}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              {submission.additionalLinks}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {submission.documentLink && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4" />
                            <a
                              href={getDocumentDetails(submission.documentLink, submission.fileType)[0].url}
                              target={getDocumentDetails(submission.documentLink, submission.fileType)[0].isImage ? "_self" : "_blank"}
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              {getDocumentDetails(submission.documentLink, submission.fileType)[0].fileName} ({getDocumentDetails(submission.documentLink, submission.fileType)[0].fileType})
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        {submission.notes && (
                          <div className="pt-2">
                            <h4 className="text-sm font-medium mb-1">Notes:</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{submission.notes}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                          <span>Submitted on {new Date(submission.createdAt).toLocaleDateString()}</span>
                          {submission.updatedAt !== submission.createdAt && (
                            <span>Updated on {new Date(submission.updatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    {submission.feedback && (
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="text-sm font-medium mb-2">Review Feedback</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{submission.feedback}</p>
                          <div className="mt-2">
                            <Badge className={submission.status === "Approved" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                              {submission.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileCode className="h-12 w-12 text-muted-foreground/60 mb-2" />
                    <p className="text-muted-foreground mb-4">No submission yet</p>
                    {isAssignedToCurrentUser && (
                      <Button onClick={() => setIsSubmissionDialogOpen(true)}>Submit Task</Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Created on {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
            {isAssignedToCurrentUser && !submission && (
              <Button onClick={() => setIsSubmissionDialogOpen(true)}>Submit Task</Button>
            )}
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{task.progress}%</span>
                  <span className={`text-sm ${dueDateStatus.color}`}>{dueDateStatus.text}</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Assignee: {task.assignee?.name || "Unassigned"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Priority: {task.priority}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Department: {task.department?.name || "None"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Updated: {new Date(task.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {task.assignee && (
            <Card>
              <CardHeader>
                <CardTitle>Assignee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={task.assignee.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {task.assignee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{task.assignee.name}</p>
                    <p className="text-sm text-muted-foreground">{task.assignee.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TaskSubmissionDialog
        open={isSubmissionDialogOpen}
        onOpenChange={setIsSubmissionDialogOpen}
        onSubmit={handleSubmitTask}
        existingSubmission={submission}
      />
    </div>
  )
}

export default TaskDetails

