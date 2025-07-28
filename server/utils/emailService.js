
const nodemailer = require("nodemailer")
const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

// Create a transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Send task reminder email
const sendTaskReminder = async (user, task) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Reminder: Update Progress for Task "${task.title}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Task Progress Update Reminder</h2>
          <p>Hello ${user.name},</p>
          <p>This is a reminder to update your progress on the following task:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">${task.title}</h3>
            <p style="margin-bottom: 5px;"><strong>Description:</strong> ${task.description}</p>
            <p style="margin-bottom: 5px;"><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
            <p style="margin-bottom: 5px;"><strong>Current Progress:</strong> ${task.progress}%</p>
            <p style="margin-bottom: 0;"><strong>Days Remaining:</strong> ${
              Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) > 0
                ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
                : 0
            } days</p>
          </div>
          <p>Please log in to the WorkflowAI system to update your progress.</p>
          <div style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || "https://main-workflow.vercel.app"}/progress" 
               style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
              Update Progress
            </a>
          </div>
          <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
            This is an automated message from the WorkflowAI system.
          </p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent: ", info.messageId)
    return info
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

// Analyze progress data to generate productivity insights
const analyzeProgressData = (progressData) => {
  if (!progressData || progressData.length === 0) {
    return {
      productivityRating: "No Data",
      progressTrend: "No Data",
      commonBlockers: [],
      keyAchievements: [],
      averageProgressPerDay: 0,
      consistencyScore: 0,
      summary: "No progress data available for analysis.",
    }
  }

  // Sort progress entries by date
  const sortedProgress = [...progressData].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Calculate average progress per day
  const progressChanges = []
  for (let i = 1; i < sortedProgress.length; i++) {
    const change = sortedProgress[i].progressPercentage - sortedProgress[i - 1].progressPercentage
    progressChanges.push(change)
  }

  const averageProgressPerDay =
    progressChanges.length > 0
      ? progressChanges.reduce((sum, change) => sum + change, 0) / progressChanges.length
      : sortedProgress[0]?.progressPercentage || 0

  // Determine progress trend
  let progressTrend = "Steady"
  if (progressChanges.length >= 3) {
    const recentChanges = progressChanges.slice(-3)
    const recentAverage = recentChanges.reduce((sum, change) => sum + change, 0) / recentChanges.length

    if (recentAverage > averageProgressPerDay * 1.2) {
      progressTrend = "Accelerating"
    } else if (recentAverage < averageProgressPerDay * 0.8) {
      progressTrend = "Slowing"
    }
  }

  // Calculate consistency score (standard deviation of progress changes)
  const mean = averageProgressPerDay
  const squaredDiffs = progressChanges.map((change) => Math.pow(change - mean, 2))
  const variance = squaredDiffs.length > 0 ? squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length : 0
  const stdDev = Math.sqrt(variance)

  // Convert to a 0-100 consistency score (lower std dev = higher consistency)
  const consistencyScore = Math.max(0, Math.min(100, 100 - stdDev * 10))

  // Extract common blockers
  const blockerWords = []
  progressData.forEach((entry) => {
    if (entry.blockers) {
      const words = entry.blockers.toLowerCase().split(/\s+/)
      blockerWords.push(...words)
    }
  })

  const blockerFrequency = {}
  blockerWords.forEach((word) => {
    if (word.length > 3) {
      // Ignore short words
      blockerFrequency[word] = (blockerFrequency[word] || 0) + 1
    }
  })

  const commonBlockers = Object.entries(blockerFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  // Extract key achievements
  const achievementPhrases = []
  progressData.forEach((entry) => {
    if (entry.achievements) {
      // Split by periods, commas, or semicolons to get phrases
      const phrases = entry.achievements.split(/[.,;]/)
      achievementPhrases.push(...phrases.filter((phrase) => phrase.trim().length > 0))
    }
  })

  // Select a few key achievements (most recent ones)
  const keyAchievements = achievementPhrases
    .slice(-5)
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length > 0)

  // Determine productivity rating
  let productivityRating = "Average"
  if (averageProgressPerDay > 10) {
    productivityRating = "Excellent"
  } else if (averageProgressPerDay > 5) {
    productivityRating = "Good"
  } else if (averageProgressPerDay < 2) {
    productivityRating = "Needs Improvement"
  }

  // Generate summary
  let summary = `Overall productivity is rated as ${productivityRating} with an average progress of ${averageProgressPerDay.toFixed(1)}% per day. `
  summary += `The progress trend is ${progressTrend.toLowerCase()} `

  if (consistencyScore > 80) {
    summary += "with very consistent work patterns. "
  } else if (consistencyScore > 60) {
    summary += "with reasonably consistent work patterns. "
  } else {
    summary += "with variable work patterns. "
  }

  if (commonBlockers.length > 0) {
    summary += `Common challenges include issues related to ${commonBlockers.slice(0, 3).join(", ")}. `
  }

  if (keyAchievements.length > 0) {
    summary += "Recent achievements include: " + keyAchievements[0]
    if (keyAchievements.length > 1) {
      summary += " and " + keyAchievements[1] + "."
    } else {
      summary += "."
    }
  }

  return {
    productivityRating,
    progressTrend,
    commonBlockers,
    keyAchievements,
    averageProgressPerDay,
    consistencyScore,
    summary,
  }
}

