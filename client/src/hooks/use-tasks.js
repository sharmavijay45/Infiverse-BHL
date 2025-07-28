"use client"

import { useState, useEffect } from "react"
import { api } from "../lib/api"

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const data = await api.tasks.getTasks()
        setTasks(data)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  return { tasks, isLoading, error }
}

export function useTask(id) {
  const [task, setTask] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      return
    }

    const fetchTask = async () => {
      try {
        setIsLoading(true)
        const data = await api.tasks.getTask(id)
        setTask(data)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTask()
  }, [id])

  return { task, isLoading, error }
}

export function useCreateTask() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const createTask = async (taskData) => {
    try {
      setIsLoading(true)
      const data = await api.tasks.createTask(taskData)
      setError(null)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { createTask, isLoading, error }
}

export function useUpdateTask() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateTask = async (id, taskData) => {
    try {
      setIsLoading(true)
      const data = await api.tasks.updateTask(id, taskData)
      setError(null)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { updateTask, isLoading, error }
}

export function useDeleteTask() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const deleteTask = async (id) => {
    try {
      setIsLoading(true)
      await api.tasks.deleteTask(id)
      setError(null)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteTask, isLoading, error }
}
