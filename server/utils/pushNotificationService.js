const webpush = require("web-push")
const PushSubscription = require("../models/PushSubscription")

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:9321vijaysharma@gmail.com",
  process.env.VAPID_PUBLIC_KEY ||
    "BEl62iUYgUivxIkv69yViEuiBIa40HcCWLrUjHLjdMorMYiNkAiOlSstp6riKGxGxaio4vWqlaKUaOOhSE8VLRs",
  process.env.VAPID_PRIVATE_KEY || "your-vapid-private-key", // Replace with your VAPID private key
)

// Send push notification to specific users
const sendPushNotificationToUsers = async (userIds, title, body, url = "/", tag = "default") => {
  try {
    // Get all subscriptions for the specified users
    const subscriptions = await PushSubscription.find({
      userId: { $in: userIds },
    })

    if (subscriptions.length === 0) {
      console.log("No push subscriptions found for specified users")
      return { successful: 0, failed: 0, results: [] }
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
      tag,
      primaryKey: Date.now().toString(),
    })

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload)
        return { success: true, userId: sub.userId }
      } catch (error) {
        console.error(`Failed to send push notification to user ${sub.userId}:`, error)

        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id })
        }

        return { success: false, userId: sub.userId, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`Push notifications sent: ${successful} successful, ${failed} failed`)

    return { successful, failed, results }
  } catch (error) {
    console.error("Error sending push notifications:", error)
    throw error
  }
}

// Send push notification to all users except specified ones
const broadcastPushNotification = async (title, body, url = "/", tag = "broadcast", excludeUserIds = []) => {
  try {
    // Get all subscriptions except excluded users
    const subscriptions = await PushSubscription.find({
      userId: { $nin: excludeUserIds },
    })

    if (subscriptions.length === 0) {
      console.log("No push subscriptions found")
      return { successful: 0, failed: 0, results: [] }
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
      tag,
      primaryKey: Date.now().toString(),
    })

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload)
        return { success: true, userId: sub.userId }
      } catch (error) {
        console.error(`Failed to send push notification to user ${sub.userId}:`, error)

        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id })
        }

        return { success: false, userId: sub.userId, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`Push broadcast sent: ${successful} successful, ${failed} failed`)

    return { successful, failed, results }
  } catch (error) {
    console.error("Error broadcasting push notifications:", error)
    throw error
  }
}

module.exports = {
  sendPushNotificationToUsers,
  broadcastPushNotification,
}
