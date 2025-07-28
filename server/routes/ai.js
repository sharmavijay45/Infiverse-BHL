// const express = require("express");
// const router = express.Router();
// const Task = require("../models/Task");
// const Department = require("../models/Department");
// const auth = require("../middleware/auth");

// // Dynamic import for gemini-ai
// let geminiAI;

// (async () => {
//   geminiAI = await import("gemini-ai");
// })();

// // Get AI insights
// router.get("/insights", async (req, res) => {
//   try {
//     const insights = [
//       {
//         id: "insight-1",
//         title: "Resource Allocation Optimization",
//         description:
//           "Marketing team has 3 high-priority tasks with overlapping deadlines. Consider redistributing tasks to prevent bottlenecks.",
//         impact: "High",
//         category: "Resources",
//         actions: ["Reassign tasks", "Adjust deadlines"],
//         createdAt: new Date().toISOString(),
//       },
//       {
//         id: "insight-2",
//         title: "Task Dependency Conflict",
//         description:
//           "Task 'Inventory Management System Update' is blocking 3 dependent tasks in Operations department.",
//         impact: "Medium",
//         category: "Dependencies",
//         actions: ["Review dependencies", "Prioritize blocking task"],
//         createdAt: new Date().toISOString(),
//       },
//       {
//         id: "insight-3",
//         title: "Deadline Risk Alert",
//         description:
//           "Sales team has 2 tasks at risk of missing deadlines based on current progress and historical completion rates.",
//         impact: "High",
//         category: "Deadlines",
//         actions: ["Extend deadlines", "Add resources"],
//         createdAt: new Date().toISOString(),
//       },
//       {
//         id: "insight-4",
//         title: "Workflow Efficiency Improvement",
//         description:
//           "Operations department workflow can be optimized by reordering tasks to minimize idle time between dependent tasks.",
//         impact: "Medium",
//         category: "Workflow",
//         actions: ["Reorder tasks", "Adjust dependencies"],
//         createdAt: new Date().toISOString(),
//       },
//       {
//         id: "insight-5",
//         title: "Resource Underutilization",
//         description: "Team member 'Alex Brown' has capacity for additional tasks based on current workload analysis.",
//         impact: "Low",
//         category: "Resources",
//         actions: ["Assign more tasks", "Review capacity"],
//         createdAt: new Date().toISOString(),
//       },
//     ];

//     res.json(insights);
//   } catch (error) {
//     console.error("Error fetching AI insights:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// // Optimize workflow using Gemini AI
// router.post("/optimize", auth, async (req, res) => {
//   try {
//     // Fetch tasks and departments from the database
//     const tasks = await Task.find()
//       .populate("department", "name")
//       .populate("assignee", "name")
//       .populate("dependencies", "title");

//     const departments = await Department.find();

//     // Generate optimization suggestions using Gemini AI
//     const prompt = `
//       Analyze the following workflow data and provide optimization suggestions:

//       Tasks:
//       ${JSON.stringify(tasks, null, 2)}

//       Departments:
//       ${JSON.stringify(departments, null, 2)}

//       Provide optimization suggestions in JSON format with title, description, impact (High/Medium/Low), category, and actions.
//     `;

//     // Ensure the gemini module is loaded before using it
//     if (!geminiAI) {
//       return res.status(500).json({ error: "Gemini AI module not loaded" });
//     }

//     // Use Gemini AI to generate the optimization suggestions
//     const { text } = await geminiAI.Client.generateText({
//       model: "gemini-v1", // Replace with the correct model version if needed
//       prompt: prompt,
//     });

//     // Parse the AI-generated text into structured data
//     const optimizationResult = {
//       timestamp: new Date().toISOString(),
//       suggestions: [
//         {
//           title: "Prioritize Inventory Management Update",
//           description:
//             "This task is blocking Supply Chain Optimization. Allocate more resources to complete it faster.",
//           impact: "High",
//           category: "Dependencies",
//           actions: ["Add resources to TASK-1003", "Expedite review process"],
//         },
//         {
//           title: "Balance Marketing Workload",
//           description:
//             "Marketing has completed high-priority tasks but has pending low-priority tasks. Consider reallocating resources.",
//           impact: "Medium",
//           category: "Resources",
//           actions: ["Reassign team members", "Review task priorities"],
//         },
//       ],
//       aiAnalysis: text, // This contains the raw AI response, which you may parse or use as needed
//     };

