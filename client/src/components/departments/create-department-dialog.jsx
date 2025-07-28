"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { useToast } from "../../hooks/use-toast"
import { api } from "../../lib/api"

export function CreateDepartmentDialog({ open, onOpenChange }) {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lead: "",
    color: "bg-blue-500",
  })

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        try {
          const usersData = await api.users.getUsers()
          setUsers(usersData)
        } catch (error) {
          console.error("Error fetching users:", error)
          toast({
            title: "Error",
            description: "Failed to load users",
            variant: "destructive",
          })
        }
      }

      fetchUsers()
    }
  }, [open, toast])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleColorSelect = (color) => {
    handleChange("color", color)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.lead) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await api.departments.createDepartment({
        ...formData,
        members: [formData.lead], // Initially add the lead as a member
      })

      toast({
        title: "Success",
        description: "Department created successfully",
      })

      // Reset form
      setFormData({
        name: "",
        description: "",
        lead: "",
        color: "bg-blue-500",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error creating department:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create department",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="dialog-overlay">
      <DialogContent className="dialog-content sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Department</DialogTitle>
          <DialogDescription>Add a new department to your workflow management system</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Department Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter department name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter department description"
              className="min-h-[100px]"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lead">
              Department Lead <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.lead} onValueChange={(value) => handleChange("lead", value)}>
              <SelectTrigger id="lead">
                <SelectValue placeholder="Select department lead" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="color">Department Color</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                className={`w-8 h-8 rounded-full bg-blue-500 p-0 ${formData.color === "bg-blue-500" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                onClick={() => handleColorSelect("bg-blue-500")}
              />
              <Button
                type="button"
                className={`w-8 h-8 rounded-full bg-green-500 p-0 ${formData.color === "bg-green-500" ? "ring-2 ring-offset-2 ring-green-500" : ""}`}
                onClick={() => handleColorSelect("bg-green-500")}
              />
              <Button
                type="button"
                className={`w-8 h-8 rounded-full bg-amber-500 p-0 ${formData.color === "bg-amber-500" ? "ring-2 ring-offset-2 ring-amber-500" : ""}`}
                onClick={() => handleColorSelect("bg-amber-500")}
              />
              <Button
                type="button"
                className={`w-8 h-8 rounded-full bg-red-500 p-0 ${formData.color === "bg-red-500" ? "ring-2 ring-offset-2 ring-red-500" : ""}`}
                onClick={() => handleColorSelect("bg-red-500")}
              />
              <Button
                type="button"
                className={`w-8 h-8 rounded-full bg-purple-500 p-0 ${formData.color === "bg-purple-500" ? "ring-2 ring-offset-2 ring-purple-500" : ""}`}
                onClick={() => handleColorSelect("bg-purple-500")}
              />
              <Button
                type="button"
                className={`w-8 h-8 rounded-full bg-cyan-500 p-0 ${formData.color === "bg-cyan-500" ? "ring-2 ring-offset-2 ring-cyan-500" : ""}`}
                onClick={() => handleColorSelect("bg-cyan-500")}
              />
              <Button
                type="button"
                className={`w-8 h-8 rounded-full bg-indigo-500 p-0 ${formData.color === "bg-indigo-500" ? "ring-2 ring-offset-2 ring-indigo-500" : ""}`}
                onClick={() => handleColorSelect("bg-indigo-500")}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
