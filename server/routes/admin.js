// const express = require("express")
// const router = express.Router()
// const User = require("../models/User")
// const Department = require("../models/Department")
// const Task = require("../models/Task")
// const auth = require("../middleware/auth")
// // const { isAdmin, isAdminOrManager } = require("../middleware/roleCheck")

// // ===== USER ROUTES =====

// // @route   GET api/admin/users
// // @desc    Get all users
// // @access  Admin or Manager
// router.get("/users", async (req, res) => {
//   try {
//     // If manager, only return users from their department
//     if (req.user?.role === "Manager") {
//       const manager = await User.findById(req.user.id)
//       if (!manager.department) {
//         return res.json([])
//       }

//       const users = await User.find({ department: manager.department }).select("-password").sort({ name: 1 })

//       return res.json(users)
//     }

//     // For admins, return all users
//     const users = await User.find().select("-password").sort({ name: 1 })

//     res.json(users)
//   } catch (error) {
//     console.error("Error fetching users:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   GET api/admin/users/:id
// // @desc    Get user by ID
// // @access  Admin or Manager (of user's department) or Self
// router.get("/users/:id", async (req, res) => {
//   try {
//     const userId = req.params.id

//     // Allow users to access their own data
//     if (userId !== req.user.id) {
//       // Check if admin
//       if (req.user.role !== "Admin") {
//         // Check if manager of user's department
//         if (req.user.role === "Manager") {
//           const user = await User.findById(userId)
//           const manager = await User.findById(req.user.id)

//           if (
//             !user ||
//             !manager ||
//             !user.department ||
//             !manager.department ||
//             user.department.toString() !== manager.department.toString()
//           ) {
//             return res.status(403).json({ error: "Not authorized to access this user" })
//           }
//         } else {
//           return res.status(403).json({ error: "Not authorized to access this user" })
//         }
//       }
//     }

//     const user = await User.findById(userId).select("-password").populate("department", "name color")

//     if (!user) {
//       return res.status(404).json({ error: "User not found" })
//     }

//     res.json(user)
//   } catch (error) {
//     console.error("Error fetching user:", error)
//     if (error.kind === "ObjectId") {
//       return res.status(404).json({ error: "User not found" })
//     }
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   POST api/admin/users
// // @desc    Create a new user
// // @access  Admin only
// router.post("/users", async (req, res) => {
//   try {
//     const { name, email, password, role, department, avatar } = req.body

//     // Validate required fields
//     if (!name || !email || !password) {
//       return res.status(400).json({ error: "Name, email, and password are required" })
//     }

//     // Check if user with the same email already exists
//     const existingUser = await User.findOne({ email: email.toLowerCase() })
//     if (existingUser) {
//       return res.status(400).json({ error: "User with this email already exists" })
//     }

//     // Create new user (without bcrypt)
//     const newUser = new User({
//       name,
//       email: email.toLowerCase(),
//       password, // Store password directly without hashing
//       role: role || "User",
//       department: department || null,
//       avatar: avatar || null,
//     })

//     const user = await newUser.save()

//     // If department is specified, add user to department members
//     if (department) {
//       await Department.findByIdAndUpdate(department, { $addToSet: { members: user._id } })
//     }

//     // Notify connected clients about the new user
//     if (req.io) {
//       const userToSend = { ...user.toObject() }
//       delete userToSend.password
//       req.io.emit("user:created", userToSend)
//     }

//     // Return user without password
//     const userResponse = { ...user.toObject() }
//     delete userResponse.password

//     res.json(userResponse)
//   } catch (error) {
//     console.error("Error creating user:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   PUT api/admin/users/:id
// // @desc    Update a user
// // @access  Admin or Self (limited fields)
// router.put("/users/:id", async (req, res) => {
//   try {
//     const userId = req.params.id
//     const { name, email, password, role, department, avatar } = req.body

//     // Check if user exists
//     const user = await User.findById(userId)
//     if (!user) {
//       return res.status(404).json({ error: "User not found" })
//     }

//     // Check permissions
//     const isSelf = req.user.id === userId
//     const isAdminUser = req.user.role === "Admin"

//     // Only admins can change roles or departments
//     if ((role !== undefined || department !== undefined) && !isAdminUser) {
//       return res.status(403).json({ error: "Not authorized to change role or department" })
//     }

