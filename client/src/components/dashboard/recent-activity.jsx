"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Loader2 } from "lucide-react"
import { api } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"

export function RecentActivity() {
  const { toast } = useToast()
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setIsLoading(true)
        const data = await api.dashboard.getRecentActivity()
        setActivities(data)
      } catch (error) {
        console.error("Error fetching recent activity:", error)
        toast({
          title: "Error",
          description: "Failed to load recent activity",
          variant: "destructive",
        })
        // Set fallback activities
        setActivities([
          {
            id: 1,
            user: {
              name: "John Doe",
              avatar: "/placeholder.svg?height=40&width=40",
              initials: "JD",
            },
            action: "completed",
            task: "Q1 Marketing Campaign Planning",
            department: "Marketing",
            time: "2 hours ago",
          },
          {
            id: 2,
            user: {
              name: "Jane Smith",
              avatar: "/placeholder.svg?height=40&width=40",
              initials: "JS",
            },
            action: "updated",
            task: "Sales Presentation for Client XYZ",
            department: "Sales",
            time: "3 hours ago",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentActivity()
  }, [toast])

  const getActionColor = (action) => {
    switch (action) {
      case "completed":
        return "text-green-500"
      case "created":
        return "text-blue-500"
      case "updated":
        return "text-amber-500"
      case "assigned":
        return "text-purple-500"
      default:
        return "text-gray-500"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across all departments</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions across all departments</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                  <AvatarFallback>{activity.user.initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    <span className={getActionColor(activity.action)}>{activity.action}</span>{" "}
                    <span className="font-medium">{activity.task}</span> in{" "}
                    <span className="font-medium">{activity.department}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
