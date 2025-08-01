

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const http = require("http");
// const socketIo = require("socket.io");
// const jwt = require("jsonwebtoken");
// const path = require("path");
// const userNotificationRoutes = require('./routes/user-notifications');
// const taskRoutes = require("./routes/tasks");
// const departmentRoutes = require("./routes/departments");
// const userRoutes = require("./routes/users");
// const authRoutes = require("./routes/auth");
// const aiRoutes = require("./routes/ai");
// const adminRoutes = require('./routes/admin');
// const dashboardRoutes = require('./routes/dashboard');
// const submissionRoutes = require('./routes/submission');
// const aiNewRoutes = require('./routes/aiRoutes');
// const progressRoutes = require('./routes/progress'); // Add this line
// const notificationRoutes = require('./routes/notifications'); // Add this line
// const aimRoutes = require('./routes/aim');
// // const aiRoutePy = require('./routes/aiRoutePy')
// // Create Express app
// const app = express();

// // Create HTTP server and initialize Socket.IO
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: ['http://localhost:5173','http://192.168.1.2:5173','https://main-workflow.vercel.app'],  // Replace with your frontend's URL
//     methods: ['GET', 'POST'],
//     credentials: true,  // Allow credentials (cookies, HTTP authentication)
//   },
// });

// // CORS Configuration
// const corsOptions = {
//   origin: ['http://localhost:5173','http://192.168.1.2:5173','https://main-workflow.vercel.app'],  // Replace with your frontend's URL
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true,  // Allow credentials (cookies, HTTP authentication)
// };
// app.use(cors(corsOptions));

// app.use(express.json());

// // Connect to MongoDB
// require('dotenv').config();  // Add this line at the top

// // Connect to MongoDB
// mongoose
//   .connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("MongoDB connection error:", err));


// // Socket.IO connection
// io.on("connection", (socket) => {
//   console.log("New client connected");

//   socket.on("join", (rooms) => {
//     if (Array.isArray(rooms)) {
//       rooms.forEach((room) => socket.join(room));
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });

// // Make io available to routes
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// app.get('/api/ping', (req, res) => {
//   res.json({ message: 'Pong!' });
// });


// // Serve static files from Vite build
// app.use(express.static(path.join(__dirname, '../client/dist')));

// // Serve frontend only for non-API routes
// app.get(/^\/(?!api).*/, (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/dist/index.html'));
// });


// // Routes
// app.use("/api/tasks", taskRoutes);
// app.use("/api/departments", departmentRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/ai", aiRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/submissions", submissionRoutes);
// app.use('/api/new/ai', aiNewRoutes);
// app.use('/api/progress', progressRoutes); // Add this line
// app.use('/api/notifications', notificationRoutes); // Add this line
// app.use('/api/aims', aimRoutes);
// app.use('/api/user-notifications', userNotificationRoutes);

// // app.use('/api/new/ai',aiRoutePy)



// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: "Something went wrong!" });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const path = require("path");
const userNotificationRoutes = require('./routes/user-notifications');
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
const aimRoutes = require('./routes/aim');
const pushRoutes = require('./routes/push'); // Add this line
// const aiRoutePy = require('./routes/aiRoutePy')
// Create Express app
const app = express();

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173','http://192.168.1.2:5173','https://main-workflow.vercel.app','https://workflowmanager.vercel.app','https://infiverse-bhl.vercel.app'],  // Replace with your frontend's URL
    methods: ['GET', 'POST'],
    credentials: true,  // Allow credentials (cookies, HTTP authentication)
  },
});

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:5173','http://192.168.1.2:5173','https://main-workflow.vercel.app','https://workflowmanager.vercel.app','https://infiverse-bhl.vercel.app'],  // Replace with your frontend's URL
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

app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pong!' });
});

// Test Linux browser detection endpoint
app.get('/api/test-browser-detection', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    console.log('🧪 Testing Linux browser detection...');

    const results = {};

    // Test if commands are installed
    try {
      await execAsync('which xdotool');
      results.xdotool = 'installed';
      console.log('✅ xdotool is installed');
    } catch (error) {
      results.xdotool = 'not installed: ' + error.message;
      console.log('❌ xdotool not installed:', error.message);
    }

    try {
      await execAsync('which wmctrl');
      results.wmctrl = 'installed';
      console.log('✅ wmctrl is installed');
    } catch (error) {
      results.wmctrl = 'not installed: ' + error.message;
      console.log('❌ wmctrl not installed:', error.message);
    }

    try {
      await execAsync('which scrot');
      results.scrot = 'installed';
      console.log('✅ scrot is installed');
    } catch (error) {
      results.scrot = 'not installed: ' + error.message;
      console.log('❌ scrot not installed:', error.message);
    }

    try {
      await execAsync('which convert');
      results.imagemagick = 'installed';
      console.log('✅ imagemagick is installed');
    } catch (error) {
      results.imagemagick = 'not installed: ' + error.message;
      console.log('❌ imagemagick not installed:', error.message);
    }

    // Test X11 environment
    try {
      const { stdout } = await execAsync('echo $DISPLAY');
      results.display = stdout.trim() || 'not set';
      console.log('🖥️ DISPLAY environment:', results.display);
    } catch (error) {
      results.display = 'error: ' + error.message;
    }

    res.json({
      success: true,
      platform: process.platform,
      commands: results,
      message: 'Linux command test completed'
    });

  } catch (error) {
    console.error('🧪 Command test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      platform: process.platform
    });
  }
});


// Serve static files from Vite build
app.use(express.static(path.join(__dirname, '../client/dist')));

// Serve frontend only for non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
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
app.use('/api/aims', aimRoutes);
app.use('/api/user-notifications', userNotificationRoutes);
app.use("/api/push", pushRoutes) // Added push routes use
app.use("/api/monitoring", require("./routes/monitoring")); // Employee monitoring routes

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
