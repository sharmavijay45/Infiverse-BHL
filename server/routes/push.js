// const express = require("express")
// const router = express.Router()
// const webpush = require("web-push")
// const PushSubscription = require("../models/PushSubscription")
// const auth = require("../middleware/auth")

// // Configure web-push with VAPID keys
// webpush.setVapidDetails(
//   "mailto:your-email@example.com", // Replace with your email
//   process.env.VAPID_PUBLIC_KEY ||
//     "BEl62iUYgUivxIkv69yViEuiBIa40HcCWLrUjHLjdMorMYiNkAiOlSstp6riKGxGxaio4vWqlaKUaOOhSE8VLRs",
//   process.env.VAPID_PRIVATE_KEY || "your-vapid-private-key", // Replace with your VAPID private key
// )

// // @route   POST api/push/subscribe
// // @desc    Subscribe user to push notifications
// // @access  Private
// router.post("/subscribe", async (req, res) => {
//   try {
//     const { subscription, userId } = req.body

//     if (!subscription || !userId) {
//       return res.status(400).json({ error: "Subscription and userId are required" })
//     }

//     // Check if subscription already exists
//     const existingSubscription = await PushSubscription.findOne({
//       userId,
//       endpoint: subscription.endpoint,
//     })

//     if (existingSubscription) {
//       return res.json({ message: "Subscription already exists" })
//     }

//     // Save new subscription
//     const newSubscription = new PushSubscription({
//       userId,
//       endpoint: subscription.endpoint,
//       keys: subscription.keys,
//       subscription: subscription,
//     })

//     await newSubscription.save()

//     res.json({ message: "Subscription saved successfully" })
//   } catch (error) {
//     console.error("Error saving push subscription:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   POST api/push/unsubscribe
// // @desc    Unsubscribe user from push notifications
// // @access  Private
// router.post("/unsubscribe", async (req, res) => {
//   try {
//     const { endpoint } = req.body
//     const userId = req.user.id

//     await PushSubscription.deleteOne({ userId, endpoint })

//     res.json({ message: "Unsubscribed successfully" })
//   } catch (error) {
//     console.error("Error unsubscribing:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   POST api/push/send
// // @desc    Send push notification to specific users
// // @access  Private (Admin only)
// router.post("/send", async (req, res) => {
//   try {
//     const { userIds, title, body, url, tag } = req.body

//     if (!userIds || !title || !body) {
//       return res.status(400).json({ error: "userIds, title, and body are required" })
//     }

//     // Get all subscriptions for the specified users
//     const subscriptions = await PushSubscription.find({
//       userId: { $in: userIds },
//     })

//     if (subscriptions.length === 0) {
//       return res.json({ message: "No subscriptions found for specified users" })
//     }

//     const payload = JSON.stringify({
//       title,
//       body,
//       url: url || "/",
//       tag: tag || "default",
//       primaryKey: Date.now().toString(),
//     })

//     const sendPromises = subscriptions.map(async (sub) => {
//       try {
//         await webpush.sendNotification(sub.subscription, payload)
//         return { success: true, userId: sub.userId }
//       } catch (error) {
//         console.error(`Failed to send notification to user ${sub.userId}:`, error)

//         // If subscription is invalid, remove it
//         if (error.statusCode === 410) {
//           await PushSubscription.deleteOne({ _id: sub._id })
//         }

//         return { success: false, userId: sub.userId, error: error.message }
//       }
//     })

//     const results = await Promise.all(sendPromises)
//     const successful = results.filter((r) => r.success).length
//     const failed = results.filter((r) => !r.success).length

//     res.json({
//       message: `Notifications sent: ${successful} successful, ${failed} failed`,
//       results,
//     })
//   } catch (error) {
//     console.error("Error sending push notifications:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// // @route   POST api/push/broadcast
// // @desc    Send push notification to all subscribed users
// // @access  Private (Admin only)
// router.post("/broadcast", async (req, res) => {
//   try {
//     const { title, body, url, tag, excludeUserIds = [] } = req.body

//     if (!title || !body) {
//       return res.status(400).json({ error: "Title and body are required" })
//     }

//     // Get all subscriptions except excluded users
//     const subscriptions = await PushSubscription.find({
//       userId: { $nin: excludeUserIds },
//     })

//     if (subscriptions.length === 0) {
//       return res.json({ message: "No subscriptions found" })
//     }

//     const payload = JSON.stringify({
//       title,
//       body,
//       url: url || "/",
//       tag: tag || "broadcast",
//       primaryKey: Date.now().toString(),
//     })

