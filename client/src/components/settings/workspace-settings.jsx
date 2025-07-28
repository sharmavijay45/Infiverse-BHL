"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Separator } from "../ui/separator"
import { Card, CardContent } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Plus, X, Check } from 'lucide-react'
import { useWorkspace } from "../../context/workspace-context"

export function WorkspaceSettings() {
  const { workspace, setWorkspace } = useWorkspace()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: workspace?.name || "Acme Inc",
    description: "A workflow management system for optimizing task flow across departments.",
    logo: "/placeholder.svg?height=100&width=100",
  })
  
  const [members, setMembers] = useState([
    {
      id: "user-1",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "Admin",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "JD",
    },
    {
      id: "user-2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "Manager",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "JS",
    },
    {
      id: "user-3",
      name: "Mike Johnson",
      email: "mike.johnson@example.com",
      role: "User",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "MJ",
    },
  ])
  
  const [inviteEmail, setInviteEmail] = useState("")
  
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setWorkspace({
        ...workspace,
        name: formData.name,
      })
      setIsLoading(false)
      alert("Workspace settings updated successfully!")
    }, 1000)
  }
  
  const handleInvite = () => {
    if (!inviteEmail) return
    
    // In a real app, this would send an invitation email
    alert(`Invitation sent to ${inviteEmail}`)
    setInviteEmail("")
  }
  
  const handleRemoveMember = (id) => {
    setMembers(members.filter(member => member.id !== id))
  }
  
  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-medium">Workspace Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your workspace details and team members
        </p>
      </div>
      <Separator />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <Card className="w-full md:w-[200px] flex-shrink-0">
            <CardContent className="p-4 flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-md border flex items-center justify-center bg-muted">
                <img 
                  src={formData.logo || "/placeholder.svg"} 
                  alt="Workspace Logo" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Change Logo
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input 
                id="workspace-name" 
                value={formData.name} 
                onChange={(e) => handleChange("name", e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workspace-description">Description</Label>
              <Textarea 
                id="workspace-description" 
                value={formData.description} 
                onChange={(e) => handleChange("description", e.target.value)} 
                className="min-h-[100px]" 
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">Team Members</h4>
            <p className="text-sm text-muted-foreground">
              Manage the members of your workspace
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={member.role === "Admin" ? "default" : "outline"}>
                      {member.role}
                    </Badge>
                    {member.id !== "user-1" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input 
                placeholder="Email address" 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)} 
              />
              <Button type="button" onClick={handleInvite}>
                <Plus className="mr-2 h-4 w-4" />
                Invite
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
