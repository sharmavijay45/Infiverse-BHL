// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
// import { Button } from "../components/ui/button"
// import { Textarea } from "../components/ui/textarea"
// import { Loader2, CheckCircle, Calendar, Clock } from "lucide-react"
// import { useToast } from "../hooks/use-toast"
// import { useAuth } from "../context/auth-context"
// import { api } from "../lib/api"
// import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
// import { format } from "date-fns"

// function TodaysAim() {
//   const { toast } = useToast()
//   const { user } = useAuth()
//   const [aims, setAims] = useState("")
//   const [existingAim, setExistingAim] = useState(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSaving, setIsSaving] = useState(false)
//   const [recentAims, setRecentAims] = useState([])

//   useEffect(() => {
//     const fetchTodayAim = async () => {
//       try {
//         setIsLoading(true)

//         // Get user ID from localStorage as a fallback
//         const storedUser = JSON.parse(localStorage.getItem("WorkflowUser") || "{}")
//         const userId = user?.id || storedUser?.id

//         if (!userId) {
//           console.error("User ID not available")
//           setIsLoading(false)
//           return
//         }

//         const todayAim = await api.aims.getTodayAim(userId)

//         if (todayAim) {
//           setExistingAim(todayAim)
//           setAims(todayAim.aims)
//         }

//         // Fetch recent aims (last 5 days)
//         const today = new Date()
//         const fiveDaysAgo = new Date()
//         fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

//         const userAims = await api.aims.getUserAims(userId, {
//           from: fiveDaysAgo.toISOString(),
//           to: today.toISOString(),
//         })

//         // Filter out today's aim from recent aims
//         const filteredAims = userAims.filter((aim) => {
//           const aimDate = new Date(aim.date)
//           const today = new Date()
//           return (
//             aimDate.getDate() !== today.getDate() ||
//             aimDate.getMonth() !== today.getMonth() ||
//             aimDate.getFullYear() !== today.getFullYear()
//           )
//         })

//         setRecentAims(filteredAims)
//       } catch (error) {
//         console.error("Error fetching today's aim:", error)
//         toast({
//           title: "Error",
//           description: "Failed to load today's aim",
//           variant: "destructive",
//         })
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchTodayAim()
//   }, [user, toast])

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     if (!aims.trim()) {
//       toast({
//         title: "Error",
//         description: "Please enter your aims for today",
//         variant: "destructive",
//       })
//       return
//     }

//     try {
//       setIsSaving(true)

//       // Get user ID from localStorage as a fallback
//       const storedUser = JSON.parse(localStorage.getItem("WorkflowUser") || "{}")
//       const userId = user?.id || storedUser?.id

//       if (!userId) {
//         toast({
//           title: "Error",
//           description: "User information not available. Please log in again.",
//           variant: "destructive",
//         })
//         setIsSaving(false)
//         return
//       }

//       await api.aims.createAim({ aims }, userId)

//       toast({
//         title: "Success",
//         description: "Your aims for today have been saved",
//         variant: "success",
//       })

//       // Refresh the data
//       const todayAim = await api.aims.getTodayAim(userId)
//       setExistingAim(todayAim)
//     } catch (error) {
//       console.error("Error saving aims:", error)
//       toast({
//         title: "Error",
//         description: "Failed to save your aims",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   const formatDate = (dateString) => {
//     const date = new Date(dateString)
//     return format(date, "EEEE, MMMM d, yyyy")
//   }

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-[80vh]">
//         <div className="flex flex-col items-center gap-2">
//           <Loader2 className="h-8 w-8 animate-spin text-primary" />
//           <p>Loading...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Today's Aims</h1>
//           <p className="text-muted-foreground">Set your goals and objectives for today</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Calendar className="h-5 w-5 text-muted-foreground" />
//           <span className="text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
//         </div>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>What do you aim to accomplish today?</CardTitle>
//           <CardDescription>
//             Setting clear daily objectives helps you stay focused and measure your progress
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit}>
//             <div className="space-y-4">
//               <Textarea
//                 placeholder="List your key objectives for today..."
//                 value={aims}
//                 onChange={(e) => setAims(e.target.value)}
//                 rows={5}
//                 className="resize-none"
//               />

//               <div className="flex justify-end">
//                 <Button type="submit" disabled={isSaving}>
//                   {isSaving ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Saving...
//                     </>
//                   ) : existingAim ? (
//                     <>
//                       <CheckCircle className="mr-2 h-4 w-4" />
//                       Update Aims
//                     </>
//                   ) : (
//                     <>
//                       <CheckCircle className="mr-2 h-4 w-4" />
//                       Save Aims
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </form>

