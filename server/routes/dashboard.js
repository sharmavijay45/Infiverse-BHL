const express = require("express")
const router = express.Router()
const Task = require("../models/Task")
const User = require("../models/User")
const Department = require("../models/Department")
const auth = require("../middleware/auth")

// Get dashboard stats
router.get("/stats",async (req, res) => {
  try {
    // Get task counts by status
    const totalTasks = await Task.countDocuments()
    const completedTasks = await Task.countDocuments({ status: "Completed" })
    const inProgressTasks = await Task.countDocuments({ status: "In Progress" })
    const pendingTasks = await Task.countDocuments({ status: "Pending" })
 
 
    // Get change percentages (mock data - in a real app, you'd compare with historical data)
    const totalTasksChange = 12 // +12% from last month
    const completedTasksChange = 8 // +8% from last month
    const inProgressTasksChange = 2 // +2 tasks since yesterday
    const pendingTasksChange = -2 // -2 tasks since yesterday

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalTasksChange,
      completedTasksChange,
      inProgressTasksChange,
      pendingTasksChange,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get department stats
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 })

    // For each department, get task counts
    const departmentStats = await Promise.all(
      departments.map(async (department) => {
        const totalTasks = await Task.countDocuments({ department: department._id })
        const completedTasks = await Task.countDocuments({
          department: department._id,
          status: "Completed",
        })

        return {
          id: department._id,
          name: department.name,
          color: department.color || "bg-blue-500",
          total: totalTasks,
          completed: completedTasks,
        }
      }),
    )

    res.json(departmentStats)
  } catch (error) {
    console.error("Error fetching department stats:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get tasks overview
router.get("/tasks-overview", async (req, res) => {
  try {
    // Get task counts by status
    const completedCount = await Task.countDocuments({ status: "Completed" })
    const inProgressCount = await Task.countDocuments({ status: "In Progress" })
    const pendingCount = await Task.countDocuments({ status: "Pending" })

    // Get task counts by priority
    const highPriorityCount = await Task.countDocuments({ priority: "High" })
    const mediumPriorityCount = await Task.countDocuments({ priority: "Medium" })
    const lowPriorityCount = await Task.countDocuments({ priority: "Low" })

    const statusData = [
      { name: "Completed", value: completedCount, color: "#22c55e" },
      { name: "In Progress", value: inProgressCount, color: "#3b82f6" },
      { name: "Pending", value: pendingCount, color: "#f59e0b" },
    ]

    const priorityData = [
      { name: "High", value: highPriorityCount, color: "#ef4444" },
      { name: "Medium", value: mediumPriorityCount, color: "#f59e0b" },
      { name: "Low", value: lowPriorityCount, color: "#22c55e" },
    ]

    res.json({
      statusData,
      priorityData,
    })
  } catch (error) {
    console.error("Error fetching tasks overview:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get recent activity
router.get("/activity", async (req, res) => {
  try {
    // In a real app, you'd have an Activity model to track user actions
    // For this example, we'll return mock data
    const activities = [
      {
        id: 1,
        user: {
          name: "John Doe",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "JD",
        },
        action: "completed",
        task: "Q1 Marketing Campaign Planning",
        department: "Marketing",
        time: "2 hours ago",
      },
      {
        id: 2,
        user: {
          name: "Jane Smith",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "JS",
        },
        action: "updated",
        task: "Sales Presentation for Client XYZ",
        department: "Sales",
        time: "3 hours ago",
      },
      {
        id: 3,
        user: {
          name: "Mike Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "MJ",
        },
        action: "created",
        task: "Inventory Management System Update",
        department: "Operations",
        time: "5 hours ago",
      },
      {
        id: 4,
        user: {
          name: "Sarah Williams",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "SW",
        },
        action: "assigned",
        task: "Customer Feedback Analysis",
        department: "Marketing",
        time: "6 hours ago",
      },
      {
        id: 5,
        user: {
          name: "Alex Brown",
          avatar: "/placeholder.svg?height=40&width=40",
          initials: "AB",
        },
        action: "commented on",
        task: "Supply Chain Optimization",
        department: "Operations",
        time: "8 hours ago",
      },
    ]

    res.json(activities)
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get user stats
router.get("/user-stats/:userId", async (req, res) => {
    try {
      let userId = req.params.userId.trim(); // 👉 remove spaces/newlines
      console.log('user id in backend for userstats', userId);
  
      const totalTasks = await Task.countDocuments({ assignee: userId });
      const completedTasks = await Task.countDocuments({ assignee: userId, status: "Completed" });
      const inProgressTasks = await Task.countDocuments({ assignee: userId, status: "In Progress" });
      const pendingTasks = await Task.countDocuments({ assignee: userId, status: "Pending" });
  
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
  
      const upcomingDeadlines = await Task.find({
        assignee: userId,
        dueDate: { $gte: today, $lte: nextWeek },
        status: { $ne: "Completed" },
      })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate("department", "name color");
  
      res.json({
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        upcomingDeadlines,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  
// @route   GET api/dashboard/progress-stats
// @desc    Get progress statistics
// @access  Private
router.get("/progress-stats", auth, async (req, res) => {
  try {
    // Get tasks with due dates in the future
    const now = new Date();
    const upcomingTasks = await Task.find({
      dueDate: { $gt: now },
      status: { $ne: "Completed" },
    }).populate("assignee", "name");
    
    // Calculate progress statistics
    const progressStats = upcomingTasks.map(task => {
      const totalDays = Math.ceil((new Date(task.dueDate) - new Date(task.createdAt)) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now - new Date(task.createdAt)) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24));
      
      // Calculate expected progress based on time elapsed
      const expectedProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
      
      // Calculate progress difference (actual vs expected)
      const progressDifference = task.progress - expectedProgress;
      
      return {
        id: task._id,
        title: task.title,
        assignee: task.assignee?.name || "Unassigned",
        dueDate: task.dueDate,
        actualProgress: task.progress,
        expectedProgress,
        progressDifference,
        daysRemaining,
        totalDays,
        status: progressDifference >= 0 ? "On Track" : "Behind Schedule",
      };
    });
    
    res.json(progressStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router
