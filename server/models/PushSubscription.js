const mongoose = require("mongoose")

const PushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  keys: {
    p256dh: {
      type: String,
      required: true,
    },
    auth: {
      type: String,
      required: true,
    },
  },
  subscription: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Create compound index for userId and endpoint
PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true })

module.exports = mongoose.model("PushSubscription", PushSubscriptionSchema)
