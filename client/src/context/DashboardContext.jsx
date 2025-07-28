// "use client";

// import { createContext, useContext } from "react";

// const DashboardContext = createContext();

// export const DashboardProvider = ({ children, recentReviews, hasNewReviews, markReviewsAsSeen }) => {
//   return (
//     <DashboardContext.Provider value={{ recentReviews, hasNewReviews, markReviewsAsSeen }}>
//       {children}
//     </DashboardContext.Provider>
//   );
// };

// export const useDashboard = () => useContext(DashboardContext);

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/lib/api";

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
console.log("notifications",notifications)
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

  return (
    <DashboardContext.Provider value={{ notifications, hasUnread, markNotificationAsRead, markAllAsRead }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);

