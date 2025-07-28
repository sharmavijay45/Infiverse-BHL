
// "use client"

// import { useState, useEffect } from "react"
// import { Link } from "react-router-dom"

// import { Button } from "../components/ui/button"
// import { Input } from "../components/ui/input"
// import { Label } from "../components/ui/label"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
// import { Loader2, Mail } from "lucide-react"
// import { api } from "../lib/api"
// import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
// import { useAuth } from "@/context/auth-context"

// export default function Register() {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     department: "",
//     role: "User",
//   })

//   const [errors, setErrors] = useState({})
//   const [departments, setDepartments] = useState([])
//   const [success, setSuccess] = useState(false)
//   const { register, loading } = useAuth()

//   useEffect(() => {
//     const fetchDepartments = async () => {
//       try {
//         const data = await api.departments.getDepartments()
//         setDepartments(data)
//         if (data.length > 0 && !formData.department) {
//           setFormData((prev) => ({ ...prev, department: data[0].id }))
//         }
//       } catch (err) {
//         console.error("Error fetching departments:", err)
//       }
//     }

//     fetchDepartments()
//   }, [])

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData({ ...formData, [name]: value })
//     if (errors[name]) setErrors({ ...errors, [name]: "" })
//   }

//   const handleDepartmentChange = (value) => {
//     setFormData({ ...formData, department: value })
//     if (errors.department) setErrors({ ...errors, department: "" })
//   }

//   const handleRoleChange = (value) => {
//     setFormData({ ...formData, role: value })
//     if (errors.role) setErrors({ ...errors, role: "" })

//     // Clear department if role is Admin/Manager
//     if (value === "Admin" || value === "Manager") {
//       setFormData((prev) => ({ ...prev, department: "" }))
//     } else if (departments.length > 0) {
//       setFormData((prev) => ({ ...prev, department: departments[0].id }))
//     }
//   }

//   const validateForm = () => {
//     const newErrors = {}

//     if (!formData.name.trim()) newErrors.name = "Name is required"
//     if (!formData.email) {
//       newErrors.email = "Email is required"
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = "Email is invalid"
//     }

//     if (!formData.password) {
//       newErrors.password = "Password is required"
//     } else if (formData.password.length < 3) {
//       newErrors.password = "Password must be at least 3 characters"
//     }

//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = "Passwords do not match"
//     }

//     if (formData.role === "User" && !formData.department) newErrors.department = "Please select a department"

//     if (!formData.role) newErrors.role = "Please select a role"

//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     if (validateForm()) {
//       const { confirmPassword, ...registerData } = formData
//       try {
//         await register(registerData)
//         setSuccess(true)
//       } catch (error) {
//         console.error("Registration error:", error)
//       }
//     }
//   }

//   const getRoleDescription = (role) => {
//     switch (role) {
//       case "Admin":
//         return "Access the organization dashboard, assign tasks, review progress, and generate reports."
//       case "Manager":
//         return "Manage department tasks, review team progress, and generate department reports."
//       case "User":
//         return "Receive tasks from admins and update your progress on a daily basis."
//       default:
//         return ""
//     }
//   }

