"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Sparkles, Clock, ArrowRight, Users, Link, GitBranch, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

export function OptimizationInsights({ insights }) {
  const { toast } = useToast();

  const getImpactColor = (impact) => {
    switch (impact) {
      case "High":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
      case "Low":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Resources": return <Users className="h-5 w-5" />;
      case "Dependencies": return <Link className="h-5 w-5" />;
      case "Deadlines": return <Clock className="h-5 w-5" />;
      case "Workflow": return <GitBranch className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const handleApplyAction = async (action, insight) => {
    try {
      // Extract task title from description
      const taskTitle = insight.description.match(/Task '([^']+)'/)?.[1];
      if (!taskTitle) {
        throw new Error("Task not found in insight description");
      }

      const tasks = await api.tasks.getTasks();
      const task = tasks.find((t) => t.title === taskTitle);
      if (!task) {
        throw new Error("Task not found");
      }

      let updates = {};
      if (action.includes("Reassign")) {
        updates.assignee = null; // Mock reassignment
      } else if (action.includes("Adjust deadlines") || action.includes("Extend deadlines")) {
        const newDueDate = new Date(task.dueDate);
        newDueDate.setDate(newDueDate.getDate() + 7);
        updates.dueDate = newDueDate.toISOString();
      } else if (action.includes("Prioritize")) {
        updates.priority = "High";
      }

      await api.tasks.updateTask(task._id, updates);
      toast({
        title: "Success",
        description: `Action "${action}" applied to task "${taskTitle}"`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || `Failed to apply action "${action}"`,
        variant: "destructive",
      });
    }
  };

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Generated Insights
          </CardTitle>
          <CardDescription>Optimization suggestions based on AI analysis of your workflow data</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>No AI insights available yet. Generate insights by clicking "Refresh Analysis" in the Actions panel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Generated Insights
        </CardTitle>
        <CardDescription>Optimization suggestions based on AI analysis of your workflow data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Insights</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0 space-y-4">
            {insights.map((insight, index) => (
              <Card key={insight.id || index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{insight.title}</CardTitle>
                    <Badge className={getImpactColor(insight.impact)}>{insight.impact} Impact</Badge>
                  </div>
                  <CardDescription>{insight.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{insight.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {insight.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyAction(action, insight)}
                      >
                        {action}
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="resources" className="mt-0 space-y-4">
            {insights
              .filter((insight) => insight.category === "Resources")
              .map((insight, index) => (
                <Card key={insight.id || index} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <Badge className={getImpactColor(insight.impact)}>{insight.impact} Impact</Badge>
                    </div>
                    <CardDescription>{insight.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{insight.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {insight.actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyAction(action, insight)}
                        >
                          {action}
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="dependencies" className="mt-0 space-y-4">
            {insights
              .filter((insight) => insight.category === "Dependencies")
              .map((insight, index) => (
                <Card key={insight.id || index} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <Badge className={getImpactColor(insight.impact)}>{insight.impact} Impact</Badge>
                    </div>
                    <CardDescription>{insight.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{insight.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {insight.actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyAction(action, insight)}
                        >
                          {action}
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="deadlines" className="mt-0 space-y-4">
            {insights
              .filter((insight) => insight.category === "Deadlines")
              .map((insight, index) => (
                <Card key={insight.id || index} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <Badge className={getImpactColor(insight.impact)}>{insight.impact} Impact</Badge>
                    </div>
                    <CardDescription>{insight.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{insight.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {insight.actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyAction(action, insight)}
                        >
                          {action}
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}