"use client"

import { createContext, useContext, useEffect, useState } from "react"
import io from "socket.io-client"
import { useToast } from "../hooks/use-toast"

const SocketContext = createContext(null)

export function useSocketContext() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider")
  }
  return context
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()
  const [events, setEvents] = useState([])

  useEffect(() => {
    // Get the base URL from the API URL environment variable
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    const baseUrl = apiUrl.replace(/\/api$/, '') // Remove '/api' if present
    
    // Initialize socket connection
    const socketInstance = io(baseUrl, {
      withCredentials: true,
      auth: {
        token: localStorage.getItem('authToken')
      }
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
      
      // Join rooms based on user ID if available
      const userData = localStorage.getItem('userData')
      if (userData) {
        try {
          const { id, department } = JSON.parse(userData)
          socketInstance.emit("join", [`user:${id}`, `department:${department}`])
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    // Real-time events
    socketInstance.on("task-created", (task) => {
      setEvents(prev => [...prev, { type: 'task-created', data: task, timestamp: new Date() }])
      toast({
        title: "New Task Created",
        description: `"${task.title}" has been added to ${task.department?.name || 'a department'}`,
      })
    })

    socketInstance.on("task-updated", (task) => {
      setEvents(prev => [...prev, { type: 'task-updated', data: task, timestamp: new Date() }])
      toast({
        title: "Task Updated",
        description: `"${task.title}" has been updated`,
      })
    })

    socketInstance.on("task-deleted", (taskId) => {
      setEvents(prev => [...prev, { type: 'task-deleted', data: { id: taskId }, timestamp: new Date() }])
      toast({
        title: "Task Deleted",
        description: "A task has been removed",
      })
    })

    socketInstance.on("department-created", (department) => {
      setEvents(prev => [...prev, { type: 'department-created', data: department, timestamp: new Date() }])
      toast({
        title: "New Department Created",
        description: `"${department.name}" has been created`,
      })
    })

    socketInstance.on("department-updated", (department) => {
      setEvents(prev => [...prev, { type: 'department-updated', data: department, timestamp: new Date() }])
      toast({
        title: "Department Updated",
        description: `"${department.name}" has been updated`,
      })
    })

    socketInstance.on("optimization-suggestions", (suggestions) => {
      setEvents(prev => [...prev, { type: 'optimization-suggestions', data: suggestions, timestamp: new Date() }])
      toast({
        title: "New AI Suggestions Available",
        description: "The AI has generated new workflow optimization suggestions",
      })
    })

    setSocket(socketInstance)

    // Clean up on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [toast])

  const joinRooms = (rooms) => {
    if (socket && isConnected) {
      socket.emit("join", rooms)
    }
  }

  const value = {
    socket,
    isConnected,
    joinRooms,
    events
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
