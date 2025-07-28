"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Loader2 } from "lucide-react"
import { api } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"

export function TasksOverview() {
  const { toast } = useToast()
  const [tasksData, setTasksData] = useState({
    statusData: [],
    priorityData: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTasksOverview = async () => {
      try {
        setIsLoading(true)
        const data = await api.dashboard.getTasksOverview()
        setTasksData(data)
      } catch (error) {
        console.error("Error fetching tasks overview:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks overview",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasksOverview()
  }, [toast])

  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Tasks Overview</CardTitle>
          <CardDescription>Distribution of tasks by status and priority</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  // Default data if API returns empty
  const statusData =
    tasksData.statusData.length > 0
      ? tasksData.statusData
      : [
          { name: "Completed", value: 0, color: "#22c55e" },
          { name: "In Progress", value: 0, color: "#3b82f6" },
          { name: "Pending", value: 0, color: "#f59e0b" },
        ]

  const priorityData =
    tasksData.priorityData.length > 0
      ? tasksData.priorityData
      : [
          { name: "High", value: 0, color: "#ef4444" },
          { name: "Medium", value: 0, color: "#f59e0b" },
          { name: "Low", value: 0, color: "#22c55e" },
        ]

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Tasks Overview</CardTitle>
        <CardDescription>Distribution of tasks by status and priority</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="priority">Priority</TabsTrigger>
          </TabsList>
          <TabsContent value="status" className="h-[220px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="priority" className="h-[220px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
