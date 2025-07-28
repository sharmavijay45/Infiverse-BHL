
// const express = require("express")
// const router = express.Router()
// const jwt = require("jsonwebtoken")
// const User = require("../models/User")
// const authMiddleware = require("../middleware/auth")
// const mongoose = require("mongoose")
// const nodemailer = require("nodemailer")
// require('dotenv').config()


// // Create email transporter
// const transporter = nodemailer.createTransport({
//   service: process.env.EMAIL_SERVICE || "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// })
// // console.log(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD)


// // Send role-specific welcome email
// const sendWelcomeEmail = async (user) => {
//   try {
//     const emailSubject = "Welcome to WorkflowAI Management System"
//     let emailContent = ""

//     // Customize email content based on user role
//     if (user.role === "Admin") {
//       emailContent = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #3b82f6;">Welcome to WorkflowAI, ${user.name}!</h2>
//           <p>Your administrator account has been successfully created.</p>
          
//           <h3 style="color: #1f2937;">As an Administrator, you can:</h3>
//           <ul>
//             <li>Access the complete organization dashboard</li>
//             <li>Create and assign tasks to team members</li>
//             <li>Review task progress and completion status</li>
//             <li>Generate daily progress reports</li>
//             <li>Broadcast notifications to team members</li>
//             <li>Create and manage departments</li>
//           </ul>
          
//           <p>You can also use the "Broadcast Update Progress" button to send reminders to all users to update their task progress.</p>
          
//           <p>The system will automatically generate PDF progress reports that will be delivered to your email.</p>
          
//           <div style="margin-top: 20px;">
//             <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard" 
//                style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
//               Go to Dashboard
//             </a>
//           </div>
          
//           <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
//             If you have any questions, please contact our support team.
//           </p>
//         </div>
//       `
//     } else if (user.role === "Manager") {
//       emailContent = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #3b82f6;">Welcome to WorkflowAI, ${user.name}!</h2>
//           <p>Your manager account has been successfully created.</p>
          
//           <h3 style="color: #1f2937;">As a Manager, you can:</h3>
//           <ul>
//             <li>Access your department dashboard</li>
//             <li>Create and assign tasks to your team members</li>
//             <li>Review task progress and completion status</li>
//             <li>Generate department progress reports</li>
//             <li>Manage your department's workflow</li>
//           </ul>
          
//           <p>You'll receive daily email notifications about your team's progress and any tasks approaching deadlines.</p>
          
//           <div style="margin-top: 20px;">
//             <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard" 
//                style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
//               Go to Dashboard
//             </a>
//           </div>
          
//           <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
//             If you have any questions, please contact the system administrator.
//           </p>
//         </div>
//       `
//     } else {
//       emailContent = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #3b82f6;">Welcome to WorkflowAI, ${user.name}!</h2>
//           <p>Your account has been successfully created.</p>
          
//           <h3 style="color: #1f2937;">As a Team Member, you can:</h3>
//           <ul>
//             <li>View tasks assigned to you</li>
//             <li>Update your daily progress on tasks</li>
//             <li>Track your productivity and completion rates</li>
//             <li>Communicate blockers and achievements</li>
//           </ul>
          
//           <p><strong>Important:</strong> You will receive daily email reminders to update your task progress. Regular updates help the team track project status and identify any issues early.</p>
          
//           <p>Each day, please visit the Progress page to:</p>
//           <ul>
//             <li>Set your daily goals</li>
//             <li>Update your progress percentage</li>
//             <li>Note any blockers or challenges</li>
//             <li>Record key achievements</li>
//           </ul>
          
//           <div style="margin-top: 20px;">
//             <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/progress" 
//                style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
//               Go to Progress Page
//             </a>
//           </div>
          
//           <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
//             If you have any questions, please contact your department manager.
//           </p>
//         </div>
//       `
//     }

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: user.email,
//       subject: emailSubject,
//       html: emailContent,
//     }

//     await transporter.sendMail(mailOptions)
//     console.log(`Welcome email sent to ${user.email}`)
//     return true
//   } catch (error) {
//     console.error("Error sending welcome email:", error)
//     return false
//   }
// }

// // Register route
// router.post("/register", async (req, res) => {
//   const { name, email, password, role, department } = req.body

//   try {
//     // Check if user already exists
//     const userExists = await User.findOne({ email })
//     if (userExists) {
//       return res.status(400).json({ error: "User already exists" })
//     }

//     // Validate role
//     const validRoles = ["Admin", "Manager", "User"]
//     if (!validRoles.includes(role)) {
//       return res.status(400).json({ error: "Invalid role" })
//     }

//     // Validate and convert department if provided
//     let departmentId = undefined
//     if (department) {
//       if (mongoose.Types.ObjectId.isValid(department)) {
//         departmentId = new mongoose.Types.ObjectId(department)
//       } else {
//         return res.status(400).json({ error: "Invalid department ID" })
//       }
//     }

//     // Create new user
//     const newUser = new User({
//       name,
//       email,
//       password: password,
//       role,
//       ...(departmentId && { department: departmentId }),
//     })

//     await newUser.save()

//     // JWT payload
//     const payload = {
//       id: newUser.id,
//       name: newUser.name,
//       email: newUser.email,
//       role: newUser.role,
//       department: newUser.department,
//     }

//     // Generate JWT token
//     const token = jwt.sign(payload, process.env.JWT_SECRET || "jwtSecret", {
//       expiresIn: "1h",
//     })

