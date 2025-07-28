// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import { Button } from "../components/ui/button";
// import { Input } from "../components/ui/input";
// import { Label } from "../components/ui/label";
// import { Textarea } from "../components/ui/textarea";
// import { Slider } from "../components/ui/slider";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
// import { Loader2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
// import { api, API_URL } from "../lib/api";
// import { useToast } from "../hooks/use-toast";
// import { useAuth } from "../context/auth-context";
// import { ProgressChart } from "../components/progress/progress-chart";
// import { ProgressHistory } from "../components/progress/progress-history";
// import { format } from "date-fns";
// import axios from "axios";

// function Progress() {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const { user } = useAuth();
//   const [isLoading, setIsLoading] = useState(true);
//   const [tasks, setTasks] = useState([]);
//   const [selectedTask, setSelectedTask] = useState(null);
//   const [progressValue, setProgressValue] = useState(0);
//   const [notes, setNotes] = useState("");
//   const [blockers, setBlockers] = useState("");
//   const [achievements, setAchievements] = useState("");
//   const [progressHistory, setProgressHistory] = useState([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);



//   useEffect(() => {
//     const fetchUserTasks = async () => {
//       try {
//         setIsLoading(true);
//         console.log("user in progress", user.id);
  
//         // Axios request to get tasks by user ID
//         const response = await axios.get(`${API_URL}/users/${user.id}/tasks`);
        
//         const filteredTasks = response.data.filter(task =>
//           ["Pending", "In Progress"].includes(task.status)
//         );
  
//         setTasks(filteredTasks);
  
//         // Select the first task by default if available
//         if (filteredTasks.length > 0) {
//           setSelectedTask(filteredTasks[0]);
//           setProgressValue(filteredTasks[0].progress || 0);
//           fetchProgressHistory(filteredTasks[0]._id);
//         }
//       } catch (error) {
//         console.error("Error fetching tasks:", error);
//         toast({
//           title: "Error",
//           description: "Failed to load your tasks",
//           variant: "destructive",
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };
  
//     if (user) {
//       fetchUserTasks();
//     }
//   }, [user, toast]);
  

//   const fetchProgressHistory = async (taskId) => {
//     try {
//       const history = await api.progress.getTaskProgress(taskId);
//       setProgressHistory(history);
//     } catch (error) {
//       console.error("Error fetching progress history:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load progress history",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleTaskChange = (taskId) => {
//     const task = tasks.find(t => t._id === taskId);
//     if (task) {
//       setSelectedTask(task);
//       setProgressValue(task.progress || 0);
//       fetchProgressHistory(task._id);
//       // Reset form fields
//       setNotes("");
//       setBlockers("");
//       setAchievements("");
//     }
//   };

//   const handleSubmitProgress = async () => {
//     if (!selectedTask) {
//       toast({
//         title: "Error",
//         description: "Please select a task first",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setIsSubmitting(true);
      
//       const progressData = {
//         user: user.id,
//         task: selectedTask._id,
//         progressPercentage: progressValue,
//         notes,
//         blockers,
//         achievements,
//         date: new Date(),
//       };

//       await api.progress.createProgress(progressData);
      
//       // Update the task in the local state
//       const updatedTasks = tasks.map(task => 
//         task._id === selectedTask._id 
//           ? { ...task, progress: progressValue } 
//           : task
//       );
//       setTasks(updatedTasks);
      
//       // Update selected task
//       setSelectedTask({ ...selectedTask, progress: progressValue });
      
//       // Refresh progress history
//       fetchProgressHistory(selectedTask._id);
      
//       // Reset form fields
//       setNotes("");
//       setBlockers("");
//       setAchievements("");
      
//       toast({
//         title: "Success",
//         description: "Progress updated successfully",
//         variant: "success",
//       });
//     } catch (error) {
//       console.error("Error updating progress:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update progress",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-[80vh]">
//         <div className="flex flex-col items-center gap-2">
//           <Loader2 className="h-8 w-8 animate-spin text-primary" />
//           <p>Loading your tasks...</p>
//         </div>
//       </div>
//     );
//   }