//     // If not admin and not self, deny access
//     if (!isAdminUser && !isSelf) {
//       return res.status(403).json({ error: "Not authorized to update this user" })
//     }

//     // Check if email is being changed and if it conflicts with existing users
//     if (email && email.toLowerCase() !== user.email) {
//       const existingUser = await User.findOne({ email: email.toLowerCase() })
//       if (existingUser) {
//         return res.status(400).json({ error: "User with this email already exists" })
//       }
//       user.email = email.toLowerCase()
//     }

//     // Update user fields
//     if (name) user.name = name
//     if (avatar !== undefined) user.avatar = avatar

//     // Handle password update (without bcrypt)
//     if (password) {
//       user.password = password // Store password directly without hashing
//     }

//     // Handle role update (admin only)
//     if (isAdminUser && role) {
//       user.role = role
//     }

//     // Handle department change (admin only)
//     if (isAdminUser && department !== undefined) {
//       const oldDepartment = user.department
//       user.department = department

//       // If department changed, update department members
//       if (oldDepartment !== department) {
//         // Remove from old department if exists
//         if (oldDepartment) {
//           await Department.findByIdAndUpdate(oldDepartment, { $pull: { members: userId } })

//           // If user was the lead of old department, remove lead
//           const oldDept = await Department.findById(oldDepartment)
//           if (oldDept && oldDept.lead && oldDept.lead.toString() === userId) {
//             oldDept.lead = null
//             await oldDept.save()
//           }
//         }

//         // Add to new department if exists
//         if (department) {
//           await Department.findByIdAndUpdate(department, { $addToSet: { members: userId } })
//         }
//       }
//     }

//     user.updatedAt = Date.now()
//     await user.save()

//     // Notify connected clients about the updated user
//     if (req.io) {
//       const userToSend = { ...user.toObject() }
//       delete userToSend.password
//       req.io.emit("user:updated", userToSend)
//     }

//     // Return user without password
//     const userResponse = { ...user.toObject() }
//     delete userResponse.password

//     res.json(userResponse)
//   } catch (error) {
//     console.error("Error updating user:", error)
//     if (error.kind === "ObjectId") {
//       return res.status(404).json({ error: "User not found" })
//     }
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   DELETE api/admin/users/:id
// // @desc    Delete a user
// // @access  Admin only
// router.delete("/users/:id",  async (req, res) => {
//   try {
//     const userId = req.params.id

//     // Prevent deleting yourself
//     if (userId === req.user.id) {
//       return res.status(400).json({ error: "Cannot delete your own account" })
//     }

//     // Find user
//     const user = await User.findById(userId)
//     if (!user) {
//       return res.status(404).json({ error: "User not found" })
//     }

//     // Check if there are tasks assigned to this user
//     const tasksCount = await Task.countDocuments({ assignee: userId })
//     if (tasksCount > 0) {
//       return res.status(400).json({
//         error: "Cannot delete user with assigned tasks",
//       })
//     }

//     // If user is in a department, update department
//     if (user.department) {
//       // Remove from department members
//       await Department.findByIdAndUpdate(user.department, { $pull: { members: userId } })

//       // If user is department lead, remove lead
//       const dept = await Department.findById(user.department)
//       if (dept && dept.lead && dept.lead.toString() === userId) {
//         dept.lead = null
//         await dept.save()
//       }
//     }

//     // Delete the user
//     await User.findByIdAndDelete(userId)

//     // Notify connected clients about the deleted user
//     if (req.io) {
//       req.io.emit("user:deleted", { _id: userId })
//     }

//     res.json({ message: "User deleted successfully" })
//   } catch (error) {
//     console.error("Error deleting user:", error)
//     if (error.kind === "ObjectId") {
//       return res.status(404).json({ error: "User not found" })
//     }
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   GET api/admin/users/role/:role
// // @desc    Get users by role
// // @access  Admin or Manager
// router.get("/users/role/:role",  async (req, res) => {
//   try {
//     const { role } = req.params

//     // Validate role
//     if (!["Admin", "Manager", "User"].includes(role)) {
//       return res.status(400).json({ error: "Invalid role" })
//     }

//     // If manager, only return users from their department
//     if (req.user.role === "Manager") {
//       const manager = await User.findById(req.user.id)
//       if (!manager.department) {
//         return res.json([])
//       }

//       const users = await User.find({
//         role,
//         department: manager.department,
//       })
//         .select("-password")
//         .sort({ name: 1 })