//     const sendPromises = subscriptions.map(async (sub) => {
//       try {
//         await webpush.sendNotification(sub.subscription, payload)
//         return { success: true, userId: sub.userId }
//       } catch (error) {
//         console.error(`Failed to send notification to user ${sub.userId}:`, error)

//         // If subscription is invalid, remove it
//         if (error.statusCode === 410) {
//           await PushSubscription.deleteOne({ _id: sub._id })
//         }

//         return { success: false, userId: sub.userId, error: error.message }
//       }
//     })

//     const results = await Promise.all(sendPromises)
//     const successful = results.filter((r) => r.success).length
//     const failed = results.filter((r) => !r.success).length

//     res.json({
//       message: `Broadcast sent: ${successful} successful, ${failed} failed`,
//       results,
//     })
//   } catch (error) {
//     console.error("Error broadcasting push notifications:", error)
//     res.status(500).json({ error: "Server error" })
//   }
// })

// module.exports = router


const express = require("express")
const router = express.Router()
const webpush = require("web-push")
const PushSubscription = require("../models/PushSubscription")
const auth = require("../middleware/auth")

// Configure web-push with VAPID keys from environment variables
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:your-email@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

// Helper function to validate subscription endpoint
function isValidSubscriptionEndpoint(endpoint) {
  // Check if it's a valid FCM endpoint
  if (endpoint.includes("fcm.googleapis.com")) {
    return endpoint.includes("/wp/") || endpoint.includes("/fcm/send/")
  }
  // Check if it's a valid Mozilla endpoint
  if (endpoint.includes("mozilla.com")) {
    return true
  }
  // Check if it's a valid Microsoft endpoint
  if (endpoint.includes("notify.windows.com")) {
    return true
  }
  return false
}

// Helper function to fix FCM endpoint
function fixFCMEndpoint(endpoint) {
  if (endpoint.includes("fcm.googleapis.com/fcm/send/")) {
    // Convert old format to new format
    const token = endpoint.split("/fcm/send/")[1]
    return `https://fcm.googleapis.com/wp/${token}`
  }
  return endpoint
}

