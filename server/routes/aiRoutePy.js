const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { PythonShell } = require("python-shell");
const path = require("path");

// Get AI insights
router.get("/insights", async (req, res) => {
  try {
    console.log("Fetching AI insights");
    const options = {
      mode: "text",
      pythonPath: process.env.PYTHON_PATH || path.join(__dirname, "..", "venv", "Scripts", "python.exe"),
      pythonOptions: ["-u"],
      scriptPath: path.join(__dirname, ".."),
      args: [],
    };

    PythonShell.run("ml_agent.py", options, (err, results) => {
      if (err) {
        console.error("Python script error:", err.message);
        return res.status(500).json({ error: "Failed to fetch AI insights", details: err.message });
      }

      try {
        const insights = JSON.parse(results.join(""));
        console.log("Insights generated:", insights);
        res.json(insights);
      } catch (parseErr) {
        console.error("Error parsing Python output:", parseErr);
        res.status(500).json({ error: "Failed to parse AI insights" });
      }
    });
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
});

// Optimize workflow
router.post("/optimize", auth, async (req, res) => {
  try {
    console.log("Generating optimization suggestions");
    const options = {
      mode: "text",
      pythonPath: process.env.PYTHON_PATH || path.join(__dirname, "..", "venv", "Scripts", "python.exe"),
      pythonOptions: ["-u"],
      scriptPath: path.join(__dirname, ".."),
      args: [],
    };

    PythonShell.run("ml_agent.py", options, (err, results) => {
      if (err) {
        console.error("Python script error:", err.message);
        return res.status(500).json({ error: "Failed to generate optimization suggestions", details: err.message });
      }

      try {
        const suggestions = JSON.parse(results.join(""));
        console.log("Optimization suggestions generated:", suggestions);
        const optimizationResult = {
          timestamp: new Date().toISOString(),
          suggestions,
          aiAnalysis: "ML-based workflow optimization completed.",
        };

        req.io.emit("optimization-suggestions", optimizationResult.suggestions);
        res.json(optimizationResult);
      } catch (parseErr) {
        console.error("Error parsing Python output:", parseErr);
        res.status(500).json({ error: "Failed to parse optimization suggestions" });
      }
    });
  } catch (error) {
    console.error("AI optimization error:", error);
    res.status(500).json({ error: "Failed to generate optimization suggestions" });
  }
});

// Get dependency analysis
router.get("/dependencies", auth, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("department", "name")
      .populate("assignee", "name")
      .populate("dependencies", "title");

    const dependencyCount = {};
    tasks.forEach((task) => {
      task.dependencies.forEach((depId) => {
        dependencyCount[depId] = (dependencyCount[depId] || 0) + 1;
      });
    });

    const bottlenecks = Object.keys(dependencyCount)
      .filter((depId) => dependencyCount[depId] > 1)
      .map((depId) => tasks.find((t) => t._id.toString() === depId)?.title);

    const analysis = {
      criticalPath: tasks
        .filter((t) => t.dependencies.length > 0)
        .map((t) => t._id.toString())
        .slice(0, 4),
      bottlenecks,
      suggestions: bottlenecks.map((b) => `Prioritize "${b}" to unblock dependent tasks`),
    };

    res.json(analysis);
  } catch (error) {
    console.error("Error fetching dependency analysis:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;