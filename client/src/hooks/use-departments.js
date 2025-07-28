"use client"

import { useState, useEffect } from "react"
import { api } from "../lib/api"

export function useDepartments() {
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoading(true)
        const data = await api.departments.getDepartments()
        setDepartments(data)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDepartments()
  }, [])

  return { departments, isLoading, error }
}

export function useDepartment(id) {
  const [department, setDepartment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      return
    }

    const fetchDepartment = async () => {
      try {
        setIsLoading(true)
        const data = await api.departments.getDepartment(id)
        setDepartment(data)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDepartment()
  }, [id])

  return { department, isLoading, error }
}

export function useCreateDepartment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const createDepartment = async (departmentData) => {
    try {
      setIsLoading(true)
      const data = await api.departments.createDepartment(departmentData)
      setError(null)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { createDepartment, isLoading, error }
}

export function useUpdateDepartment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateDepartment = async (id, departmentData) => {
    try {
      setIsLoading(true)
      const data = await api.departments.updateDepartment(id, departmentData)
      setError(null)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { updateDepartment, isLoading, error }
}

export function useDeleteDepartment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const deleteDepartment = async (id) => {
    try {
      setIsLoading(true)
      await api.departments.deleteDepartment(id)
      setError(null)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteDepartment, isLoading, error }
}
