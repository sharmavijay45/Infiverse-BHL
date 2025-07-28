// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
// import { Button } from "../components/ui/button"
// import { Loader2, Calendar, Filter, RefreshCw, Clock, Bell } from "lucide-react"
// import { useToast } from "../hooks/use-toast"
// import { useAuth } from "../context/auth-context"
// import { api } from "../lib/api"
// import { format } from "date-fns"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
// import { DatePicker } from "../components/ui/date-picker"
// import { Switch } from "../components/ui/switch"
// import { Label } from "../components/ui/label"

// function AllAims() {
//   const { toast } = useToast()
//   const { user } = useAuth()
//   const [aims, setAims] = useState([])
//   const [departments, setDepartments] = useState([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [isSendingReminders, setIsSendingReminders] = useState(false)
//   const [selectedDate, setSelectedDate] = useState(new Date())
//   const [selectedDepartment, setSelectedDepartment] = useState("")
//   const [automateAimReminders, setAutomateAimReminders] = useState(false)
//   const [automateProgressReminders, setAutomateProgressReminders] = useState(false)

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setIsLoading(true)

//         // Fetch departments
//         const departmentsData = await api.departments.getDepartments()
//         setDepartments(departmentsData)

//         // Fetch aims based on filters
//         const filters = {}
//         if (selectedDepartment) filters.department = selectedDepartment

//         // Format date for API
//         if (selectedDate) {
//           filters.date = selectedDate.toISOString()
//         }

//         const aimsData = await api.aims.getAims(filters)
//         setAims(aimsData)

//         // Fetch automation settings (in a real app, this would come from the backend)
//         // For now, we'll use mock data
//         setAutomateAimReminders(false)
//         setAutomateProgressReminders(false)
//       } catch (error) {
//         console.error("Error fetching data:", error)
//         toast({
//           title: "Error",
//           description: "Failed to load aims data",
//           variant: "destructive",
//         })
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchData()
//   }, [selectedDate, selectedDepartment, toast])

//   const handleRefresh = () => {
//     setIsLoading(true)
//     // Re-fetch data with current filters
//     const fetchData = async () => {
//       try {
//         const filters = {}
//         if (selectedDepartment) filters.department = selectedDepartment
//         if (selectedDate) filters.date = selectedDate.toISOString()

//         const aimsData = await api.aims.getAims(filters)
//         setAims(aimsData)
//       } catch (error) {
//         console.error("Error refreshing data:", error)
//         toast({
//           title: "Error",
//           description: "Failed to refresh aims data",
//           variant: "destructive",
//         })
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchData()
//   }

//   const handleSendReminders = async () => {
//     try {
//       setIsSendingReminders(true)
//       const result = await api.notifications.broadcastAimReminders()
//       toast({
//         title: "Success",
//         description: `Sent ${result.emails.length} aim reminder emails to users`,
//         variant: "success",
//       })
//     } catch (error) {
//       console.error("Error sending reminders:", error)
//       toast({
//         title: "Error",
//         description: "Failed to send reminder emails",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSendingReminders(false)
//     }
//   }

//   const handleToggleAutomation = async (type, value) => {
//     try {
//       if (type === "aim") {
//         setAutomateAimReminders(value)
//       } else {
//         setAutomateProgressReminders(value)
//       }

//       // Update automation settings
//       await api.notifications.toggleAutomation({
//         automateAimReminders: type === "aim" ? value : automateAimReminders,
//         automateProgressReminders: type === "progress" ? value : automateProgressReminders,
//       })

//       toast({
//         title: "Success",
//         description: `Automation for ${type} reminders ${value ? "enabled" : "disabled"}`,
//         variant: "success",
//       })
//     } catch (error) {
//       console.error("Error updating automation settings:", error)
//       toast({
//         title: "Error",
//         description: "Failed to update automation settings",
//         variant: "destructive",
//       })

//       // Revert UI state on error
//       if (type === "aim") {
//         setAutomateAimReminders(!value)
//       } else {
//         setAutomateProgressReminders(!value)
//       }
//     }
//   }

//   const formatDate = (dateString) => {
//     const date = new Date(dateString)
//     return format(date, "h:mm a")
//   }

