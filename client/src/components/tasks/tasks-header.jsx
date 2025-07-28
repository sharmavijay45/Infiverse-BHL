"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Plus } from "lucide-react"
import { CreateTaskDialog } from "./create-task-dialog"

export function TasksHeader() {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">Manage and track tasks across all departments</p>
      </div>
      <Button onClick={() => setIsCreateTaskOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Task
      </Button>

      <CreateTaskDialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen} />
    </div>
  )
}
