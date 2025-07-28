const express = require("express");
const router = express.Router();
const Aim = require("../models/Aim");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { sendAimReminder } = require("../utils/emailService");

// @route   GET api/aims
// @desc    Get all aims (with filters)
// @access  Private (Admin/Manager)
router.get("/", async (req, res) => {
  try {
    const { department, date, user } = req.query;

    // Build filter object
    const filter = {};
    if (department) filter.department = department;
    if (user) filter.user = user;
    
    if (date) {
      const queryDate = new Date(date);
      filter.date = {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999)),
      };
    }

    const aims = await Aim.find(filter)
      .populate("user", "name email")
      .populate("department", "name color")
      .sort({ date: -1 });

    res.json(aims);
  } catch (error) {
    console.error("Error fetching aims:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET api/aims/today
// @desc    Get user's aim for today
// @access  Private
router.get("/today/:id", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const aim = await Aim.findOne({
      user: req.params.id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    res.json(aim || null);
  } catch (error) {
    console.error("Error fetching today's aim:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET api/aims/user/:userId
// @desc    Get aims for a specific user
// @access  Private
router.get("/user/:userId", async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { user: req.params.userId };
    
    if (from && to) {
      filter.date = {
        $gte: new Date(from),
        $lte: new Date(to)
      };
    }
    
    const aims = await Aim.find(filter)
      .populate("department", "name color")
      .sort({ date: -1 });
      
    res.json(aims);
  } catch (error) {
    console.error("Error fetching user aims:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST api/aims/postaim/:id
// @desc    Create or update today's aim
// @access  Private
router.post("/postaim/:id", async (req, res) => {
    try {
      const { aims } = req.body
      const userId = req.params.id
  
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" })
      }
  
      if (!aims) {
        return res.status(400).json({ error: "Aims are required" })
      }
  
      // Get today's date (start of day)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
  
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
  
      // Check if user already has an aim for today
      let aim = await Aim.findOne({
        user: userId,
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      })
  
      const user = await User.findById(userId)
      if (!user) {
        return res.status(404).json({ error: "User not found" })
      }
  
      if (aim) {
        // Update existing aim
        aim.aims = aims
        aim.updatedAt = Date.now()
      } else {
        // Create new aim
        aim = new Aim({
          user: userId,
          department: user.department,
          aims,
          date: today,
        })
      }
  
      await aim.save()
  
      // Notify via Socket.IO
      if (req.io) {
        req.io.emit("aim-updated", {
          aim,
          user: {
            id: userId,
            name: user.name,
          },
        })
      }
  
      res.json(aim)
    } catch (error) {
      console.error("Error creating/updating aim:", error)
      res.status(500).json({ error: "Server error" })
    }
  })
  

  

// @route   PUT api/aims/:id
// @desc    Update an aim
// @access  Private
router.put("/:id", async (req, res) => {
  try {
    const { aims, completed } = req.body;
    
    // Find aim by ID
    const aim = await Aim.findById(req.params.id);
    
    if (!aim) {
      return res.status(404).json({ error: "Aim not found" });
    }
    
    // Check if user owns the aim or is admin
    if (aim.user.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(401).json({ error: "Not authorized" });
    }
    
    // Update fields
    if (aims !== undefined) aim.aims = aims;
    if (completed !== undefined) aim.completed = completed;
    aim.updatedAt = Date.now();
    
    await aim.save();
    
    // Notify via Socket.IO
    if (req.io) {
      req.io.emit("aim-updated", { aim });
    }
    
    res.json(aim);
  } catch (error) {
    console.error("Error updating aim:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   DELETE api/aims/:id
// @desc    Delete an aim
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const aim = await Aim.findById(req.params.id);
    
    if (!aim) {
      return res.status(404).json({ error: "Aim not found" });
    }
    
    // Check if user owns the aim or is admin
    if (aim.user.toString() !== req.user.id && req.user.role !== "Admin") {
      return res.status(401).json({ error: "Not authorized" });
    }
    
    await aim.remove();
    
    // Notify via Socket.IO
    if (req.io) {
      req.io.emit("aim-deleted", { id: req.params.id });
    }
    
    res.json({ msg: "Aim removed" });
  } catch (error) {
    console.error("Error deleting aim:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