//           {existingAim && (
//             <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
//               <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
//               <AlertTitle className="text-green-800 dark:text-green-300">Aims set for today</AlertTitle>
//               <AlertDescription className="text-green-700 dark:text-green-400">
//                 You've already set your aims for today at {format(new Date(existingAim.updatedAt), "h:mm a")}. You can
//                 update them if needed.
//               </AlertDescription>
//             </Alert>
//           )}
//         </CardContent>
//       </Card>

//       {recentAims.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Your Recent Aims</CardTitle>
//             <CardDescription>Review your aims from the past few days</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {recentAims.map((aim) => (
//                 <div key={aim._id} className="border rounded-lg p-4">
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center gap-2">
//                       <Calendar className="h-4 w-4 text-muted-foreground" />
//                       <span className="font-medium">{formatDate(aim.date)}</span>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       {aim.completed ? (
//                         <span className="flex items-center text-green-600 dark:text-green-400 text-sm">
//                           <CheckCircle className="h-3 w-3 mr-1" /> Completed
//                         </span>
//                       ) : (
//                         <span className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
//                           <Clock className="h-3 w-3 mr-1" /> In Progress
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <p className="text-sm whitespace-pre-line">{aim.aims}</p>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }

// export default TodaysAim



"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Textarea } from "../components/ui/textarea"
import { Loader2, CheckCircle, Calendar, Clock } from "lucide-react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useAuth } from "../context/auth-context"
import { api } from "../lib/api"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { format } from "date-fns"

function TodaysAim() {

  const { user } = useAuth()
  const [aims, setAims] = useState("")
  const [existingAim, setExistingAim] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [recentAims, setRecentAims] = useState([])

  useEffect(() => {
    const fetchTodayAim = async () => {
      try {
        setIsLoading(true)

        // Get user ID from localStorage as a fallback
        const storedUser = JSON.parse(localStorage.getItem("WorkflowUser") || "{}")
        const userId = user?.id || storedUser?.id

        if (!userId) {
          console.error("User ID not available")
          setIsLoading(false)
          return
        }

        const todayAim = await api.aims.getTodayAim(userId)

        if (todayAim) {
          setExistingAim(todayAim)
          setAims(todayAim.aims)
        }

        // Fetch recent aims (last 5 days)
        const today = new Date()
        const fiveDaysAgo = new Date()
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

        const userAims = await api.aims.getUserAims(userId, {
          from: fiveDaysAgo.toISOString(),
          to: today.toISOString(),
        })

        // Filter out today's aim from recent aims
        const filteredAims = userAims.filter((aim) => {
          const aimDate = new Date(aim.date)
          const today = new Date()
          return (
            aimDate.getDate() !== today.getDate() ||
            aimDate.getMonth() !== today.getMonth() ||
            aimDate.getFullYear() !== today.getFullYear()
          )
        })

        setRecentAims(filteredAims)
      } catch (error) {
        console.error("Error fetching today's aim:", error)
        toast.error("Failed to load today's aim")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodayAim()
  }, [user, toast])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!aims.trim()) {
      toast.error("Please enter your aims for today")
      return
    }

    try {
      setIsSaving(true)

      // Get user ID from localStorage as a fallback
      const storedUser = JSON.parse(localStorage.getItem("WorkflowUser") || "{}")
      const userId = user?.id || storedUser?.id

      if (!userId) {
        toast.error("User information not available. Please log in again.")
        setIsSaving(false)
        return
      }

      await api.aims.createAim({ aims }, userId)

      toast.success("Your aims for today have been saved")

      // Refresh the data
      const todayAim = await api.aims.getTodayAim(userId)
      setExistingAim(todayAim)
    } catch (error) {
      console.error("Error saving aims:", error)
      toast.error("Failed to save your aims")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return format(date, "EEEE, MMMM d, yyyy")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Today's Aims</h1>
          <p className="text-muted-foreground">Set your goals and objectives for today</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What do you aim to accomplish today?</CardTitle>
          <CardDescription>
            Setting clear daily objectives helps you stay focused and measure your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Textarea
                placeholder="List your key objectives for today..."
                value={aims}
                onChange={(e) => setAims(e.target.value)}
                rows={5}
                className="resize-none"
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : existingAim ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Update Aims
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Aims
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {existingAim && (
            <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-300">Aims set for today</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                You've already set your aims for today at {format(new Date(existingAim.updatedAt), "h:mm a")}. You can
                update them if needed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {recentAims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Recent Aims</CardTitle>
            <CardDescription>Review your aims from the past few days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAims.map((aim) => (
                <div key={aim._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(aim.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {aim.completed ? (
                        <span className="flex items-center text-green-600 dark:text-green-400 text-sm">
                          <CheckCircle className="h-3 w-3 mr-1" /> Completed
                        </span>
                      ) : (
                        <span className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                          <Clock className="h-3 w-3 mr-1" /> In Progress
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-line">{aim.aims}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TodaysAim