//     // Send welcome email based on role
//     sendWelcomeEmail(newUser).catch((err) => {
//       console.error("Failed to send welcome email:", err)
//       // Continue with registration even if email fails
//     })

//     res.status(201).json({ token, user: payload })
//   } catch (error) {
//     console.error("Registration error:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // Login route
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body

//   try {
//     // Find the user by email
//     const user = await User.findOne({ email })
//     if (!user) {
//       return res.status(400).json({ error: "Invalid credentials" })
//     }

//     // Check password directly
//     if (password !== user.password) {
//       return res.status(400).json({ error: "Invalid credentials" })
//     }

//     // Create JWT payload
//     const payload = {
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       department: user.department,
//     }

//     // Generate JWT token
//     const token = jwt.sign(payload, process.env.JWT_SECRET || "jwtSecret", {
//       expiresIn: "1h",
//     })

//     res.json({ token, user: payload })
//   } catch (error) {
//     console.error("Login error:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // Protected route to get user data
// router.get("/me", authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select("-password")
//     if (!user) {
//       return res.status(404).json({ error: "User not found" })
//     }
//     res.json(user)
//   } catch (error) {
//     console.error("Error fetching user:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// module.exports = router




const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const authMiddleware = require("../middleware/auth")
const mongoose = require("mongoose")
const nodemailer = require("nodemailer")
require('dotenv').config()


// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})
// console.log(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD)


// Send role-specific welcome email
const sendWelcomeEmail = async (user) => {
  try {
    const emailSubject = "Welcome to WorkflowAI Management System"
    let emailContent = ""

    // Customize email content based on user role
    if (user.role === "Admin") {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Welcome to WorkflowAI, ${user.name}!</h2>
          <p>Your administrator account has been successfully created.</p>
          
          <h3 style="color: #1f2937;">As an Administrator, you can:</h3>
          <ul>
            <li>Access the complete organization dashboard</li>
            <li>Create and assign tasks to team members</li>
            <li>Review task progress and completion status</li>
            <li>Generate daily progress reports</li>
            <li>Broadcast notifications to team members</li>
            <li>Create and manage departments</li>
          </ul>
          
          <p>You can also use the "Broadcast Update Progress" button to send reminders to all users to update their task progress.</p>
          
          <p>The system will automatically generate PDF progress reports that will be delivered to your email.</p>
          
          <div style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `
    } else if (user.role === "Manager") {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Welcome to WorkflowAI, ${user.name}!</h2>
          <p>Your manager account has been successfully created.</p>
          
          <h3 style="color: #1f2937;">As a Manager, you can:</h3>
          <ul>
            <li>Access your department dashboard</li>
            <li>Create and assign tasks to your team members</li>
            <li>Review task progress and completion status</li>
            <li>Generate department progress reports</li>
            <li>Manage your department's workflow</li>
          </ul>
          
          <p>You'll receive daily email notifications about your team's progress and any tasks approaching deadlines.</p>
          
          <div style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
            If you have any questions, please contact the system administrator.
          </p>
        </div>
      `
    } else {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Welcome to WorkflowAI, ${user.name}!</h2>
          <p>Your account has been successfully created.</p>
          
          <h3 style="color: #1f2937;">As a Team Member, you can:</h3>
          <ul>
            <li>View tasks assigned to you</li>
            <li>Update your daily progress on tasks</li>
            <li>Track your productivity and completion rates</li>
            <li>Communicate blockers and achievements</li>
          </ul>
          
          <p><strong>Important:</strong> You will receive daily email reminders to update your task progress. Regular updates help the team track project status and identify any issues early.</p>
          
          <p>Each day, please visit the Progress page to:</p>
          <ul>
            <li>Set your daily goals</li>
            <li>Update your progress percentage</li>
            <li>Note any blockers or challenges</li>
            <li>Record key achievements</li>
          </ul>
          
          <div style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/progress" 
               style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
              Go to Progress Page
            </a>
          </div>
          
          <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
            If you have any questions, please contact your department manager.
          </p>
        </div>
      `
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: emailSubject,
      html: emailContent,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Welcome email sent to ${user.email}`)
    return true
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return false
  }
}

// Register route
router.post("/register", async (req, res) => {
  const { name, email, password, role, department } = req.body

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Validate role
    const validRoles = ["Admin", "Manager", "User"]
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" })
    }

    // Validate and convert department if provided
    let departmentId = undefined
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentId = new mongoose.Types.ObjectId(department)
      } else {
        return res.status(400).json({ error: "Invalid department ID" })
      }
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password: password,
      role,
      ...(departmentId && { department: departmentId }),
    })

    await newUser.save()

    // Add the new user to the department's members array if a department is specified
    if (departmentId) {
      await Department.findByIdAndUpdate(
        departmentId,
        { $push: { members: newUser._id } },
        { new: true }
      )
    }

    // JWT payload
    const payload = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
    }

    // Generate JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET || "jwtSecret", {
      expiresIn: "1h",
    })

    // Send welcome email based on role
    sendWelcomeEmail(newUser).catch((err) => {
      console.error("Failed to send welcome email:", err)
      // Continue with registration even if email fails
    })

    res.status(201).json({ token, user: payload })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  try {
    // Find the user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Check password directly
    if (password !== user.password) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Create JWT payload
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    }

    // Generate JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET || "jwtSecret", {
      expiresIn: "1h",
    })

    res.json({ token, user: payload })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Protected route to get user data
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    res.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router

