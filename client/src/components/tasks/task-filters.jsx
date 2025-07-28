"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Label } from "../ui/label"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Checkbox } from "../ui/checkbox"
import { Button } from "../ui/button"
import { api } from "../../lib/api"

export function TaskFilters({ onFilterChange }) {
  const [status, setStatus] = useState([])
  const [department, setDepartment] = useState([])
  const [priority, setPriority] = useState("all")
  const [departments, setDepartments] = useState([])

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await api.departments.getDepartments()
        setDepartments(data)
      } catch (error) {
        console.error("Error fetching departments:", error)
      }
    }
    fetchDepartments()
  }, [])

  const handleStatusChange = (value, checked) => {
    setStatus(prev => 
      checked ? [...prev, value] : prev.filter(item => item !== value)
    )
  }

  const handleDepartmentChange = (value, checked) => {
    setDepartment(prev => 
      checked ? [...prev, value] : prev.filter(item => item !== value)
    )
  }

  const handleApplyFilters = () => {
    onFilterChange({
      status,
      department,
      priority: priority === "all" ? undefined : priority,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Status</h3>
          <div className="space-y-2">
            {["Completed", "In Progress", "Pending"].map(stat => (
              <div key={stat} className="flex items-center space-x-2">
                <Checkbox 
                  id={`status-${stat.toLowerCase()}`} 
                  onCheckedChange={(checked) => handleStatusChange(stat, checked)}
                />
                <Label htmlFor={`status-${stat.toLowerCase()}`}>{stat}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Department</h3>
          <div className="space-y-2">
            {departments.map(dept => (
              <div key={dept._id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`dept-${dept._id}`} 
                  onCheckedChange={(checked) => handleDepartmentChange(dept._id, checked)}
                />
                <Label htmlFor={`dept-${dept._id}`}>{dept.name}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Priority</h3>
          <RadioGroup value={priority} onValueChange={setPriority}>
            {["all", "High", "Medium", "Low"].map(prio => (
              <div key={prio} className="flex items-center space-x-2">
                <RadioGroupItem value={prio} id={`priority-${prio.toLowerCase()}`} />
                <Label htmlFor={`priority-${prio.toLowerCase()}`}>
                  {prio === "all" ? "All" : prio}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Button className="w-full" onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}
