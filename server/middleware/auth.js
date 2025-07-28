const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "jwtSecret");

    req.user = decoded; // ✅ This ensures req.user.id will be accessible
    next();
  } catch (error) {
    res.status(401).json({ error: "Token is not valid" });
  }
};
