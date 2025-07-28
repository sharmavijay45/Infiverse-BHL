"use client"

import { createContext, useContext, useState } from "react"

const WorkspaceContext = createContext(undefined)

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState({
    id: "workspace-1",
    name: "Acme Inc",
    role: "Admin",
  })

  return <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
