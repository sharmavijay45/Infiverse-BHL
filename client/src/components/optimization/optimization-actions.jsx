"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw, Download, Share2 } from "lucide-react";
import { useOptimizeWorkflow } from "../../hooks/use-ai";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

export function OptimizationActions({ tasks, setTasks, insights }) {
  const { optimizeWorkflow, isLoading } = useOptimizeWorkflow();
  const { toast } = useToast();

  const handleRefreshAnalysis = async () => {
    try {
      await optimizeWorkflow();
      toast({
        title: "Success",
        description: "AI analysis refreshed successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to refresh AI analysis",
        variant: "destructive",
      });
    }
  };

  const handleApplyAllRecommendations = async () => {
    try {
      const insightsData = await api.ai.getInsights();
      for (const insight of insightsData) {
        for (const action of insight.actions) {
          if (action.includes("Reassign")) {
            const taskTitle = insight.description.match(/Task '([^']+)'/)?.[1];
            const task = tasks.find((t) => t.title === taskTitle);
            if (task) {
              await api.tasks.updateTask(task._id, { assignee: null });
            }
          } else if (action.includes("Adjust deadlines")) {
            const taskTitle = insight.description.match(/Task '([^']+)'/)?.[1];
            const task = tasks.find((t) => t.title === taskTitle);
            if (task) {
              const newDueDate = new Date(task.dueDate);
              newDueDate.setDate(newDueDate.getDate() + 7);
              await api.tasks.updateTask(task._id, { dueDate: newDueDate.toISOString() });
            }
          }
        }
      }
      const updatedTasks = await api.tasks.getTasks();
      setTasks(updatedTasks);
      toast({
        title: "Success",
        description: "All AI recommendations applied",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to apply recommendations",
        variant: "destructive",
      });
    }
  };

  const handleExportInsights = async () => {
    try {
      const insightsData = await api.ai.getInsights();
      const blob = new Blob([JSON.stringify(insightsData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-insights.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Insights exported successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to export insights",
        variant: "destructive",
      });
    }
  };

  const handleShareInsights = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Apply AI recommendations to your workflow</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" onClick={handleApplyAllRecommendations} disabled={isLoading}>
          Apply All Recommendations
        </Button>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="justify-start"
            onClick={handleRefreshAnalysis}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isLoading ? "Refreshing..." : "Refresh Analysis"}
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={handleExportInsights}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Insights
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={handleShareInsights}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Insights
          </Button>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-2">Analysis Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Insights</span>
              <span>{insights ? insights.length : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High Impact</span>
              <span>{insights ? insights.filter((i) => i.impact === "High").length : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Medium Impact</span>
              <span>{insights ? insights.filter((i) => i.impact === "Medium").length : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Low Impact</span>
              <span>{insights ? insights.filter((i) => i.impact === "Low").length : 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>
                {insights && insights.length > 0
                  ? new Date(insights[insights.length - 1].createdAt).toLocaleString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}