//   const groupAimsByDepartment = () => {
//     const grouped = {}

//     aims.forEach((aim) => {
//       const deptName = aim.department?.name || "No Department"
//       if (!grouped[deptName]) {
//         grouped[deptName] = []
//       }
//       grouped[deptName].push(aim)
//     })

//     return grouped
//   }

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-[80vh]">
//         <div className="flex flex-col items-center gap-2">
//           <Loader2 className="h-8 w-8 animate-spin text-primary" />
//           <p>Loading aims data...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">All Aims</h1>
//           <p className="text-muted-foreground">View and manage daily aims across all departments</p>
//         </div>
//         <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
//           <Button variant="outline" onClick={handleRefresh}>
//             <RefreshCw className="mr-2 h-4 w-4" />
//             Refresh
//           </Button>

//           <Button variant="outline" onClick={handleSendReminders} disabled={isSendingReminders}>
//             {isSendingReminders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
//             Send Aim Reminders
//           </Button>
//         </div>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Reminder Settings</CardTitle>
//           <CardDescription>Configure automated reminders for aims and progress updates</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
//               <div className="space-y-0.5">
//                 <h3 className="text-base font-medium">Daily Aim Reminders</h3>
//                 <p className="text-sm text-muted-foreground">Automatically send reminders at 10:00 AM daily</p>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Switch
//                   id="aim-automation"
//                   checked={automateAimReminders}
//                   onCheckedChange={(value) => handleToggleAutomation("aim", value)}
//                 />
//                 <Label htmlFor="aim-automation">{automateAimReminders ? "Enabled" : "Disabled"}</Label>
//               </div>
//             </div>

//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
//               <div className="space-y-0.5">
//                 <h3 className="text-base font-medium">Progress Update Reminders</h3>
//                 <p className="text-sm text-muted-foreground">Automatically send reminders at 5:00 PM daily</p>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Switch
//                   id="progress-automation"
//                   checked={automateProgressReminders}
//                   onCheckedChange={(value) => handleToggleAutomation("progress", value)}
//                 />
//                 <Label htmlFor="progress-automation">{automateProgressReminders ? "Enabled" : "Disabled"}</Label>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Filter Aims</CardTitle>
//           <CardDescription>Filter aims by department and date</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="w-full md:w-1/3">
//               <Label htmlFor="department-filter" className="mb-2 block">
//                 Department
//               </Label>
//               <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
//                 <SelectTrigger id="department-filter">
//                   <SelectValue placeholder="All Departments" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Departments</SelectItem>
//                   {departments.map((dept) => (
//                     <SelectItem key={dept._id} value={dept._id}>
//                       {dept.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="w-full md:w-1/3">
//               <Label htmlFor="date-filter" className="mb-2 block">
//                 Date
//               </Label>
//               <DatePicker id="date-filter" date={selectedDate} setDate={setSelectedDate} />
//             </div>

//             <div className="w-full md:w-1/3 flex items-end">
//               <Button className="w-full" onClick={handleRefresh}>
//                 <Filter className="mr-2 h-4 w-4" />
//                 Apply Filters
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Tabs defaultValue="by-department">
//         <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
//           <TabsTrigger value="by-department">By Department</TabsTrigger>
//           <TabsTrigger value="all-aims">All Aims</TabsTrigger>
//         </TabsList>

//         <TabsContent value="by-department" className="mt-6">
//           {Object.keys(groupAimsByDepartment()).length === 0 ? (
//             <Card>
//               <CardContent className="flex flex-col items-center justify-center py-10 text-center">
//                 <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
//                 <h3 className="text-lg font-medium">No aims found</h3>
//                 <p className="text-muted-foreground mt-1">
//                   No aims have been set for the selected date and department.
//                 </p>
//               </CardContent>
//             </Card>
//           ) : (
//             <div className="space-y-6">
//               {Object.entries(groupAimsByDepartment()).map(([deptName, deptAims]) => (
//                 <Card key={deptName}>
//                   <CardHeader>
//                     <CardTitle>{deptName}</CardTitle>
//                     <CardDescription>{deptAims.length} team members have set aims</CardDescription>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-4">
//                       {deptAims.map((aim) => (
//                         <div key={aim._id} className="border rounded-lg p-4">
//                           <div className="flex items-center justify-between mb-2">
//                             <div className="flex items-center gap-2">
//                               <span className="font-medium">{aim.user?.name || "Unknown User"}</span>
//                             </div>
//                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                               <Clock className="h-3 w-3" />
//                               <span>Set at {formatDate(aim.createdAt)}</span>
//                             </div>
//                           </div>
//                           <p className="text-sm whitespace-pre-line">{aim.aims}</p>
//                         </div>
//                       ))}
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </TabsContent>

