const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Department = require("../models/Department");
const auth = require("../middleware/auth");
const { analyzeTasks } = require("./aiAgents"); // NEW: import your AI logic

// Get AI insights (analyzed suggestions)
router.get("/insights", async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("department", "name")
      .populate("assignee", "name")
      .populate("dependencies", "title");

    const suggestions = analyzeTasks(tasks); // Use your own AI logic

    res.json(suggestions);
  } catch (error) {
    console.error("Error generating AI insights:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Optimize workflow (same as insights in this version)
router.post("/optimize", async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("department", "name")
      .populate("assignee", "name")
      .populate("dependencies", "title");

    const suggestions = analyzeTasks(tasks);

    const result = {
      timestamp: new Date().toISOString(),
      suggestions,
      aiAnalysis: "Generated using custom rule-based AI agent.",
    };

    req.io.emit("optimization-suggestions", result.suggestions); // emit socket event
    res.json(result);
  } catch (error) {
    console.error("Optimization error:", error);
    res.status(500).json({ error: "Failed to optimize workflow" });
  }
});

module.exports = router;
