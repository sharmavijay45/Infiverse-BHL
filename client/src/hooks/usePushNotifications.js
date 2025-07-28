"use client"

import { useState, useEffect } from "react"
import { initializePushNotifications, unsubscribeFromPushNotifications } from "../utils/pushNotifications"
import { useAuth } from "../context/auth-context"

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const user = JSON.parse(localStorage.getItem("WorkflowUser"))

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window
    setIsSupported(supported)

    // Check if already subscribed
    if (supported && user?.id) {
      checkSubscriptionStatus()
    }
  }, [user])

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      }
    } catch (error) {
      console.error("Error checking subscription status:", error)
    }
  }

  const subscribe = async () => {
    if (!user?.id) {
      setError("User not authenticated")
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const subscription = await initializePushNotifications(user.id)
      setIsSubscribed(!!subscription)
      return !!subscription
    } catch (error) {
      setError(error.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await unsubscribeFromPushNotifications()
      setIsSubscribed(false)
      return true
    } catch (error) {
      setError(error.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  }
}
