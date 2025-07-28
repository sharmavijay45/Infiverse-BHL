
// "use client";

// import { useState } from "react";
// import { Bell } from "lucide-react";
// import { Button } from "../ui/button";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
// import { Badge } from "../ui/badge";
// import { useDashboard } from "../../context/DashboardContext";
// import { useNavigate } from "react-router-dom";

// export function NotificationsPopover() {
//   const dashboardContext = useDashboard();
//   const { recentReviews = [], hasNewReviews = false, markReviewsAsSeen = () => {} } = dashboardContext || {};
//   const [readReviews, setReadReviews] = useState(new Set());
//   const navigate = useNavigate();

//   // Debug log to inspect recentReviews
//   console.log("recentReviews:", recentReviews);

//   // Ensure recentReviews is an array before filtering
//   const safeReviews = Array.isArray(recentReviews) ? recentReviews : [];
//   const unreadCount = safeReviews.filter((review) => !readReviews.has(review._id)).length;

//   const markAsRead = (reviewId) => {
//     setReadReviews((prev) => new Set([...prev, reviewId]));
//   };

//   return (
//     <Popover>
//       <PopoverTrigger asChild>
//         <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unreadCount} unread)`}>
//           <Bell className="h-5 w-5" />
//           {unreadCount > 0 && (
//             <Badge className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs">
//               {unreadCount}
//             </Badge>
//           )}
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-80 bg-white border shadow-xl rounded-xl p-4" align="end">
//         <div className="flex items-center justify-between mb-3">
//           <h4 className="text-sm font-medium">Notifications</h4>
//           {unreadCount > 0 && (
//             <Button
//               variant="link"
//               size="sm"
//               onClick={() => {
//                 markReviewsAsSeen();
//                 setReadReviews(new Set(safeReviews.map((r) => r._id)));
//               }}
//               className="text-blue-600 text-xs"
//             >
//               Mark all as read
//             </Button>
//           )}
//         </div>
//         <div className="space-y-2 max-h-64 overflow-y-auto">
//           {safeReviews.length === 0 ? (
//             <p className="text-sm text-muted-foreground text-center py-4">No new notifications</p>
//           ) : (
//             safeReviews.map((review) => (
//               <div
//                 key={review._id}
//                 className={`p-2 rounded-md text-sm ${
//                   readReviews.has(review._id) ? "bg-muted/50" : "bg-blue-50 dark:bg-blue-900/20"
//                 } cursor-pointer hover:bg-muted`}
//                 onClick={() => {
//                   markAsRead(review._id);
//                   navigate(`/tasks/${review.task._id}`);
//                 }}
//               >
//                 <p className="font-medium">
//                   Submission for "{review.task?.title || "Unknown Task"}" was {review.status}
//                 </p>
//                 <p className="text-xs text-muted-foreground">
//                   {new Date(review.updatedAt).toLocaleString()}
//                 </p>
//               </div>
//             ))
//           )}
//         </div>
//       </PopoverContent>
//     </Popover>
//   );
// }



import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { useDashboard } from "../../context/DashboardContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "@/lib/api";

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const navigate = useNavigate();

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

  const markNotificationAsRead = async (notificationId) => {
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

  const deleteNotification = async (notificationId) => {
    try {
      const storedUser = localStorage.getItem("WorkflowUser");
      const userId = storedUser ? JSON.parse(storedUser).id : null;
      if (!userId) return;
  
      await axios.delete(`${API_URL}/user-notifications/${notificationId}?userId=${userId}`);
      setNotifications(notifications.filter((notification) => notification._id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${notifications.length} unread)`}>
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <Badge className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs">
              {notifications.filter((notification) => !notification.read).length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-white border shadow-xl rounded-xl p-4" align="end">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Notifications</h4>
          {hasUnread && (
            <Button
              variant="link"
              size="sm"
              onClick={markAllAsRead}
              className="text-blue-600 text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No new notifications</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-2 rounded-md text-sm ${
                  notification.read ? "bg-muted/50" : "bg-blue-50 dark:bg-blue-900/20"
                } cursor-pointer hover:bg-muted`}
                onClick={() => {
                  markNotificationAsRead(notification._id);
                  navigate(`/tasks/${notification.task}`);
                }}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium">
                    {notification.message}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    className="text-red-600 text-xs"
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
