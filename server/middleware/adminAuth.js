module.exports = (req, res, next) => {
    // Check if user is admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access denied. Admin only." })
    }
  
    next()
  }
  