//         <TabsContent value="all-aims" className="mt-6">
//           {aims.length === 0 ? (
//             <Card>
//               <CardContent className="flex flex-col items-center justify-center py-10 text-center">
//                 <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
//                 <h3 className="text-lg font-medium">No aims found</h3>
//                 <p className="text-muted-foreground mt-1">
//                   No aims have been set for the selected date and department.
//                 </p>
//               </CardContent>
//             </Card>
//           ) : (
//             <Card>
//               <CardHeader>
//                 <CardTitle>All Aims for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
//                 <CardDescription>{aims.length} team members have set aims</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   {aims.map((aim) => (
//                     <div key={aim._id} className="border rounded-lg p-4">
//                       <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
//                         <div className="flex items-center gap-2">
//                           <span className="font-medium">{aim.user?.name || "Unknown User"}</span>
//                           <span className="text-sm text-muted-foreground">
//                             ({aim.department?.name || "No Department"})
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                           <Clock className="h-3 w-3" />
//                           <span>Set at {formatDate(aim.createdAt)}</span>
//                         </div>
//                       </div>
//                       <p className="text-sm whitespace-pre-line">{aim.aims}</p>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   )
// }

// export default AllAims



"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Loader2, Calendar, Filter, RefreshCw, Clock, Bell, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "../hooks/use-toast"
import { useAuth } from "../context/auth-context"
import { api } from "../lib/api"
import { format, addDays, subDays } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Switch } from "../components/ui/switch"
import { Label } from "../components/ui/label"