//   return (
//     <div className="h-screen flex items-center justify-center overflow-y-auto bg-gray-50 dark:bg-gray-900 px-4 py-8 auth-container">
//       <Card className="w-full max-w-lg shadow-lg mx-auto">
//         <CardHeader className="space-y-1">
//           <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
//           <CardDescription className="text-center">Enter your information to create an account</CardDescription>
//         </CardHeader>
//         <form onSubmit={handleSubmit}>
//           <CardContent className="space-y-6">
//             {success && (
//               <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
//                 <Mail className="h-4 w-4" />
//                 <AlertTitle>Registration successful!</AlertTitle>
//                 <AlertDescription>
//                   A welcome email has been sent to {formData.email} with details about your role and responsibilities.
//                 </AlertDescription>
//               </Alert>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="name">Full Name</Label>
//                 <Input
//                   id="name"
//                   name="name"
//                   placeholder="John Doe"
//                   value={formData.name}
//                   onChange={handleChange}
//                   disabled={loading || success}
//                   className={errors.name ? "border-red-500" : ""}
//                 />
//                 {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                   id="email"
//                   name="email"
//                   type="email"
//                   placeholder="name@example.com"
//                   value={formData.email}
//                   onChange={handleChange}
//                   disabled={loading || success}
//                   className={errors.email ? "border-red-500" : ""}
//                 />
//                 {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="password">Password</Label>
//                 <Input
//                   id="password"
//                   name="password"
//                   type="password"
//                   placeholder="••••••••"
//                   value={formData.password}
//                   onChange={handleChange}
//                   disabled={loading || success}
//                   className={errors.password ? "border-red-500" : ""}
//                 />
//                 {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="confirmPassword">Confirm Password</Label>
//                 <Input
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   type="password"
//                   placeholder="••••••••"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   disabled={loading || success}
//                   className={errors.confirmPassword ? "border-red-500" : ""}
//                 />
//                 {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="role">Role</Label>
//                 <Select value={formData.role} onValueChange={handleRoleChange} disabled={loading || success}>
//                   <SelectTrigger
//                     className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${errors.role ? "border-red-500" : ""}`}
//                   >
//                     <SelectValue placeholder="Select a role" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                     <SelectItem
//                       value="Admin"
//                       className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors"
//                     >
//                       Admin
//                     </SelectItem>
//                     <SelectItem
//                       value="Manager"
//                       className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors"
//                     >
//                       Manager
//                     </SelectItem>
//                     <SelectItem
//                       value="User"
//                       className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors"
//                     >
//                       User
//                     </SelectItem>
//                   </SelectContent>
//                 </Select>
//                 {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
//                 {formData.role && (
//                   <p className="text-xs text-muted-foreground mt-1">{getRoleDescription(formData.role)}</p>
//                 )}
//               </div>

//               {/* <div className="space-y-2">
//                 <Label htmlFor="department">Department</Label>
//                 <Select
//                   value={formData.department}
//                   onValueChange={handleDepartmentChange}
//                   disabled={loading || success || formData.role !== "User"}
//                 >
//                   <SelectTrigger
//                     className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${errors.department ? "border-red-500" : ""}`}
//                   >
//                     <SelectValue placeholder="Select a department" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                     {departments.map((dept) => (
//                       <SelectItem
//                         key={dept.id}
//                         value={dept.id}
//                         className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors"
//                       >
//                         {dept.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
//                 {formData.role === "User" && (
//                   <p className="text-xs text-muted-foreground mt-1">
//                     You'll receive tasks from this department's manager.
//                   </p>
//                 )}
//               </div> */}
//               <div className="space-y-2">
//                 <Label htmlFor="department">Department</Label>
//                 <Select
//                   value={formData.department}
//                   onValueChange={handleDepartmentChange}
//                   disabled={loading || formData.role !== "User"}
//                 >
//                   <SelectTrigger
//                     className={`bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.department ? "border-red-500" : ""}`}
//                   >
//                     <SelectValue placeholder="Select a department" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                     {departments.map((dept) => (
//                       <SelectItem
//                         key={dept._id}
//                         value={dept._id}
//                         className="hover:bg-gray-100 focus:bg-gray-100 transition-colors"
//                       >
//                         {dept.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 {errors.department && (
//                   <p className="text-sm text-red-500">{errors.department}</p>
//                 )}
//                 {formData.role === "User" && (
//                   <p className="text-xs text-muted-foreground mt-1">
//                     You'll receive tasks from this department's manager.
//                   </p>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//           <CardFooter className="flex flex-col space-y-4">
//             {!success && (
//               <Button type="submit" className="w-full" disabled={loading}>
//                 {loading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Creating account...
//                   </>
//                 ) : (
//                   "Register"
//                 )}
//               </Button>
//             )}
//             {success && (
//               <Button asChild className="w-full">
//                 <Link to="/login">Continue to Login</Link>
//               </Button>
//             )}
//             <p className="text-center text-sm">
//               Already have an account?{" "}
//               <Link to="/login" className="text-primary hover:underline">
//                 Login
//               </Link>
//             </p>
//           </CardFooter>
//         </form>
//       </Card>
//     </div>
//   )
// }


