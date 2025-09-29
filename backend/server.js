require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Import middleware
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:5173', 'https://contribution-to-adhi-s-life-1.onrender.com', 'https://contribution-to-adhi-s-life.vercel.app'], // Vite default port

    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.use(express.json());

// In development, frontend is served by Vite
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend in production
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  } else {
    res.json({ message: 'Backend API is running. Frontend is served by Vite in development.' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Assessment 1: User Management API running on http://localhost:${PORT}`);
  console.log(`View instructions: http://localhost:${PORT}`);
  console.log(`Ready for puzzle solving!`);
});