// @route   POST api/push/subscribe
// @desc    Subscribe user to push notifications
// @access  Private
router.post("/subscribe", async (req, res) => {
  try {
    const { subscription, userId } = req.body

    if (!subscription || !userId) {
      return res.status(400).json({ error: "Subscription and userId are required" })
    }

    console.log("Received subscription for user:", userId)
    console.log("Original endpoint:", subscription.endpoint)

    // Fix the endpoint if it's an old FCM format
    const fixedEndpoint = fixFCMEndpoint(subscription.endpoint)
    console.log("Fixed endpoint:", fixedEndpoint)

    // Validate the endpoint
    if (!isValidSubscriptionEndpoint(fixedEndpoint)) {
      console.error("Invalid subscription endpoint:", fixedEndpoint)
      return res.status(400).json({ error: "Invalid subscription endpoint" })
    }

    // Update the subscription object with the fixed endpoint
    const fixedSubscription = {
      ...subscription,
      endpoint: fixedEndpoint,
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      userId,
      endpoint: fixedEndpoint,
    })

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.subscription = fixedSubscription
      existingSubscription.keys = subscription.keys
      await existingSubscription.save()
      return res.json({ message: "Subscription updated successfully" })
    }

    // Save new subscription to MongoDB
    const newSubscription = new PushSubscription({
      userId,
      endpoint: fixedEndpoint,
      keys: subscription.keys,
      subscription: fixedSubscription,
    })

    await newSubscription.save()
    console.log("New subscription saved to database with fixed endpoint")

    res.json({ message: "Subscription saved successfully" })
  } catch (error) {
    console.error("Error saving push subscription:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST api/push/cleanup
// @desc    Clean up invalid subscriptions
// @access  Private (Admin only)
router.post("/cleanup", async (req, res) => {
  try {
    console.log("Starting subscription cleanup...")

    // Get all subscriptions
    const allSubscriptions = await PushSubscription.find({})
    console.log(`Found ${allSubscriptions.length} total subscriptions`)

    let fixed = 0
    let removed = 0
    let valid = 0

    for (const sub of allSubscriptions) {
      const originalEndpoint = sub.endpoint
      const fixedEndpoint = fixFCMEndpoint(originalEndpoint)

      if (originalEndpoint !== fixedEndpoint) {
        // Endpoint was fixed
        sub.endpoint = fixedEndpoint
        sub.subscription.endpoint = fixedEndpoint
        await sub.save()
        fixed++
        console.log(`Fixed endpoint for user ${sub.userId}`)
      } else if (!isValidSubscriptionEndpoint(originalEndpoint)) {
        // Invalid endpoint, remove it
        await PushSubscription.deleteOne({ _id: sub._id })
        removed++
        console.log(`Removed invalid subscription for user ${sub.userId}`)
      } else {
        valid++
      }
    }

    res.json({
      message: "Cleanup completed",
      results: {
        total: allSubscriptions.length,
        fixed,
        removed,
        valid,
      },
    })
  } catch (error) {
    console.error("Error during cleanup:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST api/push/send
// @desc    Send push notification to specific users with better error handling
// @access  Private (Admin only)
router.post("/send", async (req, res) => {
  try {
    const { userIds, title, body, url, tag } = req.body

    if (!userIds || !title || !body) {
      return res.status(400).json({ error: "userIds, title, and body are required" })
    }

    // Get subscriptions from MongoDB
    const subscriptions = await PushSubscription.find({
      userId: { $in: userIds },
    })

    if (subscriptions.length === 0) {
      return res.json({ message: "No subscriptions found for specified users" })
    }

    // Use environment variable for frontend URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"

    const payload = JSON.stringify({
      title,
      body,
      url: url ? `${frontendUrl}${url}` : frontendUrl,
      tag: tag || "default",
      primaryKey: Date.now().toString(),
    })

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        // Validate endpoint before sending
        if (!isValidSubscriptionEndpoint(sub.endpoint)) {
          console.log(`Invalid endpoint for user ${sub.userId}, removing...`)
          await PushSubscription.deleteOne({ _id: sub._id })
          return { success: false, userId: sub.userId, error: "Invalid endpoint removed" }
        }

        await webpush.sendNotification(sub.subscription, payload)
        return { success: true, userId: sub.userId }
      } catch (error) {
        console.error(`Failed to send notification to user ${sub.userId}:`, error.message)

        // If subscription is invalid (404, 410), remove it from database
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Removing invalid subscription for user ${sub.userId}`)
          await PushSubscription.deleteOne({ _id: sub._id })
        }

        return { success: false, userId: sub.userId, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`Push notifications: ${successful} successful, ${failed} failed`)

    res.json({
      message: `Notifications sent: ${successful} successful, ${failed} failed`,
      results,
    })
  } catch (error) {
    console.error("Error sending push notifications:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   POST api/push/broadcast
// @desc    Send push notification to all subscribed users with better error handling
// @access  Private (Admin only)
router.post("/broadcast", async (req, res) => {
  try {
    const { title, body, url, tag, excludeUserIds = [] } = req.body

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" })
    }

    // Get all subscriptions from MongoDB except excluded users
    const subscriptions = await PushSubscription.find({
      userId: { $nin: excludeUserIds },
    })

    if (subscriptions.length === 0) {
      return res.json({ message: "No subscriptions found" })
    }

    // Use environment variable for frontend URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"

    const payload = JSON.stringify({
      title,
      body,
      url: url ? `${frontendUrl}${url}` : frontendUrl,
      tag: tag || "broadcast",
      primaryKey: Date.now().toString(),
    })

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        // Validate endpoint before sending
        if (!isValidSubscriptionEndpoint(sub.endpoint)) {
          console.log(`Invalid endpoint for user ${sub.userId}, removing...`)
          await PushSubscription.deleteOne({ _id: sub._id })
          return { success: false, userId: sub.userId, error: "Invalid endpoint removed" }
        }

        await webpush.sendNotification(sub.subscription, payload)
        return { success: true, userId: sub.userId }
      } catch (error) {
        console.error(`Failed to send broadcast notification to user ${sub.userId}:`, error.message)

        // If subscription is invalid (404, 410), remove it from database
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Removing invalid subscription for user ${sub.userId}`)
          await PushSubscription.deleteOne({ _id: sub._id })
        }

        return { success: false, userId: sub.userId, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`Broadcast notifications: ${successful} successful, ${failed} failed`)

    res.json({
      message: `Broadcast sent: ${successful} successful, ${failed} failed`,
      results,
    })
  } catch (error) {
    console.error("Error broadcasting push notifications:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// @route   GET api/push/subscriptions
// @desc    Get all subscriptions (for admin debugging)
// @access  Private (Admin only)
router.get("/subscriptions", async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find({}, { userId: 1, endpoint: 1, createdAt: 1 })

    res.json({
      total: subscriptions.length,
      subscriptions: subscriptions.map((sub) => ({
        userId: sub.userId,
        endpoint: sub.endpoint.substring(0, 50) + "...",
        createdAt: sub.createdAt,
        isValid: isValidSubscriptionEndpoint(sub.endpoint),
      })),
    })
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
