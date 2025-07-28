"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Users, Plus, Trash2, RefreshCw, Search, Edit, UserPlus, UserCog } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "../hooks/use-toast"
import { API_URL } from "@/lib/api"

// Configure axios with base URL
const api = axios.create({
  baseURL: `${API_URL}`,
})

const colorOptions = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-cyan-500", label: "Cyan" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-emerald-500", label: "Emerald" },
]

const roleOptions = [
  { value: "Admin", label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "User", label: "User" },
]

const AdminDashboard = () => {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("departments")

  // Department form state
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    color: "bg-blue-500",
    lead: "",
  })

  // User form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
    department: "",
  })

  // Edit states
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false)
  const [showUserDialog, setShowUserDialog] = useState(false)

  // Set auth header for all requests
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }
  }, [token])

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/admin/users")
      setUsers(response.data)
    } catch (err) {
      console.error("Error fetching users:", err)
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/admin/departments")
      setDepartments(response.data)
    } catch (err) {
      console.error("Error fetching departments:", err)
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to fetch departments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDepartment = async () => {
    if (!newDepartment.name) {
      toast({
        title: "Validation Error",
        description: "Department name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await api.post("/admin/departments", newDepartment)

      // Reset form and refresh departments
      setNewDepartment({
        name: "",
        description: "",
        color: "bg-blue-500",
        lead: "",
      })

      toast({
        title: "Success",
        description: "Department added successfully",
      })

      fetchDepartments()
    } catch (err) {
      console.error("Error adding department:", err)
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to add department",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateDepartment = async () => {
    if (!editingDepartment || !editingDepartment.name) {
      toast({
        title: "Validation Error",
        description: "Department name is required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await api.put(`/admin/departments/${editingDepartment._id}`, editingDepartment)

      setShowDepartmentDialog(false)
      setEditingDepartment(null)

      toast({
        title: "Success",
        description: "Department updated successfully",
      })

      fetchDepartments()
    } catch (err) {
      console.error("Error updating department:", err)
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to update department",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDepartment = async (id) => {
    try {
      setIsLoading(true)
      await api.delete(`/admin/departments/${id}`)

      toast({
        title: "Success",
        description: "Department deleted successfully",
      })
      fetchDepartments()
    } catch (err) {
      console.error("Error deleting department:", err)
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to delete department",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Validation Error",
        description: "Name, email and password are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await api.post("/admin/users", newUser)

      // Reset form and refresh users
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "User",
        department: "",
      })

      toast({
        title: "Success",
        description: "User added successfully",
      })

      fetchUsers()
    } catch (err) {
      console.error("Error adding user:", err)
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to add user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser || !editingUser.name || !editingUser.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      // Create a copy without password if it's empty (don't update password)
      const userToUpdate = { ...editingUser }
      if (!userToUpdate.password) {
        delete userToUpdate.password
      }

      await api.put(`/admin/users/${editingUser._id}`, userToUpdate)

      setShowUserDialog(false)
      setEditingUser(null)

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      fetchUsers()
    } catch (err) {
      console.error("Error updating user:", err)
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id) => {
    try {
      setIsLoading(true)
      await api.delete(`/admin/users/${id}`)

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      fetchUsers()
    } catch (err) {
      console.error("Error deleting user:", err)
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDepartments = departments.filter((department) =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadge = (role) => {
    switch (role) {
      case "Admin":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300">
            Admin
          </Badge>
        )
      case "Manager":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300">
            Manager
          </Badge>
        )
      case "User":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300">
            User
          </Badge>
        )
      default:
        return <Badge>{role}</Badge>
    }
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getDepartmentById = (id) => {
    return departments.find((dept) => dept._id === id)
  }

  const getUsersInDepartment = (departmentId) => {
    return users.filter((user) => user.department === departmentId)
  }

  const getDepartmentLead = (leadId) => {
    return users.find((user) => user._id === leadId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h2>
            <p className="text-slate-500 dark:text-slate-400">Manage departments and users</p>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={() => {
                fetchUsers()
                fetchDepartments()
              }}
              className="border-slate-300 dark:border-slate-600"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Dashboard Overview</CardTitle>
                  <CardDescription>Key metrics at a glance</CardDescription>
                </div>
                <div className="mt-4 md:mt-0 relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-none shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Departments</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{departments.length}</p>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                        <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-none shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{users.length}</p>
                      </div>
                      <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full">
                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-none shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Managers</p>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                          {users.filter((user) => user.role === "Manager").length}
                        </p>
                      </div>
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-full">
                        <UserCog className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="departments" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
              <TabsTrigger value="departments" className="text-sm">
                <Building2 className="mr-2 h-4 w-4" /> Departments
              </TabsTrigger>
              <TabsTrigger value="users" className="text-sm">
                <Users className="mr-2 h-4 w-4" /> Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="departments" className="mt-0">
              <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Add New Department</CardTitle>
                  <CardDescription>Create a new department in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">Department Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter department name"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">Color</Label>
                      <Select
                        value={newDepartment.color}
                        onValueChange={(value) => setNewDepartment({ ...newDepartment, color: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center">
                                <div className={`w-4 h-4 rounded-full mr-2 ${color.value}`}></div>
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</Label>
                      <Textarea
                        placeholder="Enter department description"
                        value={newDepartment.description}
                        onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                        className="w-full"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">Department Lead</Label>
                      <Select
                        value={newDepartment.lead}
                        onValueChange={(value) => setNewDepartment({ ...newDepartment, lead: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lead (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((user) => user.role === "Manager" || user.role === "Admin")
                            .map((user) => (
                              <SelectItem key={user._id} value={user._id}>
                                {user.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleAddDepartment}
                    disabled={isLoading || !newDepartment.name}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Department
                  </Button>
                </CardFooter>
              </Card>

              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Manage Departments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDepartments.map((department) => {
                    const departmentLead = getDepartmentLead(department.lead)
                    const membersCount = getUsersInDepartment(department._id).length

                    return (
                      <Card
                        key={department._id}
                        className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${department.color}`}></div>
                              {department.name}
                            </CardTitle>
                          </div>
                          {department.description && (
                            <CardDescription className="mt-2 line-clamp-2">{department.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                              <p className="text-xs text-slate-500 dark:text-slate-400">Lead</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                                <UserCog className="inline h-4 w-4 mr-1 text-blue-500" />
                                {departmentLead ? departmentLead.name : "Not assigned"}
                              </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                              <p className="text-xs text-slate-500 dark:text-slate-400">Members</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                                <Users className="inline h-4 w-4 mr-1 text-emerald-500" />
                                {membersCount}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingDepartment(department)
                                setShowDepartmentDialog(true)
                              }}
                              className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            >
                              <Edit className="mr-1 h-4 w-4" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDepartment(department._id)}
                              className="flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Add New User</CardTitle>
                  <CardDescription>Create a new user in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">Full Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter full name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</Label>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">Password</Label>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-slate-500 dark:text-slate-400">Department</Label>
                      <Select
                        value={newUser.department}
                        onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department._id} value={department._id}>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${department.color}`}></div>
                                {department.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* <Select
  value={newUser.department}
  onValueChange={(value) => setNewUser({ ...newUser, department: value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Select a department (optional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ui-ux">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-blue-500"></div>
        UI/UX
      </div>
    </SelectItem>
    <SelectItem value="marketing">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
        Marketing
      </div>
    </SelectItem>
    <SelectItem value="sales">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-yellow-500"></div>
        Sales
      </div>
    </SelectItem>
    <SelectItem value="testing">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-red-500"></div>
        Testing
      </div>
    </SelectItem>
    <SelectItem value="development">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-purple-500"></div>
        Development
      </div>
    </SelectItem>
    <SelectItem value="research">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full mr-2 bg-teal-500"></div>
        Research
      </div>
    </SelectItem>
  </SelectContent>
</Select> */}

                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleAddUser}
                    disabled={isLoading || !newUser.name || !newUser.email || !newUser.password}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <UserPlus className="mr-2 h-4 w-4" /> Add User
                  </Button>
                </CardFooter>
              </Card>

              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Manage Users</h3>
                <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">User</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => {
                          const userDepartment = getDepartmentById(user.department)

                          return (
                            <TableRow key={user._id}>
                              <TableCell>
                                <Avatar className="h-8 w-8 bg-slate-100 dark:bg-slate-700">
                                  {user.avatar ? (
                                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                  ) : (
                                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                                  )}
                                </Avatar>
                              </TableCell>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{getRoleBadge(user.role)}</TableCell>
                              <TableCell>
                                {userDepartment ? (
                                  <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${userDepartment.color}`}></div>
                                    {userDepartment.name}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Not assigned</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      Actions
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingUser(user)
                                        setShowUserDialog(true)
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" /> Edit User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 dark:text-red-400"
                                      onClick={() => handleDeleteUser(user._id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Department Dialog */}
      <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Make changes to the department details.</DialogDescription>
          </DialogHeader>
          {editingDepartment && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dept-name">Department Name</Label>
                <Input
                  id="edit-dept-name"
                  value={editingDepartment.name}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dept-color">Color</Label>
                <Select
                  value={editingDepartment.color}
                  onValueChange={(value) => setEditingDepartment({ ...editingDepartment, color: value })}
                >
                  <SelectTrigger id="edit-dept-color">
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full mr-2 ${color.value}`}></div>
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dept-desc">Description</Label>
                <Textarea
                  id="edit-dept-desc"
                  value={editingDepartment.description}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dept-lead">Department Lead</Label>
                <Select
                  value={editingDepartment.lead}
                  onValueChange={(value) => setEditingDepartment({ ...editingDepartment, lead: value })}
                >
                  <SelectTrigger id="edit-dept-lead">
                    <SelectValue placeholder="Select a lead (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => user.role === "Manager" || user.role === "Admin")
                      .map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepartmentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDepartment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Make changes to the user details.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Full Name</Label>
                <Input
                  id="edit-user-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-email">Email</Label>
                <Input
                  id="edit-user-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-password">Password</Label>
                <Input
                  id="edit-user-password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editingUser.password || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                >
                  <SelectTrigger id="edit-user-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-user-dept">Department</Label>
                <Select
                  value={editingUser.department || "none"}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, department: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger id="edit-user-dept">
                    <SelectValue placeholder="Select a department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department._id} value={department._id}>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${department.color}`}></div>
                          {department.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminDashboard
