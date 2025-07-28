const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Progress = require("../models/Progress");
const Task = require("../models/Task");
const User = require("../models/User");
const { check, validationResult } = require("express-validator");

// @route   GET api/progress/task/:taskId
// @desc    Get all progress updates for a task
// @access  Private
router.get("/task/:taskId", async (req, res) => {
  try {
    const progress = await Progress.find({ task: req.params.taskId })
      .sort({ date: -1 })
      .populate("user", "name email");

    res.json(progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/progress/user/:userId
// @desc    Get all progress updates by a user
// @access  Private
router.get("/user/:userId", async (req, res) => {
  try {
    const progress = await Progress.find({ user: req.params.userId })
      .sort({ date: -1 })
      .populate("task", "title description dueDate");

    res.json(progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/progress
// @desc    Create a progress update
// @access  Private
router.post(
  "/",
  [
    
    [
      check("task", "Task ID is required").not().isEmpty(),
      check("progressPercentage", "Progress percentage is required").isNumeric(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { user,task, progressPercentage, notes, blockers, achievements, date } = req.body;

      // Check if task exists and belongs to user
      const taskDoc = await Task.findById(task);
      if (!taskDoc) {
        return res.status(404).json({ msg: "Task not found" });
      }

      // Create new progress
      const newProgress = new Progress({
        task,
        user,
        progressPercentage,
        notes,
        blockers,
        achievements,
        date: date || new Date(),
      });

      const progress = await newProgress.save();

      // Update task progress
      taskDoc.progress = progressPercentage;
      await taskDoc.save();

      // Notify via Socket.IO
      if (req.io) {
        req.io.to(`task-${task}`).emit("progress-update", {
          task,
          progress: progressPercentage,
          user
        });
      }

      res.json(progress);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   PUT api/progress/:id
// @desc    Update a progress entry
// @access  Private
router.put("/:id", async (req, res) => {
  try {
    const { progressPercentage, notes, blockers, achievements } = req.body;

    // Find progress by ID
    let progress = await Progress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ msg: "Progress entry not found" });
    }

    // Check if user owns the progress entry
    if (progress.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Update fields
    if (progressPercentage) progress.progressPercentage = progressPercentage;
    if (notes) progress.notes = notes;
    if (blockers !== undefined) progress.blockers = blockers;
    if (achievements !== undefined) progress.achievements = achievements;
    progress.updatedAt = Date.now();

    await progress.save();

    // Update task progress
    const task = await Task.findById(progress.task);
    if (task) {
      task.progress = progressPercentage;
      await task.save();

      // Notify via Socket.IO
      if (req.io) {
        req.io.to(`task-${task._id}`).emit("progress-update", {
          task: task._id,
          progress: progressPercentage,
          user: req.user.id,
        });
      }
    }

    res.json(progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE api/progress/:id
// @desc    Delete a progress entry
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);
    if (!progress) {
      return res.status(404).json({ msg: "Progress entry not found" });
    }

    // Check if user owns the progress entry or is admin
    if (progress.user.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await progress.remove();
    res.json({ msg: "Progress entry removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
