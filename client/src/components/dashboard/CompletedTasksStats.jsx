"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Progress } from "../ui/progress"
import { Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { API_URL } from "@/lib/api"

export function CompletedTasksStats() {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    noSubmission: 0,
    byDepartment: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        // Fetch completed tasks
        const tasksResponse = await axios.get(`${API_URL}/tasks?status=Completed`)
        const tasks = tasksResponse.data

        // Fetch all submissions
        const submissionsResponse = await axios.get(`${API_URL}/submissions`)
        const submissions = submissionsResponse.data

        // Fetch departments
        const departmentsResponse = await axios.get(`${API_URL}/departments`)
        const departments = departmentsResponse.data

        // Calculate stats
        const total = tasks.length
        let approved = 0
        let pending = 0
        let rejected = 0
        let noSubmission = 0

        // Department stats initialization
        const departmentStats = departments.map((dept) => ({
          id: dept._id,
          name: dept.name,
          color: dept.color,
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          noSubmission: 0,
        }))

        // Process tasks and submissions
        tasks.forEach((task) => {
          const submission = submissions.find((sub) => sub.task?._id === task._id)
          const deptIndex = task.department ? departmentStats.findIndex((d) => d.id === task.department._id) : -1

          if (deptIndex >= 0) {
            departmentStats[deptIndex].total++
          }

          if (submission) {
            if (submission.status === "Approved") {
              approved++
              if (deptIndex >= 0) departmentStats[deptIndex].approved++
            } else if (submission.status === "Rejected") {
              rejected++
              if (deptIndex >= 0) departmentStats[deptIndex].rejected++
            } else {
              pending++
              if (deptIndex >= 0) departmentStats[deptIndex].pending++
            }
          } else {
            noSubmission++
            if (deptIndex >= 0) departmentStats[deptIndex].noSubmission++
          }
        })

        // Filter out departments with no completed tasks
        const filteredDeptStats = departmentStats.filter((dept) => dept.total > 0)

        setStats({
          total,
          approved,
          pending,
          rejected,
          noSubmission,
          byDepartment: filteredDeptStats,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        toast({
          title: "Error",
          description: "Failed to load completion statistics",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [toast])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Completion Statistics</CardTitle>
          <CardDescription>Overview of task submissions and approvals</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  const submissionData = [
    { name: "Approved", value: stats.approved, color: "#22c55e" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
    { name: "No Submission", value: stats.noSubmission, color: "#94a3b8" },
  ].filter((item) => item.value > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Completion Statistics</CardTitle>
        <CardDescription>Overview of task submissions and approvals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-600 dark:text-green-400">Approved</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-800/30 p-2 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-900/20 border-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending</p>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</p>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-800/30 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-900/20 border-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">Rejected</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.rejected}</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-800/30 p-2 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-50 dark:bg-slate-800/50 border-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No Submission</p>
                      <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.noSubmission}</p>
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Submission Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Approved</span>
                  <span className="text-sm font-medium">{Math.round((stats.approved / stats.total) * 100)}%</span>
                </div>
                <Progress value={(stats.approved / stats.total) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending Review</span>
                  <span className="text-sm font-medium">{Math.round((stats.pending / stats.total) * 100)}%</span>
                </div>
                <Progress value={(stats.pending / stats.total) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rejected</span>
                  <span className="text-sm font-medium">{Math.round((stats.rejected / stats.total) * 100)}%</span>
                </div>
                <Progress value={(stats.rejected / stats.total) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-4">Submission Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={submissionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {submissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {stats.byDepartment.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-4">Completion by Department</h3>
            <div className="space-y-4">
              {stats.byDepartment.map((dept) => (
                <div key={dept.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                      <span className="text-sm font-medium">{dept.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {dept.approved}/{dept.total} approved
                    </span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${(dept.approved / dept.total) * 100}%` }}
                    ></div>
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${(dept.pending / dept.total) * 100}%` }}
                    ></div>
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${(dept.rejected / dept.total) * 100}%` }}
                    ></div>
                    <div
                      className="bg-slate-400 h-full"
                      style={{ width: `${(dept.noSubmission / dept.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
