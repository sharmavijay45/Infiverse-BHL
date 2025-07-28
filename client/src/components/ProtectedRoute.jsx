import { useContext } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/auth-context"

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div>Loading...</div> // Replace with a proper loading component if needed
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role === "User") {
    // Allow access to /userdashboard and /tasks/* (including /tasks/:id)
     if (location.pathname !== "/userdashboard" && !location.pathname.startsWith("/tasks/") && location.pathname !== "/progress" && location.pathname !== "/aims" && location.pathname !== "/leaderboard" ) {
      return <Navigate to="/userdashboard" replace />
    }
  }

  return children
}