//       return res.json(users)
//     }

//     // For admins, return all users with the specified role
//     const users = await User.find({ role }).select("-password").sort({ name: 1 })

//     res.json(users)
//   } catch (error) {
//     console.error("Error fetching users by role:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   GET api/admin/users/search
// // @desc    Search users by name or email
// // @access  Admin or Manager
// router.get("/users/search",  async (req, res) => {
//   try {
//     const { query } = req.query

//     if (!query) {
//       return res.status(400).json({ error: "Search query is required" })
//     }

//     const searchRegex = new RegExp(query, "i")

//     // If manager, only search users from their department
//     if (req.user.role === "Manager") {
//       const manager = await User.findById(req.user.id)
//       if (!manager.department) {
//         return res.json([])
//       }

//       const users = await User.find({
//         department: manager.department,
//         $or: [{ name: searchRegex }, { email: searchRegex }],
//       })
//         .select("-password")
//         .sort({ name: 1 })

//       return res.json(users)
//     }

//     // For admins, search all users
//     const users = await User.find({
//       $or: [{ name: searchRegex }, { email: searchRegex }],
//     })
//       .select("-password")
//       .sort({ name: 1 })

//     res.json(users)
//   } catch (error) {
//     console.error("Error searching users:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // ===== DEPARTMENT ROUTES =====

// // @route   GET api/admin/departments
// // @desc    Get all departments
// // @access  Private
// router.get("/departments",  async (req, res) => {
//   try {
//     const departments = await Department.find()
//       .populate("lead", "name email role")
//       .populate("members", "name email role")
//       .sort({ name: 1 })

//     res.json(departments)
//   } catch (error) {
//     console.error("Error fetching departments:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   GET api/admin/departments/:id
// // @desc    Get department by ID
// // @access  Private
// router.get("/departments/:id", async (req, res) => {
//   try {
//     const department = await Department.findById(req.params.id)
//       .populate("lead", "name email role")
//       .populate("members", "name email role")

//     if (!department) {
//       return res.status(404).json({ error: "Department not found" })
//     }

//     res.json(department)
//   } catch (error) {
//     console.error("Error fetching department:", error)
//     if (error.kind === "ObjectId") {
//       return res.status(404).json({ error: "Department not found" })
//     }
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   POST api/admin/departments
// // @desc    Create a new department
// // @access  Admin only
// router.post("/departments",  async (req, res) => {
//   try {
//     const { name, description, color, lead } = req.body

//     // Check if department with the same name already exists
//     const existingDepartment = await Department.findOne({ name })
//     if (existingDepartment) {
//       return res.status(400).json({ error: "Department with this name already exists" })
//     }

//     // Create new department
//     const newDepartment = new Department({
//       name,
//       description,
//       color: color || "bg-blue-500",
//       lead: lead || null,
//       members: lead ? [lead] : [],
//     })

//     const department = await newDepartment.save()

//     // If lead is specified, update the user's department
//     if (lead) {
//       await User.findByIdAndUpdate(lead, { department: department._id })
//     }

//     // Notify connected clients about the new department
//     if (req.io) {
//       req.io.emit("department:created", department)
//     }

//     res.json(department)
//   } catch (error) {
//     console.error("Error creating department:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   PUT api/admin/departments/:id
// // @desc    Update a department
// // @access  Admin only
// router.put("/departments/:id",  async (req, res) => {
//   try {
//     const { name, description, color, lead } = req.body
//     const departmentId = req.params.id

//     // Check if department exists
//     const department = await Department.findById(departmentId)
//     if (!department) {
//       return res.status(404).json({ error: "Department not found" })
//     }

//     // Check if name is being changed and if it conflicts with existing departments
//     if (name && name !== department.name) {
//       const existingDepartment = await Department.findOne({ name })
//       if (existingDepartment) {
//         return res.status(400).json({ error: "Department with this name already exists" })
//       }
//     }

//     // Handle lead change
//     const previousLead = department.lead

//     // Update department fields
//     department.name = name || department.name
//     department.description = description !== undefined ? description : department.description
//     department.color = color || department.color
//     department.lead = lead || department.lead
//     department.updatedAt = Date.now()

//     // If lead is added, make sure they're in the members array
//     if (lead && !department.members.includes(lead)) {
//       department.members.push(lead)
//     }

//     await department.save()

