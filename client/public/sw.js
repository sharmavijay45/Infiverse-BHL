// Service Worker for handling push notifications (localhost compatible)
self.addEventListener("push", (event) => {
    console.log("Push event received:", event)
  
    if (event.data) {
      const data = event.data.json()
      console.log("Push data:", data)
  
      const options = {
        body: data.body,
        icon: "/vite.svg", // Using Vite's default icon for localhost
        badge: "/vite.svg",
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: data.primaryKey || "1",
          url: data.url || "/",
        },
        actions: [
          {
            action: "explore",
            title: "View Details",
          },
          {
            action: "close",
            title: "Close",
          },
        ],
        requireInteraction: true,
        tag: data.tag || "default",
      }
  
      event.waitUntil(self.registration.showNotification(data.title, options))
    }
  })
  
  self.addEventListener("notificationclick", (event) => {
    console.log("Notification click received:", event)
  
    event.notification.close()
  
    if (event.action === "explore") {
      // Open the app when user clicks "View Details"
      event.waitUntil(clients.openWindow(event.notification.data.url))
    } else if (event.action === "close") {
      // Just close the notification
      return
    } else {
      // Default action - open the app
      event.waitUntil(clients.openWindow(event.notification.data.url))
    }
  })
  
  self.addEventListener("notificationclose", (event) => {
    console.log("Notification closed:", event)
  })
  
