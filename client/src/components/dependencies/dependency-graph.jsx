"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Loader2 } from "lucide-react"
import { api } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"
import { useSocketContext } from "../../context/socket-context"
import { OptimizationInsights } from "../optimization/optimization-insights"
import { OptimizationActions } from "../optimization/optimization-actions"
import { useIsMobile } from "../../hooks/use-mobile"

// Utility function to map Tailwind colors to hex
const getHexColor = (tailwindColor) => {
  const colorMap = {
    "bg-blue-500": "#3b82f6",
    "bg-green-500": "#22c55e",
    "bg-amber-500": "#f59e0b",
    "bg-red-500": "#ef4444",
    "bg-gray-500": "#64748b",
  }
  return colorMap[tailwindColor] || "#64748b"
}

export function DependencyGraph() {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const { toast } = useToast()
  const { events } = useSocketContext()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tasks, setTasks] = useState([])
  const [departments, setDepartments] = useState([])
  const [insights, setInsights] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState("All")
  const [viewMode, setViewMode] = useState("graph") // "graph" or "gantt"
  const isMobile = useIsMobile()

  // Fetch tasks, departments, and insights
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [tasksData, departmentsData, insightsData] = await Promise.all([
          api.tasks.getTasks(),
          api.departments.getDepartments(),
          api.ai.getInsights(),
        ])
        console.log("Fetched tasks:", tasksData)
        console.log("Fetched departments:", departmentsData)
        console.log("Fetched insights:", insightsData)
        setTasks(tasksData)
        setDepartments(departmentsData)
        setInsights(insightsData)
        setError(null)
      } catch (err) {
        setError(err.message || "Failed to load data")
        toast({
          title: "Error",
          description: err.message || "Failed to load tasks, departments, or AI insights",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Listen for socket events to update insights
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[events.length - 1]
      if (latestEvent.type === "optimization-suggestions") {
        setInsights((prev) => [...prev, ...latestEvent.data])
      }
    }
  }, [events])

  // Filter tasks by selected department
  const filteredTasks =
    selectedDepartment === "All" ? tasks : tasks.filter((task) => task.department?.name === selectedDepartment)

  // Extract task IDs from insights for highlighting
  const insightTaskIds = insights
    .filter((insight) => insight.category === "Dependencies" || insight.category === "Deadlines")
    .map((insight) => {
      const match = insight.description.match(/Task '([^']+)'/)
      if (match) {
        const task = tasks.find((t) => t.title === match[1])
        return task?._id
      }
      return null
    })
    .filter((id) => id)

  // Responsive sizing for the SVG
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && svgRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const containerHeight = Math.max(400, window.innerHeight * 0.6)

        d3.select(svgRef.current).attr("width", containerWidth).attr("height", containerHeight)

        // Re-render the appropriate chart
        if (viewMode === "graph") {
          renderDependencyGraph()
        } else {
          renderGanttChart()
        }
      }
    }

    window.addEventListener("resize", updateSize)
    updateSize()

    return () => window.removeEventListener("resize", updateSize)
  }, [containerRef, svgRef, filteredTasks, departments, viewMode, insights])

  // Render Dependency Graph
  const renderDependencyGraph = () => {
    if (!svgRef.current || !filteredTasks.length || !departments.length) return

    const nodes = filteredTasks.map((task) => ({
      id: task._id,
      title: task.title,
      department: task.department?.name || "Unknown",
      status: task.status,
      isHighlighted: insightTaskIds.includes(task._id),
    }))

    const links = []
    filteredTasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((dep) => {
          const depId = dep._id
          if (nodes.find((node) => node.id === depId)) {
            links.push({
              source: depId,
              target: task._id,
            })
          }
        })
      }
    })

    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)
    const width = +svg.attr("width")
    const height = +svg.attr("height")
    const margin = isMobile
      ? { top: 10, right: 10, bottom: 10, left: 10 }
      : { top: 20, right: 20, bottom: 20, left: 20 }
    const boundedWidth = width - margin.left - margin.right
    const boundedHeight = height - margin.top - margin.bottom

    svg.style("background", "#f9fafb")

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#888")

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(isMobile ? 60 : 100),
      )
      .force("charge", d3.forceManyBody().strength(isMobile ? -100 : -200))
      .force("center", d3.forceCenter(boundedWidth / 2, boundedHeight / 2))
      .force("collide", d3.forceCollide(isMobile ? 30 : 40))
      .force("x", d3.forceX().strength(0.1))
      .force("y", d3.forceY().strength(0.1))

    const link = g
      .append("g")
      .attr("stroke", "#888")
      .attr("stroke-width", 2)
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("marker-end", "url(#arrowhead)")

    const node = g
      .append("g")
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
      .on("mouseover", (event, d) => {
        const deps = filteredTasks.find((t) => t._id === d.id)?.dependencies?.map((dep) => dep._id) || []
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.title}</strong><br>Department: ${d.department}<br>Status: ${d.status}${deps.length ? `<br>Depends on: ${deps.join(", ")}` : ""}`,
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`)
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0)
      })

    node
      .append("circle")
      .attr("r", isMobile ? 15 : 20)
      .attr("fill", (d) => {
        const dept = departments.find((dep) => dep.name === d.department)
        return dept ? getHexColor(dept.color) : "#64748b"
      })
      .attr("stroke", (d) => {
        if (d.isHighlighted) return "#ef4444"
        switch (d.status) {
          case "Completed":
            return "#22c55e"
          case "In Progress":
            return "#3b82f6"
          case "Pending":
            return "#f59e0b"
          default:
            return "#000"
        }
      })
      .attr("stroke-width", (d) => (d.isHighlighted ? 3 : 2))

    // Always add text labels but adjust size for mobile
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", isMobile ? 25 : 30)
      .attr("font-size", isMobile ? "8px" : "10px")
      .each(function (d) {
        const words = d.title.split(/\s+/).reverse()
        let word
        let line = []
        let lineNumber = 0
        const lineHeight = 1.1
        const dy = -0.5
        let tspan = d3.select(this).append("tspan").attr("x", 0).attr("dy", `${dy}em`)

        // Adjust max length based on screen size
        const maxLength = isMobile ? 40 : 60
        const maxLines = isMobile ? 2 : 3

        while ((word = words.pop())) {
          line.push(word)
          tspan.text(line.join(" "))
          if (tspan.node().getComputedTextLength() > maxLength) {
            line.pop()
            tspan.text(line.join(" "))
            line = [word]

            // Limit number of lines based on screen size
            if (lineNumber >= maxLines - 1) {
              tspan.text(tspan.text() + "...")
              break
            }

            tspan = d3.select(this).append("tspan").attr("x", 0).attr("dy", `${lineHeight}em`).text(word)
            lineNumber++
          }
        }
      })

    // Always show legend but adjust size for mobile
    const legendX = isMobile ? width - 80 : width - 120
    const legendY = isMobile ? margin.top : margin.top
    const legend = svg.append("g").attr("transform", `translate(${legendX}, ${legendY})`)

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", isMobile ? "8px" : "10px")
      .attr("font-weight", "bold")
      .text("Departments")

    departments.forEach((dept, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${isMobile ? 12 : 15} + i * ${isMobile ? 12 : 15})`)
      g.append("circle")
        .attr("r", isMobile ? 3 : 4)
        .attr("fill", getHexColor(dept.color))
      g.append("text")
        .attr("x", 8)
        .attr("y", 3)
        .attr("font-size", isMobile ? "6px" : "8px")
        .text(dept.name)
    })

    const statuses = [
      { name: "Completed", color: "#22c55e" },
      { name: "In Progress", color: "#3b82f6" },
      { name: "Pending", color: "#f59e0b" },
      { name: "AI Highlighted", color: "#ef4444" },
    ]

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", (isMobile ? 12 : 15) + departments.length * (isMobile ? 12 : 15) + (isMobile ? 8 : 10))
      .attr("font-size", isMobile ? "8px" : "10px")
      .attr("font-weight", "bold")
      .text("Status")

    statuses.forEach((status, i) => {
      const g = legend
        .append("g")
        .attr(
          "transform",
          `translate(0, ${(isMobile ? 12 : 15) + departments.length * (isMobile ? 12 : 15) + (isMobile ? 20 : 25) + i * (isMobile ? 12 : 15)})`,
        )
      g.append("circle")
        .attr("r", isMobile ? 3 : 4)
        .attr("fill", "none")
        .attr("stroke", status.color)
        .attr("stroke-width", 2)
      g.append("text")
        .attr("x", 8)
        .attr("y", 3)
        .attr("font-size", isMobile ? "6px" : "8px")
        .text(status.name)
    })

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => Math.max(0, Math.min(boundedWidth, d.source.x)))
        .attr("y1", (d) => Math.max(0, Math.min(boundedHeight, d.source.y)))
        .attr("x2", (d) => Math.max(0, Math.min(boundedWidth, d.target.x)))
        .attr("y2", (d) => Math.max(0, Math.min(boundedHeight, d.target.y)))

      node.attr("transform", (d) => {
        const radius = isMobile ? 15 : 20
        d.x = Math.max(radius, Math.min(boundedWidth - radius, d.x))
        d.y = Math.max(radius, Math.min(boundedHeight - radius, d.y))
        return `translate(${d.x},${d.y})`
      })
    })

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    return { simulation, tooltip }
  }

  // Render Gantt Chart
  const renderGanttChart = () => {
    if (!svgRef.current || !filteredTasks.length || !departments.length) return

    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)
    const width = +svg.attr("width")
    const height = +svg.attr("height")
    const margin = isMobile
      ? { top: 30, right: 10, bottom: 20, left: 60 }
      : { top: 40, right: 150, bottom: 40, left: 100 }
    const boundedWidth = width - margin.left - margin.right
    const boundedHeight = height - margin.top - margin.bottom

    svg.style("background", "#f9fafb")

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)

    const ganttData = filteredTasks.map((task) => ({
      id: task._id,
      title: task.title,
      department: task.department?.name || "Unknown",
      status: task.status,
      start: new Date(task.createdAt),
      end: task.dueDate
        ? new Date(task.dueDate)
        : new Date(new Date(task.createdAt).setDate(new Date(task.createdAt).getDate() + 7)),
      dependencies: task.dependencies?.map((dep) => dep._id) || [],
      isHighlighted: insightTaskIds.includes(task._id),
    }))

    const xScale = d3
      .scaleTime()
      .domain([d3.min(ganttData, (d) => d.start), d3.max(ganttData, (d) => d.end)])
      .range([0, boundedWidth])
      .nice()

    const yScale = d3
      .scaleBand()
      .domain(ganttData.map((d) => d.id))
      .range([0, boundedHeight])
      .padding(0.2)

    const xAxis = d3
      .axisTop(xScale)
      .ticks(isMobile ? 5 : d3.timeDay.every(1))
      .tickFormat(isMobile ? d3.timeFormat("%d") : d3.timeFormat("%b %d"))

    const yAxis = d3.axisLeft(yScale).tickFormat((id) => {
      const task = ganttData.find((d) => d.id === id)
      if (!task) return ""

      // Truncate text on mobile
      if (isMobile && task.title.length > 15) {
        return task.title.substring(0, 15) + "..."
      }
      return task.title
    })

    g.append("g")
      .attr("class", "x-axis")
      .call(xAxis)
      .selectAll("text")
      .style("font-size", isMobile ? "8px" : "10px")
      .attr("transform", isMobile ? "rotate(-45) translate(-5, -5)" : "rotate(-45)")
      .attr("text-anchor", "end")

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", isMobile ? "8px" : "10px")

    const bars = g
      .selectAll(".bar")
      .data(ganttData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.start))
      .attr("y", (d) => yScale(d.id))
      .attr("width", (d) => Math.max(2, xScale(d.end) - xScale(d.start))) // Ensure minimum width
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => {
        const dept = departments.find((dep) => dep.name === d.department)
        return dept ? getHexColor(dept.color) : "#64748b"
      })
      .attr("stroke", (d) => {
        if (d.isHighlighted) return "#ef4444"
        switch (d.status) {
          case "Completed":
            return "#22c55e"
          case "In Progress":
            return "#3b82f6"
          case "Pending":
            return "#f59e0b"
          default:
            return "#000"
        }
      })
      .attr("stroke-width", (d) => (d.isHighlighted ? 3 : 2))
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.title}</strong><br>Department: ${d.department}<br>Status: ${d.status}<br>Start: ${d.start.toLocaleDateString()}<br>End: ${d.end.toLocaleDateString()}`,
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`)
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0)
      })

    // Always show legend but adjust size for mobile
    const legendX = isMobile ? width - 80 : width - 120
    const legendY = isMobile ? margin.top : margin.top
    const legend = svg.append("g").attr("transform", `translate(${legendX}, ${legendY})`)

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", isMobile ? "8px" : "10px")
      .attr("font-weight", "bold")
      .text("Departments")

    departments.forEach((dept, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${isMobile ? 12 : 15} + i * ${isMobile ? 12 : 15})`)
      g.append("circle")
        .attr("r", isMobile ? 3 : 4)
        .attr("fill", getHexColor(dept.color))
      g.append("text")
        .attr("x", 8)
        .attr("y", 3)
        .attr("font-size", isMobile ? "6px" : "8px")
        .text(dept.name)
    })

    const statuses = [
      { name: "Completed", color: "#22c55e" },
      { name: "In Progress", color: "#3b82f6" },
      { name: "Pending", color: "#f59e0b" },
      { name: "AI Highlighted", color: "#ef4444" },
    ]

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", (isMobile ? 12 : 15) + departments.length * (isMobile ? 12 : 15) + (isMobile ? 8 : 10))
      .attr("font-size", isMobile ? "8px" : "10px")
      .attr("font-weight", "bold")
      .text("Status")

    statuses.forEach((status, i) => {
      const g = legend
        .append("g")
        .attr(
          "transform",
          `translate(0, ${(isMobile ? 12 : 15) + departments.length * (isMobile ? 12 : 15) + (isMobile ? 20 : 25) + i * (isMobile ? 12 : 15)})`,
        )
      g.append("circle")
        .attr("r", isMobile ? 3 : 4)
        .attr("fill", "none")
        .attr("stroke", status.color)
        .attr("stroke-width", 2)
      g.append("text")
        .attr("x", 8)
        .attr("y", 3)
        .attr("font-size", isMobile ? "6px" : "8px")
        .text(status.name)
    })

    return { tooltip }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading dependency graph...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center text-red-500">
          <p>Error loading dependency graph: {error}</p>
          <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="department" className="block text-sm font-medium mb-1">
                Department:
              </label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value="All">All</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode("graph")}
                className={`flex-1 sm:flex-initial px-3 py-1 text-sm rounded-md ${
                  viewMode === "graph" ? "bg-primary text-white" : "bg-gray-200"
                }`}
              >
                Graph
              </button>
              <button
                onClick={() => setViewMode("gantt")}
                className={`flex-1 sm:flex-initial px-3 py-1 text-sm rounded-md ${
                  viewMode === "gantt" ? "bg-primary text-white" : "bg-gray-200"
                }`}
              >
                Gantt
              </button>
            </div>
          </div>
          <div ref={containerRef} className="w-full overflow-auto">
            <svg ref={svgRef} className="w-full h-[400px] md:h-[600px] border border-gray-200 rounded-md" />
          </div>
        </div>
        <div className="mt-4">
          <OptimizationInsights insights={insights} />
        </div>
      </div>
      {/* Optimization actions panel - hidden on mobile */}
      <div className="hidden lg:block w-80">
        <OptimizationActions tasks={tasks} setTasks={setTasks} insights={insights} />
      </div>
    </div>
  )
}
