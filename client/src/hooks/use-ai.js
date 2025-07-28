"use client"

import { useState, useEffect } from "react"
import { api } from "../lib/api"

export function useAIInsights() {
  const [insights, setInsights] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true)
        const data = await api.ai.getInsights()
        setInsights(data)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [])

  return { insights, isLoading, error }
}

export function useOptimizeWorkflow() {
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const optimizeWorkflow = async () => {
    try {
      setIsLoading(true)
      const data = await api.ai.optimizeWorkflow()
      setResult(data)
      setError(null)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { optimizeWorkflow, result, isLoading, error }
}

export function useDependencyAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true)
        const data = await api.ai.getDependencyAnalysis()
        setAnalysis(data)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalysis()
  }, [])

  return { analysis, isLoading, error }
}
