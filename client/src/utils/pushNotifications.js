import { API_URL } from "@/lib/api"

// OR use environment variable:
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Register service worker
export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      console.log("Service Worker registered:", registration)
      return registration
    } catch (error) {
      console.error("Service Worker registration failed:", error)
      throw error
    }
  } else {
    throw new Error("Service Worker not supported")
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error("This browser does not support notifications")
  }

  const permission = await Notification.requestPermission()

  if (permission !== "granted") {
    throw new Error("Notification permission denied")
  }

  return permission
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(registration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    console.log("Push subscription:", subscription)
    return subscription
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error)
    throw error
  }
}

// Send subscription to server (localhost)
export async function sendSubscriptionToServer(subscription, userId) {
  try {
    const response = await fetch(`${API_URL}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": localStorage.getItem("WorkflowToken"),
      },
      body: JSON.stringify({
        subscription,
        userId,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send subscription to server")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending subscription to server:", error)
    throw error
  }
}

// Initialize push notifications
export async function initializePushNotifications(userId) {
  try {
    // Check if notifications are supported
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported")
      return null
    }

    // Request permission
    await requestNotificationPermission()

    // Register service worker
    const registration = await registerServiceWorker()

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready

    // Subscribe to push notifications
    const subscription = await subscribeToPushNotifications(registration)

    // Send subscription to server
    await sendSubscriptionToServer(subscription, userId)

    console.log("Push notifications initialized successfully")
    return subscription
  } catch (error) {
    console.error("Failed to initialize push notifications:", error)
    return null
  }
}

// Test notification function for localhost (using Vite icon)
export async function sendTestNotification() {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Test Notification", {
      body: "This is a test notification from localhost!",
      icon: "/vite.svg", // Using Vite's default icon
    })
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        console.log("Unsubscribed from push notifications")
      }
    }
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error)
  }
}
