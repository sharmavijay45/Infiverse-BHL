"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { api } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"

export function AIInsights() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [insights, setInsights] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true)
        const data = await api.dashboard.getAIInsights()
        setInsights(data.insights || [])
      } catch (error) {
        console.error("Error fetching AI insights:", error)
        toast({
          title: "Error",
          description: "Failed to load AI insights",
          variant: "destructive",
        })
        // Set fallback insights
        setInsights([
          "Marketing team has 3 tasks at risk of delay",
          "Sales team is overloaded with high-priority tasks",
          "Task dependencies in Operations need review",
          "Resource reallocation recommended for Project X",
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [toast])

  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
            <CardDescription>AI-powered workflow optimization</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          <CardDescription>AI-powered workflow optimization</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <span>{insight}</span>
              </li>
            ))}
          </ul>

          <Button variant="outline" className="w-full" onClick={() => navigate("/optimization")}>
            View All Insights
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