//   if (tasks.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center h-[80vh] px-4">
//         <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
//         <h2 className="text-2xl font-bold mb-2">No Active Tasks</h2>
//         <p className="text-muted-foreground text-center mb-6">
//           You don't have any active tasks assigned to you at the moment.
//         </p>
//         <Button onClick={() => navigate("/dashboard")}>
//           Return to Dashboard
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto py-6 space-y-6">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Task Progress</h1>
//           <p className="text-muted-foreground">
//             Track and update your daily progress on assigned tasks
//           </p>
//         </div>
        
//         <div className="w-full md:w-64">
//           <Select 
//             value={selectedTask?._id} 
//             onValueChange={handleTaskChange}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="Select a task" />
//             </SelectTrigger>
//             <SelectContent>
//               {tasks.map(task => (
//                 <SelectItem key={task._id} value={task._id}>
//                   {task.title}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {selectedTask && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <Card className="lg:col-span-2">
//             <CardHeader>
//               <CardTitle>Update Progress</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center">
//                   <Label>Current Progress: {progressValue}%</Label>
//                   <span className="text-sm text-muted-foreground">
//                     Due: {format(new Date(selectedTask.dueDate), "PPP")}
//                   </span>
//                 </div>
//                 <Slider
//                   value={[progressValue]}
//                   onValueChange={(values) => setProgressValue(values[0])}
//                   max={100}
//                   step={1}
//                   className="py-4"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="notes">Today's Progress Notes</Label>
//                 <Textarea
//                   id="notes"
//                   placeholder="What did you accomplish today?"
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   rows={3}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="blockers">Blockers or Challenges</Label>
//                 <Textarea
//                   id="blockers"
//                   placeholder="Any issues preventing progress?"
//                   value={blockers}
//                   onChange={(e) => setBlockers(e.target.value)}
//                   rows={2}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="achievements">Key Achievements</Label>
//                 <Textarea
//                   id="achievements"
//                   placeholder="What are you most proud of today?"
//                   value={achievements}
//                   onChange={(e) => setAchievements(e.target.value)}
//                   rows={2}
//                 />
//               </div>

//               <Button 
//                 onClick={handleSubmitProgress} 
//                 disabled={isSubmitting}
//                 className="w-full"
//               >
//                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//                 Submit Progress Update
//               </Button>
//             </CardContent>
//           </Card>

//           <div className="space-y-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Task Details</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div>
//                   <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
//                   <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-sm font-medium">Status</p>
//                     <p className="text-sm">{selectedTask.status}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium">Priority</p>
//                     <p className="text-sm">{selectedTask.priority}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium">Due Date</p>
//                     <p className="text-sm">{format(new Date(selectedTask.dueDate), "PPP")}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium">Days Left</p>
//                     <p className="text-sm">
//                       {Math.max(0, Math.ceil((new Date(selectedTask.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
//                     </p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Progress Visualization</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <ProgressChart 
//                   history={progressHistory} 
//                   dueDate={selectedTask.dueDate}
//                 />
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       )}

//       {selectedTask && progressHistory.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Progress History</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <ProgressHistory history={progressHistory} />
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

// export default Progress;


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Slider } from "../components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, API_URL } from "../lib/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/auth-context";
import { ProgressChart } from "../components/progress/progress-chart";
import { ProgressHistory } from "../components/progress/progress-history";
import { format } from "date-fns";
import axios from "axios";

