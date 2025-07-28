"use client"

import { useState, useCallback } from "react"

// This is a simplified version of the toast hook
// In a real application, you would use a more robust toast library
export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ title, description, type = "default", duration = 3000 }) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, title, description, type, duration }

    setToasts((prevToasts) => [...prevToasts, newToast])

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, duration)

    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  return { toast, dismiss, toasts }
}
