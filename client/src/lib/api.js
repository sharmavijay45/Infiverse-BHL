
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

// Helper function for API requests
async function fetchAPI(endpoint, options = {}) {
  // Get token from localStorage if available
  const token = localStorage.getItem("WorkflowToken")

  const headers = {
    "Content-Type": "application/json",
    ...(token && { "x-auth-token": token }),
    ...options.headers,
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // Handle unauthorized responses
    if (response.status === 401) {
      // Clear token and redirect to login if needed
      localStorage.removeItem("token")
      // You might want to redirect to login page here
      // window.location.href = '/login';
      throw new Error("Unauthorized: Please log in again")
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error)
    throw error
  }
}

// Auth API
const auth = {
  login: (credentials) =>
    fetchAPI("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  register: (userData) =>
    fetchAPI("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  getCurrentUser: () => fetchAPI("/auth/me"),
}

// Tasks API
const tasks = {
  getTasks: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(val => queryParams.append(key, val))
      } else if (value) {
        queryParams.append(key, value)
      }
    })

    const queryString = queryParams.toString()
    return fetchAPI(`/tasks${queryString ? `?${queryString}` : ""}`)
  },
  getTask: (id) => fetchAPI(`/tasks/${id}`),
  createTask: (task) =>
    fetchAPI("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),
  updateTask: (id, task) =>
    fetchAPI(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(task),
    }),
  deleteTask: (id) =>
    fetchAPI(`/tasks/${id}`, {
      method: "DELETE",
    }),
}

// Departments API
const departments = {
  getDepartments: () => fetchAPI("/departments"),
  getDepartment: (id) => fetchAPI(`/departments/${id}`),
  createDepartment: (department) =>
    fetchAPI("/departments", {
      method: "POST",
      body: JSON.stringify(department),
    }),
  updateDepartment: (id, department) =>
    fetchAPI(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(department),
    }),
  deleteDepartment: (id) =>
    fetchAPI(`/departments/${id}`, {
      method: "DELETE",
    }),
  getDepartmentTasks: (id, filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })

    const queryString = queryParams.toString()
    return fetchAPI(`/departments/${id}/tasks${queryString ? `?${queryString}` : ""}`)
  },
}

// Users API
const users = {
  getUsers: () => fetchAPI("/users"),
  getUser: (id) => fetchAPI(`/users/${id}`),
  createUser: (user) =>
    fetchAPI("/users", {
      method: "POST",
      body: JSON.stringify(user),
    }),
  updateUser: (id, user) =>
    fetchAPI(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    }),
  deleteUser: (id) =>
    fetchAPI(`/users/${id}`, {
      method: "DELETE",
    }),
  getUserTasks: (id, filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })

    const queryString = queryParams.toString()
    return fetchAPI(`/users/${id}/tasks${queryString ? `?${queryString}` : ""}`)
  },
  changePassword: (id, passwordData) =>
    fetchAPI(`/users/${id}/password`, {
      method: "PUT",
      body: JSON.stringify(passwordData),
    }),
}

// AI Optimization API
// const ai = {
//   getInsights: () => fetchAPI("/ai/insights"),
//   optimizeWorkflow: () => fetchAPI("/ai/optimize", { method: "POST" }),
//   getDependencyAnalysis: () => fetchAPI("/ai/dependencies"),
// }
const ai = {
  getInsights: () => fetchAPI("/new/ai/insights"),
  optimizeWorkflow: () => fetchAPI("/new/ai/optimize", { method: "POST" }),
  getDependencyAnalysis: () => fetchAPI("/new/ai/dependencies"),
}