//     // If lead changed, update user departments
//     if (lead && lead !== previousLead) {
//       // Set new lead's department
//       await User.findByIdAndUpdate(lead, { department: departmentId })

//       // If there was a previous lead and they're not in the members array,
//       // remove this department from their profile
//       if (previousLead && !department.members.includes(previousLead)) {
//         const previousLeadUser = await User.findById(previousLead)
//         if (previousLeadUser && previousLeadUser.department.toString() === departmentId) {
//           previousLeadUser.department = null
//           await previousLeadUser.save()
//         }
//       }
//     }

//     // Notify connected clients about the updated department
//     if (req.io) {
//       req.io.emit("department:updated", department)
//     }

//     res.json(department)
//   } catch (error) {
//     console.error("Error updating department:", error)
//     if (error.kind === "ObjectId") {
//       return res.status(404).json({ error: "Department not found" })
//     }
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   DELETE api/admin/departments/:id
// // @desc    Delete a department
// // @access  Admin only
// router.delete("/departments/:id",  async (req, res) => {
//   try {
//     const departmentId = req.params.id

//     // Find department
//     const department = await Department.findById(departmentId)
//     if (!department) {
//       return res.status(404).json({ error: "Department not found" })
//     }

//     // Check if there are tasks assigned to this department
//     const tasksCount = await Task.countDocuments({ department: departmentId })
//     if (tasksCount > 0) {
//       return res.status(400).json({
//         error: "Cannot delete department with assigned tasks",
//       })
//     }

//     // Update all users who belong to this department
//     await User.updateMany({ department: departmentId }, { $set: { department: null } })

//     // Delete the department
//     await Department.findByIdAndDelete(departmentId)

//     // Notify connected clients about the deleted department
//     if (req.io) {
//       req.io.emit("department:deleted", { _id: departmentId })
//     }

//     res.json({ message: "Department deleted successfully" })
//   } catch (error) {
//     console.error("Error deleting department:", error)
//     if (error.kind === "ObjectId") {
//       return res.status(404).json({ error: "Department not found" })
//     }
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   PUT api/admin/departments/:id/members
// // @desc    Add members to a department
// // @access  Admin or Manager
// router.put("/departments/:id/members", async (req, res) => {
//   try {
//     const { userIds } = req.body
//     const departmentId = req.params.id

//     if (!userIds || !Array.isArray(userIds)) {
//       return res.status(400).json({ error: "User IDs array is required" })
//     }

//     // Check if department exists
//     const department = await Department.findById(departmentId)
//     if (!department) {
//       return res.status(404).json({ error: "Department not found" })
//     }

//     // If user is a manager, they can only modify their own department
//     if (req.user.role === "Manager" && department.lead.toString() !== req.user.id) {
//       return res.status(403).json({ error: "Not authorized to modify this department" })
//     }

//     // Add users to department members
//     department.members = [...new Set([...department.members, ...userIds])]
//     await department.save()

//     // Update users' department field
//     await User.updateMany({ _id: { $in: userIds } }, { $set: { department: departmentId } })

//     // Notify connected clients
//     if (req.io) {
//       req.io.emit("department:membersUpdated", {
//         departmentId,
//         members: department.members,
//       })
//     }

//     res.json(department)
//   } catch (error) {
//     console.error("Error adding members to department:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   DELETE api/admin/departments/:id/members/:userId
// // @desc    Remove a member from a department
// // @access  Admin or Manager
// router.delete("/departments/:id/members/:userId",  async (req, res) => {
//   try {
//     const departmentId = req.params.id
//     const userId = req.params.userId

//     // Check if department exists
//     const department = await Department.findById(departmentId)
//     if (!department) {
//       return res.status(404).json({ error: "Department not found" })
//     }

//     // If user is a manager, they can only modify their own department
//     if (req.user.role === "Manager" && department.lead.toString() !== req.user.id) {
//       return res.status(403).json({ error: "Not authorized to modify this department" })
//     }

//     // Cannot remove the lead from members
//     if (department.lead && department.lead.toString() === userId) {
//       return res.status(400).json({ error: "Cannot remove department lead from members" })
//     }

//     // Remove user from department members
//     department.members = department.members.filter((member) => member.toString() !== userId)
//     await department.save()

//     // Update user's department field
//     await User.findByIdAndUpdate(userId, { department: null })

//     // Notify connected clients
//     if (req.io) {
//       req.io.emit("department:memberRemoved", {
//         departmentId,
//         userId,
//         members: department.members,
//       })
//     }