// Generate PDF report for department progress
const generateDepartmentProgressPDF = async (department, tasks, users, progressData = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `department_progress_${department._id}.pdf`
      const filePath = path.join(__dirname, "../temp", fileName)

      // Create directory if it doesn't exist
      if (!fs.existsSync(path.join(__dirname, "../temp"))) {
        fs.mkdirSync(path.join(__dirname, "../temp"), { recursive: true })
      }

      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 })
      const stream = fs.createWriteStream(filePath)

      doc.pipe(stream)

      // Add content to PDF
      doc.fontSize(25).text(`${department.name} Department Progress Report`, {
        align: "center",
      })

      doc.moveDown()
      doc.fontSize(14).text(`Generated on: ${new Date().toLocaleDateString()}`, {
        align: "center",
      })

      doc.moveDown(2)

      // Department summary
      doc.fontSize(16).text("Department Summary")
      doc.moveDown(0.5)
      doc.fontSize(12).text(`Total Tasks: ${tasks.length}`)

      const completedTasks = tasks.filter((task) => task.status === "Completed").length
      const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length
      const pendingTasks = tasks.filter((task) => task.status === "Pending").length

      doc.fontSize(12).text(`Completed Tasks: ${completedTasks}`)
      doc.fontSize(12).text(`In Progress Tasks: ${inProgressTasks}`)
      doc.fontSize(12).text(`Pending Tasks: ${pendingTasks}`)

      // Calculate overall department progress
      const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0)
      const averageProgress = tasks.length > 0 ? Math.round(totalProgress / tasks.length) : 0
      doc.fontSize(12).text(`Overall Department Progress: ${averageProgress}%`)

      doc.moveDown(2)

      // Progress Analysis Section
      doc.fontSize(16).text("Progress Analysis")
      doc.moveDown(0.5)

      // Analyze department-wide progress data
      const allProgressEntries = []
      Object.values(progressData).forEach((entries) => {
        allProgressEntries.push(...entries)
      })

      const departmentAnalysis = analyzeProgressData(allProgressEntries)

      // Add productivity summary
      doc
        .fontSize(12)
        .fillColor("#1f2937")
        .text("Productivity Summary:", { continued: true })
        .fontSize(12)
        .fillColor("#4b5563")
        .text(` ${departmentAnalysis.productivityRating}`)

      doc
        .fontSize(12)
        .fillColor("#1f2937")
        .text("Progress Trend:", { continued: true })
        .fontSize(12)
        .fillColor("#4b5563")
        .text(` ${departmentAnalysis.progressTrend}`)

      doc
        .fontSize(12)
        .fillColor("#1f2937")
        .text("Average Daily Progress:", { continued: true })
        .fontSize(12)
        .fillColor("#4b5563")
        .text(` ${departmentAnalysis.averageProgressPerDay.toFixed(1)}%`)

      doc
        .fontSize(12)
        .fillColor("#1f2937")
        .text("Work Consistency Score:", { continued: true })
        .fontSize(12)
        .fillColor("#4b5563")
        .text(` ${Math.round(departmentAnalysis.consistencyScore)}/100`)

      doc.moveDown()

      // Add summary paragraph
      doc.fontSize(12).fillColor("#1f2937").text("Analysis Summary:")
      doc.fontSize(11).fillColor("#4b5563").text(departmentAnalysis.summary, {
        align: "justify",
        width: 500,
      })

      doc.moveDown()

      // Common blockers if available
      if (departmentAnalysis.commonBlockers.length > 0) {
        doc.fontSize(12).fillColor("#1f2937").text("Common Challenges:")
        doc.fontSize(11).fillColor("#4b5563")
        departmentAnalysis.commonBlockers.forEach((blocker) => {
          doc.list([blocker], { bulletRadius: 2, textIndent: 20 })
        })
        doc.moveDown()
      }

      // Key achievements if available
      if (departmentAnalysis.keyAchievements.length > 0) {
        doc.fontSize(12).fillColor("#1f2937").text("Key Achievements:")
        doc.fontSize(11).fillColor("#4b5563")
        departmentAnalysis.keyAchievements.forEach((achievement) => {
          doc.list([achievement], { bulletRadius: 2, textIndent: 20 })
        })
        doc.moveDown()
      }

      doc.moveDown()
      doc.fillColor("#000000") // Reset text color

      // User progress
      doc.fontSize(16).text("User Progress")
      doc.moveDown(0.5)

      users.forEach((user) => {
        const userTasks = tasks.filter((task) => task.assignee && task.assignee.toString() === user._id.toString())
        if (userTasks.length === 0) return

        // Get user's progress entries
        const userProgressEntries = progressData[user._id] || []
        const userAnalysis = analyzeProgressData(userProgressEntries)

        doc.fontSize(14).text(`${user.name} (${user.email})`)
        doc.moveDown(0.25)

        // Add user productivity metrics
        doc
          .fontSize(10)
          .fillColor("#4b5563")
          .text(
            `Productivity: ${userAnalysis.productivityRating} | Daily Progress: ${userAnalysis.averageProgressPerDay.toFixed(1)}% | Consistency: ${Math.round(userAnalysis.consistencyScore)}/100`,
          )
        doc.moveDown(0.5)

        // Add tasks table
        doc.fontSize(12).fillColor("#000000")
        userTasks.forEach((task) => {
          doc.fontSize(12).text(`Task: ${task.title}`)
          doc.fontSize(10).text(`Status: ${task.status}`)
          doc.fontSize(10).text(`Progress: ${task.progress}%`)
          doc.fontSize(10).text(`Due Date: ${new Date(task.dueDate).toLocaleDateString()}`)

          // Add recent progress note if available
          const taskProgressEntries = userProgressEntries.filter(
            (entry) => entry.task && entry.task.toString() === task._id.toString(),
          )

          if (taskProgressEntries.length > 0) {
            const latestEntry = taskProgressEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0]

            if (latestEntry.notes) {
              doc.fontSize(10).fillColor("#4b5563").text(`Latest Note: "${latestEntry.notes}"`)
            }
          }

          doc.fillColor("#000000").moveDown(0.5)
        })

        doc.moveDown()
      })

      // Finalize the PDF
      doc.end()

      stream.on("finish", () => {
        resolve(filePath)
      })

      stream.on("error", (error) => {
        reject(error)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Send department progress report email
const sendDepartmentProgressReport = async (admin, department, pdfPath) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: admin.email,
      subject: `${department.name} Department Progress Report`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Department Progress Report</h2>
          <p>Hello ${admin.name},</p>
          <p>Attached is the progress report for the ${department.name} department.</p>
          <p>This report includes task progress for all users in the department, along with productivity analysis and insights based on progress notes.</p>
          <p>Key metrics included:</p>
          <ul>
            <li>Overall productivity rating</li>
            <li>Progress trends</li>
            <li>Average daily progress</li>
            <li>Work consistency scores</li>
            <li>Common challenges</li>
            <li>Key achievements</li>
          </ul>
          <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
            This is an automated message from the WorkflowAI system.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${department.name}_Progress_Report.pdf`,
          path: pdfPath,
          contentType: "application/pdf",
        },
      ],
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Report email sent: ", info.messageId)

    // Delete the temporary file
    fs.unlinkSync(pdfPath)

    return info
  } catch (error) {
    console.error("Error sending report email:", error)
    throw error
  }
}

// Add this function to the existing emailService.js file

// Send aim reminder email
const sendAimReminder = async (user) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Reminder: Set Your Today's Aims`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Daily Aims Reminder</h2>
            <p>Hello ${user.name},</p>
            <p>This is a friendly reminder to set your aims for today. Planning your day helps in better time management and productivity.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Benefits of Setting Daily Aims:</h3>
              <ul style="margin-bottom: 0;">
                <li>Improved focus on important tasks</li>
                <li>Better time management</li>
                <li>Increased productivity</li>
                <li>Clear measurement of daily achievements</li>
              </ul>
            </div>
            <p>Please log in to the WorkflowAI system to set your aims for today.</p>
            <div style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || "https://main-workflow.vercel.app"}/aims" 
                 style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                Set Today's Aims
              </a>
            </div>
            <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
              This is an automated message from the WorkflowAI system.
            </p>
          </div>
        `,
      }
  
      const info = await transporter.sendMail(mailOptions)
      console.log("Aim reminder email sent: ", info.messageId)
      return info
    } catch (error) {
      console.error("Error sending aim reminder email:", error)
      throw error
    }
  }
  
  // Export the new function
  module.exports = {
    sendTaskReminder,
    generateDepartmentProgressPDF,
    sendDepartmentProgressReport,
    sendAimReminder,
  }
