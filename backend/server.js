const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Online Examination System API',
    dfaEngine: 'Active (Deterministic Finite Automata S0-S6)',
    version: '1.0.0'
  });
});

// Mount Routes
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const dfaRoutes = require('./routes/dfaRoutes');
const dfaExamRoutes = require('./routes/dfaExamRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/dfa', dfaRoutes);
app.use('/api/dfa', dfaExamRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend build if available
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // SPA fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 404 Handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Fallback root if dist is not yet built
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Online Exam API</title></head>
      <body style="font-family: system-ui; padding: 2rem; text-align: center;">
        <h2>Online Examination System Backend Active</h2>
        <p>Frontend UI is running at <a href="http://localhost:5173">http://localhost:5173</a></p>
      </body>
    </html>
  `);
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Custom DFA transition error
  if (err.code === 'INVALID_DFA_TRANSITION') {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'INVALID_DFA_TRANSITION',
      currentState: err.currentState,
      attemptedSymbol: err.attemptedSymbol,
      allowedSymbols: err.allowedSymbols
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', ')
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate field value entered in database'
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Online Examination System Backend Running`);
      console.log(` Port:    http://localhost:${PORT}`);
      console.log(` DFA:     Deterministic Finite Automaton Active`);
      console.log(` States:  S0 (NOT_LOGGED_IN) -> S1 (AUTHENTICATED)`);
      console.log(`          -> S2 (EXAM_ACCESS_GRANTED) -> S3 (IN_PROGRESS)`);
      console.log(`          -> S4 (SUBMITTED) / S5 (AUTO_SUBMITTED)`);
      console.log(`          -> S6 (BLOCKED)`);
      console.log(`=======================================================`);
    });
    return server;
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