//     res.json(department)
//   } catch (error) {
//     console.error("Error removing member from department:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   GET api/admin/departments/:id/tasks
// // @desc    Get tasks by department
// // @access  Admin or Manager
// router.get("/departments/:id/tasks",  async (req, res) => {
//   try {
//     const { status } = req.query
//     const departmentId = req.params.id

//     // If manager, check if they belong to the requested department
//     if (req.user.role === "Manager") {
//       const manager = await User.findById(req.user.id)
//       if (!manager.department || manager.department.toString() !== departmentId) {
//         return res.status(403).json({ error: "Not authorized to access this department's tasks" })
//       }
//     }

//     // Build filter object
//     const filter = { department: departmentId }
//     if (status) filter.status = status

//     const tasks = await Task.find(filter).populate("assignee", "name avatar").populate("dependencies", "title status")

//     res.json(tasks)
//   } catch (error) {
//     console.error("Error fetching department tasks:", error)
//     if (error.kind === "ObjectId") {
//       return res.status(404).json({ error: "Department not found" })
//     }
//     res.status(500).json({ error: "Server error" })
//   }
// })

// module.exports = router





const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Department = require("../models/Department")
const Task = require("../models/Task")
const auth = require("../middleware/auth")
// const { isAdmin, isAdminOrManager } = require("../middleware/roleCheck")

// ===== USER ROUTES =====