//     // Emit socket event for real-time updates
//     req.io.emit("optimization-suggestions", optimizationResult.suggestions);

//     res.json(optimizationResult);
//   } catch (error) {
//     console.error("AI optimization error:", error);
//     res.status(500).json({ error: "Failed to generate optimization suggestions" });
//   }
// });

// // Get dependency analysis
// router.get("/dependencies", auth, async (req, res) => {
//   try {
//     const analysis = {
//       criticalPath: ["TASK-1001", "TASK-1002", "TASK-1003", "TASK-1005"],
//       bottlenecks: ["TASK-1003"],
//       suggestions: [
//         "Prioritize 'Inventory Management System Update' to unblock dependent tasks",
//         "Consider parallel execution of 'Customer Feedback Analysis' and 'Sales Presentation'",
//       ],
//     };

//     res.json(analysis);
//   } catch (error) {
//     console.error("Error fetching dependency analysis:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Department = require("../models/Department");
const auth = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Validate environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not defined in environment variables.");
  throw new Error("GEMINI_API_KEY is required");
}

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Utility function to clean AI response
const cleanAIResponse = (text) => {
  // Remove Markdown code fences and trim whitespace
  return text
    .replace(/```json\n|```/g, "")
    .replace(/^\s*|\s*$/g, "");
};

// Get AI insights
router.get("/insights", async (req, res) => {
  try {
    // Fetch tasks and departments from the database
    const tasks = await Task.find()
      .populate("department", "name")
      .populate("assignee", "name")
      .populate("dependencies", "title");

    const departments = await Department.find();

    // Generate insights using Gemini AI
    const prompt = `
      Analyze the following workflow data and provide optimization insights in JSON format.
      Each insight should have: id (UUID), title, description, impact (High/Medium/Low), category (Resources/Dependencies/Deadlines/Workflow), actions (array of strings), and createdAt (ISO date).

      Tasks:
      ${JSON.stringify(tasks, null, 2)}

      Departments:
      ${JSON.stringify(departments, null, 2)}

      Example output:
      [
        {
          "id": "insight-1",
          "title": "Resource Allocation Optimization",
          "description": "Marketing team has overlapping high-priority tasks.",
          "impact": "High",
          "category": "Resources",
          "actions": ["Reassign tasks", "Adjust deadlines"],
          "createdAt": "2025-04-28T14:30:00.000Z"
        }
      ]
    `;

    console.log("Sending prompt to Gemini AI for insights...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Received Gemini AI response:", text);

    // Clean and parse the AI-generated text
    const cleanedText = cleanAIResponse(text);
    let insights;
    try {
      insights = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini AI response:", parseError, "Raw response:", cleanedText);
      // Fallback to default insights
      insights = [
        {
          id: uuidv4(),
          title: "Resource Allocation Optimization",
          description:
            "Marketing team has 3 high-priority tasks with overlapping deadlines. Consider redistributing tasks to prevent bottlenecks.",
          impact: "High",
          category: "Resources",
          actions: ["Reassign tasks", "Adjust deadlines"],
          createdAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          title: "Task Dependency Conflict",
          description:
            "Task 'Inventory Management System Update' is blocking 3 dependent tasks in Operations department.",
          impact: "Medium",
          category: "Dependencies",
          actions: ["Review dependencies", "Prioritize blocking task"],
          createdAt: new Date().toISOString(),
        },
      ];
    }

    // Validate and normalize insights
    insights = insights.map((insight) => ({
      id: insight.id || uuidv4(),
      title: insight.title || "Untitled Insight",
      description: insight.description || "No description provided",
      impact: ["High", "Medium", "Low"].includes(insight.impact) ? insight.impact : "Medium",
      category: ["Resources", "Dependencies", "Deadlines", "Workflow"].includes(insight.category)
        ? insight.category
        : "Workflow",
      actions: Array.isArray(insight.actions) ? insight.actions : ["Review task"],
      createdAt: insight.createdAt || new Date().toISOString(),
    }));

    res.json(insights);
  } catch (error) {
    console.error("Error fetching Gemini AI insights:", error);
    res.status(500).json({ error: "Failed to fetch Gemini AI insights" });
  }
});

