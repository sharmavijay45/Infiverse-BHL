// "use client"

// import { useState, useEffect } from "react"
// import { Bell } from "lucide-react"
// import { Button } from "./button"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "./dropdown-menu"
// import { useNavigate } from "react-router-dom"
// import { useAuth } from "../../context/auth-context"

// export function NotificationBadge() {
//   const navigate = useNavigate()
//   const { user } = useAuth()
//   const [notifications, setNotifications] = useState([])
//   const [hasUnread, setHasUnread] = useState(false)

//   useEffect(() => {
//     if (!user?.id) return

//     const fetchNotifications = async () => {
//       try {
//         // In a real app, you would fetch from an API endpoint
//         // const response = await axios.get(`http://localhost:5000/api/users/${user.id}/notifications`)
//         // setNotifications(response.data)

//         // For demo purposes, we'll create some mock notifications
//         const mockNotifications = [
//           {
//             id: "1",
//             type: "submission_approved",
//             title: "Submission Approved",
//             message: "Your task submission for 'Create Login Page' has been approved!",
//             createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
//             read: false,
//             taskId: "task123",
//           },
//           {
//             id: "2",
//             type: "submission_rejected",
//             title: "Submission Needs Revision",
//             message: "Your task submission for 'API Integration' requires some changes.",
//             createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
//             read: false,
//             taskId: "task456",
//           },
//           {
//             id: "3",
//             type: "task_assigned",
//             title: "New Task Assigned",
//             message: "You have been assigned a new task: 'Database Schema Design'",
//             createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
//             read: true,
//             taskId: "task789",
//           },
//         ]

//         setNotifications(mockNotifications)
//         setHasUnread(mockNotifications.some((notification) => !notification.read))
//       } catch (error) {
//         console.error("Error fetching notifications:", error)
//       }
//     }

//     fetchNotifications()

//     // Set up polling for new notifications (every minute)
//     const intervalId = setInterval(fetchNotifications, 60 * 1000)

//     return () => clearInterval(intervalId)
//   }, [user])

//   const markAsRead = async (notificationId) => {
//     try {
//       // In a real app, you would call an API endpoint
//       // await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`)

//       // For demo purposes, we'll update the local state
//       setNotifications(
//         notifications.map((notification) =>
//           notification.id === notificationId ? { ...notification, read: true } : notification,
//         ),
//       )

//       // Check if there are still unread notifications
//       const stillHasUnread = notifications.some(
//         (notification) => notification.id !== notificationId && !notification.read,
//       )
//       setHasUnread(stillHasUnread)
//     } catch (error) {
//       console.error("Error marking notification as read:", error)
//     }
//   }

//   const markAllAsRead = async () => {
//     try {
//       // In a real app, you would call an API endpoint
//       // await axios.put(`http://localhost:5000/api/users/${user.id}/notifications/read-all`)

//       // For demo purposes, we'll update the local state
//       setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
//       setHasUnread(false)
//     } catch (error) {
//       console.error("Error marking all notifications as read:", error)
//     }
//   }

//   const handleNotificationClick = (notification) => {
//     markAsRead(notification.id)

//     // Navigate based on notification type
//     if (notification.type === "submission_approved" || notification.type === "submission_rejected") {
//       navigate("/completed-tasks")
//     } else if (notification.type === "task_assigned" && notification.taskId) {
//       navigate(`/tasks/${notification.taskId}`)
//     }
//   }

//   const getNotificationIcon = (type) => {
//     switch (type) {
//       case "submission_approved":
//         return <div className="w-2 h-2 rounded-full bg-green-500" />
//       case "submission_rejected":
//         return <div className="w-2 h-2 rounded-full bg-red-500" />
//       case "task_assigned":
//         return <div className="w-2 h-2 rounded-full bg-blue-500" />
//       default:
//         return <div className="w-2 h-2 rounded-full bg-gray-500" />
//     }
//   }

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" size="icon" className="relative">
//           <Bell className="h-5 w-5" />
//           {hasUnread && (
//             <span className="absolute top-1 right-1 flex h-2 w-2">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
//               <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
//             </span>
//           )}
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end" className="w-80">
//         <DropdownMenuLabel className="flex justify-between items-center">
//           <span>Notifications</span>
//           {hasUnread && (
//             <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={markAllAsRead}>
//               Mark all as read
//             </Button>
//           )}
//         </DropdownMenuLabel>
//         <DropdownMenuSeparator />
//         {notifications.length === 0 ? (
//           <div className="py-4 px-2 text-center text-muted-foreground">
//             <p>No notifications</p>
//           </div>
//         ) : (
//           notifications.map((notification) => (
//             <DropdownMenuItem
//               key={notification.id}
//               className={`flex items-start p-3 cursor-pointer ${!notification.read ? "bg-muted/50" : ""}`}
//               onClick={() => handleNotificationClick(notification)}
//             >
//               <div className="flex gap-2 w-full">
//                 <div className="mt-1">{getNotificationIcon(notification.type)}</div>
//                 <div className="flex-1 space-y-1">
//                   <p className="text-sm font-medium leading-none">{notification.title}</p>
//                   <p className="text-sm text-muted-foreground">{notification.message}</p>
//                   <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
//                 </div>
//               </div>
//             </DropdownMenuItem>
//           ))
//         )}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }

"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/auth-context"
import axios from "axios"
import { API_URL } from "@/lib/api"

export function NotificationBadge() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const storedUser = localStorage.getItem("WorkflowUser");
        const userId = storedUser ? JSON.parse(storedUser).id : null;
        if (!userId) return;

        const response = await axios.get(
          `${API_URL}/user-notifications/${userId}`
        );
        const notificationsData = Array.isArray(response.data) ? response.data : [];
        setNotifications(notificationsData);
        setHasUnread(notificationsData.some((notification) => !notification.read));
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const storedUser = localStorage.getItem("WorkflowUser");
      const userId = storedUser ? JSON.parse(storedUser).id : null;
      if (!userId) return;

      await axios.put(
        `${API_URL}/user-notifications/${notificationId}/read?userId=${userId}`
      );
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId ? { ...notification, read: true } : notification
        )
      );
      setHasUnread(notifications.some((notification) => notification._id !== notificationId && !notification.read));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const storedUser = localStorage.getItem("WorkflowUser");
      const userId = storedUser ? JSON.parse(storedUser).id : null;
      if (!userId) return;

      await axios.put(
        `${API_URL}/user-notifications/read-all?userId=${userId}`
      );
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })));
      setHasUnread(false);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id)
    if (notification.type === "submission_approved" || notification.type === "submission_rejected") {
      navigate("/completed-tasks")
    } else if ((notification.type === "task_assigned" || notification.type === "task_submitted") && notification.task) {
      navigate(`/tasks/${notification.task}`)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "submission_approved":
        return <div className="w-2 h-2 rounded-full bg-green-500" />
      case "submission_rejected":
        return <div className="w-2 h-2 rounded-full bg-red-500" />
      case "task_assigned":
        return <div className="w-2 h-2 rounded-full bg-blue-500" />
      case "task_submitted":
        return <div className="w-2 h-2 rounded-full bg-yellow-500" />
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {hasUnread && (
            <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-4 px-2 text-center text-muted-foreground">
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification._id}
              className={`flex items-start p-3 cursor-pointer ${!notification.read ? "bg-muted/50" : ""}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-2 w-full">
                <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