// @route   GET api/admin/users
// @desc    Get all users
// @access  Admin or Manager
router.get("/users", async (req, res) => {
  try {
    // If manager, only return users from their department
    if (req.user?.role === "Manager") {
      const manager = await User.findById(req.user.id)
      if (!manager.department) {
        return res.json([])
      }

      const users = await User.find({ department: manager.department }).select("-password").sort({ name: 1 })

      return res.json(users)
    }

    // For admins, return all users
    const users = await User.find().select("-password").sort({ name: 1 })

    res.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET api/admin/users/:id
// @desc    Get user by ID
// @access  Admin or Manager (of user's department) or Self
router.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id

    // Allow users to access their own data
    if (userId !== req.user.id) {
      // Check if admin
      if (req.user.role !== "Admin") {
        // Check if manager of user's department
        if (req.user.role === "Manager") {
          const user = await User.findById(userId)
          const manager = await User.findById(req.user.id)

          if (
            !user ||
            !manager ||
            !user.department ||
            !manager.department ||
            user.department.toString() !== manager.department.toString()
          ) {
            return res.status(403).json({ error: "Not authorized to access this user" })
          }
        } else {
          return res.status(403).json({ error: "Not authorized to access this user" })
        }
      }
    }

    const user = await User.findById(userId).select("-password").populate("department", "name color")

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    if (error.kind === "ObjectId") {
      return res.status(404).json({ error: "User not found" })
    }
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST api/admin/users
// @desc    Create a new user
// @access  Admin only
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role, department, avatar } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" })
    }

    // Check if user with the same email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" })
    }

    // Create new user (without bcrypt)
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password, // Store password directly without hashing
      role: role || "User",
      department: department || null,
      avatar: avatar || null,
    })

    const user = await newUser.save()

    // If department is specified, add user to department members
    if (department) {
      await Department.findByIdAndUpdate(department, { $addToSet: { members: user._id } })
    }

    // Notify connected clients about the new user
    if (req.io) {
      const userToSend = { ...user.toObject() }
      delete userToSend.password
      req.io.emit("user:created", userToSend)
    }

    // Return user without password
    const userResponse = { ...user.toObject() }
    delete userResponse.password

    res.json(userResponse)
  } catch (error) {
    console.error("Error creating user:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   PUT api/admin/users/:id
// @desc    Update a user
// @access  Admin or Self (limited fields)
router.put("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id
    const { name, email, password, role, department, avatar } = req.body

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Check permissions
    const isSelf = req.user.id === userId
    const isAdminUser = req.user.role === "Admin"

    // Only admins can change roles or departments
    if ((role !== undefined || department !== undefined) && !isAdminUser) {
      return res.status(403).json({ error: "Not authorized to change role or department" })
    }

    // If not admin and not self, deny access
    if (!isAdminUser && !isSelf) {
      return res.status(403).json({ error: "Not authorized to update this user" })
    }

    // Check if email is being changed and if it conflicts with existing users
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" })
      }
      user.email = email.toLowerCase()
    }

    // Update user fields
    if (name) user.name = name
    if (avatar !== undefined) user.avatar = avatar

    // Handle password update (without bcrypt)
    if (password) {
      user.password = password // Store password directly without hashing
    }

    // Handle role update (admin only)
    if (isAdminUser && role) {
      user.role = role
    }

    // Handle department change (admin only)
    if (isAdminUser && department !== undefined) {
      const oldDepartment = user.department
      user.department = department

      // If department changed, update department members
      if (oldDepartment !== department) {
        // Remove from old department if exists
        if (oldDepartment) {
          await Department.findByIdAndUpdate(oldDepartment, { $pull: { members: userId } })

          // If user was the lead of old department, remove lead
          const oldDept = await Department.findById(oldDepartment)
          if (oldDept && oldDept.lead && oldDept.lead.toString() === userId) {
            oldDept.lead = null
            await oldDept.save()
          }
        }

        // Add to new department if exists
        if (department) {
          await Department.findByIdAndUpdate(department, { $addToSet: { members: userId } })
        }
      }
    }

    user.updatedAt = Date.now()
    await user.save()

    // Notify connected clients about the updated user
    if (req.io) {
      const userToSend = { ...user.toObject() }
      delete userToSend.password
      req.io.emit("user:updated", userToSend)
    }

    // Return user without password
    const userResponse = { ...user.toObject() }
    delete userResponse.password

    res.json(userResponse)
  } catch (error) {
    console.error("Error updating user:", error)
    if (error.kind === "ObjectId") {
      return res.status(404).json({ error: "User not found" })
    }
    res.status(500).json({ error: "Server error" })
  }
})

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
// @access  Admin only
router.delete("/users/:id",  async (req, res) => {
  try {
    const userId = req.params.id

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Check if there are tasks assigned to this user
    const tasksCount = await Task.countDocuments({ assignee: userId })
    if (tasksCount > 0) {
      return res.status(400).json({
        error: "Cannot delete user with assigned tasks",
      })
    }

    // If user is in a department, update department
    if (user.department) {
      // Remove from department members
      await Department.findByIdAndUpdate(user.department, { $pull: { members: userId } })

      // If user is department lead, remove lead
      const dept = await Department.findById(user.department)
      if (dept && dept.lead && dept.lead.toString() === userId) {
        dept.lead = null
        await dept.save()
      }
    }

    // Delete the user
    await User.findByIdAndDelete(userId)

    // Notify connected clients about the deleted user
    if (req.io) {
      req.io.emit("user:deleted", { _id: userId })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    if (error.kind === "ObjectId") {
      return res.status(404).json({ error: "User not found" })
    }
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET api/admin/users/role/:role
// @desc    Get users by role
// @access  Admin or Manager
router.get("/users/role/:role",  async (req, res) => {
  try {
    const { role } = req.params

    // Validate role
    if (!["Admin", "Manager", "User"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" })
    }

    // If manager, only return users from their department
    if (req.user.role === "Manager") {
      const manager = await User.findById(req.user.id)
      if (!manager.department) {
        return res.json([])
      }

      const users = await User.find({
        role,
        department: manager.department,
      })
        .select("-password")
        .sort({ name: 1 })

      return res.json(users)
    }

    // For admins, return all users with the specified role
    const users = await User.find({ role }).select("-password").sort({ name: 1 })

    res.json(users)
  } catch (error) {
    console.error("Error fetching users by role:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET api/admin/users/search
// @desc    Search users by name or email
// @access  Admin or Manager
router.get("/users/search",  async (req, res) => {
  try {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({ error: "Search query is required" })
    }

    const searchRegex = new RegExp(query, "i")

    // If manager, only search users from their department
    if (req.user.role === "Manager") {
      const manager = await User.findById(req.user.id)
      if (!manager.department) {
        return res.json([])
      }

      const users = await User.find({
        department: manager.department,
        $or: [{ name: searchRegex }, { email: searchRegex }],
      })
        .select("-password")
        .sort({ name: 1 })

      return res.json(users)
    }

    // For admins, search all users
    const users = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    })
      .select("-password")
      .sort({ name: 1 })

    res.json(users)
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// ===== DEPARTMENT ROUTES =====

// @route   GET api/admin/departments
// @desc    Get all departments
// @access  Private
router.get("/departments",  async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("lead", "name email role")
      .populate("members", "name email role")
      .sort({ name: 1 })

    res.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET api/admin/departments/:id
// @desc    Get department by ID
// @access  Private
router.get("/departments/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("lead", "name email role")
      .populate("members", "name email role")

    if (!department) {
      return res.status(404).json({ error: "Department not found" })
    }

    res.json(department)
  } catch (error) {
    console.error("Error fetching department:", error)
    if (error.kind === "ObjectId") {
      return res.status(404).json({ error: "Department not found" })
    }
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST api/admin/departments
// @desc    Create a new department
// @access  Admin only
router.post("/departments",  async (req, res) => {
  try {
    const { name, description, color, lead } = req.body

    // Check if department with the same name already exists
    const existingDepartment = await Department.findOne({ name })
    if (existingDepartment) {
      return res.status(400).json({ error: "Department with this name already exists" })
    }

    // Create new department
    const newDepartment = new Department({
      name,
      description,
      color: color || "bg-blue-500",
      lead: lead || null,
      members: lead ? [lead] : [],
    })

    const department = await newDepartment.save()

    // If lead is specified, update the user's department
    if (lead) {
      await User.findByIdAndUpdate(lead, { department: department._id })
    }

    // Notify connected clients about the new department
    if (req.io) {
      req.io.emit("department:created", department)
    }

    res.json(department)
  } catch (error) {
    console.error("Error creating department:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   PUT api/admin/departments/:id
// @desc    Update a department
// @access  Admin only
router.put("/departments/:id",  async (req, res) => {
  try {
    const { name, description, color, lead } = req.body
    const departmentId = req.params.id

    // Check if department exists
    const department = await Department.findById(departmentId)
    if (!department) {
      return res.status(404).json({ error: "Department not found" })
    }

    // Check if name is being changed and if it conflicts with existing departments
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({ name })
      if (existingDepartment) {
        return res.status(400).json({ error: "Department with this name already exists" })
      }
    }

    // Handle lead change
    const previousLead = department.lead

    // Update department fields
    department.name = name || department.name
    department.description = description !== undefined ? description : department.description
    department.color = color || department.color
    department.lead = lead || department.lead
    department.updatedAt = Date.now()

    // If lead is added, make sure they're in the members array
    if (lead && !department.members.includes(lead)) {
      department.members.push(lead)
    }

    await department.save()

    // If lead changed, update user departments
    if (lead && lead !== previousLead) {
      // Set new lead's department
      await User.findByIdAndUpdate(lead, { department: departmentId })

      // If there was a previous lead and they're not in the members array,
      // remove this department from their profile
      if (previousLead && !department.members.includes(previousLead)) {
        const previousLeadUser = await User.findById(previousLead)
        if (previousLeadUser && previousLeadUser.department.toString() === departmentId) {
          previousLeadUser.department = null
          await previousLeadUser.save()
        }
      }
    }

    // Notify connected clients about the updated department
    if (req.io) {
      req.io.emit("department:updated", department)
    }

    res.json(department)
  } catch (error) {
    console.error("Error updating department:", error)
    if (error.kind === "ObjectId") {
      return res.status(404).json({ error: "Department not found" })
    }
    res.status(500).json({ error: "Server error" })
  }
})

// @route   DELETE api/admin/departments/:id
// @desc    Delete a department
// @access  Admin only
router.delete("/departments/:id",  async (req, res) => {
  try {
    const departmentId = req.params.id

    // Find department
    const department = await Department.findById(departmentId)
    if (!department) {
      return res.status(404).json({ error: "Department not found" })
    }

    // Check if there are tasks assigned to this department
    const tasksCount = await Task.countDocuments({ department: departmentId })
    if (tasksCount > 0) {
      return res.status(400).json({
        error: "Cannot delete department with assigned tasks",
      })
    }

    // Update all users who belong to this department
    await User.updateMany({ department: departmentId }, { $set: { department: null } })

    // Delete the department
    await Department.findByIdAndDelete(departmentId)

    // Notify connected clients about the deleted department
    if (req.io) {
      req.io.emit("department:deleted", { _id: departmentId })
    }

    res.json({ message: "Department deleted successfully" })
  } catch (error) {
    console.error("Error deleting department:", error)
    if (error.kind === "ObjectId") {
      return res.status(404).json({ error: "Department not found" })
    }
    res.status(500).json({ error: "Server error" })
  }
})

// @route   PUT api/admin/departments/:id/members
// @desc    Add members to a department
// @access  Admin or Manager
router.put("/departments/:id/members", async (req, res) => {
  try {
    const { userIds } = req.body
    const departmentId = req.params.id

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: "User IDs array is required" })
    }

    // Check if department exists
    const department = await Department.findById(departmentId)
    if (!department) {
      return res.status(404).json({ error: "Department not found" })
    }

    // If user is a manager, they can only modify their own department
    if (req.user.role === "Manager" && department.lead.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to modify this department" })
    }

    // Add users to department members
    department.members = [...new Set([...department.members, ...userIds])]
    await department.save()

    // Update users' department field
    await User.updateMany({ _id: { $in: userIds } }, { $set: { department: departmentId } })

    // Notify connected clients
    if (req.io) {
      req.io.emit("department:membersUpdated", {
        departmentId,
        members: department.members,
      })
    }

    res.json(department)
  } catch (error) {
    console.error("Error adding members to department:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   DELETE api/admin/departments/:id/members/:userId
// @desc    Remove a member from a department
// @access  Admin or Manager
router.delete("/departments/:id/members/:userId",  async (req, res) => {
  try {
    const departmentId = req.params.id
    const userId = req.params.userId

    // Check if department exists
    const department = await Department.findById(departmentId)
    if (!department) {
      return res.status(404).json({ error: "Department not found" })
    }

    // If user is a manager, they can only modify their own department
    if (req.user.role === "Manager" && department.lead.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to modify this department" })
    }

    // Cannot remove the lead from members
    if (department.lead && department.lead.toString() === userId) {
      return res.status(400).json({ error: "Cannot remove department lead from members" })
    }

    // Remove user from department members
    department.members = department.members.filter((member) => member.toString() !== userId)
    await department.save()

    // Update user's department field
    await User.findByIdAndUpdate(userId, { department: null })

    // Notify connected clients
    if (req.io) {
      req.io.emit("department:memberRemoved", {
        departmentId,
        userId,
        members: department.members,
      })
    }

    res.json(department)
  } catch (error) {
    console.error("Error removing member from department:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET api/admin/departments/:id/tasks
// @desc    Get tasks by department
// @access  Admin or Manager
router.get("/departments/:id/tasks",  async (req, res) => {
  try {
    const { status } = req.query
    const departmentId = req.params.id

    // If manager, check if they belong to the requested department
    if (req.user.role === "Manager") {
      const manager = await User.findById(req.user.id)
      if (!manager.department || manager.department.toString() !== departmentId) {
        return res.status(403).json({ error: "Not authorized to access this department's tasks" })
      }
    }

    // Build filter object
    const filter = { department: departmentId }
    if (status) filter.status = status

    const tasks = await Task.find(filter).populate("assignee", "name avatar").populate("dependencies", "title status")

    res.json(tasks)
  } catch (error) {
    console.error("Error fetching department tasks:", error)
    if (error.kind === "ObjectId") {
      return res.status(404).json({ error: "Department not found" })
    }
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST api/admin/migrate-users-to-departments
// @desc    Migrate existing users to their respective departments

router.post("/migrate-users-to-departments", async (req, res) => {
  try {
    // // Check if the user is an Admin
    // if (req.user.role !== "Admin") {
    //   return res.status(403).json({ error: "Not authorized to perform this action" });
    // }

    // Find all users who have a department assigned but are not in the department's members list
    const usersToMigrate = await User.find({ department: { $exists: true, $ne: null } });

    let migratedCount = 0;
    const errors = [];

    for (const user of usersToMigrate) {
      try {
        // Add the user to the department's members array if not already present
        const department = await Department.findByIdAndUpdate(
          user.department,
          { $addToSet: { members: user._id } },
          { new: true }
        );

        if (department) {
          migratedCount++;
        } else {
          errors.push(`Department not found for user ${user.email}`);
        }
      } catch (error) {
        errors.push(`Error migrating user ${user.email}: ${error.message}`);
        console.error(`Error migrating user ${user.email}:`, error);
      }
    }

    res.json({
      message: `Migration complete. ${migratedCount} users migrated.`,
      errors: errors,
    });
  } catch (error) {
    console.error("Error migrating users to departments:", error);
    res.status(500).json({ error: "Server error during migration" });
  }
});

module.exports = router