// Optimize workflow using Gemini AI
router.post("/optimize", auth, async (req, res) => {
  try {
    // Fetch tasks and departments from the database
    const tasks = await Task.find()
      .populate("department", "name")
      .populate("assignee", "name")
      .populate("dependencies", "title");

    const departments = await Department.find();

    // Generate optimization suggestions using Gemini AI
    const prompt = `
      Analyze the following workflow data and provide optimization suggestions in JSON format.
      Each suggestion should have: id (UUID), title, description, impact (High/Medium/Low), category (Resources/Dependencies/Deadlines/Workflow), actions (array of strings), and createdAt (ISO date).

      Tasks:
      ${JSON.stringify(tasks, null, 2)}

      Departments:
      ${JSON.stringify(departments, null, 2)}

      Example output:
      [
        {
          "id": "suggestion-1",
          "title": "Prioritize Inventory Management Update",
          "description": "This task is blocking Supply Chain Optimization.",
          "impact": "High",
          "category": "Dependencies",
          "actions": ["Add resources", "Expedite review"],
          "createdAt": "2025-04-28T14:30:00.000Z"
        }
      ]
    `;

    console.log("Sending prompt to Gemini AI for optimization...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Received Gemini AI response:", text);

    // Clean and parse the AI-generated text
    const cleanedText = cleanAIResponse(text);
    let suggestions;
    try {
      suggestions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini AI optimization response:", parseError, "Raw response:", cleanedText);
      suggestions = [
        {
          id: uuidv4(),
          title: "Prioritize Inventory Management Update",
          description:
            "This task is blocking Supply Chain Optimization. Allocate more resources to complete it faster.",
          impact: "High",
          category: "Dependencies",
          actions: ["Add resources to TASK-1003", "Expedite review process"],
          createdAt: new Date().toISOString(),
        },
        {
          id: uuidv4(),
          title: "Balance Marketing Workload",
          description:
            "Marketing has completed high-priority tasks but has pending low-priority tasks. Consider reallocating resources.",
          impact: "Medium",
          category: "Resources",
          actions: ["Reassign team members", "Review task priorities"],
          createdAt: new Date().toISOString(),
        },
      ];
    }

    const optimizationResult = {
      timestamp: new Date().toISOString(),
      suggestions: suggestions.map((suggestion) => ({
        id: suggestion.id || uuidv4(),
        title: suggestion.title || "Untitled Suggestion",
        description: suggestion.description || "No description provided",
        impact: ["High", "Medium", "Low"].includes(suggestion.impact) ? suggestion.impact : "Medium",
        category: ["Resources", "Dependencies", "Deadlines", "Workflow"].includes(suggestion.category)
          ? suggestion.category
          : "Workflow",
        actions: Array.isArray(suggestion.actions) ? suggestion.actions : ["Review task"],
        createdAt: suggestion.createdAt || new Date().toISOString(),
      })),
      aiAnalysis: text,
    };

    // Emit socket event for real-time updates
    req.io.emit("optimization-suggestions", optimizationResult.suggestions);

    res.json(optimizationResult);
  } catch (error) {
    console.error("AI optimization error:", error);
    res.status(500).json({ error: "Failed to generate optimization suggestions" });
  }
});

// Get dependency analysis
router.get("/dependencies", auth, async (req, res) => {
  try {
    const analysis = {
      criticalPath: ["TASK-1001", "TASK-1002", "TASK-1003", "TASK-1005"],
      bottlenecks: ["TASK-1003"],
      suggestions: [
        "Prioritize 'Inventory Management System Update' to unblock dependent tasks",
        "Consider parallel execution of 'Customer Feedback Analysis' and 'Sales Presentation'",
      ],
    };

    res.json(analysis);
  } catch (error) {
    console.error("Error fetching dependency analysis:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;