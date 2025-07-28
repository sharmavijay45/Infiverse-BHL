
const express = require("express")
const router = express.Router()
const TaskSubmission = require("../models/TaskSubmission")
const Task = require("../models/Task")
const multer = require("multer")
const { uploadToCloudinary } = require("../utils/cloudinary")
const Notification = require("../models/Notification")
const User = require("../models/User")

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(null, true) // Allow empty file field
    }

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ]
    const validExtensions = /\.(pdf|doc|docx|png|jpg|jpeg)$/i
    const mimetypeValid = validTypes.includes(file.mimetype)
    const extnameValid = validExtensions.test(file.originalname)

    if (!mimetypeValid || !extnameValid) {
      console.error(`Invalid file: mimetype=${file.mimetype}, originalname=${file.originalname}`)
      return cb(new Error("Only PDF, DOC, DOCX, PNG, and JPEG files are allowed"))
    }

    cb(null, true)
  },
})

// Get all submissions
router.get("/", async (req, res) => {
  try {
    const submissions = await TaskSubmission.find()
      .populate("task", "title status")
      .populate("user", "name email")
      .populate("reviewHistory.reviewedBy", "name email")

    res.json(submissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get submission by ID
router.get("/:id", async (req, res) => {
  try {
    const submission = await TaskSubmission.findById(req.params.id)
      .populate("task", "title status department assignee")
      .populate("user", "name email")
      .populate("reviewHistory.reviewedBy", "name email")

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" })
    }

    res.json(submission)
  } catch (error) {
    console.error("Error fetching submission:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get submission by task ID
router.get("/task/:taskId", async (req, res) => {
  try {
    const submission = await TaskSubmission.findOne({ task: req.params.taskId })
      .populate("task", "title status")
      .populate("user", "name email")
      .populate("reviewHistory.reviewedBy", "name email")

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" })
    }

    res.json(submission)
  } catch (error) {
    console.error("Error fetching submission by task:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Create new submission
router.post("/", upload.single("document"), async (req, res) => {
  try {
    const { task: taskId, githubLink, notes, originalSubmission, userId } = req.body

    // Check if task exists
    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({ error: "Task not found" })
    }

    // If it's an original submission (not a revision)
    if (!originalSubmission) {
      const existingSubmission = await TaskSubmission.findOne({
        task: taskId,
        originalSubmission: { $exists: false },
      })

      if (existingSubmission) {
        return res.status(400).json({ error: "A submission already exists for this task" })
      }
    }

    let documentLink = ""
    let fileType = ""
    if (req.file) {
      console.log("File uploaded:", {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      })

      const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname)
      documentLink = cloudinaryUrl
      fileType = req.file.mimetype
    }

    // Create new submission
    const newSubmission = new TaskSubmission({
      task: taskId,
      user: userId,
      githubLink: githubLink || "",
      notes: notes || "",
      documentLink,
      fileType,
      originalSubmission: originalSubmission ? originalSubmission : undefined,
    })

    const submission = await newSubmission.save()

    // Populate user information
    await submission.populate("user", "name")

    // Update task status to "Completed" only for original submission
    if (!originalSubmission && task.status !== "Completed") {
      task.status = "Completed"
      task.progress = 100
      await task.save()
    }

    // Emit socket event for real-time updates
    req.io.emit("submission-created", {
      submission,
      taskId,
    })

    // Find admin user(s) to notify
    const admins = await User.find({ role: "Admin" })
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: "task_submitted",
        title: "Task Submitted",
        message: `Submission by ${submission.user.name} for task: '${task.title}'. Please review it.`,
        task: taskId,
      })
    }

    res.status(201).json(submission)
  } catch (error) {
    console.error("Error creating submission:", error)
    res.status(500).json({ error: error.message || "Server error" })
  }
})

// Update submission
router.put("/:id", upload.single("document"), async (req, res) => {
  try {
    const { githubLink, notes } = req.body
    const submission = await TaskSubmission.findById(req.params.id)

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" })
    }

    let documentLink = submission.documentLink
    let fileType = submission.fileType
    if (req.file) {
      console.log("File uploaded:", {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      })

      const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname)
      documentLink = cloudinaryUrl
      fileType = req.file.mimetype
    }

    // Update submission
    const updatedSubmission = await TaskSubmission.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          githubLink: githubLink || "",
          notes: notes || "",
          documentLink,
          fileType,
          updatedAt: Date.now(),
        },
      },
      { new: true }
    )
      .populate("task", "title status")
      .populate("user", "name email")
      .populate("reviewHistory.reviewedBy", "name email")

    // Emit socket event for real-time updates
    req.io.emit("submission-updated", updatedSubmission)

    res.json(updatedSubmission)
  } catch (error) {
    console.error("Error updating submission:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Review submission
router.put("/:id/review", async (req, res) => {
  try {
    const { status, feedback, reviewedBy } = req.body

    if (!status || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    const submission = await TaskSubmission.findById(req.params.id)
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" })
    }

    // Use reviewedBy from request body, or fall back to user ID from token
    const reviewerId = reviewedBy
    if (!reviewerId) {
      return res.status(400).json({ error: "Reviewer ID is required" })
    }

    // Add current review to history
    if (submission.status !== "Pending") {
      submission.reviewHistory.push({
        status: submission.status,
        feedback: submission.feedback,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
    }

    // Update current status and feedback
    submission.status = status
    submission.feedback = feedback || ""
    await submission.save()

    // If approved, ensure task is marked as completed
    if (status === "Approved") {
      const task = await Task.findById(submission.task)
      if (task && task.status !== "Completed") {
        task.status = "Completed"
        task.progress = 100
        await task.save()
      }
    }

    // Emit socket event for real-time updates
    req.io.emit("submission-reviewed", submission)

    // Notify the submitter
    await Notification.create({
      recipient: submission.user,
      type: "submission_reviewed",
      title: `Submission ${status}`,
      message: `Your submission for task '${submission.task.title}' has been ${status.toLowerCase()}. Feedback: ${feedback || "None"}`,
      task: submission.task,
    })

    res.json(submission)
  } catch (error) {
    console.error("Error reviewing submission:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Delete submission
router.delete("/:id", async (req, res) => {
  try {
    const submission = await TaskSubmission.findById(req.params.id)

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" })
    }

    await TaskSubmission.findByIdAndDelete(req.params.id)

    // Emit socket event for real-time updates
    req.io.emit("submission-deleted", req.params.id)

    res.json({ message: "Submission deleted successfully" })
  } catch (error) {
    console.error("Error deleting submission:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