// Admin API
const admin = {
  getUsers: () => fetchAPI("/admin/users"),
  getUser: (id) => fetchAPI(`/admin/users/${id}`),
  createUser: (userData) =>
    fetchAPI("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  updateUser: (id, userData) =>
    fetchAPI(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),
  deleteUser: (id) =>
    fetchAPI(`/admin/users/${id}`, {
      method: "DELETE",
    }),
  getDepartments: () => fetchAPI("/admin/departments"),
  getDepartment: (id) => fetchAPI(`/admin/departments/${id}`),
  createDepartment: (departmentData) =>
    fetchAPI("/admin/departments", {
      method: "POST",
      body: JSON.stringify(departmentData),
    }),
  updateDepartment: (id, departmentData) =>
    fetchAPI(`/admin/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(departmentData),
    }),
  deleteDepartment: (id) =>
    fetchAPI(`/admin/departments/${id}`, {
      method: "DELETE",
    }),
  getDepartmentTasks: (id, filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })

    const queryString = queryParams.toString()
    return fetchAPI(`/admin/departments/${id}/tasks${queryString ? `?${queryString}` : ""}`)
  },
}


// Progress API
const progress = {
  getTaskProgress: (taskId) => fetchAPI(`/progress/task/${taskId}`),
  getUserProgress: (userId) => fetchAPI(`/progress/user/${userId}`),
  createProgress: (progressData) =>
    fetchAPI("/progress", {
      method: "POST",
      body: JSON.stringify(progressData),
    }),
  updateProgress: (id, progressData) =>
    fetchAPI(`/progress/${id}`, {
      method: "PUT",
      body: JSON.stringify(progressData),
    }),
  deleteProgress: (id) =>
    fetchAPI(`/progress/${id}`, {
      method: "DELETE",
    }),
};

// Notifications API
const notifications = {
  broadcastReminders: () =>
    fetchAPI("/notifications/broadcast-reminders", {
      method: "POST",
    }),
  broadcastAimReminders: () =>
    fetchAPI("/notifications/broadcast-aim-reminders", {
      method: "POST",
    }),
  generateReports: () =>
    fetchAPI("/notifications/generate-reports", {
      method: "POST",
    }),
  toggleAutomation: (settings) =>
    fetchAPI("/notifications/toggle-automation", {
      method: "POST",
      body: JSON.stringify(settings),
    }),
};

// Dashboard API
const dashboard = {
  getStats: () => fetchAPI("/dashboard/stats"),
  getRecentActivity: () => fetchAPI("/dashboard/activity"),
  getDepartmentStats: () => fetchAPI("/dashboard/departments"),
  getTasksOverview: () => fetchAPI("/dashboard/tasks-overview"),
  getUserStats: (userId) => fetchAPI(`/dashboard/user-stats/${userId}`),
}

// Update only the aims section in the API client

// const fetchAPI = async (url, options) => {
//   const res = await fetch(url, {
//     headers: {
//       "Content-Type": "application/json",
//     },
//     ...options,
//   })
//   return await res.json()
// }

// Aims API
const aims = {
  getAims: (filters = {}) => {
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })

    const queryString = queryParams.toString()
    return fetchAPI(`/aims${queryString ? `?${queryString}` : ""}`)
  },
  getTodayAim: (userId) => {
    if (!userId) {
      throw new Error("User ID is required")
    }
    return fetchAPI(`/aims/today/${userId}`)
  },
  getUserAims: (userId, filters = {}) => {
    if (!userId) {
      throw new Error("User ID is required")
    }
    const queryParams = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value)
    })

    const queryString = queryParams.toString()
    return fetchAPI(`/aims/user/${userId}${queryString ? `?${queryString}` : ""}`)
  },
  createAim: (aim, userId) => {
    if (!userId) {
      throw new Error("User ID is required")
    }
    return fetchAPI(`/aims/postaim/${userId}`, {
      method: "POST",
      body: JSON.stringify(aim),
    })
  },
  updateAim: (id, aim) =>
    fetchAPI(`/aims/${id}`, {
      method: "PUT",
      body: JSON.stringify(aim),
    }),
  deleteAim: (id) =>
    fetchAPI(`/aims/${id}`, {
      method: "DELETE",
    }),
}


// Update the exported API object
export const api = {
  auth,
  tasks,
  departments,
  users,
  ai,
  progress,
  notifications,
  admin,
  dashboard,
  aims,
}

export default api
