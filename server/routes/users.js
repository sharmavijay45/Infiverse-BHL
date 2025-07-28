const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Task = require("../models/Task")
const TaskSubmission = require("../models/TaskSubmission")
const auth = require("../middleware/auth")
const adminAuth = require("../middleware/adminAuth")

// Search users
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { role: { $regex: q, $options: 'i' } }
      ]
    };

    const users = await User.find(searchQuery)
      .select("-password")
      .populate("department", "name")
      .limit(10);

    // Calculate additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        try {
          const tasks = await Task.find({ assignee: user._id });
          const completedTasks = tasks.filter(task => task.status === 'Completed').length;
          const activeTasks = tasks.filter(task => task.status !== 'Completed').length;
          const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            joinDate: user.createdAt,
            completionRate,
            activeTasks,
            completedTasks,
            department: user.department
          };
        } catch (error) {
          console.error(`Error calculating stats for user ${user._id}:`, error);
          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            joinDate: user.createdAt,
            completionRate: 0,
            activeTasks: 0,
            completedTasks: 0,
            department: user.department
          };
        }
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all users (admin only)
router.get("/",async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("department", "name")
    res.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    // Regular users can only access their own profile
    // if (req.user.role !== "Admin" && req.user.id !== req.params.id) {
    //   return res.status(403).json({ error: "Not authorized" })
    // }

    const user = await User.findById(req.params.id).select("-password").populate("department", "name")

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Update user
router.put("/:id", async (req, res) => {
  try {
    // Regular users can only update their own profile
    // if (req.user.role !== "Admin" && req.user.id !== req.params.id) {
    //   return res.status(403).json({ error: "Not authorized" })
    // }

    const { id } = req.params
    const updates = req.body

    // Don't allow role updates unless admin
    // if (req.user.role !== "Admin" && updates.role) {
    //   delete updates.role
    // }

    // Remove password from updates (use separate endpoint for password changes)
    if (updates.password) {
      delete updates.password
    }

    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).select("-password")

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Delete user (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    // Check if there are tasks assigned to this user
    const tasksCount = await Task.countDocuments({ assignee: req.params.id })

    if (tasksCount > 0) {
      return res.status(400).json({
        error: "Cannot delete user with assigned tasks",
      })
    }

    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get tasks assigned to user
router.get("/:id/tasks", async (req, res) => {
  try {
    // Regular users can only access their own tasks
    // if (req.user.role !== "Admin" && req.user.id !== req.params.id) {
    //   return res.status(403).json({ error: "Not authorized" })
    // }

    const { status } = req.query

    // Build filter object
    const filter = { assignee: req.params.id }
    if (status) filter.status = status

    const tasks = await Task.find(filter).populate("department", "name color").populate("dependencies", "title status")

    res.json(tasks)
  } catch (error) {
    console.error("Error fetching user tasks:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Change password
router.put("/:id/password", async (req, res) => {
  try {
    // // Users can only change their own password
    // if (req.user.id !== req.params.id) {
    //   return res.status(403).json({ error: "Not authorized" })
    // }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      })
    }

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)

    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error changing password:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get user's tasks
router.get("/:id/tasks", async (req, res) => {
  try {
    const userId = req.params.id;

    const tasks = await Task.find({ assignee: userId })
      .populate("department", "name")
      .populate("assignee", "name email")
      .sort({ createdAt: -1 });

    // Add additional task information
    const tasksWithDetails = tasks.map(task => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      progress: task.progress || 0,
      department: task.department,
      assignee: task.assignee
    }));

    res.json(tasksWithDetails);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// / Get submissions by a user
router.get("/:id/submissions", async (req, res) => {
  try {
    const submissions = await TaskSubmission.find({ user: req.params.id })
      .populate("task", "title status")
      .sort({ createdAt: -1 })

    res.json(submissions)
  } catch (error) {
    console.error("Error fetching user submissions:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get user notifications
router.get("/:id/notifications", async (req, res) => {
  try {
    // In a real app, you would fetch notifications from a database
    // For now, we'll return mock data
    const notifications = [
      {
        id: "1",
        type: "submission_approved",
        title: "Submission Approved",
        message: "Your task submission for 'Create Login Page' has been approved!",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        read: false,
        taskId: "task123",
      },
      {
        id: "2",
        type: "submission_rejected",
        title: "Submission Needs Revision",
        message: "Your task submission for 'API Integration' requires some changes.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        read: false,
        taskId: "task456",
      },
      {
        id: "3",
        type: "task_assigned",
        title: "New Task Assigned",
        message: "You have been assigned a new task: 'Database Schema Design'",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: true,
        taskId: "task789",
      },
    ]

    res.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Mark all notifications as read
router.put("/:id/notifications/read-all", async (req, res) => {
  try {
    // In a real app, you would update notifications in the database
    // For now, we'll just return a success message
    res.json({ message: "All notifications marked as read" })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