function AllAims() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [aims, setAims] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingReminders, setIsSendingReminders] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [automateAimReminders, setAutomateAimReminders] = useState(false)
  const [automateProgressReminders, setAutomateProgressReminders] = useState(false)
  const filterCardRef = useRef(null)

  const fetchData = useCallback(async () => {
    // Save the scroll position of the filter card
    const scrollPosition = filterCardRef.current ? filterCardRef.current.getBoundingClientRect().top + window.scrollY : 0
    try {
      setIsLoading(true)

      // Fetch departments
      const departmentsData = await api.departments.getDepartments()
      setDepartments(departmentsData)

      // Fetch aims based on filters
      const filters = {}
      if (selectedDepartment) filters.department = selectedDepartment
      if (selectedDate) filters.date = selectedDate.toISOString()

      const aimsData = await api.aims.getAims(filters)
      setAims(aimsData)

      // Fetch automation settings (mock data)
      setAutomateAimReminders(false)
      setAutomateProgressReminders(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load aims data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      // Restore scroll position to the filter card
      if (filterCardRef.current) {
        window.scrollTo({ top: scrollPosition, behavior: "instant" })
      }
    }
  }, [selectedDate, selectedDepartment, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    fetchData()
  }

  const handleSendReminders = async () => {
    try {
      setIsSendingReminders(true)
      const result = await api.notifications.broadcastAimReminders()
      toast({
        title: "Success",
        description: `Sent ${result.emails.length} aim reminder emails to users`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error sending reminders:", error)
      toast({
        title: "Error",
        description: "Failed to send reminder emails",
        variant: "destructive",
      })
    } finally {
      setIsSendingReminders(false)
    }
  }

  const handleToggleAutomation = async (type, value) => {
    try {
      if (type === "aim") {
        setAutomateAimReminders(value)
      } else {
        setAutomateProgressReminders(value)
      }

      await api.notifications.toggleAutomation({
        automateAimReminders: type === "aim" ? value : automateAimReminders,
        automateProgressReminders: type === "progress" ? value : automateProgressReminders,
      })

      toast({
        title: "Success",
        description: `Automation for ${type} reminders ${value ? "enabled" : "disabled"}`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating automation settings:", error)
      toast({
        title: "Error",
        description: "Failed to update automation settings",
        variant: "destructive",
      })

      if (type === "aim") {
        setAutomateAimReminders(!value)
      } else {
        setAutomateProgressReminders(!value)
      }
    }
  }

  const handlePreviousDate = () => {
    setSelectedDate(subDays(selectedDate, 1))
  }

  const handleNextDate = () => {
    setSelectedDate(addDays(selectedDate, 1))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return format(date, "h:mm a")
  }

  const groupAimsByDepartment = () => {
    const grouped = {}

    aims.forEach((aim) => {
      const deptName = aim.department?.name || "No Department"
      if (!grouped[deptName]) {
        grouped[deptName] = []
      }
      grouped[deptName].push(aim)
    })

    return grouped
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading aims data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Aims</h1>
          <p className="text-muted-foreground">View and manage daily aims across all departments</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button variant="outline" onClick={handleSendReminders} disabled={isSendingReminders}>
            {isSendingReminders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
            Send Aim Reminders
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reminder Settings</CardTitle>
          <CardDescription>Configure automated reminders for aims and progress updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Daily Aim Reminders</h3>
                <p className="text-sm text-muted-foreground">Automatically send reminders at 10:00 AM daily</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="aim-automation"
                  checked={automateAimReminders}
                  onCheckedChange={(value) => handleToggleAutomation("aim", value)}
                />
                <Label htmlFor="aim-automation">{automateAimReminders ? "Enabled" : "Disabled"}</Label>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Progress Update Reminders</h3>
                <p className="text-sm text-muted-foreground">Automatically send reminders at 5:00 PM daily</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="progress-automation"
                  checked={automateProgressReminders}
                  onCheckedChange={(value) => handleToggleAutomation("progress", value)}
                />
                <Label htmlFor="progress-automation">{automateProgressReminders ? "Enabled" : "Disabled"}</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card ref={filterCardRef} >
        <CardHeader>
          <CardTitle>Filter Aims</CardTitle>
          <CardDescription>Filter aims by department and date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Label htmlFor="department-filter" className="mb-2 block">
                Department
              </Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment} className="bg-white border border-gray-300 rounded-md shadow-sm">
                   <SelectTrigger id="department-filter" >
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/3">
              <Label className="mb-2 block">Date</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePreviousDate}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  {format(selectedDate, "MMMM d, yyyy")}
                </div>
                <Button variant="outline" size="icon" onClick={handleNextDate}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="w-full md:w-1/3 flex items-end">
              <Button className="w-full" onClick={handleRefresh}>
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="by-department">
        <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
          <TabsTrigger value="by-department">By Department</TabsTrigger>
          <TabsTrigger value="all-aims">All Aims</TabsTrigger>
        </TabsList>

        <TabsContent value="by-department" className="mt-6">
          {Object.keys(groupAimsByDepartment()).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No aims found</h3>
                <p className="text-muted-foreground mt-1">
                  No aims have been set for the selected date and department.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupAimsByDepartment()).map(([deptName, deptAims]) => (
                <Card key={deptName}>
                  <CardHeader>
                    <CardTitle>{deptName}</CardTitle>
                    <CardDescription>{deptAims.length} team members have set aims</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deptAims.map((aim) => (
                        <div key={aim._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{aim.user?.name || "Unknown User"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Set at {formatDate(aim.createdAt)}</span>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-line">{aim.aims}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-aims" className="mt-6">
          {aims.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No aims found</h3>
                <p className="text-muted-foreground mt-1">
                  No aims have been set for the selected date and department.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Aims for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
                <CardDescription>{aims.length} team members have set aims</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aims.map((aim) => (
                    <div key={aim._id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{aim.user?.name || "Unknown User"}</span>
                          <span className="text-sm text-muted-foreground">
                            ({aim.department?.name || "No Department"})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Set at {formatDate(aim.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-line">{aim.aims}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AllAims
