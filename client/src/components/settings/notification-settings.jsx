"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false)

  const [settings, setSettings] = useState({
    emailNotifications: true,
    taskAssigned: true,
    taskUpdated: true,
    taskCompleted: true,
    commentAdded: true,
    aiSuggestions: true,
    dailyDigest: false,
    weeklyReport: true,
    notificationMethod: "email-and-app",
    notificationFrequency: "immediate",
  })

  const handleToggle = (field) => {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      alert("Notification settings updated successfully!")
    }, 1000)
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">Manage how and when you receive notifications</p>
      </div>
      <Separator />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="font-medium">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle("emailNotifications")}
            />
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">Task Notifications</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="task-assigned" className="cursor-pointer">
                  When a task is assigned to me
                </Label>
                <Switch
                  id="task-assigned"
                  checked={settings.taskAssigned}
                  onCheckedChange={() => handleToggle("taskAssigned")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="task-updated" className="cursor-pointer">
                  When a task I'm assigned to is updated
                </Label>
                <Switch
                  id="task-updated"
                  checked={settings.taskUpdated}
                  onCheckedChange={() => handleToggle("taskUpdated")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="task-completed" className="cursor-pointer">
                  When a task I'm assigned to is completed
                </Label>
                <Switch
                  id="task-completed"
                  checked={settings.taskCompleted}
                  onCheckedChange={() => handleToggle("taskCompleted")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="comment-added" className="cursor-pointer">
                  When someone comments on my task
                </Label>
                <Switch
                  id="comment-added"
                  checked={settings.commentAdded}
                  onCheckedChange={() => handleToggle("commentAdded")}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3">AI and Reports</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-suggestions" className="cursor-pointer">
                  AI optimization suggestions
                </Label>
                <Switch
                  id="ai-suggestions"
                  checked={settings.aiSuggestions}
                  onCheckedChange={() => handleToggle("aiSuggestions")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-digest" className="cursor-pointer">
                  Daily activity digest
                </Label>
                <Switch
                  id="daily-digest"
                  checked={settings.dailyDigest}
                  onCheckedChange={() => handleToggle("dailyDigest")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-report" className="cursor-pointer">
                  Weekly performance report
                </Label>
                <Switch
                  id="weekly-report"
                  checked={settings.weeklyReport}
                  onCheckedChange={() => handleToggle("weeklyReport")}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label htmlFor="notification-method" className="text-sm font-medium">
                Notification Method
              </Label>
              <RadioGroup
                id="notification-method"
                value={settings.notificationMethod}
                onValueChange={(value) => handleChange("notificationMethod", value)}
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email-only" id="email-only" />
                  <Label htmlFor="email-only">Email only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="app-only" id="app-only" />
                  <Label htmlFor="app-only">In-app only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email-and-app" id="email-and-app" />
                  <Label htmlFor="email-and-app">Email and in-app</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-frequency">Notification Frequency</Label>
              <Select
                value={settings.notificationFrequency}
                onValueChange={(value) => handleChange("notificationFrequency", value)}
              >
                <SelectTrigger id="notification-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly digest</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
