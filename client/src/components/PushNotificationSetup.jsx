"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Alert, AlertDescription } from "./ui/alert"
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { usePushNotifications } from "../hooks/usePushNotifications"

export function PushNotificationSetup() {
  const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe } = usePushNotifications()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubscribe = async () => {
    const success = await subscribe()
    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  const handleUnsubscribe = async () => {
    await unsubscribe()
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>Push notifications are not supported in this browser</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>Get instant notifications for task reminders and updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showSuccess && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Push notifications enabled successfully!</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Status: {isSubscribed ? "Enabled" : "Disabled"}</p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? "You will receive push notifications for important updates"
                : "Enable notifications to stay updated on task reminders"}
            </p>
          </div>

          <Button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={isLoading}
            variant={isSubscribed ? "outline" : "default"}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubscribed ? (
              <>
                <BellOff className="mr-2 h-4 w-4" />
                Disable
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Enable
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
