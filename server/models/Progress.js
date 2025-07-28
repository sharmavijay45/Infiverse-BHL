const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  blockers: {
    type: String,
    trim: true,
  },
  achievements: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
ProgressSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Progress", ProgressSchema);

