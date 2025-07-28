const express = require("express")
const router = express.Router()
const Department = require("../models/Department")
const Task = require("../models/Task")
const auth = require("../middleware/auth")

// Get all departments
router.get("/", async (req, res) => {
  try {
    const departments = await Department.find().populate("lead", "name avatar").populate("members", "name avatar")
    res.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get department by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("lead", "name avatar")
      .populate("members", "name avatar")

    if (!department) {
      return res.status(404).json({ error: "Department not found" })
    }

    res.json(department)
  } catch (error) {
    console.error("Error fetching department:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Create new department
router.post("/", async (req, res) => {
  try {
    const newDepartment = new Department(req.body)
    const department = await newDepartment.save()

    // Populate fields for response
    const populatedDepartment = await Department.findById(department._id)
      .populate("lead", "name avatar")
      .populate("members", "name avatar")

    // Emit socket event for real-time updates
    req.io.emit("department-created", populatedDepartment)

    res.status(201).json(populatedDepartment)
  } catch (error) {
    console.error("Error creating department:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Update department
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const department = await Department.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate("lead", "name avatar")
      .populate("members", "name avatar")

    if (!department) {
      return res.status(404).json({ error: "Department not found" })
    }

    // Emit socket event for real-time updates
    req.io.emit("department-updated", department)

    res.json(department)
  } catch (error) {
    console.error("Error updating department:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Delete department
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if there are tasks assigned to this department
    const tasksCount = await Task.countDocuments({ department: req.params.id })

    if (tasksCount > 0) {
      return res.status(400).json({
        error: "Cannot delete department with assigned tasks",
      })
    }

    const department = await Department.findByIdAndDelete(req.params.id)

    if (!department) {
      return res.status(404).json({ error: "Department not found" })
    }

    // Emit socket event for real-time updates
    req.io.emit("department-deleted", req.params.id)

    res.json({ message: "Department deleted successfully" })
  } catch (error) {
    console.error("Error deleting department:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get tasks by department
router.get("/:id/tasks", async (req, res) => {
  try {
    const { status } = req.query

    // Build filter object
    const filter = { department: req.params.id }
    if (status) filter.status = status

    const tasks = await Task.find(filter).populate("assignee", "name avatar").populate("dependencies", "title status")

    res.json(tasks)
  } catch (error) {
    console.error("Error fetching department tasks:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
