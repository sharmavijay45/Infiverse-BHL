// aiAgent.js
const { v4: uuidv4 } = require("uuid");

function analyzeTasks(tasks) {
  const suggestions = [];
  const now = new Date();

  // 1. Check for overdue tasks
  tasks.forEach(task => {
    const dueDate = new Date(task.dueDate);
    if (task.status !== "Completed" && dueDate < now) {
      suggestions.push({
        id: uuidv4(),
        title: "Pending Task with Past Due Date",
        description: `The "${task.title}" is pending but its due date (${task.dueDate}) has already passed.`,
        impact: "High",
        category: "Deadlines",
        actions: ["Reschedule due date", "Investigate reason for delay", "Prioritize task completion"],
        createdAt: now.toISOString()
      });
    }
  });

  // 2. Check for dependency bottlenecks
  const dependencyMap = new Map();
  tasks.forEach(task => {
    task.dependencies.forEach(dep => {
      if (!dependencyMap.has(dep.title)) {
        dependencyMap.set(dep.title, []);
      }
      dependencyMap.get(dep.title).push(task.title);
    });
  });

  for (let [depTitle, dependents] of dependencyMap) {
    if (dependents.length > 1) {
      suggestions.push({
        id: uuidv4(),
        title: "Dependency Bottleneck",
        description: `Multiple tasks depend on "${depTitle}", creating a potential bottleneck.`,
        impact: "Medium",
        category: "Dependencies",
        actions: ["Review dependencies", "Split tasks", "Communicate potential delays"],
        createdAt: now.toISOString()
      });
    }
  }

  // 3. Check for resource overload
  const workload = {};
  tasks.forEach(task => {
    if (!task.assignee?.name) return;
    if (!workload[task.assignee.name]) workload[task.assignee.name] = [];
    workload[task.assignee.name].push(task);
  });

  for (let [name, assignedTasks] of Object.entries(workload)) {
    const upcoming = assignedTasks.filter(task => new Date(task.dueDate) > now);
    if (upcoming.length > 2) {
      suggestions.push({
        id: uuidv4(),
        title: "Potential Resource Overload",
        description: `"${name}" is assigned to multiple upcoming tasks (${upcoming.map(t => `"${t.title}"`).join(", ")}).`,
        impact: "Medium",
        category: "Resources",
        actions: ["Review workload", "Reassign tasks", "Prioritize"],
        createdAt: now.toISOString()
      });
    }
  }

  // 4. Check for long dependency chains (simple logic)
  tasks.forEach(task => {
    if (task.dependencies.length > 2) {
      suggestions.push({
        id: uuidv4(),
        title: "Long Dependency Chain",
        description: `Task "${task.title}" has a long dependency chain which could delay workflow.`,
        impact: "Low",
        category: "Workflow",
        actions: ["Break chain into phases", "Use async tasks", "Communicate delays"],
        createdAt: now.toISOString()
      });
    }
  });

  return suggestions;
}

module.exports = { analyzeTasks };
