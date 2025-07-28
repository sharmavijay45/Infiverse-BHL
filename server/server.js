const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

// Import routes
const taskRoutes = require("./routes/tasks");
const departmentRoutes = require("./routes/departments");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const aiRoutes = require("./routes/ai");
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const submissionRoutes = require('./routes/submission');
const aiNewRoutes = require('./routes/aiRoutes');
const progressRoutes = require('./routes/progress'); // Add this line
const notificationRoutes = require('./routes/notifications'); // Add this line
// const aiRoutePy = require('./routes/aiRoutePy')
// Create Express app
const app = express();

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173','http://192.168.1.2:5173','https://main-workflow.vercel.app'],  // Replace with your frontend's URL
    methods: ['GET', 'POST'],
    credentials: true,  // Allow credentials (cookies, HTTP authentication)
  },
});

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:5173','http://192.168.1.2:5173','https://main-workflow.vercel.app'],  // Replace with your frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,  // Allow credentials (cookies, HTTP authentication)
};
app.use(cors(corsOptions));

app.use(express.json());

// Connect to MongoDB
require('dotenv').config();  // Add this line at the top

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join", (rooms) => {
    if (Array.isArray(rooms)) {
      rooms.forEach((room) => socket.join(room));
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// System info endpoint
app.get('/api/system/info', (req, res) => {
  res.json({
    platform: process.platform,
    browserMonitoringSupported: process.platform === 'win32',
    screenshotSupported: process.platform === 'win32',
    message: process.platform === 'win32'
      ? 'Full monitoring features available'
      : `Monitoring features limited on ${process.platform} - Windows required for browser detection and screenshots`
  });
});

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/submissions", submissionRoutes);
app.use('/api/new/ai', aiNewRoutes);
app.use('/api/progress', progressRoutes); // Add this line
app.use('/api/notifications', notificationRoutes); // Add this line
// app.use('/api/new/ai',aiRoutePy)



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
