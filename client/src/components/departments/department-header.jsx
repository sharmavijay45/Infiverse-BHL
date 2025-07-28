"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Plus } from "lucide-react"
import { CreateDepartmentDialog } from "./create-department-dialog"

export function DepartmentHeader() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
        <p className="text-muted-foreground">Manage departments and their tasks</p>
      </div>
      <Button onClick={() => setIsCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Department
      </Button>

      <CreateDepartmentDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}
