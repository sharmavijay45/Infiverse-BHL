// "use client"

// import { useState } from "react"
// import { Link, useNavigate } from "react-router-dom"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Loader2 } from "lucide-react"
// import { useAuth } from "../context/auth-context" // Import the context

// export default function Login() {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   })
//   const [errors, setErrors] = useState({})
//   const [loading, setLoading] = useState(false)
//   const navigate = useNavigate()

//   // Use login from AuthContext
//   const { login } = useAuth()

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData({ ...formData, [name]: value })

//     // Clear error when user types
//     if (errors[name]) {
//       setErrors({ ...errors, [name]: "" })
//     }
//   }

//   const validateForm = () => {
//     const newErrors = {}

//     if (!formData.email) {
//       newErrors.email = "Email is required"
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = "Email is invalid"
//     }

//     if (!formData.password) {
//       newErrors.password = "Password is required"
//     }

//     setErrors(newErrors)
//     return Object.keys(newErrors).length === 0
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
  
//     if (validateForm()) {
//       setLoading(true)
  
//       try {
//         await login(formData) // Ensure the login function is successful
//         console.log("Login successful")  // Add this log to confirm successful login
//         navigate("/dashboard") // Ensure this line gets executed
//       } catch (error) {
//         console.error("Login error:", error)
//         setErrors({ password: "Invalid email or password" })
//       } finally {
//         setLoading(false)
//       }
//     }
//   }
  

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 auth-container">
//       <Card className="w-full max-w-md">
//         <CardHeader className="space-y-1">
//           <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
//           <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
//         </CardHeader>
//         <form onSubmit={handleSubmit}>
//           <CardContent className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 name="email"
//                 type="email"
//                 placeholder="name@example.com"
//                 value={formData.email}
//                 onChange={handleChange}
//                 disabled={loading}
//                 className={errors.email ? "border-red-500" : ""}
//               />
//               {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
//             </div>
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="password">Password</Label>
//                 <Link to="/forgot-password" className="text-sm text-primary hover:underline">
//                   Forgot password?
//                 </Link>
//               </div>
//               <Input
//                 id="password"
//                 name="password"
//                 type="password"
//                 placeholder="••••••••"
//                 value={formData.password}
//                 onChange={handleChange}
//                 disabled={loading}
//                 className={errors.password ? "border-red-500" : ""}
//               />
//               {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
//             </div>
//           </CardContent>
//           <CardFooter className="flex flex-col space-y-4">
//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Logging in...
//                 </>
//               ) : (
//                 "Login"
//               )}
//             </Button>
//             <p className="text-center text-sm">
//               Don't have an account?{" "}
//               <Link to="/register" className="text-primary hover:underline">
//                 Register
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
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useAuth } from "../context/auth-context" // Import the context

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [forceTheme, setForceTheme] = useState("");
  const navigate = useNavigate()

  // Use login from AuthContext
  const { login } = useAuth()

  useEffect(() => {
    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setForceTheme(isSystemDark ? "light" : "dark");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
  
    if (validateForm()) {
      setLoading(true)
  
      try {
        await login(formData) // Ensure the login function is successful
        console.log("Login successful")  // Add this log to confirm successful login
        navigate("/dashboard") // Ensure this line gets executed
      } catch (error) {
        console.error("Login error:", error)
        setErrors({ password: "Invalid email or password" })
      } finally {
        setLoading(false)
      }
    }
  }
  

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Enhanced Cyber Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20"></div>
      <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
      <div className="absolute inset-0 gradient-cyber opacity-10"></div>

      {/* Floating Cyber Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float-cyber glow-primary"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/20 rounded-full blur-xl animate-float-cyber glow-accent" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-primary/15 rounded-full blur-xl animate-float-cyber glow-cyber" style={{animationDelay: '4s'}}></div>

      <Card className="w-full max-w-md relative z-10 neo-card animate-scale-in">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mb-6 glow-primary animate-glow-pulse transform rotate-3 hover:rotate-0 transition-cyber">
            <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <CardTitle className="text-4xl font-bold text-foreground mb-2">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            Enter your credentials to access your cyber workspace
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardContent className="space-y-6">
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
                  disabled={loading}
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

            <div className="space-y-2 group">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-sm text-primary/70 hover:text-primary transition-colors duration-200">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`transition-all duration-300 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 ${
                    errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""
                  }`}
                />
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 animate-slide-up flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full relative overflow-hidden group gradient-primary hover:glow-primary transition-cyber transform hover:scale-105 hover-cyber text-primary-foreground font-semibold py-3 text-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Accessing Cyber Workspace...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Enter Workspace
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

