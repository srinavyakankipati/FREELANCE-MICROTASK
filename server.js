const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to Database
const connectDB = require('./src/config/db');
connectDB();

// Import Routes & Middleware
const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const skillTestRoutes = require('./src/routes/skillTestRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const matchingRoutes = require('./src/routes/matchingRoutes');
const milestoneRoutes = require('./src/routes/milestoneRoutes');
const workspaceRoutes = require('./src/routes/workspaceRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const disputeRoutes = require('./src/routes/disputeRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const initSocket = require('./src/socket');

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initSocket(httpServer);
app.set('io', io);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Enable CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    },
    credentials: true,
  })
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Freelance Micro-Task API Server is operational 🚀',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/skill-tests', skillTestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.method} ${req.originalUrl} on this server`,
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // In production, close server & exit process
});

module.exports = { app, server, io };