"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Loader2, Mail } from "lucide-react"
import { api } from "../lib/api"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { useAuth } from "@/context/auth-context"

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    role: "User",
  })

  const [errors, setErrors] = useState({})
  const [departments, setDepartments] = useState([])
  const [success, setSuccess] = useState(false)
  const { register, loading } = useAuth()
  const [forceTheme, setForceTheme] = useState("");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await api.departments.getDepartments()
        setDepartments(data)
        if (data.length > 0 && !formData.department) {
          setFormData((prev) => ({ ...prev, department: data[0].id }))
        }
      } catch (err) {
        console.error("Error fetching departments:", err)
      }
    }

    fetchDepartments()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: "" })
  }

  const handleDepartmentChange = (value) => {
    setFormData({ ...formData, department: value })
    if (errors.department) setErrors({ ...errors, department: "" })
  }

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value })
    if (errors.role) setErrors({ ...errors, role: "" })

    // Clear department if role is Admin/Manager
    if (value === "Admin" || value === "Manager") {
      setFormData((prev) => ({ ...prev, department: "" }))
    } else if (departments.length > 0) {
      setFormData((prev) => ({ ...prev, department: departments[0].id }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 3) {
      newErrors.password = "Password must be at least 3 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (formData.role === "User" && !formData.department) newErrors.department = "Please select a department"

    if (!formData.role) newErrors.role = "Please select a role"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateForm()) {
      const { confirmPassword, ...registerData } = formData
      try {
        await register(registerData)
        setSuccess(true)
      } catch (error) {
        console.error("Registration error:", error)
      }
    }
  }

  const getRoleDescription = (role) => {
    switch (role) {
      case "Admin":
        return "Access the organization dashboard, assign tasks, review progress, and generate reports."
      case "Manager":
        return "Manage department tasks, review team progress, and generate department reports."
      case "User":
        return "Receive tasks from admins and update your progress on a daily basis."
      default:
        return ""
    }
  }

  useEffect(() => {
    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setForceTheme(isSystemDark ? "light" : "dark");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Enhanced Cyber Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-primary/20"></div>
      <div className="absolute inset-0 bg-cyber-dots opacity-40"></div>
      <div className="absolute inset-0 gradient-cyber opacity-10"></div>

      {/* Floating Cyber Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-float-cyber glow-accent"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-primary/20 rounded-full blur-xl animate-float-cyber glow-primary" style={{animationDelay: '3s'}}></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/15 rounded-full blur-xl animate-float-cyber glow-cyber" style={{animationDelay: '1s'}}></div>

      <Card className="w-full max-w-lg relative z-10 neo-card animate-scale-in mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-20 h-20 gradient-accent rounded-2xl flex items-center justify-center mb-6 glow-accent animate-glow-pulse transform -rotate-3 hover:rotate-0 transition-cyber">
            <svg className="w-10 h-10 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <CardTitle className="text-4xl font-bold text-foreground mb-2">
            Join CyberFlow
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Create your account to access the future of workflow management
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardContent className="space-y-6">
            {success && (
              <Alert className="neo-card border-accent/30 bg-accent/10 animate-slide-up">
                <Mail className="h-4 w-4 text-accent" />
                <AlertTitle className="text-foreground">Registration successful!</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  A welcome email has been sent to {formData.email} with details about your role and responsibilities.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
                  Full Name
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading || success}
                    className={`transition-all duration-300 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 ${
                      errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""
                    }`}
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                {errors.name && (
                  <p className="text-sm text-red-500 animate-slide-up flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading || success}
                    className={`transition-all duration-300 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 ${
                      errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""
                    }`}
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 animate-slide-up flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading || success}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading || success}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange} disabled={loading || success}>
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${errors.role ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <SelectItem
                      value="Admin"
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors"
                    >
                      Admin
                    </SelectItem>
                    <SelectItem
                      value="Manager"
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors"
                    >
                      Manager
                    </SelectItem>
                    <SelectItem
                      value="User"
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors"
                    >
                      User
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                {formData.role && (
                  <p className="text-xs text-muted-foreground mt-1">{getRoleDescription(formData.role)}</p>
                )}
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={handleDepartmentChange}
                  disabled={loading || success || formData.role !== "User"}
                >
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${errors.department ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept.id}
                        value={dept.id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors"
                      >
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                {formData.role === "User" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll receive tasks from this department's manager.
                  </p>
                )}
              </div> */}
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={handleDepartmentChange}
                  disabled={loading || formData.role !== "User"}
                >
                  <SelectTrigger
                    className={`bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.department ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept._id}
                        value={dept._id}
                        className="hover:bg-gray-100 focus:bg-gray-100 transition-colors"
                      >
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-sm text-red-500">{errors.department}</p>
                )}
                {formData.role === "User" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll receive tasks from this department's manager.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {!success && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            )}
            {success && (
              <Button asChild className="w-full">
                <Link to="/login">Continue to Login</Link>
              </Button>
            )}
            <p className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