function Progress() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [blockers, setBlockers] = useState("");
  const [achievements, setAchievements] = useState("");
  const [progressHistory, setProgressHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);



  useEffect(() => {
    const fetchUserTasks = async () => {
      try {
        setIsLoading(true);
        console.log("user in progress", user.id);
  
        // Axios request to get tasks by user ID
        const response = await axios.get(`${API_URL}/users/${user.id}/tasks`);
        
        const filteredTasks = response.data.filter(task =>
          ["Pending", "In Progress"].includes(task.status)
        );
  
        setTasks(filteredTasks);
  
        // Select the first task by default if available
        if (filteredTasks.length > 0) {
          setSelectedTask(filteredTasks[0]);
          setProgressValue(filteredTasks[0].progress || 0);
          fetchProgressHistory(filteredTasks[0]._id);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load your tasks");
      } finally {
        setIsLoading(false);
      }
    };
  
    if (user) {
      fetchUserTasks();
    }
  }, [user, toast]);
  

  const fetchProgressHistory = async (taskId) => {
    try {
      const history = await api.progress.getTaskProgress(taskId);
      setProgressHistory(history);
    } catch (error) {
      console.error("Error fetching progress history:", error);
      toast.error("Failed to load progress history");
    }
  };

  const handleTaskChange = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (task) {
      setSelectedTask(task);
      setProgressValue(task.progress || 0);
      fetchProgressHistory(task._id);
      // Reset form fields
      setNotes("");
      setBlockers("");
      setAchievements("");
    }
  };

  const handleSubmitProgress = async () => {
    if (!selectedTask) {
      toast.error("Please select a task first");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const progressData = {
        user: user.id,
        task: selectedTask._id,
        progressPercentage: progressValue,
        notes,
        blockers,
        achievements,
        date: new Date(),
      };

      await api.progress.createProgress(progressData);
      
      // Update the task in the local state
      const updatedTasks = tasks.map(task => 
        task._id === selectedTask._id 
          ? { ...task, progress: progressValue } 
          : task
      );
      setTasks(updatedTasks);
      
      // Update selected task
      setSelectedTask({ ...selectedTask, progress: progressValue });
      
      // Refresh progress history
      fetchProgressHistory(selectedTask._id);
      
      // Reset form fields
      setNotes("");
      setBlockers("");
      setAchievements("");
      
      toast.success("Progress updated successfully");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Active Tasks</h2>
        <p className="text-muted-foreground text-center mb-6">
          You don't have any active tasks assigned to you at the moment.
        </p>
        <Button onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ToastContainer />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Progress</h1>
          <p className="text-muted-foreground">
            Track and update your daily progress on assigned tasks
          </p>
        </div>
        
        <div className="w-full md:w-64">
          <Select 
            value={selectedTask?._id} 
            onValueChange={handleTaskChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a task" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map(task => (
                <SelectItem key={task._id} value={task._id}>
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedTask && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Update Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Current Progress: {progressValue}%</Label>
                  <span className="text-sm text-muted-foreground">
                    Due: {format(new Date(selectedTask.dueDate), "PPP")}
                  </span>
                </div>
               <Slider
                  value={[progressValue]}
                  onValueChange={(values) => setProgressValue(values[0])}
                  max={100}
                  step={1}
                  className="py-4 [&>span:first-child]:bg-black [&>span:last-child]:bg-white [&>span:first-child]:border-black [&>span:last-child]:border-white-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Today's Progress Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="What did you accomplish today?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blockers">Blockers or Challenges</Label>
                <Textarea
                  id="blockers"
                  placeholder="Any issues preventing progress?"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievements">Key Achievements</Label>
                <Textarea
                  id="achievements"
                  placeholder="What are you most proud of today?"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleSubmitProgress} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Progress Update
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm">{selectedTask.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <p className="text-sm">{selectedTask.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm">{format(new Date(selectedTask.dueDate), "PPP")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Days Left</p>
                    <p className="text-sm">
                      {Math.max(0, Math.ceil((new Date(selectedTask.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressChart 
                  history={progressHistory} 
                  dueDate={selectedTask.dueDate}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {selectedTask && progressHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress History</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressHistory history={progressHistory} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Progress;

